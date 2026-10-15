# Deployment status and GitHub-only direction

Last checked: 2026-10-15

## Hosting decision

The product owner has chosen **GitHub as the only third-party platform** for the current phase. Do not create or migrate to Hatchable, AppDeploy, Vercel, Cloudflare, Supabase, Neon, or another hosted provider as part of this direction without a new explicit decision.

GitHub is the source repository, code review, CI, and (for static content only) a possible GitHub Pages host. GitHub Pages does **not** execute the Next.js server runtime or provide a private transactional database, managed school authentication, or server-side secrets. Therefore GitHub Pages alone cannot operate the intended multi-school SaaS with private student data.

## What can be delivered with GitHub alone

- Public product website and static, fictional-data UI demonstration via GitHub Pages.
- Repository-hosted source, issues/PR review, and GitHub Actions quality checks.
- Static/offline prototype with no real student records, no real QR credentials, and no claims of live attendance or identity verification.
- Documented, reproducible build artifacts and release checklist.

## What cannot honestly be claimed with GitHub Pages alone

- Secure server-side sign-in/session management for school operators.
- Private multi-tenant student database and server-enforced role/tenant authorization.
- Card issuance/revocation, trusted QR verification, or attendance writes backed by a private database.
- Production monitoring, backups/restores, or operational SLA for a live school SaaS.

The existing Next.js project contains server routes and Neon Auth/database integration. Those routes will not run on GitHub Pages. Do not publish a static export as though it were the full application, and do not place credentials or student records in the browser bundle or Git repository.

## Current source status

- Repository: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS
- Active review branch: `feat/card-admin-attendance-safety`
- PR #4: https://github.com/Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS/pull/4 (open, draft; not merged)
- The latest reviewed branch has an initial `/api/students` list/create API slice, but its integration tests and exact-head CI still need verification.
- Existing AppDeploy preview is a separate static snapshot and is no longer the selected deployment direction. Do not rely on it for release status.
- Hatchable prototype/docs are legacy exploration only and are not the chosen host.

## GitHub-only release stages

1. Keep the current application source and reviewable branch in GitHub.
2. Make the public website/static demo build reproducibly as static assets with fictional data only.
3. Run typecheck, lint, automated tests, build, dependency checks, and secret scanning in GitHub Actions on the exact release commit.
4. Keep all server-only API routes disabled from any static deployment; never ship environment secrets.
5. Before real school use, the owner must either approve a self-managed server/database operated under their control or explicitly revise the no-third-party constraint. GitHub Pages alone is not a viable production backend.
6. If self-managed infrastructure is not available, keep the release as a static demo and do not onboard schools or enter real student data.

## Mandatory gates before operational launch

- Authentication and session lifecycle E2E, including account recovery and revocation.
- Restricted runtime database role and independently tested RLS/tenant isolation.
- Student CRUD, card issuance/rotation/revocation, QR verification and shared abuse controls.
- Negative integration tests for school A vs school B, roles, expired/revoked tokens, and transaction rollback.
- Backups and restore drills, monitoring, incident response, retention/export/deletion, privacy and applicable Indonesian child-data review.
- Accessibility/mobile/offline verification, rollback plan, named responsible operator, and written approval.
- Exact release commit and deployed artifact verified before any operational claim.

No production launch, real-student-data onboarding, or live-service claim until the hosting model and mandatory controls are evidenced.
