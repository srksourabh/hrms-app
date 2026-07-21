/**
 * Builds the authoritative per-tenant DDL bundle from the Drizzle tenant
 * schema — the single source of truth for what a tenant schema contains
 * (DB-001). The bundle is materialised into `src/tenant-ddl.generated.ts` by
 * `scripts/generate-tenant-ddl.ts` and executed by `createTenantSchema()` with
 * `search_path` pinned to the new tenant schema, so every statement is
 * unqualified and lands inside that schema.
 *
 * Design notes:
 *  - Tables, enums, FKs and indexes are derived from `schema/tenant/*.ts` via
 *    drizzle-kit's programmatic API, so provisioning can never drift from the
 *    schema the app compiles against (the parity unit test enforces that the
 *    checked-in generated file matches this builder's output).
 *  - Every statement is made idempotent (IF NOT EXISTS / duplicate_object
 *    guards) so re-provisioning an existing schema is safe.
 *  - Enum types are created inside the tenant schema itself (matching the
 *    convention established by scripts/seed-rukn-modules.ts), not in public.
 *  - guide_maps.created_by references public.users — the one deliberate
 *    cross-schema FK — so that reference is re-qualified explicitly.
 *  - Hand-maintained EXTRA statements append what Drizzle cannot express:
 *    the audit_logs append-only trigger (DB-003), leave_balances timestamps
 *    (DB-009, not yet in the Drizzle schema — see leave_balances.ts note) and
 *    the trigram index for name search (QA-012).
 *
 * This module is imported only by the generator script and its test — never by
 * runtime code (drizzle-kit must not be bundled into the app).
 */
import { createRequire } from "node:module";
import { is } from "drizzle-orm";
import { PgTable, isPgEnum } from "drizzle-orm/pg-core";
import * as tenantSchema from "./schema/tenant";

/** Statements Drizzle cannot generate; appended verbatim after the schema DDL. */
const EXTRA_STATEMENTS: string[] = [
  // ── audit_logs append-only enforcement (DB-003, mirrors migration 0007) ──
  `CREATE OR REPLACE FUNCTION prevent_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'audit_logs is append-only; % is not permitted', TG_OP; END; $f$;`,
  `DROP TRIGGER IF EXISTS audit_logs_no_update ON "audit_logs";`,
  `DROP TRIGGER IF EXISTS audit_logs_no_delete ON "audit_logs";`,
  `CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();`,
  `CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();`,
  // ── leave_balances change timestamps (DB-009; mirrored for legacy tenants
  //    by migration 0010 — added here, not in the Drizzle schema, until 0010
  //    has been applied everywhere) ──
  `ALTER TABLE "leave_balances" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;`,
  `ALTER TABLE "leave_balances" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;`,
  // ── trigram index for leading-wildcard name search (QA-012). pg_trgm may be
  //    installed in public (self-hosted) or extensions (Supabase); fall back to
  //    a plain btree — same as legacy migration 0006 — if neither works. ──
  `DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public; EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_trgm unavailable: %', SQLERRM; END $$;`,
  `DO $$ BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS employees_fullname_trgm_idx ON "employees" USING gin (full_name public.gin_trgm_ops)'; EXCEPTION WHEN OTHERS THEN BEGIN EXECUTE 'CREATE INDEX IF NOT EXISTS employees_fullname_trgm_idx ON "employees" USING gin (full_name extensions.gin_trgm_ops)'; EXCEPTION WHEN OTHERS THEN EXECUTE 'CREATE INDEX IF NOT EXISTS employees_fullname_trgm_idx ON "employees" (full_name)'; END; END $$;`,
];

/** Tenant tables (name → Drizzle object), excluding relations/enums/types. */
export function tenantTables(): Record<string, PgTable> {
  const tables: Record<string, PgTable> = {};
  for (const [exportName, value] of Object.entries(tenantSchema)) {
    if (is(value, PgTable)) tables[exportName] = value;
  }
  return tables;
}

/** SQL-level table names of every table in the tenant Drizzle schema. */
export function tenantTableNames(): string[] {
  return Object.values(tenantTables())
    .map((t) => (t as unknown as { [key: symbol]: string })[Symbol.for("drizzle:Name")])
    .filter((n): n is string => typeof n === "string")
    .sort();
}

function stripSemicolon(statement: string): string {
  return statement.replace(/;\s*$/, "");
}

/**
 * Rewrites one drizzle-kit statement into its idempotent, tenant-schema-local
 * form (see module docblock).
 */
function normalizeStatement(statement: string): string {
  let s = statement.trim();
  // Everything lives in the tenant schema (resolved via search_path)…
  s = s.replaceAll(`"public".`, "");
  // …except the deliberate cross-schema FK to public.users.
  s = s.replace(/REFERENCES "users"\s*\(/g, `REFERENCES "public"."users" (`);

  if (s.startsWith("CREATE TYPE ")) {
    return `DO $$ BEGIN ${stripSemicolon(s)}; EXCEPTION WHEN duplicate_object THEN null; END $$;`;
  }
  if (s.startsWith("ALTER TABLE ")) {
    return `DO $$ BEGIN ${stripSemicolon(s)}; EXCEPTION WHEN duplicate_object THEN null; END $$;`;
  }
  if (s.startsWith("CREATE TABLE ")) {
    return s.replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS ");
  }
  if (s.startsWith("CREATE UNIQUE INDEX ")) {
    return s.replace(/^CREATE UNIQUE INDEX /, "CREATE UNIQUE INDEX IF NOT EXISTS ");
  }
  if (s.startsWith("CREATE INDEX ")) {
    return s.replace(/^CREATE INDEX /, "CREATE INDEX IF NOT EXISTS ");
  }
  return s;
}

/** Builds the full ordered DDL statement list for one tenant schema. */
export async function buildTenantDdl(): Promise<string[]> {
  // Lazy CJS load: drizzle-kit's ESM api.mjs throws "Dynamic require of fs"
  // under esbuild/tsx, and drizzle-kit must never load in runtime/test paths
  // that only need tenantTableNames(). The CJS api.js handles its own requires.
  const cjsRequire = createRequire(import.meta.url);
  const { generateDrizzleJson, generateMigration } =
    cjsRequire("drizzle-kit/api") as typeof import("drizzle-kit/api");

  const entities: Record<string, unknown> = {};
  for (const [exportName, value] of Object.entries(tenantSchema)) {
    if (is(value, PgTable) || isPgEnum(value)) entities[exportName] = value;
  }
  const empty = generateDrizzleJson({});
  const current = generateDrizzleJson(entities, empty.id);
  const statements = await generateMigration(empty, current);
  return [...statements.map(normalizeStatement), ...EXTRA_STATEMENTS];
}
