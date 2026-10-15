# Kartu Pelajar Digital — Student ID OS

PWA-first digital student identity platform for Indonesian schools. This repository is the application foundation; it is not production-ready and must not be used with real student data yet.

## Current scope
- Indonesian-language PWA shell
- Neon PostgreSQL schema foundation
- CI checks and scenario-test catalogue
- Security-first multi-tenant architecture notes

## Development status
Authentication, server-side authorization, QR verification, and live database integration are not yet implemented. The demo card is placeholder UI only. Do not enter real student personal data.

## Principles
- Keep database credentials server-side only.
- Enforce school/tenant authorization on every protected server request.
- QR codes must contain opaque random tokens, never student details; store only token hashes.
- Require human review for production migrations and releases.
- Use a separate Neon development branch and synthetic test data.

## Getting started
1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure a development-only `DATABASE_URL` when backend integration is implemented.
4. Run `npm run dev`.

## Security and verification references
- `docs/SECURITY-READINESS.md` — mandatory release gates before real student data.
- `docs/QR-VERIFICATION-CONTRACT.md` — planned privacy-preserving QR API behavior.
- `docs/DB-STATUS.md` — verified database migration status.
- `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` — system architecture and phases.
- `tests/scenarios.md` — test scenarios.
