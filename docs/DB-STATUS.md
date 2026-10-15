# Database status — Student ID OS

Last verified: 2026-10-15

## Production database

- Neon project: young-band-21857293
- Branch: production (br-late-meadow-b3vj6rqi)
- Database: neondb
- Schema: public
- PostgreSQL: 18.6
- Migration sources: db/migrations/0001_initial.sql, 0002_runtime_security.sql, and 0003_student_attendance.sql

## Applied and verified schema

All three migrations have now been applied to the production branch in order. Read-only catalog verification after migration confirmed 12 application tables, 31 row-level security policies, and six expected authorization/verification helper functions.

Tables present:
- Core identity: schools, app_users, school_memberships, students, student_cards, audit_events
- Student attendance: school_classes, school_class_students, school_class_teachers, attendance_sessions, attendance_events, attendance_corrections

RLS is enabled on all 12 tables. The runtime role student_id_os_runtime has no UPDATE or DELETE privilege on attendance_events or attendance_corrections, preserving the append-only correction model at the grant layer.

## Data and runtime credentials

Read-only row counts verified that all 12 application tables are empty. No student, guardian, worker, school, or attendance records have been inserted.

The dedicated role student_id_os_runtime exists with NOBYPASSRLS, NOCREATEDB, and NOCREATEROLE. The role has no password at the time of verification, so the application must not connect using it until an administrator sets its credential through the Neon Console and stores the connection string only in the production host's secret manager. Do not paste credentials into chat, GitHub, source files, or public environment variables. Do not substitute the database owner role for routine application traffic.

## Connectivity readiness endpoint

The source repository's GET /api/ready checks whether the server can connect using its server-side DATABASE_URL and execute SELECT 1. It does not prove that authentication, authorization, tenant isolation, attendance operations, or QR issuance work.

## Remaining production blockers

- A sign-in page and Neon Auth proxy scaffold exist in the feature branch. Neon Auth is provisioned only on the isolated rehearsal branch; production auth is not enabled.
- Session-to-app-user mapping, school membership provisioning, and authorization-aware APIs are not implemented.
- Server API routes for school, student, card lifecycle, attendance sessions/events/corrections are not implemented.
- QR issuance/rotation and a public rate-limited verification API are not implemented in the application.
- Behavioral RLS tests with two synthetic schools and multiple roles have not yet been run against the production runtime role.
- Production host, secret configuration, backup/restore rehearsal, monitoring, incident response, retention/deletion, privacy notices, and legal review remain release gates.

Use synthetic data only until all required security and operational gates are verified. Production migrations are applied; this does not mean the application is ready to onboard real students.
