# Admin Control Center — Digital Card OS

Status: authenticated application UI merged to `main`; production operations are **not approved** until the release gates below are verified.

## Access and runtime

- Application route: `/admin`; requires a server-side authenticated session.
- The page does not grant a school or issuer role simply because an account can sign in.
- It is part of the Next.js server application. It is **not** included in the static `site/` GitHub Pages artifact.
- The public GitHub Pages site is a separate product preview and cannot execute Next.js routes or access private server secrets.

## Modules and their real data/action boundaries

| Menu | Specific responsibility | Current source of data/actions | Production boundary |
|---|---|---|---|
| Ringkasan operasional | Membership count, selected-school holder count, release-gate tasks | `GET /api/me`, `GET /api/students`, static release checklist | Metrics reflect available API responses only; no commercial analytics pipeline |
| Organisasi & penerbit | School memberships and digital-card issuer memberships | `GET /api/me`, `GET /api/digital-card-issuers` | Onboarding, legal review, and issuer creation are not self-service |
| Jenis kartu & template | Registry IDs, required issuer type, field list, status, and prototype boundary | Shared server registry reference plus documented catalog | UI is read-only; changes require reviewed registry/schema migration |
| Pemegang kartu | Search/list and create student record within selected school | `GET/POST /api/students` | Server checks active school membership; no student update/delete UI yet |
| Penerbitan & pencabutan | Issuer-scoped card inventory and explicit revoke action | `GET /api/digital-cards`, `POST /api/digital-cards/[cardId]/revoke` | API fails closed unless release flags, secret, role, schema, and rate-limit controls are configured |
| Verifikasi QR | Submit an opaque token and show minimal verification result | `POST /api/digital-cards/verify` | Disabled until trusted proxy and shared rate limiting are verified |
| Paket & penagihan | Draft pricing, quota, and billing-period planning | Browser-local draft only | No active subscription, invoice, payment gateway, refund, or reconciliation service |
| Pengguna & hak akses | Role matrix and least-privilege explanation | Role model documentation | Invitations and role changes are not yet exposed as a production workflow |
| Audit & keamanan | Issuer-admin audit read view and release checklist | `GET /api/digital-card-audit` plus security-readiness documentation | API returns a minimal audit projection; only issuer admins may read issuer audit events |
| Pengaturan sistem | Branding/support/retention draft | Browser-local draft only | Does not change server configuration or tenant settings |

## Privacy and security notes

- UI access control is not the authorization boundary; every protected API must enforce session, tenant/issuer membership, and role server-side.
- Student records are scoped to a selected school ID and the API verifies membership before reading or inserting.
- Issuer card lists omit raw QR tokens and claims. Revoke is a destructive lifecycle action and requires an explicit confirmation in the UI.
- The public verification endpoint must not return private claims, names, student numbers, contact details, or internal subject references.
- Browser-local package/settings drafts are not shared, backed up, or persisted on the server.
- Do not enter real student, pilgrim, or other personal data until the release gates are approved.

## Required before commercial onboarding

1. Choose and configure a server-capable production host for the Next.js app; GitHub Pages alone is insufficient.
2. Configure auth origins, secure session cookies, database URL, and a restricted runtime database credential through the host's secret manager.
3. Reconcile the production schema/migration ledger with reviewed migrations; do not blindly replay migrations on the existing database.
4. Run end-to-end authentication, role, tenant-isolation, issuance/revocation, and public-verification abuse tests on a rehearsal deployment.
5. Configure monitoring, backup/restore, incident response, retention/deletion/export, and applicable Indonesian privacy/child-data review.
6. Implement billing as a separate reviewed integration before accepting customer payments.
7. Verify the exact deployed commit and smoke-test the deployed app on desktop/mobile before claiming production readiness.

A passing CI build is necessary but not sufficient for commercial production. Keep issuance and verification disabled until all applicable controls are evidenced.
