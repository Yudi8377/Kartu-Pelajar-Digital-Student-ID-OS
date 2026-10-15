# Generic Digital Card Storage v1

Migration `db/migrations/0003_generic_digital_cards.sql` adds an issuer-scoped schema alongside the existing Student ID tables. It is additive and does not alter or migrate existing student records.

## Tables

- `digital_card_issuers`: tenant/issuer identity and lifecycle status.
- `digital_card_issuer_memberships`: issuer-scoped roles (`issuer_admin`, `operator`, `verifier`, `viewer`).
- `digital_cards`: card type, issuer-local opaque subject reference, card lifecycle, one-way credential hash, and separated claim JSON.
- `digital_card_audit_events`: issuer-scoped audit trail without credential material.

## Access rules

- RLS is enabled for all four tables.
- Issuer and card mutations are scoped to issuer membership; only issuer admins can update issuer configuration and memberships.
- Direct card reads are restricted to issuer admins and operators. Verifiers do not receive direct access to public/private claim JSON.
- `verify_digital_card(bytea)` returns only a minimal validity result and issuer/card-type metadata for a valid credential. It does not return claims or holder data.
- The function is not granted to PUBLIC. Only the restricted runtime role can call it.
- Raw QR tokens must never be stored. Store only the SHA-256 hash of a high-entropy opaque token.

## Deployment gate

This migration has **not** been applied to a live database. Rehearse it on a disposable branch, review the SQL and RLS behavior, test with the actual restricted runtime role, and capture evidence before any production application.

Do not expose a public verification endpoint until a shared rate limiter, abuse monitoring, generic error behavior, and integration tests are implemented. The SQL function alone is not a production QR verification service.

The GitHub Pages website is a static preview and cannot run the private database or Next.js APIs. Keep using synthetic data only.
