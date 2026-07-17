import { z } from "zod";
import { hash } from "bcryptjs";
import { createTRPCRouter, publicProcedure, protectedProcedure, requireRole } from "../server";
import { eq, and, desc } from "drizzle-orm";
import { adminDb, users, inviteTokenIndex } from "@hrms-app/db";
import { employees, employeeInvitations } from "@hrms-app/db/schema/tenant";

const INVITE_EXPIRY_DAYS = 7;

export const inviteRouter = createTRPCRouter({
  list: requireRole("super_admin", "hr_manager", "payroll_admin").query(async ({ ctx }) => {
    return ctx.db.query.employeeInvitations.findMany({
      orderBy: [desc(employeeInvitations.createdAt)],
    });
  }),

  pending: requireRole("super_admin", "hr_manager", "payroll_admin").query(async ({ ctx }) => {
    return ctx.db.query.employeeInvitations.findMany({
      where: eq(employeeInvitations.status, "pending"),
      orderBy: [desc(employeeInvitations.createdAt)],
    });
  }),

  create: requireRole("super_admin", "hr_manager")
    .input(z.object({
      email: z.string().email(),
      fullName: z.string().min(2),
      role: z.enum(["hr_manager", "department_manager", "payroll_admin", "employee"]).optional().default("employee"),
      departmentId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email, role, departmentId, fullName } = input;

      const existingInvite = await ctx.db.query.employeeInvitations.findFirst({
        where: and(
          eq(employeeInvitations.email, email),
          eq(employeeInvitations.status, "pending"),
        ),
      });
      if (existingInvite) {
        throw new Error("An invitation is already pending for this email");
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const tenantSchema = ctx.tenantDb ? extractSchemaName(ctx.tenantDb) : null;
      if (!tenantSchema) {
        throw new Error("Cannot resolve tenant schema for invite creation");
      }

      const [invite] = await ctx.db
        .insert(employeeInvitations)
        .values({
          email,
          role: role ?? "employee",
          invitedByUserId: ctx.user.id,
          departmentId: departmentId ?? null,
          fullName,
          token,
          expiresAt,
        })
        .returning();

      if (invite) {
        // Mirror the token into the public index so a public procedure can
        // resolve the tenant without scanning every schema.
        await adminDb.insert(inviteTokenIndex).values({
          token,
          tenantSchema,
          invitationId: invite.id,
          status: "pending",
          expiresAt,
        });
      }

      return { invite, inviteUrl: `/invite/${token}` };
    }),

  revoke: requireRole("super_admin", "hr_manager")
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(employeeInvitations)
        .set({ status: "revoked" })
        .where(eq(employeeInvitations.id, input.inviteId));
      await adminDb
        .update(inviteTokenIndex)
        .set({ status: "revoked" })
        .where(eq(inviteTokenIndex.invitationId, input.inviteId));
      return { success: true };
    }),

  resend: requireRole("super_admin", "hr_manager")
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
      const newToken = crypto.randomUUID();

      const [updated] = await ctx.db
        .update(employeeInvitations)
        .set({ token: newToken, expiresAt, status: "pending" })
        .where(eq(employeeInvitations.id, input.inviteId))
        .returning();

      if (updated) {
        await adminDb
          .update(inviteTokenIndex)
          .set({ token: newToken, expiresAt, status: "pending" })
          .where(eq(inviteTokenIndex.invitationId, input.inviteId));
      }
      return { invite: updated, inviteUrl: `/invite/${newToken}` };
    }),

  // PUBLIC — no auth required. Looks up the tenant via the public
  // invite_token_index (constant-time, no per-tenant scan, no string
  // concatenation).
  getByToken: publicProcedure
    .input(z.object({ token: z.string().min(1).max(128) }))
    .query(async ({ input }) => {
      const row = await adminDb.query.inviteTokenIndex.findFirst({
        where: eq(inviteTokenIndex.token, input.token),
      });
      if (!row) return null;
      if (row.status !== "pending") return null;
      if (new Date(row.expiresAt) < new Date()) {
        await adminDb
          .update(inviteTokenIndex)
          .set({ status: "expired" })
          .where(eq(inviteTokenIndex.id, row.id));
        return null;
      }

      // Fetch the actual invitation from its tenant schema using a
      // parameterised Drizzle query (no string concatenation).
      const { getTenantDb } = await import("@hrms-app/db");
      const tenantDb = getTenantDb(row.tenantSchema) as any;
      const invite = await tenantDb.query.employeeInvitations.findFirst({
        where: eq(employeeInvitations.id, row.invitationId),
      });
      if (!invite) return null;
      return {
        id: invite.id,
        email: invite.email,
        fullName: invite.fullName,
        role: invite.role,
        departmentId: invite.departmentId,
        expiresAt: invite.expiresAt,
        status: invite.status,
        _tenantSchema: row.tenantSchema,
      };
    }),

  // PUBLIC — no auth required. Accepts an invite and creates the employee
  // + user account.
  acceptInvite: publicProcedure
    .input(z.object({
      token: z.string().min(1).max(128),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const row = await adminDb.query.inviteTokenIndex.findFirst({
        where: eq(inviteTokenIndex.token, input.token),
      });
      if (!row) throw new Error("Invitation not found");
      if (row.status !== "pending") throw new Error("Invitation is no longer active");
      if (new Date(row.expiresAt) < new Date()) {
        await adminDb
          .update(inviteTokenIndex)
          .set({ status: "expired" })
          .where(eq(inviteTokenIndex.id, row.id));
        throw new Error("Invitation has expired");
      }

      const { getTenantDb } = await import("@hrms-app/db");
      const tenantDb = getTenantDb(row.tenantSchema) as any;
      const invite = await tenantDb.query.employeeInvitations.findFirst({
        where: eq(employeeInvitations.id, row.invitationId),
      });
      if (!invite) throw new Error("Invitation not found");
      if (invite.status !== "pending") throw new Error("Invitation already used");

      // Look up the inviter's tenantId.
      const inviter = await adminDb.query.users.findFirst({
        where: eq(users.id, invite.invitedByUserId),
      });
      if (!inviter?.tenantId) {
        throw new Error("Cannot determine tenant for this invitation");
      }

      // Create the employee.
      const today = new Date().toISOString().slice(0, 10)!;
      const [employee] = await tenantDb
        .insert(employees)
        .values({
          fullName: invite.fullName,
          nationality: "saudi",
          employmentStatus: "active",
          hireDate: today,
          salaryBasic: "0",
          salaryHousing: "0",
          salaryTransport: "0",
          departmentId: invite.departmentId,
        })
        .returning();

      // Create the user.
      const passwordHash = await hash(input.password, 12);
      await adminDb.insert(users).values({
        email: invite.email,
        name: invite.fullName,
        passwordHash,
        role: invite.role as any,
        tenantId: inviter.tenantId,
        employeeId: (employee as any).id,
      });

      // Mark the invitation accepted in both the tenant table and the
      // public index.
      await tenantDb
        .update(employeeInvitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(employeeInvitations.id, invite.id));
      await adminDb
        .update(inviteTokenIndex)
        .set({ status: "accepted" })
        .where(eq(inviteTokenIndex.id, row.id));

      return { success: true, employee };
    }),
});

/** Best-effort extraction of the tenant schema name from a Drizzle db handle. */
function extractSchemaName(db: unknown): string | null {
  // The tenant-manager sets `db._schemaName` on the patched connection.
  const candidate = (db as { _schemaName?: string })._schemaName;
  return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}
