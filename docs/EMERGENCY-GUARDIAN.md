# KPD Emergency Guardian — Product & Safety Specification

**Status:** planned product specification. The current KPD web preview does not detect accidents, track a device, send SMS, or call anyone. Native Android implementation and end-to-end tests are still required.

## Goal

Help a student or card holder request help during a possible accident or other emergency, alert verified guardians, and share the most recent available location. This is a supplemental safety tool, not a certified medical device and not a replacement for emergency services or adult supervision.

## Proposed flow

1. **User setup (opt-in):** the student and verified guardian complete an age-appropriate explanation, permissions, emergency contacts, contact order, language, and allowed location-sharing rules. The user can test the workflow and revoke permissions.
2. **SOS button:** a clearly visible in-app and Android quick-access action begins an emergency session immediately, without relying on sensor detection.
3. **Possible-incident signal:** a native Android service may evaluate supported motion/activity signals and device context. Sensor events are indicators only; they cannot reliably diagnose a crash or injury. Sensor availability varies by device.
4. **Check-in window:** where the user can interact, the device gives a noticeable sound/vibration and a short opportunity to confirm safety or cancel a false alarm. The UI must also provide an accessible path for a user who cannot respond.
5. **Guardian alert:** send a push notification and, if specifically configured and technically supported, an SMS or other approved channel to verified contacts. Include event time, alert status, and a secure location link if location is available. Record delivery status and escalate to the next guardian if delivery fails.
6. **Public emergency services:** do not silently or repeatedly auto-dial public emergency numbers based only on an accelerometer signal. Provide a clear emergency-call action and follow platform, telecom, jurisdiction, and app-store requirements. Any future automatic emergency-service integration requires a reviewed, lawful, technically supported dispatch workflow and explicit product approval.
7. **Location snapshot:** obtain a location fix when authorized and technically possible; store timestamp, accuracy radius, and source. If live location cannot be acquired, send the last known fix with a visible age label, never imply it is current. A guardian opens an HTTPS Google Maps URL using coordinates; no Google Maps API key is required for a standard Maps URL.
8. **Close and review:** allow the user or authorized responder to close the event; notify contacts of cancellation/resolution where appropriate; keep only the minimum incident record for a documented period.

## Reliability tiers

- **Tier A — user-initiated SOS:** the most reliable initial feature; uses a direct in-app action.
- **Tier B — possible incident with confirmation:** sensor signal followed by an on-device check-in, then guardian notification.
- **Tier C — unattended incident alert:** only after native Android feasibility, permission, battery, false-positive, accessibility, and abuse testing. Do not promise operation after force-stop, device shutdown, revoked permissions, dead battery, no signal, or unsupported hardware.
- **Tier D — public emergency service dispatch:** not part of the first release. Requires a separately approved integration or a user-initiated call workflow.

## Location and Google Maps

- Collect location only for an explained safety purpose, with the minimum scope required.
- Prefer a user-initiated foreground location flow where it meets the use case. Background location is a sensitive permission and must be justified, disclosed, reviewed against current Google Play requirements, and requested only when necessary.
- Show an ongoing, understandable indication when an active safety session is sharing location.
- Do not create continuous family tracking by default. Configure emergency-only sharing, authorized recipients, expiry, and revoke controls.
- Use the last known location only if it is clearly labeled with timestamp and accuracy; never imply a stale fix is live.
- Use a URL of the form `https://www.google.com/maps/search/?api=1&query=LATITUDE%2CLONGITUDE` with proper URL encoding. Access should be through a time-limited secure KPD incident page where possible; avoid exposing student identifiers or other personal data in the URL.

## Privacy, child protection, and abuse prevention

- Verify guardian relationship and contact ownership before enabling alerts.
- Keep emergency contacts private; restrict access by role and school tenant.
- Do not expose a student's location to a general QR verifier, classmates, advertisers, or unrelated school staff.
- Do not silently activate microphone, camera, or continuous location tracking.
- Do not use camera-based injury diagnosis or face recognition in the first release.
- Make permissions and sharing visible; support revocation, correction, access history, and deletion subject to lawful retention obligations.
- Rate-limit alerts and add duplicate suppression, but never let spam controls block a legitimate user-initiated SOS.
- Keep logs minimal; encrypt incident records and links; limit link validity and record access.
- Perform a child-rights/privacy impact assessment, security testing, threat modeling, and misuse review before real student data is used.

## Android implementation notes

A web/PWA page cannot guarantee reliable background sensor monitoring or unrestricted calling. Build a native Android layer (for example, Kotlin) for supported sensors, foreground service and notification UX where permitted, runtime permissions, location provider, notification delivery, and a clear SOS action. Validate current Android background-start and foreground-service restrictions for the targeted SDK and devices. Do not assume a service can start from the background whenever a sensor event occurs. If direct calling is implemented, follow Android call-intent/permission rules and carrier/device constraints.

## Suggested event record

Store only the data needed for response and audit:
- random incident ID;
- pseudonymous student/card reference;
- trigger type (user SOS / possible sensor incident);
- created time, notification status and resolution state;
- location snapshot (latitude/longitude, timestamp, accuracy) only when permitted and available;
- guardian delivery outcomes;
- audit actor and action.

Avoid storing raw continuous sensor streams by default. Do not include location or student identifiers in analytics, public logs, or QR codes.

## Release gates

1. Native Android proof of feasibility across supported devices and Android versions.
2. Permission and background-behavior review against current Android and Google Play policies.
3. Guardian identity/relationship verification and contact ownership verification.
4. False-positive, missed-event, battery, network-loss, stale-location, and accessibility tests.
5. Delivery receipts, retry policy, cancellation, and incident closure tests.
6. Privacy impact assessment, threat model, incident retention policy, and security review.
7. A documented regional emergency-service directory and user-initiated call flow; 112 availability varies by locality, so verify the user's location/region before presenting it as available.
8. Clear user-facing statement that the feature is not a guarantee of rescue or a substitute for emergency services.

## Public emergency number note

Indonesia's official 112 program is operated in a decentralized way by participating local governments. Do not assume the same dispatch capability is active in every locality. The first KPD release should make public emergency calling user-initiated and show local instructions only after current coverage is verified.
