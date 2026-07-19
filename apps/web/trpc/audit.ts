import { schema } from "@hrms-app/db";

/**
 * Central audit-log writer. Every sensitive mutation (salary change, payroll
 * run, EOSB/settlement, employee create/delete, period reopen) records who did
 * what, when, and the old/new values, into the tenant `audit_logs` table.
 *
 * Audit failure must never block the primary operation, but it is surfaced in
 * server logs so a missing trail is noticed.
 */
export interface AuditEntry {
  action: string;                 // e.g. "employee.update", "payroll.reopen"
  entityType: string;             // e.g. "employee", "payroll_run"
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

interface AuditableContext {
  db: { insert: (table: unknown) => { values: (v: unknown) => Promise<unknown> } };
  user: { id: string; role: string };
  headers: Headers;
}

function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return headers.get("x-real-ip");
}

export async function writeAudit(ctx: AuditableContext, entry: AuditEntry): Promise<void> {
  try {
    await ctx.db.insert(schema.tenant.auditLogs).values({
      userId: ctx.user.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      // Record the acting role alongside the values so a dual-role actor is traceable.
      oldValue: entry.oldValue ?? null,
      newValue:
        entry.newValue !== undefined
          ? { ...(entry.newValue as Record<string, unknown>), _actingRole: ctx.user.role }
          : { _actingRole: ctx.user.role },
      ipAddress: clientIp(ctx.headers),
    });
  } catch (err) {
    console.error("[audit] failed to write audit log for", entry.action, err);
  }
}

/** Fields whose changes are salary-sensitive and gated to payroll-authorised roles. */
export const SALARY_FIELDS = ["salaryBasic", "salaryHousing", "salaryTransport"] as const;

/** Pick only the keys present in `changed` from `source` (for old-value snapshots). */
export function pickChanged<T extends Record<string, unknown>>(
  source: T | undefined | null,
  changed: Record<string, unknown>,
): Partial<T> {
  if (!source) return {};
  const out: Partial<T> = {};
  for (const key of Object.keys(changed)) {
    if (key in source) out[key as keyof T] = source[key as keyof T];
  }
  return out;
}
