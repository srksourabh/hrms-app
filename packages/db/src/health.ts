import postgres from "postgres";

function requiredDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to check the database connection.");
  }
  return url;
}

function isTransientDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection closed|connection terminated|econnreset|socket hang up|timeout/i.test(message);
}

export async function checkDatabaseConnection(attempt = 1): Promise<boolean> {
  const sql = postgres(requiredDatabaseUrl(), {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
    keep_alive: 30,
  });

  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    if (attempt < 3 && isTransientDbConnectionError(error)) {
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      return checkDatabaseConnection(attempt + 1);
    }
    return false;
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined);
  }
}
