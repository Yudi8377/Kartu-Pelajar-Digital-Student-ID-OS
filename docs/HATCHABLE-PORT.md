# Hatchable compatibility and commercial launch decision

## Decision summary

Hatchable is **not approved as the zero-cost production host for a paid-customer launch**.

Official references (re-check before release):
- Terms: https://hatchable.com/terms — account holders must meet the platform's minimum age requirement (18+).
- Acceptable Use Policy: https://hatchable.com/acceptable-use — the free tier is not production infrastructure for paying customers.
- Pricing: https://hatchable.com/pricing — the free tier's public-app allowance and usage caps do not override the Acceptable Use Policy.
- Developer docs: https://hatchable.com/docs/developers/mcp — this Next.js/TSX repository cannot be imported and deployed unchanged; a separate compatible project format is required.

Because this product is intended for schools and may serve paying customers, do not launch a paid production service on Hatchable Free. Do not bypass age or account requirements. If Hatchable is used, an adult who meets the platform's terms must own and manage the account. The production hosting decision must match the intended business model and current provider terms.

## Verified connection status

- Hatchable connector currently returns no projects for the connected account.
- No Hatchable project has been created, imported, or deployed for Student ID OS.
- Do not claim that the application is live on Hatchable.
- A public UI preview hosted elsewhere is not the operational service.

## Source of truth

- Keep this repository and its reviewed commits as the source of truth.
- Do not import the Next.js repository root into Hatchable and expect it to run unchanged.
- `hatchable-port/` is a static, framework-free prototype only. It uses synthetic data and has no authentication, database persistence, valid QR credential, or attendance integration.
- Do not migrate or duplicate the Neon production schema/data into a new provider without a reviewed migration, rollback plan, export test, and explicit approval.
- Never put database credentials, auth secrets, or student data in public browser code or Git history.

## Commercial hosting gate

Before selecting a production host, record evidence for every item:
1. Current terms explicitly allow the intended commercial model and customer data.
2. Pricing and resource caps are understood, including what happens when limits are reached.
3. The host supports the required server-side runtime and encrypted secret handling.
4. Authentication, server-side authorization, and tenant isolation can be implemented and tested.
5. Database backup/export/restore, incident response, monitoring, and rollback are practical.
6. Data-processing, region, privacy, and retention terms are reviewed by the responsible operator/legal reviewer.
7. Deployment from the reviewed Git commit is reproducible and verifiable.

If zero cost and paid-customer production cannot both be supported by the same provider's terms, keep the app in non-production test/pilot state until a compliant hosting plan is chosen. Do not mislabel a static preview as an operational service.

## Mandatory product security gates

No real student records until all applicable controls are implemented and evidenced:
- Authentication on all private routes; server-side role and school-scope authorization on every request.
- Cross-school isolation tests for reads, writes, enumeration, exports, and QR verification.
- Least-privilege database credentials; no owner/superuser role for normal app traffic.
- QR tokens generated with a cryptographically secure random source; only hashes stored; expiry, revocation, rotation, rate limiting, and generic invalid responses tested.
- Audit events omit raw tokens and unnecessary personal information.
- Validation, safe errors, CSRF protection where applicable, security headers, dependency/secret scanning.
- Backup restore rehearsal, retention/deletion/export workflows, monitoring and incident-response process.
- Mobile/accessibility/offline behavior tests; offline UI must not claim live verification.
- Privacy notice and review of Indonesian personal-data and child-data requirements by the responsible operator/legal reviewer.
- Exact release commit, test artifacts, reviewer, date, and rollback target recorded.

## Current verified status (2026-10-15)

- GitHub Actions CI run #118 succeeded for documentation update commit `12cf49d7099e4efa6291968a893e9a2cf3888fea`: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/actions/runs/38709296736
- A successful CI run is not evidence of production security or end-to-end readiness.
- The existing AppDeploy URL is a static UI preview and is not connected to the operational Neon/auth flow.
- Authentication and profile bootstrap code exist on the feature branch, but the complete sign-up/sign-in/session flow and server-side school authorization have not passed end-to-end verification.
- Runtime DB credentials and the application of the security migration to the target environment remain unverified/pending; never substitute the database owner role.
- No production launch, production migration, or PR merge is authorized by this document.

## Release rule

Keep all release work in a reviewable branch/PR. Do not merge, publish as operational, onboard schools, or enter real student data until the hosting decision and all mandatory gates have verifiable evidence and the responsible owner approves the release.
