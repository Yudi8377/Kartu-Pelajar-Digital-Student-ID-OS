# Security Readiness Gates

This checklist is a release gate, not a claim that the application is currently secure or production-ready. Until every required control is implemented and independently verified, use synthetic data only.

## P0 — Required before any real student data

- [ ] Authentication is enforced on every private server route. Unauthenticated requests fail closed.
- [ ] Authorization is evaluated on the server for every request; hiding UI controls is not authorization.
- [ ] Every student, card, membership, and audit query is scoped to the authenticated user's active school membership.
- [ ] Cross-school isolation tests prove that a user from school A cannot read, modify, enumerate, or verify private records belonging to school B.
- [ ] The database connection string and any elevated database credential are server-only; no secret is exposed in browser bundles, public environment variables, logs, or error responses.
- [ ] Database access follows least privilege. The application runtime does not use a schema-owner role for routine requests.
- [ ] QR credentials are generated with a cryptographically secure random source, shown only when issued, stored only as a one-way hash, revocable, and never written to logs or audit metadata.
- [ ] Public verification responses disclose only the minimum fields needed to establish validity; they never return student number, full birth date, address, contact details, guardian data, or internal identifiers.
- [ ] QR verification is rate-limited, uses generic invalid responses, and has tests for expired, revoked, replaced, pending, malformed, and unknown credentials.
- [ ] Audit events record actor, action, entity, school scope, request ID, and timestamp without recording credentials or unnecessary student personal data.
- [ ] Input validation, output encoding, CSRF protections where applicable, safe error handling, and security headers are tested.
- [ ] Dependency and secret scanning are enabled in CI; dependency updates are reviewed.
- [ ] Backup and restore are tested. Recovery objectives and an incident-response contact/process are documented.
- [ ] Privacy notices, lawful basis, retention/deletion rules, access/correction procedures, and a review of applicable Indonesian personal-data and child-data requirements are completed by the responsible operator/legal reviewer.
- [ ] Production access, deployment environment variables, database permissions, and domain/TLS settings are reviewed before launch.

## P1 — Required before wider school rollout

- [ ] Independent security review and threat model completed.
- [ ] Load and abuse tests cover QR verification and school-scoped queries.
- [ ] Monitoring alerts on repeated failed verification, permission denials, unusual exports, and application/database errors.
- [ ] Data export and account offboarding have approval, audit, and retention controls.
- [ ] Disaster recovery and school tenant offboarding are rehearsed.

## Verification evidence

For each checked item, record the test or review artifact, date, reviewer, and commit/deployment SHA. A checkbox must not be marked complete based only on code being present.

## Current baseline

The initial database schema exists, and the current application is still a foundation. Authentication, server-side authorization, tenant isolation, live database integration, and the QR verification endpoint are not yet implemented. Therefore, do not enter real student personal data.