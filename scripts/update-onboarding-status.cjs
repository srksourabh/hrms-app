const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.iefwhxxhrycaalhxkfgp:0uKNZKTCt9JjHonT@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to Supabase PostgreSQL database.");

  // Check tenants table columns and data
  const { rows: tenants } = await client.query(`SELECT id, schema_name, onboarding_completed FROM tenants`);
  console.log("Current Tenants:", tenants);

  // Set onboarding_completed = 'true' for all tenants so demo companies pass the dashboard gate
  await client.query(`UPDATE tenants SET onboarding_completed = 'true';`);
  console.log("Updated onboarding_completed = 'true' for all tenants.");

  const { rows: updated } = await client.query(`SELECT id, schema_name, onboarding_completed FROM tenants`);
  console.log("Updated Tenants:", updated);

  await client.end();
}

main().catch(console.error);
