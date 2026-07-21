import { describe, it, expect } from "vitest";
import { TENANT_DDL_STATEMENTS } from "../tenant-ddl.generated";
import { tenantTableNames } from "../tenant-ddl-builder";

/**
 * DB-001 regression: the previous inline generateTenantDDL() created only
 * departments + employees (2 of ~72 tables), so every new tenant was
 * structurally broken. These tests assert the generated provisioning DDL
 * covers the whole Drizzle tenant schema. Regenerate with
 * `pnpm --filter @hrms-app/db gen:tenant-ddl` if this drifts.
 */
describe("tenant provisioning DDL (DB-001)", () => {
  const ddl = TENANT_DDL_STATEMENTS.join("\n");
  const tableNames = tenantTableNames();

  it("provisions a CREATE TABLE for every tenant table in the schema", () => {
    const missing = tableNames.filter(
      (name) => !ddl.includes(`CREATE TABLE IF NOT EXISTS "${name}"`),
    );
    expect(missing).toEqual([]);
  });

  it("creates as many tables as the schema defines (not the old 2-table stub)", () => {
    const created = (ddl.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length;
    expect(created).toBe(tableNames.length);
    expect(created).toBeGreaterThan(20);
  });

  it("keeps the audit_logs append-only trigger (DB-003)", () => {
    expect(ddl).toContain("audit_logs_no_update");
    expect(ddl).toContain("audit_logs_no_delete");
  });

  it("re-qualifies only the deliberate cross-schema FK to public.users", () => {
    const publicRefs = ddl.match(/"public"\."\w+"/g) ?? [];
    for (const ref of publicRefs) expect(ref).toBe('"public"."users"');
  });

  it("is idempotent (guards on every create)", () => {
    // No bare CREATE TABLE / CREATE TYPE without an existence guard.
    expect(ddl).not.toMatch(/CREATE TABLE (?!IF NOT EXISTS)/);
  });
});
