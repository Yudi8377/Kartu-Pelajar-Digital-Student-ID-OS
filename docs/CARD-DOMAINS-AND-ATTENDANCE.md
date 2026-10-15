# Reusable Digital Card Domains and Attendance Design

**Status:** architecture and product-template specification. The domain templates and module registry are not live operational workflows.

## Product model

KPD is evolving toward **Digital Card OS**: one shared identity-card platform with independently configured domain templates. The initial domain templates are:

- **Student:** school identity, attendance, class schedule, leave/permission, guardian communication, learning passport and student services.
- **Project worker:** company and project assignment, work attendance, site access, certifications, safety induction and incident reporting.
- **Institution member:** membership lifecycle, event check-in and facility access.

A new card domain should be configured from a reviewed template rather than forking the entire product. Each domain defines a stable ID, modules, primary roles, data classification, lifecycle status and guardrails. Organizations explicitly enable modules and set their policy; a template is not evidence that its features are already implemented.

## Shared card foundation

All domains may reuse these platform capabilities:
- issuer and organization/project namespace;
- person-to-organization membership with effective dates and status;
- card issue, activate, expire, replace, suspend and revoke lifecycle;
- opaque random QR credential with only its hash stored server-side;
- minimum-result QR verification, rate limiting and audit trail;
- configurable branding and card fields with field-level privacy rules;
- role-based permissions and tenant isolation enforced server-side;
- data export/correction/retention controls and an auditable module-enable workflow.

Do not encode names, identity numbers, birth dates, school/class, employer, project, certifications, attendance history or location into a QR payload. Public verification should return only the minimum confirmation needed for the stated purpose.

## Student attendance module

### Supported attendance states (planned)
- Present / hadir
- Late / terlambat
- Excused / izin
- Sick / sakit
- Absent without approved reason / alpa
- Early departure / pulang lebih awal
- Corrected / dikoreksi (an audit action, not a replacement for the original event)

The school configures schedules, grace periods, attendance windows, holidays and the role allowed to correct a record.

### Attendance workflow
1. A school operator configures academic year, class, schedule and the allowed check-in method.
2. A teacher or authorized device records a check-in/out event for the assigned class/session.
3. The server validates the caller's active school membership, assigned class, session window, student status and duplicate-event policy.
4. The event records timestamp, source/method, session, actor or device identifier and outcome. Avoid collecting GPS by default.
5. Teachers can review the class roster and resolve exceptions. A correction creates an auditable amendment with reason, actor and timestamp; it must not silently overwrite history.
6. Students and verified guardians can view only the attendance data allowed by school policy and applicable law. Notices are sent only through configured channels and approved contact links.
7. Reports summarize attendance for an authorized class and period. Exports are permissioned and audited.

### QR and anti-abuse limitations
A QR scan alone does not prove that the named student is physically present or that the card holder is the rightful student. Do not market QR attendance as fraud-proof. Risk controls can include authenticated teacher scanning, short-lived session challenges, duplicate detection, server timestamps and manual exception review. Any location feature must be separately justified, disclosed and optional where possible; no continuous student tracking.

### Minimum data model to implement
- attendance_sessions: organization/school, class, schedule reference, start/end window, status, policy version.
- attendance_events: session, student membership, event type, server timestamp, source, actor/device, idempotency key and status.
- attendance_corrections: original event, replacement/decision, reason, reviewer, timestamp and audit reference.
- attendance_policies: allowed methods, grace window, duplicate policy, correction roles and notification policy.

The proposed schema is now drafted in `db/migrations/0003_student_attendance.sql` on the development branch, with static guardrail tests in `tests/attendance-migration.test.ts`. It has not been applied to production and is not yet connected to an authenticated application workflow. Use foreign keys, tenant-scoped uniqueness, indexes and server-side authorization. Do not put student details in event IDs or QR values. See `docs/ATTENDANCE-IMPLEMENTATION-STATUS.md` for current limitations and release gates.

## Project worker card domain

Project worker identity is a separate tenant domain. A worker may have a relationship to a contractor and an assignment to a particular project/site, each with start/end dates and status. Optional modules include:
- work attendance and shift/session records;
- site/zone access decisions;
- verified certification and expiry dates;
- safety induction acknowledgements;
- incident reporting and authorized follow-up.

Do not expose employment history, detailed incident reports, health information or certificate documents to public QR verifiers. Site access should return a minimum result to the access-control system and be enforced at the server/device boundary. Contractors and project operators must not gain access to school tenants. Cross-organization worker assignments need explicit linking, scoped permissions and an audit trail.

## Module activation gates

Before a domain or module becomes operational:
1. Assign a product owner and confirm the lawful purpose/data controller roles.
2. Define required fields, classification, retention and correction process.
3. Define roles and negative-access tests for tenant boundaries.
4. Implement server-side API and database constraints; hiding a button is not authorization.
5. Add unit, integration and security tests, including duplicate events, corrections, expiry and revoked membership.
6. Complete privacy/security review and test with synthetic data.
7. Label UI status accurately; planned modules must not look live.
8. Obtain explicit release approval before processing real student or worker records.

## Rollout order

1. Finish identity, authentication, membership and tenant authorization.
2. Implement card lifecycle and QR issuance/verification.
3. Implement student attendance as the first domain-specific operational module.
4. Add schedule, leave requests, guardian notifications and attendance reports.
5. Validate a separate project-worker tenant/domain and its attendance/access policies.
6. Add institution-member templates and a controlled template/module configuration interface.
