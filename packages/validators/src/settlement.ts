import { z } from "zod";
import { uuidSchema } from "./common";

export const separationReasonSchema = z.enum([
  "resignation",
  "termination",            // employer termination without cause — full EOSB
  "termination_for_cause",  // Article 80 dismissal — zero EOSB, needs investigation doc
  "end_of_contract",
  "mutual_termination",
  "force_majeure",
  "death",
  "employer_fault",         // Article 81 — full EOSB, no notice
]);

/**
 * The EOSB amount is computed server-side from the employee record and the
 * separation reason — it is never accepted from the client (DOC-003). For an
 * Article 80 dismissal ("termination_for_cause") an investigation document is
 * mandatory before the settlement can be created (EOSB-010).
 */
export const createFinalSettlementSchema = z.object({
  employeeId: uuidSchema.describe("Employee UUID"),
  terminationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Termination date must be YYYY-MM-DD")
    .describe("Last working day"),
  separationReason: separationReasonSchema.describe("Statutory separation reason"),
  completedProbation: z.boolean().default(true).describe("Whether probation was completed"),
  fullAwardOverride: z.boolean().optional().describe("Article 87 full-award override (marriage/childbirth/force majeure)"),
  unpaidSalary: z.number().min(0).optional().describe("Unpaid salary amount"),
  accruedLeavePayout: z.number().min(0).optional().describe("Accrued leave payout amount"),
  investigationDocumentId: uuidSchema.optional().describe("Article 57 investigation document (required for termination_for_cause)"),
  exitReason: z.string().max(500).optional().describe("Reason for exit"),
});

export type CreateFinalSettlementInput = z.infer<typeof createFinalSettlementSchema>;
