# Deployment status

Last checked: 2026-10-15

## Public UI preview

- URL: https://kartu-pelajar-digital-student-id-os-n0ar6x.v2.appdeploy.ai/
- Scope: static interactive UI preview with fictional identity details only.
- This is a separate hosting snapshot, not automatically synchronized with GitHub.
- It does not authenticate users, read/write Neon records, issue QR credentials, or verify real cards. It is not the production application.

## Source repository and CI

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Development branch: `feat/kpd-modular-education-welfare`
- Pull request: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/pull/3
- Recent source changes: native Next.js flat ESLint configuration, transaction-scoped auth identity, `/api/me`, tenant-scoped student APIs, and the institution workspace UI.
- Latest CI runs are in progress at the time of this update; do not treat CI as green until the latest commit's workflow completes successfully.

## Neon database and authentication

The production Neon branch has migrations 0001–0003 applied. Twelve application tables exist, RLS is enabled on all twelve, and all application tables remain empty. Neon Auth has been provisioned on the production branch, but no production application host/origin or runtime secrets are configured. The runtime DB role still requires secure credential setup.

Vercel project creation was attempted but blocked because the connected GitHub account has no Login Connection configured. No Vercel project or deployment was created by that attempt.

## Commercial launch gates

1. Connect GitHub to the chosen Next.js host and deploy a preview from this source branch.
2. Configure the production HTTPS origin in Neon Auth and store `NEON_AUTH_BASE_URL`, a fresh `NEON_AUTH_COOKIE_SECRET`, and least-privilege `DATABASE_URL` in the host secret manager.
3. Provision the first school/admin through a reviewed controlled procedure; never open unauthenticated self-registration or public bootstrap.
4. Verify sign-in, sign-out, session restoration, `/api/me`, and protected API behavior against the live deployment.
5. Implement class/teacher assignment, attendance workflows, QR issuance/rotation/revocation and rate-limited verification.
6. Run behavioral tests for cross-school isolation and role boundaries using the exact runtime role.
7. Configure monitoring, backup/restore, incident response, retention/deletion, privacy notices, and legal review for Indonesian personal and child data.
8. Complete mobile/accessibility/device QA, abuse/load tests, support and escalation process, pricing/contract terms, onboarding and school offboarding.
9. Run end-to-end smoke tests against the exact production deployment SHA before onboarding a pilot school.

Do not enter real student data or present the current preview as a live identity-verification service until the gates above pass.
