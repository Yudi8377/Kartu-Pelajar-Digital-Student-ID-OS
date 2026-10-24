# Digital Card Lifecycle API

**Status: source implementation under review; not yet deployed as a production API.** The GitHub Pages static preview cannot execute these routes. Use synthetic records in a private rehearsal environment only.

## List issued cards

`GET /api/digital-cards?issuerId=<issuer-uuid>`

Requires an authenticated session and an active issuer membership with `issuer_admin` or `operator` role. Returns at most 200 records and never returns raw credentials, credential hashes, or private claims.

## Issue a card

`POST /api/digital-cards` with `Content-Type: application/json`:

```json
{
  "issuerId": "<issuer-uuid>",
  "cardNumber": "DEMO-2026-0001",
  "cardTypeId": "student_id",
  "subjectRef": "issuer-local-random-reference",
  "expiresAt": "2027-06-30T23:59:59.000Z"
}
```

The server generates a 256-bit random opaque token, stores only its SHA-256 hash, and returns the raw token once in the creation response. Do not store the raw token in logs or analytics. `subjectRef` must be an issuer-local opaque reference, not a name, government ID, phone number, or other direct identifier. The API limits the request body and applies a database-backed per-user/per-issuer issuance limit. The card insert and audit event share a database transaction.

## Revoke a card

`PATCH /api/digital-cards/<card-uuid>` with `Content-Type: application/json`:

```json
{
  "issuerId": "<issuer-uuid>",
  "reason": "Replaced after issuer review"
}
```

Only an active or pending card in the explicitly selected issuer can be revoked by an authorized issuer operator. Revocation and its audit event share a transaction. The endpoint applies a database-backed per-user/per-issuer rate limit and bounded request body.

## Current limitations and required gates

- Public verification endpoint is intentionally not enabled yet. A trusted edge/client-IP policy, shared rate limiting for anonymous callers, generic invalid-token behavior, and abuse monitoring must be designed and tested first.
- Token rotation/reissue is not implemented in this slice. A lost one-time token must not be recoverable from the database; implement a separately audited rotation flow before operational use.
- The current issuer membership model and authentication must be tested against a deployed backend using the restricted runtime role.
- Run negative tests for anonymous access, wrong issuer, revoked membership, inactive issuer, duplicate card number, expired card, malformed/oversized body, rate limit, database failure, and transaction rollback.
- The current GitHub Pages deployment does not run these API routes. Do not advertise these routes as live until a supported backend is provisioned and end-to-end tests pass.
- Never put names, document numbers, MRZ, photos, or biometric data into public card claims or QR payloads.
