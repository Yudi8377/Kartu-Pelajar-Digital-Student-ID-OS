import "server-only";

import { Pool } from "pg";

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
