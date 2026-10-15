# Hatchable compatibility and commercial launch decision

## Decision summary

Hatchable is **not approved as the zero-cost production host for a paid-customer launch**.

Verified official policy references (re-check before release):
- Hatchable Terms: https://hatchable.com/terms — account holders must be at least 18 or the age of majority in their jurisdiction.
- Hatchable Acceptable Use Policy: https://hatchable.com/acceptable-use — prohibits using a free-tier project as production infrastructure for paying customers.
- Hatchable pricing: https://hatchable.com/pricing — the free tier permits one public app, but the free-tier permission does not override the Acceptable Use Policy.
- Hatchable developer docs: https://hatchable.com/docs/developers/mcp — deploy rejects Next.js, TSX/JSX, framework imports and build-step assumptions; source files must follow Hatchable's supported plain-file runtime contract.

Because this product is intended for schools and may eventually serve paying customers, do not launch a paid production service on Hatchable Free. Do not bypass age or account requirements. If Hatchable is used for any eligible work, an adult who meets the platform's terms must own and manage the account. A hosting choice must be re-evaluated against the actual production business model and current provider terms.

## Source of truth

- Keep this repository and its reviewed commits as the source of truth.
- Do not import the Next.js repository root into Hatchable and expect it to run unchanged.
- `hatchable-port/` is only a static, framework-free prototype. It uses synthetic data and has no authentication, database persistence, real QR credential, or attendance integration.
- Do not migrate or duplicate the Neon production schema/data into a new provider without a reviewed migration, rollback plan, export test, and explicit approval.
- Do not put database credentials, auth secrets, or student data in public browser code or Git history.

## Commercial hosting gate

Before selecting a production host, record evidence for every item:
1. Current terms explicitly allow the intended commercial model and customer data.
2. Pricing and resource caps are understood, including what happens when limits are reached.
3. The host supports the required server-side runtime and secrets handling.
4. Authentication, server-side authorization, and tenant isolation can be implemented and tested.
5. Database backup/export/restore, incident response, monitoring, and rollback are practical.
6. The host's data-processing, region, privacy, and retention terms are reviewed by the responsible adult/operator.
7. A deployment from the reviewed Git commit can be reproduced and verified.

If zero cost and paid-customer production cannot both be supported by the same provider's terms, keep the app in a non-production test/pilot state until a compliant hosting plan is chosen. Do not mislabel a static preview as the operational service.

## Mandatory product security gates

No real student records until all applicable controls are implemented and evidenced:
- Authentication on all private routes; server-side role and school-scope authorization on every request.
- Cross-school isolation tests for reads, writes, enumeration, exports, and QR verification.
- Least-privilege database credentials; no owner/superuser role for normal app traffic.
- QR tokens generated from a cryptographically secure random source; only hashes stored; expiry, revocation, rotation, rate limiting, and generic invalid responses tested.
- Audit events omit raw tokens and unnecessary personal information.
- Validation, safe errors, CSRF protection where applicable, security headers, dependency/secret scanning.
- Backup restore rehearsal, retention/deletion/export workflows, monitoring and incident-response process.
- Mobile/accessibility/offline behavior tests; offline UI must not claim live verification.
- Privacy notice and review of Indonesian personal-data and child-data requirements by the responsible operator/legal reviewer.
- Exact release commit, test artifacts, reviewer, date, and rollback target recorded.

## Current verified status (2026-10-15)

- GitHub Actions CI run #117 completed successfully for commit `2eee43a70b3fe8197f660b827152b800258eabc5`: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/actions/runs/38706381428
- The successful CI run is not evidence of production security or end-to-end readiness.
- The existing AppDeploy URL is a static UI preview and is not connected to the operational Neon/auth flow.
- The repository's current security-readiness checklist still records authentication, server-side authorization, tenant isolation, live DB integration, and QR issuance/verification as release blockers.
- Neon runtime credentials and production application of the pending security migration remain unverified/pending; do not substitute the database owner role.
- No production launch, production migration, or PR merge is authorized by this document.

## Release rule

Keep all release work in a reviewable branch/PR. Do not merge, publish as operational, onboard schools, or enter real student data until the hosting decision and all mandatory gates have verifiable evidence and the responsible owner approves the release.
