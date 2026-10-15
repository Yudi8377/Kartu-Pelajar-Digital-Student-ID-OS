# Student ID OS — Product Blueprint (Approved Decisions)

**Status:** approved product direction; implementation remains gated.  
**Repository:** `Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS`  
**Release rule:** no merge to the default branch and no production deployment until every mandatory security, privacy, operational, and approval gate passes.

## 1. Product vision

Student ID OS is a **national multi-school SaaS for student identity, campus operations, attendance, and safety**. It must be delivered in deliberate stages: build a trustworthy identity and authorization foundation first, then add attendance, safety, integrations, and intelligence. “All features” is the long-term scope, not permission to launch all features at once.

## 2. Locked design decisions

1. **Priority:** all major capability areas, with a staged foundation and release gates.
2. **Identity scope:** cross-school identity is supported only through an official, authorized transfer workflow. Student numbers are unique within a school, not globally.
3. **Location policy:** continuous location is allowed only inside an explicitly authorized, time-bounded, disclosed session or trip. It is off by default outside that context. Only authorized roles can view it, access is audited, and location collection must stop at session expiry or cancellation.
4. **Product model:** national multi-school SaaS with strict tenant isolation. Each school/yayasan has its own users, records, policies, branding, and permissions. Platform operators receive no routine access to student-level data without a documented, authorized operational purpose.
5. **Release discipline:** work on feature branches and draft PRs; never merge or deploy production until the relevant gates have evidence and the owner explicitly authorizes release.

## 3. Product capability domains

### A. Identity and Card Studio
- School-specific card branding, optional fields, validity dates, issue/reissue/revoke lifecycle.
- Student number uniqueness scoped to school; immutable internal school and student IDs.
- QR/barcode carries an opaque, random, revocable credential—not a student number, name, address, or other personal data.
- Store token hashes rather than raw QR secrets; support expiry, rotation, rate-limited verification, and audit records.
- Offline verification, if introduced, must have bounded validity and a documented revocation/staleness warning.

### B. School registry and official transfer
- Student, guardian, staff, school, campus, class, academic year, and membership records.
- Cross-school transfer is a stateful workflow: request, verify identity/authority, receiving-school acceptance, effective date, records minimization, and audit trail.
- Never merge records merely because names or student numbers match. Handle duplicate candidates with authorized human review.
- Historical attendance and credentials remain attributable to the originating school; the receiving school gets only approved, necessary records.

### C. Attendance and class operations
- QR-based check-in as the first practical pilot path; evaluate NFC/BLE only after device compatibility, consent, anti-replay, and security tests.
- Class sessions, check-in/check-out, teacher handover, late/absent status, event attendance, and auditable corrections.
- Offline event queue with unique idempotency keys, device/session identity, conflict handling, and visible pending-sync status.
- Wi-Fi presence or Bluetooth signal loss alone must never prove a student's identity, arrival, or departure. Distinguish confirmed, pending, unknown, and signal-lost states.
- No automatic disciplinary action based solely on anomaly scores.

### D. Safety and Trip Guardian
- Time-limited school-trip/event sessions with named responsible staff, roster, checkpoints, emergency contacts, and escalation rules.
- Parent/guardian notice and authorization where required by school policy and applicable law.
- Location sharing requires explicit session activation, a clear notice, limited access, access audit, and automatic expiry/stop. Do not use background tracking as the default attendance method.
- Distinguish “not checked in”, “location unavailable”, “signal lost”, and “confirmed incident”; avoid falsely labelling uncertainty as danger.
- Provide a human-operated help/escalation path and document response responsibilities.

### E. Parent and guardian connection
- Verified guardian relationships and granular permissions.
- Attendance, schedule, trip, and permission notifications with delivery status and privacy-safe message content.
- Guardians only see students for whom their relationship and permissions are valid; support correction and revocation.

### F. Campus services and achievement passport
- Optional library, facility access, queues, extracurricular and event registration.
- Verifiable achievements/certificates with issuer, issue date, scope, verification, expiry/revocation where applicable.
- Payment/wallet features are a separate future module with separate authorization, reconciliation, and compliance review; never silently combine payment data with identity.

### G. Trust, governance, and security
- Role-based access control plus tenant and record-level authorization enforced server-side on every protected request.
- Least privilege for school admins, teachers, safety officers, guardians, students, and platform operators.
- Immutable or tamper-evident audit trail for access to sensitive records, role changes, transfers, exports, location access, card issuance/revocation, and corrections.
- Data minimization, retention schedule, export/delete/correction workflows, incident response, backup/restore, and breach procedures.
- Security states must be explicit: verified, expired, revoked, pending sync, unavailable, and unknown are not interchangeable.

### H. Offline-first and device trust
- Secure offline roster only where operationally necessary; encrypt local sensitive storage where supported, limit stored fields, and define expiry/wipe behavior.
- Register staff devices and sessions; support revocation, lost-device response, replay protection, and suspicious activity review.
- Do not treat a device identifier or proximity signal as strong identity proof on its own.

