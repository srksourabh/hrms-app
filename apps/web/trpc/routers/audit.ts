import { z } from "zod";
import { createTRPCRouter, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { desc } from "drizzle-orm";

/**
 * Audit-log access — HR Manager / super admin only (access matrix: "Audit
 * logs: HR Mgr only"). The log is written by the central audit helper on every
 * sensitive mutation; it is read-only here (no update/delete surface).
 */
export const auditRouter = createTRPCRouter({
  list: requireRole("super_admin", "hr_manager")
    .input(
      z
        .object({ limit: z.number().int().min(1).max(200).default(50) })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.auditLogs.findMany({
        orderBy: desc(schema.tenant.auditLogs.createdAt),
        limit: input?.limit ?? 50,
      });
    }),
});
