# Student ID OS — Digital Card, Attendance, and Safety Design

## Status
This document defines the product contract for the next implementation phases. The admin page on this branch is a UI prototype only. It does not persist settings, issue valid QR credentials, read device proximity, collect GPS, or write attendance records. Do not use real student data.

## 1. School-scoped identity
- Each school has a server-generated immutable `school_id` (UUID) and a human-readable school code.
- Each student has an immutable internal `student_id` (UUID), distinct from the school's student number.
- Enforce a database uniqueness constraint on `(school_id, normalized_student_number)`; normalize whitespace/case according to a documented school policy before insert.
- Never use the student number alone as a global primary key. The same number at two different schools is valid.
- Do not construct a security credential from a student number. Display IDs are labels, not secrets.
- Imports must validate duplicates inside the selected school, report collisions before commit, and support an auditable correction flow.

## 2. Card designer and credential lifecycle
Admin settings: school name/logo, card layout, theme, optional fields, validity dates, and QR/barcode display. Restrict changes to authorized school administrators and audit them.
- Preview mode must be clearly marked and use synthetic data.
- Issuance happens on the server after authorization. Generate a cryptographically random opaque token; store only its hash; never encode student details in QR/barcode.
- Support expiry, revocation, reissue, and audit trail. A QR rotation invalidates the prior token according to an explicit policy.
- Do not issue a production credential until authentication, tenant authorization, uniqueness constraints, rate limiting, and verification tests are passing.

## 3. Attendance methods and honest device constraints
Recommended staged rollout:
1. **QR/barcode scan** on a registered staff terminal: easiest to pilot, explicit action, and compatible with ordinary phones.
2. **NFC tap** where the student credential and reader device actually support it; verify OS/browser limitations before selecting hardware.
3. **BLE proximity** only as an opt-in, explicitly disclosed pilot with compatible apps/beacons, permission handling, replay/spoofing controls, and a confidence state. RSSI is approximate and does not prove a person is present.
4. **Wi-Fi presence** may indicate a device/network association, not a precise location or guaranteed student identity. Do not silently infer attendance from Wi-Fi alone.

A regular phone cannot universally discover and read identifiers from all nearby phones. Mobile operating systems restrict background scanning, identifiers, and peer-to-peer radio access. A reliable automatic design may need managed student devices, a school-owned gateway/reader, NFC hardware, or dedicated BLE beacons. Prove feasibility on the actual target Android/iOS versions before promising automatic attendance.

## 4. Network and offline behavior
- A registered staff terminal authenticates to the school tenant and downloads only the minimum roster required for its assigned session.
- Offline attendance is queued locally with device/session identifiers, timestamp, and idempotency key, then synchronized when connectivity returns.
- Mark offline records as pending until server validation; resolve conflicts visibly rather than silently overwriting.
- Do not treat a lost Wi-Fi signal as proof that a student left the campus. Use states such as `last_seen`, `signal_lost`, `check_out_confirmed`, and `unknown`.
- A student app can continue a background task only where platform policy and user permissions allow it; no guarantee of continuous operation when the app is suspended or force-stopped.

## 5. Teacher handover and class sessions
- A teacher opens a time-bounded class session linked to an authorized schedule, room, subject, and roster.
- Only students assigned to that school and session can be marked present.
- Handover records the outgoing/incoming teacher, timestamps, and session change in an audit log.
- Nearby-device detections must not expose unrelated students or other classes to a teacher.

## 6. School zone and study-tour safety mode
- School geofence and trip mode are separate policies. Location collection is off by default and must be disclosed and authorized.
- For school campus, prefer confirmed check-in/check-out and coarse zone state over continuous tracking.
- For study tours, activate a time-limited event with an explicit participant list, named supervising staff, parent/guardian notice/authorization where required, defined check-in points, emergency contact workflow, and automatic end time.
- Show location only to assigned staff and administrators with a need to know; log every access and export.
- Student-facing screens should not expose staff-only location dashboards, but students and guardians must receive clear notice of when collection is active and how to raise concerns.
- A device being out of coverage means **last known status**, not proof the student has left or is safe. Never label a student "logged out" solely because connectivity vanished.

## 7. Privacy, retention, and access
- Separate permissions for school administration, attendance staff, teachers, trip supervisors, guardians, and students.
- Collect the minimum necessary data. Avoid continuous precise location by default.
- Define retention windows for attendance and location separately; automatically expire trip tracking data when the approved period ends, unless a documented incident requires retention.
- Maintain immutable audit events for card issuance/revocation, attendance corrections, location access, exports, and role changes.
- Provide access/correction/deletion procedures, security incident response, and guardian/student notice before real data onboarding.
- Use synthetic data for development and test.

## 8. Release gates
Before any live pilot with students: threat model, privacy/legal review under applicable Indonesian personal-data and child-protection requirements, device compatibility test, negative tenant-isolation tests, abuse/rate-limit tests, offline conflict tests, backup/restore drill, incident plan, and written school approval.
