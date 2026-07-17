import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as tenantSchema from "./schema/tenant";
import * as publicSchema from "./schema/public";

const ADMIN_DB_URL = process.env.DATABASE_URL ?? "postgresql://postgres:***@localhost:5432/hrms-app";

// Validate schema names to prevent SQL injection in the search_path parameter.
// Tenant schema names follow the pattern `tenant_<12-char-hex>` or are matched
// against known names by getTenantDb callers.
const SAFE_SCHEMA_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
function assertSafeSchema(schemaName: unknown): asserts schemaName is string {
  if (typeof schemaName !== "string" || !SAFE_SCHEMA_NAME.test(schemaName)) {
    throw new Error(`unsafe schema name: ${String(schemaName).slice(0, 80)}`);
  }
}

// Singleton admin client for public-schema queries (tenants, users, sessions).
const adminSql = postgres(ADMIN_DB_URL, {
  max: 5,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
  keep_alive: 30,
});
export const adminDb = drizzle(adminSql, { schema: publicSchema });

const tenantPools = new Map<string, ReturnType<typeof drizzle>>();
const tenantSqlConnections = new Map<string, ReturnType<typeof postgres>>();

/**
 * Returns a Drizzle client pinned to the given tenant schema.
 *
 * Why this works:
 *  - `connection.search_path` is sent in the startup packet to PostgreSQL.
 *    With `prepare: false` (required for pgBouncer transaction-mode), the
 *    search_path IS honored at the connection level.
 *  - Drizzle query-builder calls (db.query.*) and insert/update/delete calls
 *    use the same connection pool and therefore inherit the search_path.
 *  - For raw db.execute() calls (Drizzle's escape hatch), we additionally
 *    wrap the query in a transaction with SET LOCAL search_path so the SET
 *    and the query share the same physical connection even if pgBouncer
 *    strips startup parameters in some future configuration.
 */
export function getTenantDb(schemaName: string) {
  assertSafeSchema(schemaName);

  const existing = tenantPools.get(schemaName);
  if (existing) return existing;

  const sql = postgres(ADMIN_DB_URL, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: false,
    keep_alive: 30,
    connection: { search_path: schemaName },
  });
  const db = drizzle(sql, { schema: tenantSchema });

  // Tag the connection with its schema name so callers (e.g. invite.ts)
  // can recover the schema without scanning tenants.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any)._schemaName = schemaName;

  // Patch db.execute to run inside a transaction with SET LOCAL search_path.
  // This guarantees the SET and the query share a physical connection under
  // any pooler configuration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (db as any).execute = async (query: unknown, ...rest: unknown[]) => {
    return sql.begin(async (tx) => {
      await tx.unsafe(`SET LOCAL search_path TO "${schemaName}"`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (tx as any).unsafe(query as any, ...(rest as any[]));
    });
  };

  tenantPools.set(schemaName, db);
  tenantSqlConnections.set(schemaName, sql);
  return db;
}

/**
 * Closes all pooled connections. Call this from long-running scripts and
 * tests to avoid leaking postgres connections. Vercel serverless functions
 * don't need this — the function instance dies and the OS reaps sockets.
 */
export async function closeAllPools(): Promise<void> {
  for (const [name, sql] of tenantSqlConnections) {
    try {
      await sql.end({ timeout: 5 });
    } catch {
      // best-effort
    }
    tenantPools.delete(name);
  }
  tenantSqlConnections.clear();
}

export async function createTenantSchema(schemaName: string) {
  assertSafeSchema(schemaName);
  const sql = postgres(ADMIN_DB_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });
  try {
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await sql.unsafe(`SET search_path TO "${schemaName}"`);
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await sql.unsafe(generateTenantDDL());
    return true;
  } finally {
    await sql.end();
  }
}

function generateTenantDDL(): string {
  return `
    CREATE TABLE IF NOT EXISTS "departments" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      parent_department_id UUID,
      head_employee_id UUID,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "employees" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      manager_employee_id UUID,
      iqama_number_enc TEXT,
      passport_number_enc TEXT,
      bank_iban_enc TEXT,
      nationality TEXT NOT NULL CHECK (nationality IN ('saudi', 'expat', 'gcc')),
      full_name TEXT NOT NULL,
      employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','terminated','suspended','on_leave')),
      hire_date DATE NOT NULL,
      termination_date DATE,
      gosi_registration_date DATE,
      gosi_system TEXT CHECK (gosi_system IN ('old', 'new')),
      salary_basic NUMERIC(12,2) NOT NULL,
      salary_housing NUMERIC(12,2) NOT NULL DEFAULT 0,
      salary_transport NUMERIC(12,2) NOT NULL DEFAULT 0,
      rehire_eligible TEXT,
      rehire_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;
}

export async function createTenantRegistry(
  companyName: string,
  crNumber: string,
  nitaqatActivity: string,
  regulatoryContext?: "saudi" | "india",
) {
  const schemaName = `tenant_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const [tenant] = await adminDb
    .insert(publicSchema.tenants)
    .values({
      companyName,
      crNumber,
      nitaqatActivity,
      schemaName,
      ...(regulatoryContext ? { regulatoryContext } : {}),
    })
    .returning();
  await createTenantSchema(schemaName);
  return tenant;
}
