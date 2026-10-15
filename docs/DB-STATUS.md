# Database status — Student ID OS

Last verified: 2026-10-15

## Production database

- Neon project: `young-band-21857293`
- Branch: production (`br-late-meadow-b3vj6rqi`)
- Database: `neondb`
- PostgreSQL: 18.6
- Migrations: `0001_initial.sql`, `0002_runtime_security.sql`, `0003_student_attendance.sql`

## Applied and verified schema

All three migrations have been applied to the production branch. Read-only catalog verification confirmed 12 application tables, 31 row-level security policies, and six authorization/verification helper functions. RLS is enabled on all 12 tables.

Tables:
- Core identity: `schools`, `app_users`, `school_memberships`, `students`, `student_cards`, `audit_events`
- Attendance: `school_classes`, `school_class_students`, `school_class_teachers`, `attendance_sessions`, `attendance_events`, `attendance_corrections`

The runtime role has no UPDATE/DELETE privilege on attendance events or corrections. Read-only row counts verified that all application tables are empty; no real student or school records have been inserted.

## Runtime credential

The dedicated `student_id_os_runtime` role exists with `NOBYPASSRLS`, `NOCREATEDB`, and `NOCREATEROLE`, but was last verified with authentication method `no_login` and no password. The app must not connect until the runtime role credential is configured securely and verified. Do not substitute the database owner role for routine application traffic.

## Auth and source API

Neon Auth is now provisioned on the production branch as well as the isolated rehearsal branch. The production trusted origin and host secrets are not configured. Source branch APIs now include:
- `GET /api/me` — server session to app-user mapping and active institution memberships
- `GET /api/students?school_id=<uuid>` — read under RLS
- `POST /api/students` — create a student and audit event under RLS

These routes have not yet passed live end-to-end or cross-tenant behavioral tests. The UI/API foundation does not constitute a commercially ready service.

## Remaining blockers

- Live host, trusted origin, auth cookie secret, and runtime DB credential.
- Reviewed first-admin, school, and membership provisioning process.
- Behavioral RLS tests with two synthetic schools and multiple roles.
- Class/teacher assignment, attendance sessions/events/corrections APIs and UI.
- QR issuance/rotation/revocation and public rate-limited verification.
- Backup/restore rehearsal, monitoring, incident response, retention/deletion, privacy notice and legal review.

Use synthetic data only until all release gates are closed and evidenced.
