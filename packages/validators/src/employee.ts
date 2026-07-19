import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

/**
 * Saudi government ID format (VAL-005). Both a Saudi national ID and an iqama
 * are 10 digits; a citizen ID starts with 1, an iqama (resident) starts with 2.
 * The value is stored in `iqamaNumberEnc` and validated on the plaintext input.
 */
export function validateNationalId(
  value: string | undefined,
  nationality: "saudi" | "expat",
  ctx: z.RefinementCtx,
): void {
  if (!value) return; // optional
  if (!/^\d{10}$/.test(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["iqamaNumberEnc"], message: "ID must be exactly 10 digits" });
    return;
  }
  const expectedPrefix = nationality === "saudi" ? "1" : "2";
  if (value[0] !== expectedPrefix) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["iqamaNumberEnc"],
      message:
        nationality === "saudi"
          ? "A Saudi national ID must start with 1"
          : "An iqama number must start with 2",
    });
  }
}

const employeeBaseSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200).describe("Employee full name"),
  nationality: z.enum(["saudi", "expat"]).describe("Nationality classification"),
  departmentId: uuidSchema.optional().describe("Department UUID"),
  managerEmployeeId: uuidSchema.optional().describe("Manager employee UUID"),
  iqamaNumberEnc: z.string().optional().describe("National ID / Iqama number (10 digits)"),
  passportNumberEnc: z.string().optional().describe("Encrypted passport number"),
  bankIbanEnc: z.string().optional().describe("Encrypted bank IBAN"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Hire date must be YYYY-MM-DD").describe("Date of hire"),
  gosiRegistrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().describe("GOSI registration date"),
  gosiSystem: z.enum(["old", "new"]).optional().describe("GOSI system type"),
  // Upper bounds fit within numeric(12,2) so an extreme value can't overflow the
  // column (VAL-004); GOSI base is separately capped in the engine.
  salaryBasic: z.number().positive().max(9_999_999_999, "Salary is out of range").describe("Basic salary"),
  salaryHousing: z.number().min(0).max(9_999_999_999).default(0).describe("Housing allowance"),
  salaryTransport: z.number().min(0).max(9_999_999_999).default(0).describe("Transport allowance"),
});

/** Reject a hire date more than a year in the future (typo guard, VAL-008). */
function futureHireDateGuard(hireDate: string | undefined, ctx: z.RefinementCtx): void {
  if (!hireDate) return;
  const hire = new Date(hireDate);
  const oneYearAhead = new Date();
  oneYearAhead.setUTCFullYear(oneYearAhead.getUTCFullYear() + 1);
  if (hire > oneYearAhead) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hireDate"], message: "Hire date is too far in the future." });
  }
}

export const createEmployeeSchema = employeeBaseSchema.superRefine((data, ctx) => {
  validateNationalId(data.iqamaNumberEnc, data.nationality, ctx);
  futureHireDateGuard(data.hireDate, ctx);
});

export const updateEmployeeSchema = employeeBaseSchema.partial().superRefine((data, ctx) => {
  if (data.iqamaNumberEnc !== undefined && data.nationality) {
    validateNationalId(data.iqamaNumberEnc, data.nationality, ctx);
  }
});

export const employeeQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "terminated", "suspended", "on_leave"]).optional().describe("Filter by employment status"),
  departmentId: uuidSchema.optional().describe("Filter by department"),
  search: z.string().max(200).optional().describe("Search text on full name (English or Arabic)"),
  sortBy: z.enum(["fullName", "hireDate", "createdAt"]).optional().describe("Column to sort by"),
  sortDir: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
