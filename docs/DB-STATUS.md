# Database status — Student ID OS

Last verified: 2026-10-15

## Production database

- Neon project: `young-band-21857293`
- Branch: `production` (`br-late-meadow-b3vj6rqi`)
- Database: `neondb`
- Schema: `public`
- PostgreSQL: 18.6
- Initial migration source: `db/migrations/0001_initial.sql`
- Pending security migration source: `db/migrations/0002_runtime_security.sql`

## Applied schema

The initial schema migration was applied to the production branch after being prepared and tested on an isolated temporary branch. The temporary branch was then removed by the migration workflow.

Expected application tables:

- `schools`
- `app_users`
- `school_memberships`
- `students`
- `student_cards`
- `audit_events`

A read-only verification after initial application found all six tables in `public`. No sample or real student records were inserted. Recheck production row counts before onboarding.

## Runtime database role and pending security migration

A dedicated role named `student_id_os_runtime` has been created on the production branch using SQL with `NOBYPASSRLS`, `NOCREATEDB`, and `NOCREATEROLE`. It currently has no password, so it cannot authenticate as an application connection. Do not use the database owner role as a substitute for routine app traffic.

The migration in `db/migrations/0002_runtime_security.sql` was prepared and tested on an isolated temporary branch (`br-hidden-tree-b35m3xvr`). Verification confirmed row-level security is enabled on all six application tables, the runtime role lacks DELETE and audit UPDATE privileges, it is neither superuser nor RLS-bypass, and an unknown QR hash returns a generic invalid result without personal data. The migration has **not** been applied to production. Production application of this security migration requires explicit approval.

Before the application can connect, set a password for `student_id_os_runtime` through the Neon Console, then store its connection string only in the hosting platform's secret manager. Do not paste the password or connection string into chat, GitHub, source files, or public environment variables.

## Connectivity readiness endpoint

The source repository's `GET /api/ready` checks that a server can connect using its server-side `DATABASE_URL` and execute `SELECT 1`. It returns a generic 503 when configuration is absent or the database cannot be reached. It does not inspect table existence, perform student CRUD, validate tenant permissions, or establish production readiness. The existing `GET /health` remains a lightweight liveness response.

## Important limitations

- Authentication and server-side school-scoped authorization are not implemented in the source application.
- The public UI preview is a separate static hosting snapshot and is not connected to the database.
- QR issuance and live verification are not yet exposed by the application.
- Do not enter real student personal data until server-side authorization, tenant-isolation tests, privacy review, backup/recovery procedures, and a real deployment check are complete.
- Use temporary Neon branches for migration rehearsal and require human approval before applying production security/schema changes.
