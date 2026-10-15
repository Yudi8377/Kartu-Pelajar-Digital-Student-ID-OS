# Database status — Student ID OS

Last verified: 2026-10-15

## Production database

- Neon project: `young-band-21857293`
- Branch: `production` (`br-late-meadow-b3vj6rqi`)
- Database: `neondb`
- Schema: `public`
- PostgreSQL: 18.6
- Migration source: `db/migrations/0001_initial.sql`

## Applied schema

The initial schema migration was applied to the production branch after being prepared and tested on an isolated temporary branch. The temporary branch was then removed by the migration workflow.

Expected application tables:

- `schools`
- `app_users`
- `school_memberships`
- `students`
- `student_cards`
- `audit_events`

A read-only verification after application found all six tables in `public`. The initial row-count check on the temporary branch returned zero rows for each table; no sample or real student records were inserted. Recheck production row counts before onboarding.

## Connectivity readiness endpoint

`GET /api/ready` checks that the server can connect using its server-side `DATABASE_URL` and execute `SELECT 1`. It returns a generic 503 when configuration is absent or the database cannot be reached. It does not inspect table existence, perform student CRUD, validate tenant permissions, or establish production readiness. The existing `GET /health` remains a lightweight liveness response.

## Important limitations

- The schema does not mean authentication or authorization is implemented.
- The web UI is still a clearly labeled demo and is not connected to the database for student workflows.
- QR issuance and verification endpoints are not implemented.
- Do not enter real student personal data until server-side authorization, tenant-isolation tests, privacy review, backup/recovery procedures, and a real deployment check are complete.
- Production schema changes require human approval. Use a temporary Neon branch for migration rehearsal first.
