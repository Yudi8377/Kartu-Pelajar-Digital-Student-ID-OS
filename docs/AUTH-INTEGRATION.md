# Neon Auth integration — implementation and setup

## Current status

- The feature branch contains a Next.js server adapter, a same-origin auth route, and an Indonesian sign-in page.
- Managed Neon Auth has been provisioned on the isolated rehearsal branch only. Its branch-specific URL is in the developer's local setup notes and must not be treated as the production URL.
- Production Neon Auth is not enabled. The sign-in flow has not been end-to-end tested against the intended application host.
- Self-registration is blocked at the app proxy because student accounts must be provisioned by an authorized institution administrator.
- A successful sign-in does not grant school access. Session-to-app-user mapping, membership assignment, authorization middleware, and protected application APIs are still required.

## Required environment variables

- NEON_AUTH_BASE_URL: the exact auth base URL returned by Neon for the branch being used. Development, preview, and production branches have separate auth environments.
- NEON_AUTH_COOKIE_SECRET: unique high-entropy secret of at least 32 characters. Generate locally and store only in the host's secret manager.
- NEXT_PUBLIC_APP_URL: the app's public origin, without an auth path. This is public configuration, not a secret.
- DATABASE_URL: connection string for the dedicated least-privilege runtime role. Do not use a database owner credential.

Never paste or commit the cookie secret or database connection string. The URL currently shown in .env.example is for the isolated rehearsal branch only; replace it when changing branches.

## Before enabling production login

1. Select the real Next.js hosting origin and HTTPS domain.
2. Provision Neon Auth for the production branch and configure the trusted application domain/redirect origin.
3. Set the environment variables above in the host's secret manager, using the production branch's auth URL.
4. Set a password for student_id_os_runtime through the Neon Console and configure its connection string only in the host's secret manager.
5. Add and test server-side session resolution and map the verified auth subject to app_users.
6. Implement admin-controlled invitations, membership assignment, and first-admin bootstrap; do not open public sign-up.
7. Add protected API authorization and integration tests for anonymous access, role boundaries, and cross-school isolation.
8. Test login, logout, expired sessions, bad credentials, missing auth configuration, and disabled accounts on the deployed URL.

## Safety boundary

Until the items above pass, use synthetic data only. The sign-in screen is not evidence that private student records are protected, and login alone must never grant a user access to any school.
