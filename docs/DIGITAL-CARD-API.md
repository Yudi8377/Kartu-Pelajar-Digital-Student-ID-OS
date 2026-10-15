# Digital Card OS lifecycle API — initial server implementation

## Endpoints

- `POST /api/digital-cards/issue`: authenticated issuer admin/operator can issue a generic credential.
- `POST /api/digital-cards/{cardId}/revoke`: authenticated issuer admin/operator can revoke a credential.
- `POST /api/digital-cards/verify`: public minimal validity check; never returns names, claims, subject references, card numbers, or token hashes.

Lifecycle routes are deliberately disabled unless `DIGITAL_CARD_LIFECYCLE_API_ENABLED=true`. Issuance/revocation also require `DIGITAL_CARD_RATE_LIMIT_SECRET` with at least 32 characters and migration `0004_digital_card_rate_limits.sql` applied. Public verification additionally requires `DIGITAL_CARD_PUBLIC_VERIFY_ENABLED=true` and `DIGITAL_CARD_TRUSTED_PROXY_IP_ENABLED=true`. Do not enable the toggle until deployment, database role, auth, rate limit, tenant isolation, and release checks are verified.

## Issuance request

```json
{
  "issuerId": "00000000-0000-4000-8000-000000000000",
  "cardTypeId": "project_identity",
  "subjectRef": "internal-reference-001",
  "expiresAt": "2027-01-01T00:00:00Z",
  "publicClaims": {
    "full_name": "Contoh Fiktif",
    "issuer_name": "server replaces this with the authoritative issuer name",
    "project_name": "Proyek Contoh",
    "role": "Anggota"
  },
  "privateClaims": {}
}
```

Use synthetic data for development. The subject reference must be issuer-local and opaque; do not use a name, phone number, student number, passport number, or other direct identifier.

The response contains the QR credential once. The database stores only its SHA-256 hash. Never log or place the raw token in audit metadata, URLs, analytics, or support tickets.

## Privacy and issuer checks

- Only registered fields are accepted.
- Fields marked private-by-default must be sent in `privateClaims`; they are never returned by the issuance response.
- Required fields are enforced from the registry.
- The issuer name is bound server-side to the active issuer record.
- Hajj/Umrah service cards remain prototype-only and are rejected by the registry gate.
- Rate limiting is atomic and shared in PostgreSQL per issuer/actor bucket (30 issuance attempts per hour).
- Revoke requires an active issuer admin/operator membership and writes an audit event.

## Production limitations

GitHub Pages is static hosting and does not execute Next.js API routes. These endpoints are source code for a server-capable deployment and are not live merely because the public site is live. The database migrations must be rehearsed on a disposable PostgreSQL instance, then separately approved and applied to the intended database. Do not use an owner/superuser database URL as `DATABASE_URL`; use the restricted runtime role.

The minimal verification route is implemented but remains disabled by default. Before enabling it, configure a trusted reverse proxy that overwrites `x-real-ip` (clients must not be able to supply the value that the application trusts), verify shared rate limiting on the intended host, add monitoring/alerting, and complete a security review. If the deployment cannot guarantee the proxy header, keep public verification disabled.
