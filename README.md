# Digital Card OS — Kartu Identitas Digital

**Digital Card OS** is the evolving umbrella vision for a configurable platform to create, issue, manage, present, and verify purpose-specific digital cards. **Student ID OS remains the first product module**—the existing student and school work is retained, not discarded.

Examples of future card types include student identity, project/team identity, digital name cards, event participants, organization membership, achievements/certificates, and authorized Hajj/Umrah service workflows. These are planned modules, not claims that all features are already implemented.

## Hosting direction

The current decision is **GitHub only** for source, review, CI, and a static GitHub Pages preview. Do not add external hosting/service providers unless the owner explicitly revises this constraint.

**Important:** GitHub Pages serves static files; it does not run private Next.js server routes or provide a private transactional database, secure school/issuer authentication, or server-side secrets. GitHub-only can deliver a public website and a static demo with fictional data. It cannot alone operate the intended commercial identity platform with real personal data.

## Approved product direction

The product evolves from a student-only identity card into a **configurable Digital Card OS** with:
- A shared card lifecycle and verification core.
- A purpose selector that guides the issuer through intended use, functions, fields, validity, and verification policy.
- Separate modules for each card purpose, with independent authorization and data boundaries.
- Student ID OS retained as the first vertical and its existing work preserved.
- Security, privacy, and release gates before real-world operational use.

See `docs/DIGITAL-CARD-OS-VISION.md` for the umbrella product vision and roadmap, and `docs/PRODUCT-BLUEPRINT.md` for the detailed school/student module.

## Current scope and limits

- Indonesian-language Next.js/PWA source foundation.
- GitHub repository, reviewable changes, GitHub Actions quality workflow, and static public preview.
- Existing student API, card designer, QR/security contracts, attendance and safety docs remain part of the codebase.
- Existing Neon-related auth/database code is legacy integration work; it is not a verified GitHub-only runtime and must not be represented as operational.
- The first school-scoped student list/create API exists in source, but hosted integration, tenant-isolation tests, and full UI integration are not yet verified.
- The static preview uses fictional details only. It does not issue official cards, persist data, verify real QR credentials, or record attendance.

## Security principles

- A digital card is not automatically a government-issued or universally valid identity document.
- Every card type must have a named authorized issuer, defined purpose, minimal fields, lifecycle, verification policy, and audit trail.
- Never put secrets or sensitive personal data in public browser code, static exports, QR payloads, or Git history.
- Every private server request must enforce authentication, issuer/role permissions, and tenant scope.
- QR credentials must be opaque, cryptographically random, revocable, and stored only as one-way hashes.
- Never enter real student, pilgrim, employee, or other personal data into static demos.
- Specialized or official-use modules require relevant issuer authorization and separate legal, privacy, and security review.

## Development

1. Install Node.js 22+ and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` only if working on the legacy server/database integration branch.
4. Use synthetic data and a development-only database for local experiments.
5. Run `npm run dev`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

A successful local build or CI run is not proof of production readiness.

## Key documents

- `docs/DIGITAL-CARD-OS-VISION.md` — broader platform vision, configurable card types, boundaries, and roadmap.
- `docs/PRODUCT-BLUEPRINT.md` — existing Student ID OS school/student domain.
- `docs/DEPLOYMENT.md` — GitHub-only deployment decision and limits.
- `docs/SECURITY-READINESS.md` — release gates before real personal data.
- `docs/STUDENT-API.md` — first student API slice and verification contract.
- `docs/ATTENDANCE-AND-SAFETY.md` — attendance and location privacy rules.
- `docs/IDENTITY-VERIFICATION-INTEGRATION.md` — vendor-neutral identity document reading/authenticity integration contract and production gates; Regula is not yet licensed or integrated.
- `docs/DIGITAL-CARD-LIFECYCLE-API.md` — current card issuance/revocation endpoints, one-time QR token behavior, and outstanding release tests.
- `docs/HATCHABLE-PORT.md` — archived hosting exploration.
- `tests/scenarios.md` — required security and behavior scenarios.
