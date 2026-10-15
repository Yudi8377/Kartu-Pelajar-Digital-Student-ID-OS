# Architecture foundation

## Product shape: Digital Card OS

Use one shared card platform with separate domain templates rather than building unrelated card applications. Initial templates:
- Student: identity, school membership, attendance, schedule, leave and guardian workflows.
- Project worker: employer/contractor and project assignment, work attendance, certifications, safety induction and optional site access.
- Institution member: membership lifecycle, event check-in and facility access.

The domain registry describes configuration and roadmap status only. It is not a feature flag service and does not imply operational readiness. An organization must explicitly enable a module and define its policy. Domain-specific data models and permissions remain isolated.

## Runtime boundaries
- PWA client renders the card and requests server APIs.
- A server-only backend authenticates the caller, resolves active organization/project membership, and enforces tenant scope on every read/write.
- Neon PostgreSQL is private application storage. The browser must never connect directly to Neon.
- GitHub Actions runs quality checks and non-destructive health checks.

## Multi-tenancy and domain boundaries
Every organization-owned record carries an organization/tenant identifier and, when relevant, a project or school scope. Queries must scope by the caller's authorized membership. Never trust a client-supplied tenant, school, project or class ID as authorization. Add database constraints and, where practical, row-level safeguards as defense in depth.

A user may have multiple memberships, but each membership has an explicit organization, role, scope, status and effective dates. A project-worker identity must not grant access to student records. Cross-tenant links require an explicit, auditable relationship and minimum access.

## Shared card lifecycle
Cards need a stable internal ID and explicit lifecycle states such as pending, active, expired, suspended, replaced and revoked. Issue, replace and revoke operations must be authorized and auditable. Keep domain-specific attributes out of the shared card record where possible; use versioned domain profiles with explicit field visibility policies.

## QR verification
Generate a cryptographically random opaque token on the server. Store only a cryptographic hash. QR payload contains only the opaque token or a URL carrying it, never a student name, student number, class, birth date, employer, project, attendance history, location or other personal data. Verification checks card status, expiry and revocation, and returns the minimum necessary confirmation. Rate-limit verification and avoid logging tokens.

A QR scan alone does not prove a person's physical presence or rightful identity. For attendance, require an authorized teacher/device or a short-lived session challenge where appropriate; log the method and allow an auditable correction workflow.

## Student attendance boundaries
Attendance should be a separate student-domain module with session-based events, server timestamps, duplicate/idempotency handling and append-only correction history. Only authorized teachers/operators can record or correct attendance for assigned classes. Students and verified guardians see only records permitted by policy. Do not collect continuous GPS by default; any location use requires a separate purpose and privacy review.

## Privacy and security
- Use synthetic data in development until privacy review and access controls are approved.
- Keep DATABASE_URL server-side; never use NEXT_PUBLIC_DATABASE_URL.
- Restrict logs and audit metadata; do not put secrets or student PII in prompts.
- Require human approval for production migration, bulk export and release.
- Establish retention, correction, access, incident-response and deletion procedures before real student/worker records are onboarded.
- Public verification never returns attendance, employment history, sensitive certification documents or detailed incident reports.

## Current limitations
This is an initial schema and repository foundation. Authentication, authorization middleware, QR API, real DB integration, student attendance workflows, configurable domain administration and production controls remain to be implemented and tested.
