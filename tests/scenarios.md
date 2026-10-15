# Scenario catalogue

## Identity and access
- Unauthenticated user cannot read or mutate protected data.
- A school operator cannot access another school's students by changing an ID in the request.
- Disabled users and revoked memberships are denied immediately.
- Each role can perform only explicitly allowed actions.

## Student records
- Duplicate student number in the same school is rejected.
- The same student number in different schools is allowed.
- Invalid or oversized fields are rejected safely.
- Concurrent issuance does not create duplicate active cards for the same policy scope.

## Card and QR lifecycle
- Pending, active, revoked, expired, and replaced states are handled correctly.
- Forged, unknown, expired, and revoked QR tokens do not verify as valid.
- QR response contains minimal confirmation and no unnecessary personal details.
- Raw QR token is never persisted or logged; only a hash is stored.
- Verification endpoint is rate-limited.

## Reliability and privacy
- Database timeout returns a safe error without leaking connection details.
- Audit trail records security-relevant changes without secrets or student PII.
- Import/export is authorized and auditable.
- Backup restoration is tested in an isolated environment.
- PWA layout remains usable on mobile and keyboard; offline mode does not falsely claim live verification.


## Reusable card domains
- A student card domain cannot read a project-worker tenant, and a project-worker role cannot read student records.
- An organization can enable only modules allowed by its domain template and assigned role.
- Planned modules are not exposed as live operational capabilities.
- Public QR verification does not return attendance, employer/project history, certification documents or incident details.

## Student attendance
- Only an authenticated teacher/operator assigned to the school and class can record attendance.
- Check-in outside the configured session window is rejected or routed to authorized exception review.
- Duplicate scans/events are idempotently rejected or safely deduplicated.
- Present, late, excused, sick, absent and early-departure statuses follow the school's configured policy.
- A correction preserves the original event and records reason, actor, timestamp and reviewer where required.
- A guardian can view only the linked student's permitted attendance summary.
- Attendance exports are permissioned, scoped to a school/class/period and audited.
- QR attendance does not claim proof of identity or physical presence by itself.
- Attendance works without collecting continuous location data.

## Project-worker card domain
- Contractor and project assignments are valid only within their effective dates.
- A site supervisor can view only workers and access status for assigned projects/sites.
- Expired or revoked worker cards do not verify as active.
- Public verification does not expose detailed certifications, safety records or incident reports.
- A project-worker account cannot access student or guardian records.
