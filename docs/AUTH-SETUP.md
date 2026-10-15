# Authentication setup and verification

## Current state

Neon Managed Better Auth is provisioned on the production and rehearsal Neon branches. The application integration is being added on `feat/card-admin-attendance-safety`; it is not production-ready until CI passes and the complete sign-up/sign-in/sign-out/session flow is verified against a hosted preview.

- Production branch ID: `br-late-meadow-b3vj6rqi`
- Rehearsal branch ID: `br-hidden-tree-b35m3xvr`
- Production auth base URL: `https://ep-twilight-block-b38mafb2.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth`
- Rehearsal auth base URL: `https://ep-plain-hill-b30wylis.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth`

These URLs are configuration values, not passwords. Never commit an auth cookie secret or database credential.

## Required server environment

Set these only in the hosting provider's encrypted environment-variable store:

- `NEON_AUTH_BASE_URL`: the auth URL for the branch used by that environment.
- `NEON_AUTH_COOKIE_SECRET`: a unique random secret of at least 32 characters.
- `DATABASE_URL`: connection string for the restricted `student_id_os_runtime` role, not the database owner.

Use the rehearsal URL and a rehearsal database connection for preview deployments. Do not use the production database credentials in preview builds. Do not prefix any of these variables with `NEXT_PUBLIC_`.

## Trusted origin

Before testing login on a hosted preview, add its exact HTTPS origin to the trusted-domain allowlist of the matching Neon Auth branch. Add the production origin only after a production host and domain have been selected. Do not allow broad wildcard origins.

## Verification checklist

- [ ] Sign up with a test-only account and verify expected email behavior.
- [ ] Sign in, reload the page, and confirm session restoration.
- [ ] Sign out and confirm private pages redirect to sign-in.
- [ ] Confirm unauthenticated direct requests to protected routes fail closed.
- [ ] Confirm a signed-in user without an active school membership still has no school-data access.
- [ ] Confirm preview cannot reach the production database.
- [ ] Confirm missing auth configuration returns a generic unavailable state, without secrets or stack traces.
- [ ] Review password recovery, email verification, account deletion, support, and privacy notice before public signup.

## Important boundary

Authentication proves who signed in; it does not prove which school they belong to or authorize access to student records. Every school-scoped route must separately enforce active membership and role on the server. Public registration must not grant school-admin privileges automatically.
