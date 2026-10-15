import { Pool } from "pg";

const required = [
  "DATABASE_ADMIN_URL",
  "BOOTSTRAP_AUTH_SUBJECT",
  "BOOTSTRAP_SCHOOL_NAME",
  "BOOTSTRAP_SCHOOL_CODE",
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.CONFIRM_BOOTSTRAP !== "YES") {
  console.error("Refusing to bootstrap. Set CONFIRM_BOOTSTRAP=YES only after verifying the target database and identity.");
  process.exit(1);
}

const schoolName = process.env.BOOTSTRAP_SCHOOL_NAME.trim();
const schoolCode = process.env.BOOTSTRAP_SCHOOL_CODE.trim().toUpperCase();
const adminName = process.env.BOOTSTRAP_ADMIN_NAME.trim();
const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
const authSubject = process.env.BOOTSTRAP_AUTH_SUBJECT.trim();

if (schoolName.length < 2 || schoolName.length > 200) {
  throw new Error("School name must be 2–200 characters.");
}
if (!/^[A-Z0-9][A-Z0-9_-]{1,19}$/.test(schoolCode)) {
  throw new Error("School code must be 2–20 characters using A–Z, 0–9, underscore, or hyphen.");
}
if (adminName.length < 2 || adminName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("Provide a valid bootstrap administrator name and email.");
}
if (authSubject.length > 200) {
  throw new Error("Authentication subject is too long.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_ADMIN_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
  application_name: "student-id-os-one-time-bootstrap",
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["student-id-os-first-school-bootstrap"]);

  const state = await client.query(
    "SELECT (SELECT count(*)::int FROM public.schools) AS schools, (SELECT count(*)::int FROM public.school_memberships) AS memberships",
  );
  if (state.rows[0].schools !== 0 || state.rows[0].memberships !== 0) {
    throw new Error("Bootstrap stopped: schools or memberships already exist. Use the reviewed admin provisioning workflow instead.");
  }

  const school = await client.query(
    "INSERT INTO public.schools (name, code, status) VALUES ($1, $2, 'active') RETURNING id",
    [schoolName, schoolCode],
  );
  const user = await client.query(
    "INSERT INTO public.app_users (auth_subject, display_name, email, status) VALUES ($1, $2, $3, 'active') RETURNING id",
    [authSubject, adminName, adminEmail],
  );
  await client.query(
    "INSERT INTO public.school_memberships (school_id, user_id, role, status) VALUES ($1, $2, 'school_admin', 'active')",
    [school.rows[0].id, user.rows[0].id],
  );
  await client.query(
    "INSERT INTO public.audit_events (school_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5, $6::jsonb)",
    [school.rows[0].id, user.rows[0].id, "bootstrap.first_school", "school", school.rows[0].id, JSON.stringify({ bootstrap: "one_time", role: "school_admin" })],
  );

  await client.query("COMMIT");
  console.log("Bootstrap completed. One school and one school_admin membership were created.");
  console.log(`School ID: ${school.rows[0].id}`);
  console.log("No database or authentication secrets were printed.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
