# QR Verification Contract and Implementation Status

## Current implementation checkpoint — 2026-10-15

The source branch now includes `POST /api/students/:studentId/card` to issue or rotate a card for an authorized school user. It generates a cryptographically random token, stores only its SHA-256 hash, marks previous active cards as replaced, writes an audit event, and returns the raw token once with `Cache-Control: no-store`. The endpoint has not yet been verified end-to-end on a live host. It does not render a QR image or create a public verification endpoint.

The public verification endpoint below remains planned. Do not treat card issuance as a complete QR verification product.

## Endpoint

- Method: `POST`
- Path: `/api/qr/verify`
- Request content type: `application/json`
- Request body: `{ "token": "<opaque-token>" }`
- The raw token must not be placed in a URL, query string, analytics event, client-side error report, application log, or audit metadata.
- Apply request-size limits, schema validation, rate limiting, and abuse monitoring.

## Token lifecycle

1. Generate a high-entropy opaque token using a cryptographically secure random generator on the server.
2. Return the raw token only at issuance time to the intended card-generation flow.
3. Persist only a one-way cryptographic hash of the token in `student_cards.qr_token_hash`; never persist the raw token.
4. Compare by looking up the hash in the database. Do not accept a client-supplied hash as proof of identity.
5. Rotate the token when a card is replaced or a credential is suspected to be exposed. Revocation must take effect immediately.
6. Keep credentials out of logs, traces, analytics, audit metadata, and error messages.

## Validity decision

A card is verifiable only when all of the following hold:

- The token hash matches a stored card.
- The card status is `active`.
- The associated student is active.
- The associated school is active.
- The card has not reached its expiration time, if one is set.
- The database query is scoped consistently to the card's school and student relationship.

A UI-only check is insufficient. The server must make the decision using current persisted state for every verification request.

## Response privacy

For a valid card, return only a minimal confirmation such as:

```json
{
  "valid": true,
  "school": "Example School",
  "cardStatus": "active",
  "expiresAt": null
}
```

The exact public fields require a privacy review. Do not include full student name, student number, class, birth date, address, guardian details, email, phone, internal UUIDs, or membership information in a public response by default. If a school requires a named verifier workflow, authenticate the verifier and authorize it against that school before returning any additional field.

For invalid, unknown, expired, revoked, replaced, or otherwise unverifiable credentials, return a generic invalid result that does not reveal which internal check failed. HTTP status codes may distinguish malformed requests from a well-formed but invalid credential, but must not expose personal information.

## Audit and operations

- Record the outcome category, timestamp, request ID, and school scope only when the school can be identified safely.
- Never record the raw token or its hash in ordinary logs/audit metadata.
- Rate-limit by a combination of network and abuse-resistant signals, while avoiding permanent storage of unnecessary IP data.
- Avoid caching verification responses; if caching is introduced, revocation and expiry must invalidate cached results promptly.
- Ensure the public verification path cannot enumerate students or card numbers.

## Minimum test matrix

- Active, unexpired card is accepted.
- Expired card is rejected at the exact expiry boundary.
- Pending, revoked, expired, and replaced cards are rejected.
- Inactive student and suspended/closed school are rejected.
- Unknown and malformed tokens are rejected without PII.
- Revocation is reflected on the next verification.
- A school A verifier cannot retrieve private school B data.
- Raw token is absent from logs and audit metadata.
- Rate limits and generic error behavior are exercised.

## Remaining implementation status

- Card issue/rotation API exists in the source branch, but no live-host end-to-end test has passed yet.
- Public verification endpoint is not implemented.
- Durable rate limiting, abuse monitoring, QR image rendering, and verification end-to-end tests are not implemented.
- Production runtime database credentials and application host are not configured.

Until these are complete, do not use issued tokens as a public operational identity credential.