### I. Multi-school SaaS and integration hub
- Tenant-aware provisioning, school-specific policy and branding, quotas, billing entitlements, support access controls, and audit.
- Versioned APIs, webhooks, import/export, schema validation, rate limits, idempotency, and integration credentials scoped to a school and capability.
- Cross-school reporting must be aggregated or explicitly authorized; prevent accidental tenant leakage through search, logs, exports, caches, and background jobs.

### J. AI School Operations Assistant (later phase)
- Read only data the requesting role is authorized to access; apply the same tenant filters as the application.
- Cite source, timestamp, and freshness; mark missing or conflicting evidence.
- AI may summarize, identify patterns, and draft recommendations. Human approval is required for sensitive actions, transfer decisions, discipline, emergency declarations, or changes to access.
- No opaque automated decisions that deny access, punish students, or infer dangerous intent from location/attendance alone.

## 4. Main application workspaces

1. **Platform Operations:** tenant provisioning, service health, subscription entitlements, support workflow, and tightly controlled break-glass access.
2. **School Admin Command Center:** roster, card issuance, attendance operations, safety sessions, integrations, reports, and audit.
3. **Teacher Workspace:** class sessions, roster, attendance correction requests, handover, and authorized trip duties.
4. **Student Wallet:** own card, status, schedule, achievements, and permitted service access.
5. **Parent/Guardian Portal:** linked students, notices, permissions, attendance history, and time-limited trip information.
6. **Safety/Trip Workspace:** assigned trips, roster checkpoints, current session status, escalation and audit.
7. **Governance & Security:** roles, devices, data retention, audit review, incident workflow, export/delete requests.
8. **Integration & Intelligence:** imports/exports, API/webhook health, evidence-based reports, and later authorized AI assistance.

All workspaces must be responsive and accessible. Menu visibility is not authorization; server-side policies are mandatory.

## 5. Phased implementation plan

### Phase 0 — Foundation and evidence
- Confirm architecture, schema, threat model, data inventory, retention map, tenant boundary model, and test fixtures using synthetic data.
- Establish CI, migration review, secret handling, audit event contract, and release checklist.
- Exit gate: documented architecture and threat review; CI baseline; no real student data.

### Phase 1 — Tenant identity and card lifecycle
- Implement school-scoped records and membership; RBAC and negative cross-tenant tests.
- Build Card Studio; secure token issuance, hash-only storage, verification, expiry, revocation, rate limiting, and audit.
- Exit gate: authorization tests pass; token security reviewed; accessibility and abuse tests recorded.

### Phase 2 — Attendance and classroom operations
- QR attendance, class sessions, teacher handover, offline queue/idempotency, corrections, and status confidence.
- Exit gate: duplicate/replay/offline/conflict tests; staff-device loss procedure; no signal-only departure inference.

### Phase 3 — Guardian connection and trip safety
- Verified guardian linking, notices, permission workflow, time-limited trip mode, checkpoints, emergency workflow, location session controls.
- Exit gate: privacy review; session expiry and stop verified; location access audited; consent/notice flows tested; emergency responsibilities assigned.

### Phase 4 — Cross-school transfer and SaaS operations
- Formal transfer workflow; tenant provisioning, school configuration, support access, subscription entitlements, quotas, and tenant-safe analytics.
- Exit gate: cross-tenant penetration tests, transfer audit, export/log/cache isolation tests, billing/entitlement tests.

### Phase 5 — Campus services and integrations
- Library/facility/achievement modules and versioned APIs/webhooks/import/export; payment features only after separate review.
- Exit gate: scoped credentials, rate limits, reconciliation and failure recovery tested.

### Phase 6 — Intelligence and national scale
- Evidence-based analytics and role-scoped AI assistant; capacity, availability, disaster recovery, monitoring, and operational support.
- Exit gate: AI authorization tests, human approval controls, load/restore drills, privacy assessment, and explicit pilot/scale approval.

## 6. Mandatory production gates

Production is blocked until all applicable items are evidenced and explicitly approved:
- [ ] Tenant isolation and server-side authorization tests, including negative tests across every protected endpoint and background job.
- [ ] Authentication, session security, account recovery, privileged access and admin bootstrap reviewed.
- [ ] QR/token threat review, replay/rate-limit/expiry/revocation tests, and no personal data embedded in credentials.
- [ ] Location is off by default, session-scoped, clearly disclosed, automatically stopped, role-restricted, and audited.
- [ ] Privacy/data protection review appropriate to Indonesian law and school/minor context; guardian and school responsibilities documented.
- [ ] Retention, correction, export/deletion, incident response, and access request processes tested.
- [ ] Production secrets, TLS/host configuration, monitoring, alerts, backups, and restore drill verified.
- [ ] Accessibility, mobile, offline/reconnect, migration rollback, and failure-mode tests pass.
- [ ] Independent review of critical security/privacy paths and all CI checks pass.
- [ ] Limited pilot authorization, support owner, incident contacts, and rollback plan documented.
- [ ] Owner explicitly authorizes merge and production release after reviewing evidence.

## 7. Non-goals and prohibitions
- No real student data in prototypes, public demos, screenshots, or unapproved environments.
- No always-on location collection outside an authorized and disclosed session.
- No claim that Wi-Fi/BLE presence alone proves identity or physical presence.
- No automatic disciplinary or transfer decisions by AI.
- No production merge/deployment based solely on a successful build or a green CI badge.
