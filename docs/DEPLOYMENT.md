# Deployment status and GitHub-only direction

Last checked: 2026-10-15

## Hosting decision

The selected direction is **GitHub only** for source, review, CI, and a possible static GitHub Pages site. Do not add Hatchable, AppDeploy, Vercel, Cloudflare, Supabase, Neon-hosted production services, or another provider unless the owner explicitly revises this constraint.

GitHub Pages serves static files. It does not execute the Next.js server runtime or provide a private transactional database, managed school authentication, or server-side secrets. GitHub Pages alone cannot operate the intended multi-school SaaS with private student data.

## Static site added

- Public static site source: `site/index.html`.
- Deployment workflow: `.github/workflows/pages.yml`.
- The workflow packages only the `site/` directory, keeping internal documentation out of the published artifact.
- The page uses fictional sample details and explicitly states that it does not support login, real QR verification, card issuance, or attendance.
- **Deployment is not yet confirmed.** Repository Pages settings must be set to **GitHub Actions** and the workflow must complete successfully on `main`. Do not publish the Pages URL as live until the successful deployment URL is visible in GitHub Actions.

## What GitHub-only can deliver

- Public product website and static UI demonstration with fictional data.
- Source control, reviewable PRs, CI quality checks, and static release artifacts.
- Documentation and reproducible development workflow.

## What GitHub Pages alone cannot deliver

- Secure server-side school sign-in and session management.
- Private multi-tenant student database and server-enforced role/tenant authorization.
- Real card issuance/revocation, trusted QR verification, or attendance writes.
- Operational backups/restores, private monitoring, or a production service-level commitment.

The repository still contains Next.js server routes and legacy Neon auth/database integration code. Those routes do not run on GitHub Pages. Never ship secrets in static assets, and do not treat a static export as the full application.

## Current source status

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Active review branch: `feat/card-admin-attendance-safety`
- PR #4: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/pull/4 (open, draft; not merged)
- Student list/create API exists in source, but exact-head CI, integration tests, UI integration, and runtime authorization evidence are pending.
- The previous AppDeploy preview is a separate static snapshot and is not the selected deployment direction.
- Hatchable compatibility work is archived and is not the selected host.

## GitHub-only release stages

1. Verify typecheck, lint, automated tests, and build on the exact latest PR commit.
2. Configure GitHub Pages to use GitHub Actions and verify the static workflow on `main`.
3. Keep server routes out of static deployment and verify no secrets/private docs are included in the artifact.
4. Continue local/rehearsal testing with synthetic data only.
5. Before real school use, the owner must either provide infrastructure under their own control (server and database) or explicitly revise the no-third-party-hosting constraint. GitHub Pages alone is not a viable production backend.
6. If self-managed infrastructure is unavailable, keep the product a static demo; do not onboard schools or enter real student data.

## Mandatory gates before operational launch

- Complete authentication and session lifecycle tests.
- Restricted runtime database role and independently tested RLS/tenant isolation.
- Student CRUD, card issuance/rotation/revocation, QR verification and shared abuse controls.
- Negative integration tests for school A vs school B, roles, expired/revoked tokens, and transaction rollback.
- Backups and restore drills, monitoring, incident response, retention/export/deletion, privacy and applicable Indonesian child-data review.
- Accessibility/mobile/offline verification, rollback plan, named responsible operator, and written approval.
- Exact release commit and deployed artifact verified before any operational claim.

No production launch, real-student-data onboarding, or live-service claim until the hosting model and mandatory controls are evidenced.
