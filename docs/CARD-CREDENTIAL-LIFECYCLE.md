# Card Credential Lifecycle v1

This change adds the first server-side lifecycle endpoints for the Student ID vertical. It does not activate them in production.

## Endpoints

### Issue

- `POST /api/cards/issue`
- Body: `{ "schoolId": "<uuid>", "studentId": "<uuid>", "expiresAt": "2027-10-15T00:00:00Z" }`
- `expiresAt` is optional; when supplied it must be a future ISO timestamp with an explicit timezone.
- The caller must be authenticated and have an active `school_admin` or `operator` membership in the selected school.
- The student must be active and belong to that same school.
- A 256-bit random URL-safe QR credential is generated on the server. Only its SHA-256 hash is stored in `student_cards.qr_token_hash`.
- The raw token is returned once in the no-store response. It must not be logged or written to audit metadata.
- A non-PII audit event is written in the same database transaction.

### Revoke

- `POST /api/cards/{cardId}/revoke`
- Body: `{ "schoolId": "<uuid>" }`
- The caller must be authenticated and have an active `school_admin` or `operator` membership in the card's school.
- Active and pending cards can be revoked; repeated revocation is idempotent. Replaced/expired cards cannot be changed through this endpoint.
- Revocation and the audit event occur in the same transaction.

## Release gate

Both routes return HTTP 503 unless `CARD_LIFECYCLE_API_ENABLED=true`. Leave this variable unset or false until all of the following are independently verified in a hosted rehearsal:

- Auth and database runtime credentials are configured server-side and the database role is not an owner, superuser, or RLS-bypass role.
- The migrations and RLS policies are applied and verified.
- A shared rate-limiting control exists for public QR verification; issuance routes are protected against abuse.
- A real QR verification endpoint checks current card, student, and school status on every request and returns only minimum confirmation data.
- Integration tests prove cross-school isolation, token non-disclosure in logs, immediate revocation, and expiry behavior.
- Backup/restore, incident response, privacy notice, retention, and legal review are complete.

## Current deployment boundary

GitHub Pages serves only the static preview. It cannot execute these Next.js API routes or host the private database. Do not enable the feature flag on a static-only deployment. Use synthetic records only until the backend is separately hosted and reviewed.
