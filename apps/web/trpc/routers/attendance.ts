import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, desc, inArray } from "drizzle-orm";
import {
  createTRPCRouter,
  protectedProcedure,
  requireRole,
  requireCapability,
} from "../server";
import { schema } from "@hrms-app/db";
import { assertManagesException } from "../scoping";
import {
  createShiftSchema,
  updateShiftSchema,
  assignShiftSchema,
  punchInSchema,
  punchOutSchema,
  resolveExceptionSchema,
  attendanceQuerySchema,
  punchInForEmployeeSchema,
  punchOutForEmployeeSchema,
} from "@hrms-app/validators";

async function resolveEmployeeId(ctx: any): Promise<string | null> {
  // Any user linked to an employee record can act on their own attendance,
  // regardless of role — a manager or admin may also be an employee who
  // punches in. Previously this only resolved for the "employee" role, so
  // every other role's punch failed with "not linked".
  if (ctx.user.employeeId) return ctx.user.employeeId;
  const user = await ctx.adminDb.query.users.findFirst({
    where: (users: any, { eq }: any) => eq(users.id, ctx.user.id!),
  });
  return user?.employeeId ?? null;
}

function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}+03:00`);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface TreeNode {
  id: string;
  fullName: string;
  department: string | null;
  managerId: string | null;
  employmentStatus: string;
  children: TreeNode[];
  lastLocation: { lat: number; lng: number; workLocation: string | null; punchInAt: Date | null } | null;
}

export const attendanceRouter = createTRPCRouter({
  // ── Shifts ────────────────────────────────────────────────────────────
  shift: createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.query.shifts.findMany({
        orderBy: (shifts: any, { asc }: any) => asc(shifts.name),
      });
    }),

    create: requireRole("super_admin", "hr_manager")
      .input(createShiftSchema)
      .mutation(async ({ ctx, input }) => {
        const [shift] = await ctx.db
          .insert(schema.tenant.shifts)
          .values(input)
          .returning();
        return shift;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateShiftSchema }))
      .mutation(async ({ ctx, input }) => {
        const [shift] = await ctx.db
          .update(schema.tenant.shifts)
          .set(input.data)
          .where(eq(schema.tenant.shifts.id, input.id))
          .returning();
        return shift;
      }),

    delete: requireRole("super_admin")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .delete(schema.tenant.shifts)
          .where(eq(schema.tenant.shifts.id, input));
        return { success: true };
      }),
  }),

  // ── Shift assignments ────────────────────────────────────────────────
  assignment: createTRPCRouter({
    list: requireCapability("attendance:view_company")
      .input(
        z
          .object({
            employeeId: z.string().uuid().optional(),
            shiftId: z.string().uuid().optional(),
          })
          .optional()
          .default({}),
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.employeeId)
          conditions.push(eq(schema.tenant.shiftAssignments.employeeId, input.employeeId));
        if (input?.shiftId)
          conditions.push(eq(schema.tenant.shiftAssignments.shiftId, input.shiftId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.shiftAssignments.findMany({
          where,
          with: { employee: true, shift: true },
          limit: 200,
        });
      }),

    create: requireRole("super_admin", "hr_manager", "department_manager")
      .input(assignShiftSchema)
      .mutation(async ({ ctx, input }) => {
        const [assignment] = await ctx.db
          .insert(schema.tenant.shiftAssignments)
          .values(input)
          .returning();
        return assignment;
      }),
  }),

  // ── Punch in / out ───────────────────────────────────────────────────
  punchIn: protectedProcedure
    .input(punchInSchema)
    .mutation(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const workDate = input.workDate ?? todayISO();

      // Find the latest record for this employee+date
      const latest = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
        ),
        orderBy: desc(schema.tenant.attendanceRecords.punchSequence),
      });

      // If there's a record with no punch-out, can't punch in again
      if (latest && !latest.punchOutAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Open punch sequence already exists. Punch out first.",
        });
      }

      const nextSequence = (latest?.punchSequence ?? 0) + 1;

      const assignment = await ctx.db.query.shiftAssignments.findFirst({
        where: and(
          eq(schema.tenant.shiftAssignments.employeeId, employeeId),
          lte(schema.tenant.shiftAssignments.effectiveFrom, workDate),
        ),
        with: { shift: true },
        orderBy: desc(schema.tenant.shiftAssignments.effectiveFrom),
      });

      const now = new Date();
      let lateMinutes = 0;
      let status: "present" | "late" | "remote" = "present";
      let scheduledStart: string | null = null;

      if (assignment?.shift) {
        scheduledStart = assignment.shift.startTime;
        const scheduledDateTime = combineDateTime(workDate, assignment.shift.startTime);
        const grace = assignment.shift.graceMinutes ?? 0;
        if (now.getTime() > scheduledDateTime.getTime() + grace * 60_000) {
          lateMinutes = Math.floor((now.getTime() - scheduledDateTime.getTime()) / 60_000);
          status = "late";
        }
      }
      if (input.workLocation && input.workLocation.toLowerCase().includes("remote")) {
        status = "remote";
      }

      const [record] = await ctx.db
        .insert(schema.tenant.attendanceRecords)
        .values({
          employeeId,
          workDate,
          punchSequence: nextSequence,
          punchInAt: now,
          status,
          lateMinutes,
          scheduledStart,
          workLocation: input.workLocation,
          // Store the punch-in GPS location (time + location, SEC requirement).
          punchInLat: input.lat ?? null,
          punchInLng: input.lng ?? null,
          punchInAccuracy: input.accuracy != null ? Math.round(input.accuracy) : null,
          notes: input.notes,
          shiftId: assignment?.shiftId ?? null,
        })
        .returning();
      return record;
    }),

  punchOut: protectedProcedure
    .input(punchOutSchema)
    .mutation(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const workDate = input.workDate ?? todayISO();

      // Find the latest open record (no punch-out) for this employee+date
      const openRecord = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
        ),
        orderBy: desc(schema.tenant.attendanceRecords.punchSequence),
      });

      if (!openRecord?.punchInAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No open punch-in found for this sequence",
        });
      }
      if (openRecord.punchOutAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already punched out for this sequence",
        });
      }

      const now = new Date();
      // Worked time for THIS sequence = punch-out minus punch-in. Only the
      // punched-in interval is counted; the gap until the next punch-in (break)
      // is a separate sequence and is never counted (matches the model where a
      // 2h morning + 1h evening = 3h across two sequences).
      const workedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - openRecord.punchInAt.getTime()) / 60_000),
      );

      let overtimeMinutes = 0;
      let earlyLeaveMinutes = 0;
      const status = openRecord.status;

      if (openRecord.scheduledEnd) {
        const scheduledEndDate = combineDateTime(workDate, openRecord.scheduledEnd);
        if (now.getTime() > scheduledEndDate.getTime()) {
          overtimeMinutes = Math.floor((now.getTime() - scheduledEndDate.getTime()) / 60_000);
        } else if (now.getTime() < scheduledEndDate.getTime()) {
          earlyLeaveMinutes = Math.floor(
            (scheduledEndDate.getTime() - now.getTime()) / 60_000,
          );
        }
      }

      const [record] = await ctx.db
        .update(schema.tenant.attendanceRecords)
        .set({
          punchOutAt: now,
          workedMinutes,
          overtimeMinutes,
          earlyLeaveMinutes,
          status,
          workLocation: input.workLocation ?? openRecord.workLocation,
          notes: input.notes ?? openRecord.notes,
        })
        .where(eq(schema.tenant.attendanceRecords.id, openRecord.id))
        .returning();
      return record;
    }),

  // ── Today's status for the current user (employee self-service) ─────
  today: protectedProcedure.query(async ({ ctx }) => {
    const employeeId = await resolveEmployeeId(ctx);
    if (!employeeId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Employee profile is not linked to this login",
      });
    }
    const workDate = todayISO();
    const records = await ctx.db.query.attendanceRecords.findMany({
      where: and(
        eq(schema.tenant.attendanceRecords.employeeId, employeeId),
        eq(schema.tenant.attendanceRecords.workDate, workDate),
      ),
      with: { shift: true, exceptions: true },
      orderBy: (r: any, { asc }: any) => asc(r.punchSequence),
    });
    const assignment = await ctx.db.query.shiftAssignments.findFirst({
      where: and(
        eq(schema.tenant.shiftAssignments.employeeId, employeeId),
        lte(schema.tenant.shiftAssignments.effectiveFrom, workDate),
      ),
      with: { shift: true },
      orderBy: desc(schema.tenant.shiftAssignments.effectiveFrom),
    });
    return { records, assignment };
  }),

  // ── Self-service history for an employee ─────────────────────────────
  myHistory: protectedProcedure
    .input(
      z
        .object({
          from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const conditions: ReturnType<typeof eq>[] = [
        eq(schema.tenant.attendanceRecords.employeeId, employeeId),
      ];
      if (input?.from) conditions.push(gte(schema.tenant.attendanceRecords.workDate, input.from));
      if (input?.to) conditions.push(lte(schema.tenant.attendanceRecords.workDate, input.to));
      const where = and(...conditions);
      return await ctx.db.query.attendanceRecords.findMany({
        where,
        with: { shift: true, exceptions: true },
        orderBy: desc(schema.tenant.attendanceRecords.workDate),
        limit: 60,
      });
    }),

  // ── Monthly summary for the current user ─────────────────────────────
  myMonthlySummary: protectedProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const from = `${input.month}-01`;
      const lastDay = new Date(
        Number(input.month.slice(0, 4)),
        Number(input.month.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);
      const records = await ctx.db.query.attendanceRecords.findMany({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          gte(schema.tenant.attendanceRecords.workDate, from),
          lte(schema.tenant.attendanceRecords.workDate, lastDay),
        ),
      });
      const summary = {
        totalDays: records.length,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        remote: 0,
        halfDay: 0,
        weekend: 0,
        holiday: 0,
        totalWorkedMinutes: 0,
        totalOvertimeMinutes: 0,
        totalLateMinutes: 0,
      };
      for (const r of records) {
        summary.totalWorkedMinutes += r.workedMinutes;
        summary.totalOvertimeMinutes += r.overtimeMinutes;
        summary.totalLateMinutes += r.lateMinutes;
        switch (r.status) {
          case "present": summary.present++; break;
          case "late": summary.late++; break;
          case "absent": summary.absent++; break;
          case "on_leave": summary.onLeave++; break;
          case "remote": summary.remote++; break;
          case "half_day": summary.halfDay++; break;
          case "weekend": summary.weekend++; break;
          case "holiday": summary.holiday++; break;
        }
      }
      return { month: input.month, summary, records };
    }),

  // ── HR / manager view: every employee's day ─────────────────────────
  list: requireCapability("attendance:view_company")
    .input(attendanceQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.employeeId)
        conditions.push(eq(schema.tenant.attendanceRecords.employeeId, input.employeeId));
      if (input?.departmentId) {
        const empIds = await ctx.db
          .select({ id: schema.tenant.employees.id })
          .from(schema.tenant.employees)
          .where(eq(schema.tenant.employees.departmentId, input.departmentId));
        conditions.push(
          inArray(
            schema.tenant.attendanceRecords.employeeId,
            empIds.map((e: { id: string }) => e.id),
          ),
        );
      }
      if (input?.status)
        conditions.push(eq(schema.tenant.attendanceRecords.status, input.status));
      if (input?.from) conditions.push(gte(schema.tenant.attendanceRecords.workDate, input.from));
      if (input?.to) conditions.push(lte(schema.tenant.attendanceRecords.workDate, input.to));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.attendanceRecords.findMany({
        where,
        with: { employee: { with: { department: true } }, shift: true, exceptions: true },
        orderBy: desc(schema.tenant.attendanceRecords.workDate),
        limit: 200,
      });
    }),

  // ── Aggregated monthly stats for HR ─────────────────────────────────
  monthlyReport: requireCapability("attendance:view_company")
    .input(
      z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        departmentId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = `${input.month}-01`;
      const lastDay = new Date(
        Number(input.month.slice(0, 4)),
        Number(input.month.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);
      const employees = await ctx.db.query.employees.findMany({
        where: input.departmentId
          ? eq(schema.tenant.employees.departmentId, input.departmentId)
          : undefined,
        with: { department: true },
      });
      const empIds = employees.map((e: { id: string }) => e.id);
      if (empIds.length === 0) return { month: input.month, employees: [] as any[] };
      const records = await ctx.db.query.attendanceRecords.findMany({
        where: and(
          inArray(schema.tenant.attendanceRecords.employeeId, empIds),
          gte(schema.tenant.attendanceRecords.workDate, from),
          lte(schema.tenant.attendanceRecords.workDate, lastDay),
        ),
      });
      const grouped = new Map<string, typeof records>();
      for (const r of records) {
        const arr = grouped.get(r.employeeId) ?? [];
        arr.push(r);
        grouped.set(r.employeeId, arr);
      }
      const employees_report = employees.map((e: { id: string; fullName: string; department: { name: string } | null }) => {
        const list = grouped.get(e.id) ?? [];
        const summary = {
          present: 0,
          late: 0,
          absent: 0,
          onLeave: 0,
          remote: 0,
          halfDay: 0,
          totalWorkedMinutes: 0,
          totalOvertimeMinutes: 0,
          totalLateMinutes: 0,
          exceptions: 0,
        };
        for (const r of list) {
          summary.totalWorkedMinutes += r.workedMinutes;
          summary.totalOvertimeMinutes += r.overtimeMinutes;
          summary.totalLateMinutes += r.lateMinutes;
          switch (r.status) {
            case "present": summary.present++; break;
            case "late": summary.late++; break;
            case "absent": summary.absent++; break;
            case "on_leave": summary.onLeave++; break;
            case "remote": summary.remote++; break;
            case "half_day": summary.halfDay++; break;
          }
        }
        return {
          employeeId: e.id,
          fullName: e.fullName,
          department: e.department?.name ?? null,
          summary,
        };
      });
      return { month: input.month, employees: employees_report };
    }),

  // ── Exception queue for HR ──────────────────────────────────────────
  exceptions: requireCapability("attendance:view_company")
    .input(
      z
        .object({
          status: z.enum(["open", "acknowledged", "resolved", "waived"]).optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.status)
        conditions.push(eq(schema.tenant.attendanceExceptions.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.attendanceExceptions.findMany({
        where,
        with: {
          employee: true,
          record: true,
        },
        orderBy: desc(schema.tenant.attendanceExceptions.createdAt),
        limit: 100,
      });
    }),

  resolveException: requireRole("super_admin", "hr_manager", "department_manager")
    .input(resolveExceptionSchema)
    .mutation(async ({ ctx, input }) => {
      // A department_manager may only resolve exceptions for their own team (SEC-013).
      await assertManagesException(ctx, input.id);
      const [exc] = await ctx.db
        .update(schema.tenant.attendanceExceptions)
        .set({
          status: input.status,
          resolutionNotes: input.resolutionNotes,
          resolvedByUserId: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(schema.tenant.attendanceExceptions.id, input.id))
        .returning();
      return exc;
    }),

  // ── HR/Admin: punch in for any employee ──────────────────────────────
  punchInForEmployee: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(punchInForEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const workDate = input.workDate ?? todayISO();

      const latest = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, input.employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
        ),
        orderBy: desc(schema.tenant.attendanceRecords.punchSequence),
      });

      if (latest && !latest.punchOutAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Open punch sequence exists for this employee. Punch out first.",
        });
      }

      const nextSequence = (latest?.punchSequence ?? 0) + 1;

      const assignment = await ctx.db.query.shiftAssignments.findFirst({
        where: and(
          eq(schema.tenant.shiftAssignments.employeeId, input.employeeId),
          lte(schema.tenant.shiftAssignments.effectiveFrom, workDate),
        ),
        with: { shift: true },
        orderBy: desc(schema.tenant.shiftAssignments.effectiveFrom),
      });

      const now = new Date();
      let lateMinutes = 0;
      let status: "present" | "late" | "remote" = "present";
      let scheduledStart: string | null = null;

      if (assignment?.shift) {
        scheduledStart = assignment.shift.startTime;
        const scheduledDateTime = combineDateTime(workDate, assignment.shift.startTime);
        const grace = assignment.shift.graceMinutes ?? 0;
        if (now.getTime() > scheduledDateTime.getTime() + grace * 60_000) {
          lateMinutes = Math.floor((now.getTime() - scheduledDateTime.getTime()) / 60_000);
          status = "late";
        }
      }
      if (input.workLocation?.toLowerCase().includes("remote")) {
        status = "remote";
      }

      const [record] = await ctx.db
        .insert(schema.tenant.attendanceRecords)
        .values({
          employeeId: input.employeeId,
          workDate,
          punchSequence: nextSequence,
          punchInAt: now,
          status,
          lateMinutes,
          scheduledStart,
          workLocation: input.workLocation,
          notes: input.notes,
          shiftId: assignment?.shiftId ?? null,
        })
        .returning();
      return record;
    }),

  // ── HR/Admin: punch out for any employee ─────────────────────────────
  punchOutForEmployee: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(punchOutForEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const workDate = input.workDate ?? todayISO();

      let targetSequence = input.punchSequence;
      if (!targetSequence) {
        const latest = await ctx.db.query.attendanceRecords.findFirst({
          where: and(
            eq(schema.tenant.attendanceRecords.employeeId, input.employeeId),
            eq(schema.tenant.attendanceRecords.workDate, workDate),
          ),
          orderBy: desc(schema.tenant.attendanceRecords.punchSequence),
        });
        targetSequence = (latest?.punchSequence ?? 1);
      }

      const targetSeq: number = targetSequence!;

      const openRecord = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, input.employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
          eq(schema.tenant.attendanceRecords.punchSequence, targetSeq),
        ),
        with: { shift: true },
      });

      if (!openRecord?.punchInAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No open punch-in found for this sequence",
        });
      }
      if (openRecord.punchOutAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already punched out for this sequence",
        });
      }

      const now = new Date();
      // Worked time for THIS sequence = punch-out minus punch-in. Only the
      // punched-in interval is counted; the gap until the next punch-in (break)
      // is a separate sequence and is never counted (matches the model where a
      // 2h morning + 1h evening = 3h across two sequences).
      const workedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - openRecord.punchInAt.getTime()) / 60_000),
      );

      let overtimeMinutes = 0;
      let earlyLeaveMinutes = 0;
      const status = openRecord.status;

      if (openRecord.scheduledEnd) {
        const scheduledEndDate = combineDateTime(workDate, openRecord.scheduledEnd);
        if (now.getTime() > scheduledEndDate.getTime()) {
          overtimeMinutes = Math.floor((now.getTime() - scheduledEndDate.getTime()) / 60_000);
        } else if (now.getTime() < scheduledEndDate.getTime()) {
          earlyLeaveMinutes = Math.floor(
            (scheduledEndDate.getTime() - now.getTime()) / 60_000,
          );
        }
      }

      const [record] = await ctx.db
        .update(schema.tenant.attendanceRecords)
        .set({
          punchOutAt: now,
          workedMinutes,
          overtimeMinutes,
          earlyLeaveMinutes,
          status,
          workLocation: input.workLocation ?? openRecord.workLocation,
          notes: input.notes ?? openRecord.notes,
        })
        .where(eq(schema.tenant.attendanceRecords.id, openRecord.id))
        .returning();
      return record;
    }),

  // ── Org subtree: all employees under a manager with last known location ─
  getSubtree: requireCapability("attendance:view_company")
    .input(z.object({ rootEmployeeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Department managers may only view their own reporting subtree, not an
      // arbitrary root — they cannot walk another manager's team or the whole
      // org tree of GPS locations (SEC-011). Company-wide roles may root anywhere.
      const rootEmployeeId =
        ctx.user.role === "department_manager"
          ? ctx.user.employeeId ?? ""
          : input.rootEmployeeId;

      // Recursive CTE to get all employees under rootEmployeeId
      const subtree = await ctx.db.query.employees.findMany({
        with: { department: true },
      });

      // Build tree in memory
      const nodes: TreeNode[] = [];
      const childMap = new Map<string, TreeNode[]>();

      for (const emp of subtree) {
        const node: TreeNode = {
          id: emp.id,
          fullName: emp.fullName,
          department: emp.department?.name ?? null,
          managerId: emp.managerEmployeeId,
          employmentStatus: emp.employmentStatus,
          children: [],
          lastLocation: null,
        };
        nodes.push(node);
        const children = childMap.get(emp.managerEmployeeId ?? "ROOT") ?? [];
        children.push(node);
        childMap.set(emp.managerEmployeeId ?? "ROOT", children);
      }

      const rootNode = nodes.find((n) => n.id === rootEmployeeId);
      if (!rootNode) return null;

      // Attach children
      for (const node of nodes) {
        node.children = childMap.get(node.id) ?? [];
      }

      // Get last known location for each employee in subtree
      const empIds = nodes.map((n) => n.id);
      if (empIds.length > 0) {
        const latestRecords = await ctx.db.query.attendanceRecords.findMany({
          where: inArray(schema.tenant.attendanceRecords.employeeId, empIds),
          with: {},
        });

        const latestByEmployee = new Map<string, typeof latestRecords[0]>();
        for (const rec of latestRecords) {
          const existing = latestByEmployee.get(rec.employeeId);
          if (!existing || rec.workDate > existing.workDate ||
            (rec.workDate === existing.workDate && rec.punchSequence > existing.punchSequence)) {
            latestByEmployee.set(rec.employeeId, rec);
          }
        }

        for (const node of nodes) {
          const lastRec = latestByEmployee.get(node.id);
          if (lastRec?.workLocation) {
            const parts = lastRec.workLocation.split(",");
            node.lastLocation = {
              lat: parseFloat(parts[0]?.trim() ?? "0"),
              lng: parseFloat(parts[1]?.trim() ?? "0"),
              workLocation: lastRec.workLocation,
              punchInAt: lastRec.punchInAt,
            };
          }
        }
      }

      return rootNode;
    }),
});
