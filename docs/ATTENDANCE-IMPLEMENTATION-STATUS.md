# Student attendance implementation status

## Implemented in the development branch

- A proposed PostgreSQL migration for attendance sessions, attendance events and append-only correction records: `db/migrations/0003_student_attendance.sql`.
- School-scoped foreign keys and unique constraints to prevent cross-school session/student links and duplicate attendance events.
- Server-time session-window validation in row-level policies; only active students can be marked in an open session.
- Role checks for school administrators, operators and teachers, with row-level security.
- No UPDATE or DELETE grants for attendance events/corrections; corrections are new records with reason and actor.
- Static regression tests that check important migration guardrails.

## Not yet implemented

- The migration has **not** been applied to the production Neon database.
- The application has no verified authentication/session integration yet, so there is no safe attendance API or live attendance UI.
- Teacher-to-class assignment, verified guardian relationship and student/guardian read-only access are not yet modeled. The current schema uses `class_label` for the session scope, so a normalized class/schedule model is a later prerequisite for a larger deployment.
- Notification delivery, CSV/report exports, offline synchronization and device management are not operational.
- No real student data should be used for testing.

## Important migration dependency

Migration 0003 depends on `0001_initial.sql` and `0002_runtime_security.sql`, including the `student_id_os_runtime` role and helper functions. It should first be applied and tested on a temporary Neon branch using the least-privileged runtime role. Production changes require explicit approval, a rollback/restore plan and passing CI.

## Next implementation sequence

1. Verify the current branch CI, including typecheck, lint, tests and build.
2. Design and configure trusted authentication; never trust a client-provided user ID or role.
3. Add integration tests against a temporary database for cross-tenant denial, closed/out-of-window sessions, inactive students, duplicate events and correction history.
4. Add teacher/class assignments and verified guardian links before exposing those views.
5. Build the teacher attendance UI against authenticated server actions/API only.
6. Review migration and privacy controls, rehearse rollback, and request explicit approval before production deployment.
