# Student attendance implementation status

## Implemented in the development branch

- Draft migration `db/migrations/0003_student_attendance.sql` defines school classes, student enrollment per class, teacher assignments, attendance sessions, immutable attendance events and append-only corrections.
- Composite foreign keys bind class, student, session and event records to the same school.
- Teachers can manage attendance only for classes explicitly assigned to them; school administrators/operators manage school setup and class assignments.
- Event creation is restricted by row-level security to an open session within its configured time window, an active student and an active enrollment in that class.
- A unique session/student/event-type constraint and a school-scoped idempotency key help prevent duplicate records.
- Correction records require a reason and actor; runtime has no UPDATE/DELETE grants on attendance events or corrections.
- Static regression tests check key migration guardrails.

## Not yet implemented or verified

- The migration has **not** been applied to the production Neon database.
- The schema migration has not yet been confirmed against a live PostgreSQL instance. CI static tests do not replace a database migration rehearsal.
- The application still lacks verified authentication/session integration for the attendance workflow, so there is no safe attendance API or live attendance UI.
- Verified guardian relationships and student/guardian attendance read-only views are not modeled yet.
- Notifications, reports/exports, offline synchronization, device management and school-specific attendance policies are not operational.
- No real student data should be used for testing.

## Migration dependencies and review

Migration 0003 depends on `0001_initial.sql` and `0002_runtime_security.sql`, including the `student_id_os_runtime` role and helper functions. First apply and test it on a temporary Neon branch using the least-privileged runtime role. Validate teacher/class scoping, cross-school denial, closed/out-of-window sessions, inactive or unenrolled students, duplicate events and correction history. Production changes require explicit approval, a rollback/restore plan and passing CI.

## Next implementation sequence

1. Verify the current PR CI after the latest migration and test commits.
2. Configure trusted authentication; never trust a client-provided user ID or role.
3. Rehearse migration 0003 on a temporary database and add integration tests for row-level security and policy edge cases.
4. Add verified guardian links and carefully scoped student/guardian read-only views.
5. Build the teacher attendance UI against authenticated server API/actions only.
6. Add notifications and reports, review privacy controls, rehearse rollback, and request explicit approval before production deployment.
