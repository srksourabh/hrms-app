/**
 * Apply migration: 0008_user_lockout_columns.sql
 * Adds durable account-lockout columns to public.users (C2).
 * Idempotent — safe to re-run.
 */
const { Client } = require("pg");
const fs = require("fs");

const PROJECT_ROOT = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app";

const envContent = fs.readFileSync(PROJECT_ROOT + "/.env", "utf8");
const DATABASE_URL = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.split("=")[1]
  .replace(/^"/, "")
  .replace(/"/g, "");

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
console.log("DB:", DATABASE_URL.split("/").pop());

const sqlPath = PROJECT_ROOT + "/packages/db/drizzle/0008_user_lockout_columns.sql";
const sql = fs.readFileSync(sqlPath, "utf8");

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, statement_timeout: 60000 });
  await client.connect();
  console.log("Applying 0008_user_lockout_columns.sql...");
  try {
    await client.query(sql);
    console.log("Migration applied OK (users.failed_login_attempts + locked_until added)");
  } catch (err) {
    const msg = err ? err.message || String(err) : "";
    console.error("Migration failed:", msg.split("\n")[0]);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
