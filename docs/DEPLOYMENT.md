# Deployment status

Last checked: 2026-10-15

## Public UI preview

- URL: https://kartu-pelajar-digital-student-id-os-n0ar6x.v2.appdeploy.ai/
- Status: deployment reported ready by the hosting platform.
- Scope: static, interactive UI preview with synthetic example identity only.
- Automated visual QA reported no frontend or network errors.
- The preview is a separate hosting snapshot. It is not automatically synchronized with this GitHub repository.
- The preview is not the operational Student ID OS. It does not authenticate users, read/write Neon student records, issue QR tokens, or verify real cards.

## Source repository and CI

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Production source branch: `main`
- Latest verified source commit at the time of this record: `28c4775aa2a8d9e2c9d6879813e80331e63f48c8`
- GitHub Actions run for that commit: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/actions/runs/38668112673
- Result: success.

## Neon database

The initial schema is present on the production Neon branch. See `DB-STATUS.md` for project and schema details. The application server has a PostgreSQL connection module and `GET /api/ready`, but the public UI preview is static and does not use that endpoint. The endpoint is only meaningful after a trusted server host has a securely configured server-side `DATABASE_URL`.

## Required gates before operational launch

1. Select and configure the production application host so it builds from the GitHub source of truth and supports Next.js server routes.
2. Configure a restricted database role and deliver its connection string through the host's secret manager. Do not use the database owner role for routine app traffic.
3. Implement and verify authentication, school-scoped authorization, membership provisioning, and an auditable first-admin bootstrap.
4. Implement school and student workflows, QR token issuance/rotation/revocation, and a minimal public verification endpoint.
5. Add integration tests for cross-school isolation, role boundaries, expiry/revocation, and generic invalid-token responses.
6. Verify HTTPS, environment secrets, backups/restore, monitoring, retention/deletion controls, privacy notice, and applicable Indonesian personal-data requirements.
7. Re-run CI and smoke tests against the exact production deployment SHA.

Do not enter real student personal data or use the preview as an identity verification service until all applicable gates are verified.
