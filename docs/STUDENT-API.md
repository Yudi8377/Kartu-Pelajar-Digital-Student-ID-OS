# Student API — implementation contract

## Current implementation

`src/app/api/students/route.ts` provides:
- `GET /api/students?schoolId=<uuid>` — returns at most 200 students for one school, sorted by name.
- `POST /api/students` — creates a student and writes an audit event in the same database transaction.

Both endpoints require a Neon Auth session. They require an existing active application profile and an active `school_admin` or `operator` membership for the requested school. The school ID is always explicit; the database query is scoped to that tenant. Public registration does not grant school membership or a role.

The create endpoint validates JSON content type, streams the request body with an 8 KiB cap, normalizes the school-local student number to uppercase, validates field lengths/control characters, relies on the database unique constraint for same-school duplicates, and returns generic errors. Audit metadata contains only the action source, not student fields or credentials.

## API examples

List:

```http
GET /api/students?schoolId=<authorized-school-uuid>
```

Create:

```json
{
  "schoolId": "<authorized-school-uuid>",
  "studentNumber": "XI-2026-014",
  "fullName": "Contoh Siswa",
  "classLabel": "XI IPA 1"
}
```

Only fictional data may be used in development. Do not use this endpoint with real student records until the release gates in `docs/SECURITY-READINESS.md` pass.

## Required verification before production

- [ ] CI typecheck, lint, unit tests, and build run against the exact latest commit.
- [ ] Integration tests exercise anonymous, unprovisioned, no-membership, revoked-membership, wrong-school, student-role, operator, and school-admin cases.
- [ ] Verify RLS behavior using the actual restricted runtime credential in a rehearsal database.
- [ ] Verify same-school duplicate handling, cross-school same-number acceptance, oversized streaming request, malformed UTF-8/JSON, invalid UUID, control characters, and database failure behavior.
- [ ] Verify transaction rollback removes both the student insert and audit event when either operation fails.
- [ ] Add abuse protection/shared rate limiting and monitoring before production.
- [ ] Add update, archive/status workflow, import/export approvals, card issuance, QR lifecycle, and attendance only in separately tested increments.

## Scope limitation

This is the first school-scoped list/create API slice, not a complete student-management module. It does not implement update/delete, bulk import, parent linking, card issuance, QR verification HTTP endpoints, attendance, or UI integration. No hosted end-to-end test has yet been recorded.
