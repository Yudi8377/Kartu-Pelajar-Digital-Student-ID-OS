# Neon Auth integration — implementation and setup

## Current status (2026-10-15)

- Managed Neon Auth is provisioned on both the isolated rehearsal branch and the production Neon branch.
- The source branch contains the Next.js server adapter, same-origin auth proxy, Indonesian sign-in page, session-backed `GET /api/me`, and tenant-scoped student APIs.
- Production auth is enabled at Neon, but this does **not** mean the application login is live: no production host/origin is connected, no production auth URL/cookie secret has been installed in a host secret manager, and end-to-end login has not been verified.
- Self-registration is blocked at the application proxy.
- `GET /api/me` maps the verified auth subject to `app_users` inside a transaction and reports active memberships. A user with no membership receives no school access.
- The first school administrator and institution memberships still require controlled provisioning. Do not create an unauthenticated public bootstrap route.

## Required environment variables

- `NEON_AUTH_BASE_URL`: exact Auth URL for the same Neon branch as the environment.
- `NEON_AUTH_COOKIE_SECRET`: unique high-entropy secret of at least 32 characters, stored only in the hosting secret manager.
- `DATABASE_URL`: connection string for the dedicated `student_id_os_runtime` role, not the database owner.
- `NEXT_PUBLIC_APP_URL`: public app origin, not a secret; configure it only if a feature explicitly consumes it.

Never paste or commit a cookie secret or database connection string. The URL in `.env.example` is a rehearsal-only value and must not be reused in production.

## Remaining steps before production login

1. Connect the GitHub repository to a supported Next.js host and select the production origin.
2. Add the exact HTTPS application origin to the production Neon Auth trusted-domain list.
3. Install the production `NEON_AUTH_BASE_URL`, a fresh `NEON_AUTH_COOKIE_SECRET`, and a restricted `DATABASE_URL` in the host's secret manager.
4. Set the runtime role password through the provider's secure credential workflow; never commit the connection string or use an owner credential for app traffic.
5. Provision the first school and its first `school_admin` membership through a reviewed, audited administrative procedure.
6. Test sign-in, sign-out, session restoration, expired/invalid sessions, disabled users, missing config, and direct anonymous requests to every API.
7. Test cross-school reads/writes and role boundaries with synthetic schools under the exact runtime role.

## Safety boundary

Until the deployed login and authorization tests pass, use synthetic data only. A working login is not sufficient evidence that private student records are protected.
