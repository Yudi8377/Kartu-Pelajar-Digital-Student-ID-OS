# Commercial readiness plan

## Current checkpoint — 2026-10-15

Implemented in the feature branch: public landing page, institution workspace, sign-in/auth proxy scaffold, session-to-app-user mapping at `GET /api/me`, tenant-scoped student list/create APIs, audit event for student creation, and a student-card issue/rotation API that stores only a SHA-256 token hash. Neon Auth is provisioned on the production branch. Source changes are still awaiting CI completion and live smoke tests.

Not commercially live: no deployed Next.js host connected to this repository; Vercel project creation is blocked until the GitHub Login Connection is configured. Production Neon Auth trusted origin and host secrets are not configured. The runtime DB role still has no usable credential. First-admin bootstrap is a controlled manual runbook, not an in-app workflow. QR public verification, durable abuse/rate limiting, attendance APIs/UI, cross-tenant behavioral tests, backup/restore, monitoring, legal/privacy review, support and billing remain open.

**Release rule:** do not onboard real students or accept payment for an operational school service until these blockers are closed and evidenced. The AppDeploy URL is a static demo only.


This is the operational release plan for Student ID OS. A feature is commercially ready only when implementation, security tests, deployment evidence, support ownership, and privacy review exist. A UI card or passing compile is not sufficient.

## Release tiers

### Tier 0 — Developer preview
- Synthetic data only; no real identities or live QR credentials.
- UI can be shown for product feedback.
- Clearly label every planned feature and every simulated workflow.
- No claims of government integration or official identity status.

### Tier 1 — Controlled school pilot
- One consenting school, written scope and data-processing responsibilities.
- Named school administrator and support contact.
- Verified authentication and school-scoped authorization.
- Runtime DB role with least privilege; no owner credential in the app.
- Student/guardian notice, lawful basis review, retention rules, access/correction process, incident response, and tested backup/restore.
- Synthetic rehearsal followed by explicitly approved import of the minimum necessary pilot data.
- Attendance and QR features are enabled only after role and tenant-isolation tests pass.

### Tier 2 — Commercial multi-tenant release
- Automated school onboarding/offboarding and role lifecycle.
- Strong tenant isolation for every read, write, export, report, and QR verification path.
- Monitoring, abuse/rate limiting, alerting, tested recovery objectives, dependency/secret scanning, and security review.
- Published terms, privacy notice, service scope, support hours, escalation path, data retention/deletion, export, and school exit procedures.
- Contract/invoice/subscription workflow and a documented price list; do not advertise an unimplemented billing integration as active.
- Accessibility and mobile-device QA, load testing, disaster recovery rehearsal, and versioned release/rollback procedures.

## Required product modules

### Shared platform
- Organization and domain provisioning with separate tenant boundaries.
- Roles and permissions enforced server-side, not only in UI.
- Audit trail for privileged changes; no secrets or unnecessary personal data in logs.
- Card lifecycle: draft, issued, active, suspended, expired, replaced, revoked.
- QR token issuance and revocation with random opaque tokens; only hashes stored; minimal public response.

### Student domain
- School, academic year, class, student, guardian relationship and role provisioning.
- Teacher/class assignment with effective dates.
- Attendance sessions, check-in/out, authorized manual marks, idempotency, and append-only corrections.
- Student and guardian views scoped to the verified relationship.
- Consent/notice and retention rules suitable for children; no continuous location tracking by default.
- Learning/service modules only after their own access and data requirements are approved.

### Project-worker domain
- Separate organization/project tenant model; never grant access to student records by sharing a card identity.
- Employer/contractor membership, project assignment, worker card lifecycle, work attendance, certifications/safety-induction records, and optional site access.
- Site access decisions and safety credentials visible only to authorized project staff.
- Separate retention, employment-record, and incident-handling policies.

### Institution-member domain
- Institution membership lifecycle, events, facility access and verifier roles.
- Each institution's configuration and records isolated from other tenants.
- Public checks disclose only minimum membership validity.

## Security acceptance tests

- Anonymous requests cannot access private records or mutate state.
- A user from tenant A cannot list, read, mutate, export, or verify private records in tenant B.
- A teacher can record attendance only for currently assigned classes and active enrolled students.
- Duplicate requests are idempotent; attendance correction requires a reason and creates a new immutable record.
- Pending, expired, revoked, replaced, inactive, and unknown QR credentials all fail safely without exposing internal details.
- Public verification responses never disclose student numbers, names, class, guardians, contact details, attendance, or internal IDs by default.
- Permission denials and abuse attempts are observable without logging secrets or raw QR tokens.
- Backup restoration, key/credential rotation, incident escalation, and school offboarding are rehearsed.

## Current evidence and blockers (2026-10-15)

- CI run #57 passed typecheck, lint, automated tests, and build on commit bf90111f85e7fde867172bf5ffc26ae201267259.
- Production Neon migrations 0001–0003 are applied and catalog-verified; 12 application tables and 31 RLS policies exist, and all application tables are empty.
- The runtime database role exists with restricted role attributes but has no password; production application connectivity is not configured.
- The Indonesian sign-in page and Neon Auth proxy scaffold are in the feature branch, but production authentication is not enabled or end-to-end verified.
- Session-to-app-user mapping, secure school membership provisioning, operational APIs/UI, QR issuance and verification endpoints, behavioral cross-tenant integration tests, deployment host configuration, privacy/legal review, monitoring, and recovery rehearsal remain incomplete.

## Release decision

**Current status: developer preview / not commercially launchable.** Do not onboard real student or worker data, charge customers for an operational service, or describe attendance/QR workflows as active until the relevant release tier's evidence is complete. Record each gate with a test/review artifact, date, reviewer, and deployed commit SHA.
