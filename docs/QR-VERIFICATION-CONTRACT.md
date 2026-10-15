# QR Verification API Contract (Planned)

This document defines the expected behavior for a future endpoint. It does not mean the endpoint exists today.

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

## Current implementation status

This is a planned contract only. The database schema stores a unique token hash, but the verification endpoint, token issuance/rotation flow, rate limiting, and end-to-end tests have not been implemented.