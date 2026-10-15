# Kartu Pelajar Digital — Student ID OS

PWA-first digital student identity platform for Indonesian schools. This repository is the application foundation; it is not production-ready and must not be used with real student data yet.

## Current scope
- Indonesian-language PWA shell
- Neon PostgreSQL schema foundation
- Server-only database connectivity check at `GET /api/ready`
- CI checks and scenario-test catalogue
- Security-first multi-tenant architecture notes

## Development status
The `/health` endpoint is a lightweight liveness check. `/api/ready` runs a trivial database query and returns 200 only when `DATABASE_URL` is configured and reachable; it returns a generic 503 otherwise. It does not create, read, or update student records.

Authentication, server-side authorization, school/tenant isolation, QR issuance/verification, and student workflow integration are not yet implemented. The demo card is placeholder UI only. Do not enter real student personal data.

## Principles
- Keep database credentials server-side only.
- Enforce school/tenant authorization on every protected server request.
- QR codes must contain opaque random tokens, never student details; store only token hashes.
- Require human review for production migrations and releases.
- Use a separate Neon development branch and synthetic test data.

## Getting started
1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `DATABASE_URL` to a development-only Neon connection string. Never commit `.env.local` or expose the value with a `NEXT_PUBLIC_` prefix.
5. Run `npm run dev`.
6. Open `/api/ready` to check server-to-database connectivity.

A successful readiness response confirms only that the server can execute `SELECT 1`; it does not prove authorization, schema correctness, or production readiness.

## Security and verification references
- `docs/SECURITY-READINESS.md` — mandatory release gates before real student data.
- `docs/QR-VERIFICATION-CONTRACT.md` — planned privacy-preserving QR API behavior.
- `docs/DB-STATUS.md` — verified database migration status.
- `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` — architecture and phases.
- `tests/scenarios.md` — test scenarios.
