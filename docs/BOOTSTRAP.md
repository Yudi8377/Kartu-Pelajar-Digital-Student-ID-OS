# One-time first-school bootstrap

This is a controlled setup procedure, not a public API. It creates the first school and assigns the first school administrator to an existing Neon Auth user.

## Preconditions

- The app has a chosen host, and sign-up/sign-in have been verified on a non-production rehearsal.
- The target Neon database has been reconciled with the checked-in schema and RLS policies.
- The selected Auth user ID is verified by the operator directly in Neon Auth; never send it, an email OTP, a password, or a database URL through chat.
- The database is empty of schools and memberships. The script aborts if either count is nonzero.
- A backup/recovery plan exists, and the operator has authority to create the initial school.
- Use this only once, in a controlled terminal. Do not run from a web request, CI, or the application host.

## Required environment variables

Set these in the operator's temporary shell/session only:

- `DATABASE_ADMIN_URL`: one-time owner-level connection string. Do not save it in the app's runtime environment or commit it.
- `BOOTSTRAP_AUTH_SUBJECT`: the verified Neon Auth user ID for the intended first administrator.
- `BOOTSTRAP_SCHOOL_NAME`
- `BOOTSTRAP_SCHOOL_CODE`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `CONFIRM_BOOTSTRAP=YES`: explicit confirmation for the exact target database.

Then run `npm run bootstrap:school`. The script uses a transaction and advisory lock, checks that no school or membership already exists, creates one school plus one `school_admin` membership, and writes an audit event. On error it rolls back. It never prints secrets.

Do not run this against production until the production host, trusted Auth origin, restricted runtime credential, backup/recovery, and release approvals are ready. The runtime application must continue to use `student_id_os_runtime`, never `DATABASE_ADMIN_URL`.
