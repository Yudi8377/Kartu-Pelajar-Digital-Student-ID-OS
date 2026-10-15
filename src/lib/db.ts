import "server-only";

import { Pool, type PoolClient } from "pg";

type StudentIdGlobal = typeof globalThis & {
  studentIdOsPool?: Pool;
};

const globalForStudentIdOs = globalThis as StudentIdGlobal;

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!globalForStudentIdOs.studentIdOsPool) {
    globalForStudentIdOs.studentIdOsPool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: "student-id-os",
    });
  }

  return globalForStudentIdOs.studentIdOsPool;
}

/**
 * Checks whether the configured PostgreSQL database can answer a trivial query.
 * This must only be called from server-side code.
 */
export async function checkDatabaseConnection(): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}


/**
 * Run a database operation inside a transaction with a transaction-local
 * authenticated subject for the database's row-level security policies.
 * DATABASE_URL must identify the restricted runtime role, never the owner.
 */
export async function withAuthenticatedDb<T>(
  authSubject: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  if (!authSubject || authSubject.length > 200) {
    throw new Error("Invalid authenticated subject");
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.auth_subject', $1, true)", [authSubject]);
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
