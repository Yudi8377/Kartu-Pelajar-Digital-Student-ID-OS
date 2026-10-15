# Deployment status

Last checked: 2026-10-15

## Public UI preview

- URL: https://kartu-pelajar-digital-student-id-os-n0ar6x.v2.appdeploy.ai/
- Scope: static, interactive UI preview with synthetic example identity only.
- The preview is a separate hosting snapshot, not automatically synchronized with this GitHub repository.
- It does not authenticate users against the source app, read/write Neon student records, issue QR tokens, or verify real cards.
- Do not enter real student data or present this preview as an operational identity service.

## Source repository and CI

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Production source branch: `main`
- Active review branch: `feat/card-admin-attendance-safety`
- PR #4: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/pull/4 (open, draft; not merged)
- Latest checked commit: `12cf49d7099e4efa6291968a893e9a2cf3888fea`
- GitHub Actions run #118: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/actions/runs/38709296736
- Result: success for typecheck/lint/tests/build in the repository CI workflow. This is code-quality evidence, not proof of production security or end-to-end readiness.

## Application and database

- The branch includes a Next.js application foundation, Neon Managed Auth integration, a profile endpoint, guarded bootstrap script, and security-oriented database policies.
- Authentication and profile code are not equivalent to completed school-scoped application authorization.
- The admin card designer remains a UI prototype; settings are not persisted and no valid card is issued.
- The QR verification contract and security SQL function are not proof that a live, rate-limited QR API has been deployed.
- The production database was inspected read-only; all 12 business tables were empty at that time and RLS was enabled.
- The restricted runtime DB credential was not verified. Do not use an owner-level connection string as a workaround.
- Do not reapply migrations without reconciling migration history and current live schema first.

## Hosting decision

- Hatchable connector returned no projects; Student ID OS has not been imported or deployed there.
- Hatchable Free is not approved as production infrastructure for paying customers under the currently documented policy, and the existing Next.js/TSX project is not directly deployable there unchanged.
- Hatchable account management must comply with the provider's minimum-age terms.
- A production host remains unselected. Do not silently move to a different paid provider or claim zero-cost commercial hosting without verifying terms and limits.

## Required gates before operational launch

1. Choose a commercially compliant production host that supports Next.js server routes, encrypted secrets, TLS, and required operational controls.
2. Configure and verify a restricted database role; deliver its connection string only through the host secret manager. Never use the database owner role for routine app traffic.
3. Reconcile and rehearse migrations against an isolated branch; prove backup and restore.
4. Verify complete sign-up/sign-in/sign-out/session flows on a hosted rehearsal, with exact trusted origins and separate preview credentials.
5. Implement and verify school-scoped authorization, user provisioning, and auditable first-admin bootstrap.
6. Implement student/card CRUD, QR token issuance/rotation/revocation, verification, abuse controls, and safe audit events.
7. Add automated negative integration tests for cross-school isolation, role boundaries, expiry/revocation, and generic invalid-token responses.
8. Complete privacy notice, retention/deletion/export, incident response, monitoring, dependency/secret scanning, accessibility, mobile/offline tests, and applicable Indonesian personal-data/child-data review.
9. Re-run CI and smoke tests against the exact release commit and production deployment SHA.
10. Record the responsible operator's written approval and a rollback target before launch.

No production launch, merge, real-student-data onboarding, or operational claim until the release gates are evidenced and approved.
