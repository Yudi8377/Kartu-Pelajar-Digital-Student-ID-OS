# Digital Card OS — production readiness gates

## Current verified state

- Public static preview: deployed through GitHub Pages.
- Card Type Registry and Card Studio: available in the public static preview.
- Generic issuance/revocation/minimal-verification API source: merged into `main`; these are Next.js server routes, not GitHub Pages functions.
- Database migrations 0001–0004: rehearsed in disposable PostgreSQL during CI. This does not mean they have been applied to a production database.
- CI checks: typecheck, lint, unit tests, Next build, and migration rehearsal must pass for the current commit.
- No production credential issuance is enabled by default.

## Why the API is not live on GitHub Pages

GitHub Pages serves static HTML, CSS, JavaScript, and assets. It does not execute Next.js API routes, maintain server secrets, or provide a private PostgreSQL database. A successful Pages deployment therefore proves the website is live, not that the identity/card backend is operational.

The current server code also uses the Neon Auth integration and a PostgreSQL runtime role. Do not assume those services are configured or reachable; this must be resolved explicitly before a production launch. If the requirement remains strictly GitHub-only, the backend cannot be made into a conventional always-on commercial SaaS using GitHub Pages alone. A self-managed server/database or a deliberate hosting decision is required.

## Required environment variables for a server-capable deployment

- `DATABASE_URL`: restricted runtime PostgreSQL role, never the database owner or superuser.
- `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`: current auth integration settings; cookie secret must be at least 32 characters.
- `DIGITAL_CARD_RATE_LIMIT_SECRET`: at least 32 characters, kept server-side only.
- `DIGITAL_CARD_LIFECYCLE_API_ENABLED=true`: keep unset/false until the lifecycle deployment checklist passes.
- `DIGITAL_CARD_PUBLIC_VERIFY_ENABLED=true`: keep unset/false until verification abuse controls and monitoring pass.
- `DIGITAL_CARD_TRUSTED_PROXY_IP_ENABLED=true`: only when the reverse proxy strips client-supplied forwarding headers and overwrites `x-real-ip`.

Never place any of these secrets in `site/index.html`, public assets, client-side JavaScript, or repository commits.

## Release checklist

1. Decide on a server-capable hosting model and confirm it fits the user's data-location, cost, and provider constraints.
2. Provision PostgreSQL; create a dedicated restricted runtime login role and keep owner credentials separate.
3. Rehearse migrations 0001–0004 on a disposable database. Review role grants, RLS, functions, and backups before applying to production.
4. Configure and test authentication, session cookies, account recovery, issuer provisioning, and tenant isolation.
5. Configure trusted proxy IP handling, verify database-backed rate limits, and add alerting for repeated failures and abuse.
6. Test issuance, single-display token handling, verification of active/expired/revoked cards, and revocation. Confirm no API returns private claims.
7. Configure backups and perform a restore rehearsal; establish retention, incident response, and data-deletion procedures.
8. Complete privacy/legal review for the data categories and each issuer. Obtain issuer authorization; do not present service cards as official government credentials.
9. Run a production-like acceptance test with synthetic data and obtain explicit release approval before enabling the feature flags.
10. Only after these gates pass, enable the API flags and publish a verified production status.

## Safe operation until launch

Use the public demo only with synthetic data. Keep issuance and verification disabled in any server environment that has not passed the checklist. Hajj/Umrah service cards remain prototype-only.
