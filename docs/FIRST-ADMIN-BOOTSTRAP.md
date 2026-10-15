# First school and administrator bootstrap

This is a controlled, one-time operational procedure. Do not expose it as a public API and do not run it with real school details until the production host and security gates are ready.

## Preconditions

- The production Next.js host is deployed with the production Neon Auth URL and a fresh cookie secret.
- The host uses the dedicated `student_id_os_runtime` database role, never the database owner.
- A designated institution administrator has been created through the trusted Neon Auth administrator workflow; public self-registration remains disabled.
- The administrator can sign in, then open `/api/me`. The response must contain an internal `user.id` and an empty `memberships` array.
- Keep the response and SQL operation in an approved, access-controlled admin session. Do not paste secrets into chat or commit them.

## Bootstrap sequence

1. Sign in with the designated administrator account.
2. Open `/api/me` and record the internal UUID in `user.id`. This is the application user ID, not the Neon Auth subject.
3. An authorized database owner executes the following transaction in the Neon SQL editor, replacing all three placeholders with reviewed values. Use a new unique institution code and the exact internal user UUID from step 2.

```sql
BEGIN;

WITH new_school AS (
  INSERT INTO public.schools (name, code, status)
  VALUES ('<APPROVED SCHOOL NAME>', '<UNIQUE SCHOOL CODE>', 'active')
  RETURNING id
)
INSERT INTO public.school_memberships (school_id, user_id, role, status)
SELECT new_school.id, '<APP_USER_UUID>'::uuid, 'school_admin', 'active'
FROM new_school
RETURNING school_id, user_id, role;

COMMIT;
```

4. Verify the transaction returned exactly one membership row. If it did not, roll back rather than improvising.
5. Sign out and sign back in. Reload `/workspace`; it must display only the new institution and allow the designated admin to add a synthetic test student.
6. Create a second synthetic school and test that the first admin cannot read or modify its records. Remove test data only through a reviewed administrative procedure.
7. Record the operator, approval, timestamp, school code, and verification evidence in the private operations log.

## Important limits

- This bootstrap is a manual break-glass procedure, not a self-service onboarding product.
- Do not run it against production until host configuration, role credentials, and the live auth flow are verified.
- Never grant an ordinary account `school_admin` based only on a form submission or an email address supplied by the user.
- A commercially scalable release still needs an audited admin provisioning interface, invitation/role lifecycle, tenant-isolation tests, support processes, and legal/privacy review.
