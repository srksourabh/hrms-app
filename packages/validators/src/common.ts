import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID");

export const emailSchema = z.string().email("Invalid email address");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // Cap is intentionally high; pages that need full result sets (dashboard,
  // organogram, file-upload employee picker) call with up to 500 and rely on
  // their own tRPC procedures for tenant-scoped pagination when needed.
  pageSize: z.coerce.number().int().positive().max(500).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function paginate(page: number, pageSize: number) {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}
