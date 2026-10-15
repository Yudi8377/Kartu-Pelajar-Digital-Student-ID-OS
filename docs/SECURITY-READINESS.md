# Security Readiness Gates

This checklist is a release gate, not a claim that the application is currently secure or production-ready. Until every required control is implemented and independently verified, use synthetic data only.

## P0 — Required before any real student data

- [ ] Authentication is enforced on every private server route. Unauthenticated requests fail closed.
- [ ] Complete sign-up/sign-in/sign-out, session refresh, recovery, email verification, and account lifecycle behavior is tested on a hosted rehearsal.
- [ ] Authorization is evaluated on the server for every request; hiding UI controls is not authorization.
- [ ] Every student, card, membership, and audit query is scoped to the authenticated user's active school membership.
- [ ] Cross-school isolation tests prove that a user from school A cannot read, modify, enumerate, export, or verify private records belonging to school B.
- [ ] Database credentials and elevated credentials are server-only; no secret is exposed in browser bundles, public environment variables, logs, or error responses.
- [ ] Database access follows least privilege. The application runtime does not use a schema-owner role for routine requests.
- [ ] The runtime credential is tested directly against a rehearsal environment and confirmed to have no owner/superuser/BYPASSRLS privileges.
- [ ] QR credentials are generated with a cryptographically secure random source, shown only when issued, stored only as a one-way hash, revocable, and never written to logs or audit metadata.
- [ ] Public verification responses disclose only the minimum fields needed to establish validity; they never return student number, full birth date, address, contact details, guardian data, or internal identifiers.
- [ ] QR verification is rate-limited at a reliable shared enforcement layer, uses generic invalid responses, and has tests for expired, revoked, replaced, pending, malformed, and unknown credentials.
- [ ] Audit events record actor, action, entity, school scope, request ID, and timestamp without recording credentials or unnecessary student personal data.
- [ ] Input validation, output encoding, CSRF protections where applicable, safe error handling, and security headers are tested.
- [ ] Dependency and secret scanning are enabled in CI; dependency updates are reviewed.
- [ ] Backup and restore are tested. Recovery objectives and an incident-response contact/process are documented.
- [ ] Privacy notices, lawful basis, retention/deletion rules, access/correction procedures, and review of applicable Indonesian personal-data and child-data requirements are completed by the responsible operator/legal reviewer.
- [ ] Production access, deployment environment variables, database permissions, domain/TLS settings, and rollback are reviewed before launch.

## P1 — Required before wider school rollout

- [ ] Independent security review and threat model completed.
- [ ] Load and abuse tests cover QR verification and school-scoped queries.
- [ ] Monitoring alerts on repeated failed verification, permission denials, unusual exports, and application/database errors.
- [ ] Data export and account offboarding have approval, audit, and retention controls.
- [ ] Disaster recovery and school tenant offboarding are rehearsed.

## Verification evidence

For each checked item, record the test or review artifact, date, reviewer, and commit/deployment SHA. A checkbox must not be marked complete based only on code being present.

## Current baseline (2026-10-15)

- The branch has authentication integration routes, a protected admin entry point, and a self-profile endpoint that does not grant school roles.
- The branch has transaction-local authenticated DB context and database RLS policies in checked-in migrations.
- A first database-backed school-scoped student list/create API now exists at `/api/students`; it is not yet covered by recorded integration/E2E evidence and is not connected to a completed admin workflow. The card designer remains a UI prototype: settings persistence and real card issuance are incomplete.
- The QR API contract and SQL verification function are present as design/schema components; a deployed, rate-limited end-to-end verification API and issuance/revocation flow are not verified.
- Neon production schema/RLS was inspected read-only; the 12 business tables were empty at the time. Runtime credential verification and the migration-history reconciliation remain pending.
- GitHub Actions run #119 passed for docs commit `f66190c32f85463d17edeac5a6ad6f78721bedd2`. Student API commits after that SHA still require CI evidence on the exact latest head. CI success does not establish hosted auth, tenant-isolation, backup/restore, or security-review completion.
- Hatchable has no connected Student ID OS project and is not approved as a free-tier paid-customer production host under its current policy.
- Therefore the product is not approved for real student data or production launch.

## Release rule

Do not mark a control complete without evidence. No real student personal data or operational school onboarding until every P0 gate has been independently verified and the responsible operator has approved the exact release.
