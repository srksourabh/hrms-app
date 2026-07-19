import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createFinalSettlementSchema } from "@hrms-app/validators";
import { calculateFinalSettlement, qualifiesForArt87FullAward } from "@hrms-app/payroll";
import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { writeAudit } from "../audit";

function toNumber(value: string | null | undefined): number {
  return value ? Number.parseFloat(value) : 0;
}

const ktItemSchema = z.object({
  task: z.string().min(2),
  successor: z.string().min(2),
  interimOwner: z.string().optional(),
  dueDate: z.string().min(8),
  status: z.enum(["pending", "in_progress", "complete"]),
  notes: z.string().optional(),
});

const assetReturnSchema = z.object({
  asset: z.enum(["laptop", "phone", "id_card", "parking", "uniform", "keys", "other"]),
  serial: z.string().optional(),
  status: z.enum(["pending", "returned", "lost"]),
  returnedAt: z.string().optional(),
});

const exitInterviewSchema = z.object({
  conductedBy: z.string().min(2),
  date: z.string().min(8),
  primaryReason: z.enum(["resignation", "termination", "end_of_contract", "retirement", "transfer", "other"]),
  satisfaction: z.number().min(1).max(5),
  wouldRecommend: z.boolean(),
  rehireEligibility: z.enum(["yes", "no", "conditional"]),
  rehireReason: z.string().optional(),
  highlights: z.string().optional(),
  concerns: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const itRevocationSchema = z.object({
  system: z.string(),
  scheduledFor: z.string(),
  revokedAt: z.string().optional(),
  status: z.enum(["scheduled", "completed"]),
});

function safeParse(s: string | null | undefined): any {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function readPayload(existing: { exitReason: string | null }) {
  if (!existing.exitReason) return { offboarding: {} as Record<string, any> };
  const parts = existing.exitReason.split(" :: ");
  if (parts.length < 2) return { offboarding: {} as Record<string, any> };
  return safeParse(parts[1]);
}

function writePayload(existing: { exitReason: string | null }, payload: any) {
  const prefix = (existing.exitReason ?? "").split(" :: ")[0];
  return `${prefix} :: ${JSON.stringify(payload)}`;
}

export const settlementRouter = createTRPCRouter({
  list: companyProcedure
    .input(
      z
        .object({
          employeeId: z.string().uuid().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const where = input?.employeeId ? eq(schema.tenant.finalSettlements.employeeId, input.employeeId) : undefined;
      return await ctx.db.query.finalSettlements.findMany({
        where,
        with: { employee: true },
        orderBy: desc(schema.tenant.finalSettlements.createdAt),
        limit: 100,
      });
    }),

  create: requireRole("super_admin", "hr_manager")
    .input(createFinalSettlementSchema)
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.id, input.employeeId),
      });
      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found." });
      }

      // ── Article 80 documentation gate (EOSB-010) ──────────────────────────
      // A dismissal for cause cannot be finalised without the Article 57
      // investigation document on file for this employee.
      if (input.separationReason === "termination_for_cause") {
        if (!input.investigationDocumentId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Article 80 dismissal requires the investigation document to be attached before finalising the settlement.",
          });
        }
        const doc = await ctx.db.query.documents.findFirst({
          where: and(
            eq(schema.tenant.documents.id, input.investigationDocumentId),
            eq(schema.tenant.documents.employeeId, input.employeeId),
          ),
        });
        if (!doc) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The referenced investigation document was not found for this employee.",
          });
        }
      }

      // ── Article 87 auto-derivation ────────────────────────────────────────
      // A resignation within 6 months of marriage / 3 months of childbirth
      // qualifies for the full award without the caller flipping a flag.
      const art87 = qualifiesForArt87FullAward(input.separationReason, input.terminationDate, {
        marriageDate: input.marriageDate,
        childbirthDate: input.childbirthDate,
      });

      // ── Compute EOSB from the engine — never trust a client-supplied amount (DOC-003) ──
      const eosb = calculateFinalSettlement({
        hireDate: employee.hireDate,
        terminationDate: input.terminationDate,
        basicSalary: toNumber(employee.salaryBasic),
        housingAllowance: toNumber(employee.salaryHousing),
        transportAllowance: toNumber(employee.salaryTransport),
        separationReason: input.separationReason,
        completedProbation: input.completedProbation,
        fullAwardOverride: input.fullAwardOverride || art87,
      });

      const [settlement] = await ctx.db
        .insert(schema.tenant.finalSettlements)
        .values({
          employeeId: input.employeeId,
          esbAmount: eosb.eosbAmount.toString(),
          unpaidSalary: input.unpaidSalary?.toString(),
          accruedLeavePayout: input.accruedLeavePayout?.toString(),
          exitReason: input.exitReason,
        })
        .returning();

      await writeAudit(ctx, {
        action: "settlement.create",
        entityType: "final_settlement",
        entityId: settlement?.id ?? input.employeeId,
        newValue: {
          employeeId: input.employeeId,
          separationReason: input.separationReason,
          esbAmount: eosb.eosbAmount,
          terminationDate: input.terminationDate,
        },
      });

      return {
        ...settlement,
        computed: {
          eosbAmount: eosb.eosbAmount,
          resignationFraction: eosb.eosbResignationFraction,
          yearsOfService: eosb.components.yearsOfService,
          warnings: eosb.warnings,
          requiresHrReview: eosb.requiresHrReview,
        },
      };
    }),

  getByEmployee: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.finalSettlements.findFirst({
      where: eq(schema.tenant.finalSettlements.employeeId, input),
      with: { employee: true },
    });
  }),

  offboarding: createTRPCRouter({
    initiate: requireRole("super_admin", "hr_manager", "hr_specialist")
      .input(
        z.object({
          employeeId: z.string().uuid(),
          lastWorkingDay: z.string().min(8),
          primaryReason: z.enum(["resignation", "termination", "end_of_contract", "retirement", "transfer", "other"]),
          initiatedBy: z.string().min(2),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const payload = {
          offboarding: {
            initiatedBy: input.initiatedBy,
            initiatedAt: new Date().toISOString(),
            lastWorkingDay: input.lastWorkingDay,
            primaryReason: input.primaryReason,
            ktItems: [] as z.infer<typeof ktItemSchema>[],
            assetReturns: [] as z.infer<typeof assetReturnSchema>[],
            itRevocations: [
              { system: "Email & SSO", scheduledFor: input.lastWorkingDay, status: "scheduled" },
              { system: "VPN & network access", scheduledFor: input.lastWorkingDay, status: "scheduled" },
              { system: "HR self-service portal", scheduledFor: input.lastWorkingDay, status: "scheduled" },
            ] as z.infer<typeof itRevocationSchema>[],
            exitInterview: null as z.infer<typeof exitInterviewSchema> | null,
          },
        };
        const [settlement] = await ctx.db
          .insert(schema.tenant.finalSettlements)
          .values({
            employeeId: input.employeeId,
            exitReason: `${input.primaryReason} :: ${JSON.stringify(payload)}`,
          })
          .returning();
        return { ...settlement, structured: payload };
      }),

    addKtItem: requireRole("super_admin", "hr_manager", "hr_specialist")
      .input(z.object({ settlementId: z.string().uuid(), item: ktItemSchema }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.finalSettlements.findFirst({
          where: eq(schema.tenant.finalSettlements.id, input.settlementId),
        });
        if (!existing) throw new Error("Settlement not found");
        const payload = readPayload(existing);
        payload.offboarding = payload.offboarding ?? {};
        payload.offboarding.ktItems = payload.offboarding.ktItems ?? [];
        payload.offboarding.ktItems.push(input.item);
        await ctx.db
          .update(schema.tenant.finalSettlements)
          .set({ exitReason: writePayload(existing, payload) })
          .where(eq(schema.tenant.finalSettlements.id, input.settlementId));
        return { ok: true };
      }),

    addAssetReturn: requireRole("super_admin", "hr_manager", "hr_specialist")
      .input(z.object({ settlementId: z.string().uuid(), asset: assetReturnSchema }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.finalSettlements.findFirst({
          where: eq(schema.tenant.finalSettlements.id, input.settlementId),
        });
        if (!existing) throw new Error("Settlement not found");
        const payload = readPayload(existing);
        payload.offboarding = payload.offboarding ?? {};
        payload.offboarding.assetReturns = payload.offboarding.assetReturns ?? [];
        payload.offboarding.assetReturns.push(input.asset);
        await ctx.db
          .update(schema.tenant.finalSettlements)
          .set({ exitReason: writePayload(existing, payload) })
          .where(eq(schema.tenant.finalSettlements.id, input.settlementId));
        return { ok: true };
      }),

    recordExitInterview: requireRole("super_admin", "hr_manager", "hr_specialist")
      .input(z.object({ settlementId: z.string().uuid(), interview: exitInterviewSchema }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.finalSettlements.findFirst({
          where: eq(schema.tenant.finalSettlements.id, input.settlementId),
        });
        if (!existing) throw new Error("Settlement not found");
        const payload = readPayload(existing);
        payload.offboarding = payload.offboarding ?? {};
        payload.offboarding.exitInterview = input.interview;
        await ctx.db
          .update(schema.tenant.finalSettlements)
          .set({ exitReason: writePayload(existing, payload) })
          .where(eq(schema.tenant.finalSettlements.id, input.settlementId));
        return { ok: true };
      }),

    complete: requireRole("super_admin", "hr_manager")
      .input(z.object({ settlementId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const existing = await ctx.db.query.finalSettlements.findFirst({
          where: eq(schema.tenant.finalSettlements.id, input.settlementId),
        });
        if (!existing) throw new Error("Settlement not found");
        const payload = readPayload(existing);
        payload.offboarding = payload.offboarding ?? {};
        payload.offboarding.completedAt = new Date().toISOString();
        await ctx.db
          .update(schema.tenant.finalSettlements)
          .set({ exitReason: writePayload(existing, payload) })
          .where(eq(schema.tenant.finalSettlements.id, input.settlementId));
        return { ok: true };
      }),

    getPayload: companyProcedure.input(z.object({ settlementId: z.string().uuid() })).query(async ({ ctx, input }) => {
      const existing = await ctx.db.query.finalSettlements.findFirst({
        where: eq(schema.tenant.finalSettlements.id, input.settlementId),
        with: { employee: true },
      });
      if (!existing) throw new Error("Settlement not found");
      const payload = readPayload(existing);
      return { settlement: existing, offboarding: payload.offboarding ?? {} };
    }),
  }),
});