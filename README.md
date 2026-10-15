# Kartu Pelajar Digital — Student ID OS

PWA-first digital student identity platform for Indonesian schools. The repository is the application source foundation; it is not yet an operational production system and must not be used with real student data.

## Hosting direction

The current decision is **GitHub only** for source, review, CI, and a possible static GitHub Pages site. Do not add Hatchable, AppDeploy, Vercel, Cloudflare, Supabase, Neon-hosted production services, or another provider unless the owner explicitly revises this constraint.

**Important:** GitHub Pages serves static files; it does not run Next.js server routes or provide a private transactional database, managed school authentication, or server-side secrets. GitHub-only can deliver a public website and a static demo using fictional data. It cannot alone operate the intended multi-school production SaaS with real student records.

## Approved product direction

The approved target is a national multi-school student identity platform, delivered in stages, with official cross-school transfer and location tracking limited to explicitly authorized, disclosed, time-bounded sessions. See `docs/PRODUCT-BLUEPRINT.md` for product domains and release gates.

## Current scope

- Indonesian-language Next.js/PWA source foundation.
- GitHub repository, reviewable pull request, and GitHub Actions quality workflow.
- Neon-related database/auth code and schema remain in the branch as legacy integration work; they are not part of a verified GitHub-only runtime and must not be exposed or represented as operational.
- First school-scoped student list/create API slice exists in source, but hosted integration, tenant-isolation tests, and full UI integration are not yet verified.
- Static preview is allowed only with fictional data and without operational identity/attendance claims.

## Security principles

- Never put secrets in public browser code, static exports, or Git history.
- Every private server request must enforce authentication and school-scoped authorization.
- QR tokens must be opaque, cryptographically random, revocable, and stored only as one-way hashes.
- Never enter real student personal data into static demos.
- Require human review for releases and migrations.

## Development

1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` only if working on the legacy server/database integration branch.
4. Use a development-only database, never real student data, for local experiments.
5. Run `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

A successful local build or CI run is not proof of production readiness.

## Key documents

- `docs/PRODUCT-BLUEPRINT.md` — product domains and staged roadmap.
- `docs/DEPLOYMENT.md` — GitHub-only deployment decision and limits.
- `docs/SECURITY-READINESS.md` — release gates before real student data.
- `docs/STUDENT-API.md` — first API slice and verification contract.
- `docs/ATTENDANCE-AND-SAFETY.md` — attendance and location privacy rules.
- `docs/HATCHABLE-PORT.md` — archived hosting exploration.
- `tests/scenarios.md` — required security and behavior scenarios.
