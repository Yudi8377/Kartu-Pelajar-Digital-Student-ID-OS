# Commercial backend architecture (GitHub Pages + Neon)

## Decision

The owner has requested autonomous work toward a commercial launch while retaining the no-Vercel direction. Use:

- **GitHub Pages** for the public, static website and UI shell.
- **Neon Postgres + Neon Auth + Neon Functions** for private data, identity, and server-side operations.
- **GitHub Actions** for CI, dependency auditing, and static artifact validation.

This is a change from the earlier GitHub-only restriction: GitHub remains the source-control and frontend host, while Neon is the backend provider. Do not introduce Vercel or Cloudflare.

## Isolated backend project

A new, empty Neon project was created for the commercial backend rather than cloning the existing Student ID OS production branch. The new database is isolated from any legacy student records. The four reviewed SQL migrations (0001–0004) were applied to its empty database; Neon Auth (Better Auth provider) was provisioned and the GitHub Pages origin was added as a trusted origin.

The first Neon Function is deployed at `https://br-calm-mountain-azgavkou-cardosapi.compute.c-3.ap-southeast-1.aws.neon.tech/`; its `/health` endpoint has a GitHub Actions smoke test. This is a health-only shell, not a card API. This provisioning is **not equivalent to a commercial launch**. No issuer or real user was bootstrapped, no student data was copied, and no card-operation API or production user flow is declared complete. Keep all public features in demo mode until backend APIs and the complete sign-in/authorization journey are deployed and tested.

## Trust boundaries

- Never put a database URL, Auth cookie secret, private key, or privileged service credential into the Pages artifact.
- Browser clients must use a short-lived, verified Auth token. The backend must validate signature, expiry, issuer, and intended audience before database access.
- The backend must enforce issuer/tenant membership server-side on every read and write. Do not trust issuer IDs or role labels supplied by a browser.
- Use transactions for card issue/revoke plus audit events. Store only the SHA-256 hash of a high-entropy QR credential.
- Public verification is disabled until negative tests, abuse controls, and rate-limit behavior are verified. Do not trust `X-Forwarded-For` at a Neon Function.
- Use synthetic data for all tests. Do not copy real student records into preview or staging environments.
- Use the restricted runtime role for application queries; do not run normal request traffic as a database owner.
- Apply migrations to production only after isolated rehearsal, backup/restore verification, and review of the exact migration diff.

## Required launch gates

1. Create and test a minimal authenticated Neon Function API using Node.js 24 and the existing migrations.
2. Configure the Auth client for the static site; test sign-up/sign-in/session expiry/sign-out and email verification using the real Pages origin.
3. Verify school/issuer isolation with negative cross-tenant tests, including read, issue, list, revoke, and audit access.
4. Verify expired, revoked, malformed, replayed, and unknown QR tokens. Keep public QR lookup closed until rate-limit and abuse tests pass.
5. Verify database runtime-role permissions and RLS using the exact production runtime role, not only a privileged test connection.
6. Commit a reproducible lockfile and use `npm ci` in CI.
7. Verify monitoring, backup and restore, incident response, data retention/export/deletion, and Indonesian privacy/child-data obligations with a responsible operator.
8. Build and device-test signed Android release artifacts and a genuinely offline Windows Admin Control Center. A WebView wrapper or static fallback is not an offline-capable release.
9. Run independent security review and obtain a release decision before onboarding schools or handling real student data.

## Current release policy

The public Pages website can be released as a **static product demo** when CI passes. The commercial backend remains **not launched** until the gates above have evidence. Never represent a health endpoint, a passing build, or successful database migration as proof of a complete SaaS product.
