# Kartu Pelajar Digital — Student ID OS

PWA-first Digital Card OS: a reusable digital identity-card platform, beginning with Indonesian schools and designed for separate domains such as project-worker and institution-member cards. The source application is under active development; it is not yet an operational commercial production service and must not be used with real student data.

## Public preview

A public UI preview is available at https://kartu-pelajar-digital-student-id-os-n0ar6x.v2.appdeploy.ai/. It uses fictional demo identity details only. It is a separate static hosting snapshot, not synchronized with GitHub, and does not connect to Neon, authenticate users, issue QR credentials, or verify real cards.

## Implemented source-branch scope

- Indonesian public landing page and reusable card-domain templates
- Neon PostgreSQL schema foundation and row-level security policies
- Neon Auth server adapter and same-origin auth proxy scaffold
- Sign-in page with self-registration blocked
- `GET /api/me`: resolves the server-side session, provisions the app-user profile under RLS, and returns active institution memberships
- `GET /api/students?school_id=<uuid>`: tenant-scoped student listing, maximum 200 rows
- `POST /api/students`: validated student creation with an audit event, constrained by database RLS
- `POST /api/students/:studentId/card`: issue/rotate a card, store only the token hash, and return the opaque token once
- `GET /api/health` and `GET /api/ready`
- Institution workspace UI for membership selection and student records

## Current release status

Production Neon Auth has been provisioned on the production Neon branch, but the public application host, trusted production origin, auth/runtime secrets, and runtime database connection are not configured. Login and protected APIs have not yet passed end-to-end tests on a live application URL. First-admin and school-membership provisioning remain controlled operational steps; a new login does not automatically gain school access.

Attendance operations, QR issuance/rotation/verification, guardian/student self-service, billing, monitoring, backup/restore rehearsal, privacy/legal review, and multi-tenant behavioral tests remain incomplete. Do not enter real student data.

The `/api/ready` response only confirms that the server can execute `SELECT 1`; it does not prove authorization or commercial readiness.

## Security principles

- Keep database credentials server-side only.
- Use the dedicated least-privilege runtime database role, not the owner role.
- Bind the verified auth subject inside each database transaction so RLS cannot inherit identity from another pooled request.
- Enforce school/tenant authorization on every protected server request.
- QR codes must contain opaque random tokens, never student details; store only token hashes.
- Use synthetic data and a separate rehearsal branch until all release gates pass.

## Getting started

1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure a development-only Neon `DATABASE_URL`, the matching branch `NEON_AUTH_BASE_URL`, and a unique `NEON_AUTH_COOKIE_SECRET` of at least 32 characters.
5. Run `npm run dev`.
6. Check `/health`, `/api/ready`, and after signing in `/api/me`.

## References

- `docs/DEPLOYMENT.md` — current host/CI status and release gates.
- `docs/AUTH-INTEGRATION.md` — auth setup and environment requirements.
- `docs/FIRST-ADMIN-BOOTSTRAP.md` — controlled first-school administrator setup; manual operational procedure only.
- `docs/DB-STATUS.md` — production schema and runtime-role status.
- `docs/SECURITY-READINESS.md` — mandatory gates before real student data.
- `docs/QR-VERIFICATION-CONTRACT.md` — privacy-preserving QR design.
- `docs/COMMERCIAL-READINESS.md` — commercial release tiers and operational requirements.
- `docs/PRODUCT-VISION-COMPLIANCE.md` and `docs/CARD-DOMAINS-AND-ATTENDANCE.md` — product domains and safeguards.
- `docs/EMERGENCY-GUARDIAN.md` — emergency guardian concept and launch gates.
- `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` — architecture and roadmap.
- `tests/scenarios.md` — security and workflow scenarios.
