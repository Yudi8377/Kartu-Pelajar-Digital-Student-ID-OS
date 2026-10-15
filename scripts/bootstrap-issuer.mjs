import { Pool } from "pg";

const required = [
  "DATABASE_ADMIN_URL",
  "BOOTSTRAP_AUTH_SUBJECT",
  "BOOTSTRAP_ISSUER_KEY",
  "BOOTSTRAP_ISSUER_NAME",
  "BOOTSTRAP_ISSUER_TYPE",
  "BOOTSTRAP_ADMIN_NAME",
  "BOOTSTRAP_ADMIN_EMAIL",
];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (process.env.CONFIRM_ISSUER_BOOTSTRAP !== "YES") {
  console.error("Refusing to bootstrap. Set CONFIRM_ISSUER_BOOTSTRAP=YES only after verifying the exact target database and Auth identity.");
  process.exit(1);
}

const issuerKey = process.env.BOOTSTRAP_ISSUER_KEY.trim().toLowerCase();
const issuerName = process.env.BOOTSTRAP_ISSUER_NAME.trim();
const issuerType = process.env.BOOTSTRAP_ISSUER_TYPE.trim();
const adminName = process.env.BOOTSTRAP_ADMIN_NAME.trim();
const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
const authSubject = process.env.BOOTSTRAP_AUTH_SUBJECT.trim();
const allowedTypes = new Set(["school", "project", "organization", "event", "personal", "service_provider"]);

if (!/^[a-z][a-z0-9_-]{2,63}$/.test(issuerKey)) {
  throw new Error("Issuer key must be a 3–64 character lowercase slug.");
}
if (issuerName.length < 2 || issuerName.length > 200) {
  throw new Error("Issuer name must be 2–200 characters.");
}
if (!allowedTypes.has(issuerType)) {
  throw new Error("Issuer type is not supported.");
}
if (adminName.length < 2 || adminName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  throw new Error("Provide a valid bootstrap administrator name and email.");
}
if (!authSubject || authSubject.length > 200) {
  throw new Error("Authentication subject must be 1–200 characters.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_ADMIN_URL,
  max: 1,
  connectionTimeoutMillis: 10000,
  application_name: "digital-card-os-one-time-issuer-bootstrap",
});

const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`digital-card-os-issuer-bootstrap:${issuerKey}`]);

  const existing = await client.query(
    "SELECT id FROM public.digital_card_issuers WHERE issuer_key = $1 LIMIT 1",
    [issuerKey],
  );
  if (existing.rowCount !== 0) {
    throw new Error("Bootstrap stopped: this issuer key already exists. Use the reviewed issuer-admin workflow instead.");
  }

  await client.query(
    "INSERT INTO public.app_users (auth_subject, display_name, email, status) VALUES ($1, $2, $3, 'active') ON CONFLICT (auth_subject) DO NOTHING",
    [authSubject, adminName, adminEmail],
  );
  const userResult = await client.query(
    "SELECT id FROM public.app_users WHERE auth_subject = $1 AND status = 'active' LIMIT 1",
    [authSubject],
  );
  const user = userResult.rows[0];
  if (!user) throw new Error("Bootstrap stopped: the Auth user is not linked to an active application profile.");

  const issuerResult = await client.query(
    "INSERT INTO public.digital_card_issuers (issuer_key, display_name, issuer_type, status) VALUES ($1, $2, $3, 'active') RETURNING id",
    [issuerKey, issuerName, issuerType],
  );
  const issuerId = issuerResult.rows[0].id;

  await client.query(
    "INSERT INTO public.digital_card_issuer_memberships (issuer_id, user_id, role, status) VALUES ($1, $2, 'issuer_admin', 'active')",
    [issuerId, user.id],
  );
  await client.query(
    "INSERT INTO public.digital_card_audit_events (issuer_id, actor_user_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, 'issuer.bootstrap', 'digital_card_issuer', $3, $4::jsonb)",
    [issuerId, user.id, issuerId, JSON.stringify({ bootstrap: "one_time", role: "issuer_admin" })],
  );

  await client.query("COMMIT");
  console.log("Issuer bootstrap completed. One issuer and one issuer_admin membership were created.");
  console.log(`Issuer ID: ${issuerId}`);
  console.log("No database or authentication secrets were printed.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(error instanceof Error ? error.message : "Issuer bootstrap failed.");
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
