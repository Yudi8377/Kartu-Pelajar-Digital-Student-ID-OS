# Database status — Student ID OS

Last verified: 2026-10-15 (read-only production inspection)

## Production database

- Neon project: `young-band-21857293`
- Branch: `production` (`br-late-meadow-b3vj6rqi`)
- Database: `neondb`
- Schema: `public`
- PostgreSQL: 18.6
- Initial migration source in repository: `db/migrations/0001_initial.sql`
- Security migration source in repository: `db/migrations/0002_runtime_security.sql`

## Verified live schema and data state

A read-only query confirmed 12 tables in `public`:

- `schools`, `app_users`, `school_memberships`, `students`, `student_cards`, `audit_events`
- `school_classes`, `school_class_students`, `school_class_teachers`
- `attendance_sessions`, `attendance_events`, `attendance_corrections`

Read-only row-count queries on all 12 tables returned zero rows. No real or synthetic student records are present in these application tables.

Row-level security is enabled on all 12 tables. A read-only inspection also found policies for school membership, assigned classes, attendance, and card access, plus helper functions such as `is_school_member` and `can_manage_school_class`. This is broader than the initial six-table migration in the repository, so the database and repository migration history must be reconciled before another schema change. Do not blindly reapply the SQL migration or infer that every policy has been independently tested.

## Runtime role

The role `student_id_os_runtime` exists with `NOBYPASSRLS`, `NOCREATEDB`, and `NOCREATEROLE`. Its observed table grants are limited to SELECT/INSERT/UPDATE on business tables and SELECT/INSERT on audit events; it has no DELETE grant and no UPDATE grant on `audit_events`.

A connection test explicitly using this role failed because the Neon connection service reported missing password credentials. Treat the runtime connection as **not configured/verified**. Do not use `neondb_owner` for normal application requests; it has RLS bypass capability. Configure the runtime role password only through an approved secret-management workflow, and never paste it into chat, source code, or GitHub.

## Neon Auth

Neon Managed Better Auth is provisioned on both production and rehearsal branches. The application login integration is being developed on the feature branch. A provisioned identity service is not proof that the app's full sign-up/sign-in/session flow or school authorization has passed end-to-end tests.

See `docs/AUTH-SETUP.md` for branch URLs, required host secrets, trusted-origin setup, and verification checklist.

## Connectivity readiness endpoint

`GET /api/ready` checks only whether the server-side `DATABASE_URL` can execute `SELECT 1`. It does not verify schema version, application permissions, tenant isolation, or production readiness. `GET /health` is a liveness check.

## Blocking items before commercial production

- Reconcile database schema/policy history with checked-in migrations and add a repeatable migration ledger.
- Provide the restricted runtime database credential via the selected host's secret manager and test it without owner privileges.
- Complete auth end-to-end tests and enforce school membership plus role authorization on every private server route.
- Implement and test tenant isolation, card issuance/revocation, QR verification/rate limiting, and attendance APIs.
- Verify backups/restore, monitoring, incident response, privacy notices, retention/deletion, and applicable Indonesian child-data requirements.
- Select and configure a production Next.js host and domain, then smoke-test the exact deployment SHA.

Use synthetic data until all applicable release gates pass. Production schema changes still require rehearsal, evidence, and explicit approval.
