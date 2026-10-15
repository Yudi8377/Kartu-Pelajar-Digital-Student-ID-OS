# Deployment status

Last checked: 2026-10-15

## Public UI preview

- URL: https://kartu-pelajar-digital-student-id-os-n0ar6x.v2.appdeploy.ai/
- Scope: static interactive UI preview with fictional identity details only.
- The preview is a separate hosting snapshot, not automatically synchronized with GitHub.
- It does not authenticate users, read/write Neon records, issue real QR credentials, or verify real cards. It is not the production application.

## Source repository and CI

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Development branch: feat/kpd-modular-education-welfare
- Pull request: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/pull/3
- Latest validated commit at this checkpoint: bf90111f85e7fde867172bf5ffc26ae201267259
- GitHub Actions run #57: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/actions/runs/38680595351
- Result: success for install, typecheck, lint, automated tests, and production build.

## Neon database

The production branch has migrations 0001, 0002, and 0003 applied. See DB-STATUS.md for read-only verification. Twelve application tables exist, RLS is enabled on all twelve, 31 policies are installed, and all application tables remain empty. The runtime database role has no password yet, so production application connectivity has not been enabled.

## Commercial launch gates

1. Select and configure a supported server host that deploys from the GitHub source branch and supports Next.js server routes.
2. Configure a restricted runtime database credential in the host secret manager; never use owner credentials for routine app requests.
3. Configure and verify Neon Auth on the intended production branch, then implement trusted session-to-user mapping, tenant-scoped authorization, membership provisioning, and a controlled first-admin bootstrap.
4. Implement real school/student CRUD, class/teacher assignment, attendance session/event workflows, and append-only corrections.
5. Implement secure QR issuance, rotation, revocation, minimal verification responses, and abuse/rate limiting.
6. Add behavioral integration tests proving cross-school isolation and role boundaries using the runtime role and synthetic data.
7. Configure monitoring, tested backup/restore, incident response, retention/deletion, access/correction processes, privacy notices, and legal review for Indonesian personal-data and child-data requirements.
8. Verify accessibility/mobile UX, browser/device coverage, load and abuse tests, support process, pricing/contract terms, onboarding, and school offboarding.
9. Run end-to-end smoke tests against the exact production deployment SHA before onboarding a pilot school.

Do not enter real student personal data or present the preview as an identity-verification service until the gates above are closed and evidenced.
