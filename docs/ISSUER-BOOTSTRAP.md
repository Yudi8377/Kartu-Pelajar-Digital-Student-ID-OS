# One-time Digital Card OS issuer bootstrap

This is a controlled operator-terminal procedure, not a public API. It creates one generic card issuer and assigns one verified Auth user the `issuer_admin` role.

## Preconditions

- The generic card migration `0003_generic_digital_cards.sql` has been applied to a disposable rehearsal database and RLS behavior has been reviewed.
- The application host, trusted Auth origin, restricted runtime database role, backups, and release approval are ready.
- The intended Auth subject is verified directly in the identity provider. Do not share its credentials, tokens, or database URL in chat.
- The issuer key does not already exist. The script aborts on duplicates.
- Run only from a controlled operator terminal, never CI, a web request, or the app host.

## Required environment variables

- `DATABASE_ADMIN_URL`: temporary one-time administrative database connection; never use this as the app runtime connection.
- `BOOTSTRAP_AUTH_SUBJECT`: verified identity-provider subject ID.
- `BOOTSTRAP_ISSUER_KEY`: stable lowercase slug, 3–64 characters.
- `BOOTSTRAP_ISSUER_NAME`: display name.
- `BOOTSTRAP_ISSUER_TYPE`: one of `school`, `project`, `organization`, `event`, `personal`, `service_provider`.
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_EMAIL`
- `CONFIRM_ISSUER_BOOTSTRAP=YES`: explicit confirmation for this target.

Run `npm run bootstrap:issuer` only after checking the target database and migration history. The script uses a transaction and advisory lock, rejects an existing issuer key, creates or links an active app-user profile, creates the issuer and its first admin membership, and writes an audit event. It never prints secrets.

The generic schema is additive. Do not apply it to production solely because CI passed; first rehearse with the actual restricted runtime role and verify tenant isolation. Do not onboard real cardholder data until the security readiness gates are independently verified.
