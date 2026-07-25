import type { SQL } from "drizzle-orm";
import postgres from "postgres";

function requiredDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to execute database queries.");
  }
  return url;
}

function isTransientDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /connection closed|connection terminated|econnreset|socket hang up|timeout/i.test(message);
}

const queryConfig = {
  escapeName: (name: string) => `"${name.replaceAll('"', '""')}"`,
  escapeParam: (index: number) => `$${index + 1}`,
  escapeString: (value: string) => `'${value.replaceAll("'", "''")}'`,
  casing: {
    getColumnCasing: (column: { name: string }) => column.name,
  },
};

export async function executeAdminSql<T = unknown>(query: SQL, attempt = 1): Promise<T[]> {
  const client = postgres(requiredDatabaseUrl(), {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false,
    keep_alive: 30,
  });

  try {
    const built = query.toQuery(queryConfig);
    return (await client.unsafe(built.sql, built.params)) as T[];
  } catch (error) {
    if (attempt < 3 && isTransientDbConnectionError(error)) {
      await client.end({ timeout: 1 }).catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
      return executeAdminSql<T>(query, attempt + 1);
    }
    throw error;
  } finally {
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}
