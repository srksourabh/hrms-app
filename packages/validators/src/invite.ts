import { z } from "zod";

const uuidSchema = z.string().uuid();

export const createInviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  role: z.enum(["hr_manager", "department_manager", "payroll_admin", "employee"])
    .optional()
    .default("employee"),
  departmentId: uuidSchema.optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
