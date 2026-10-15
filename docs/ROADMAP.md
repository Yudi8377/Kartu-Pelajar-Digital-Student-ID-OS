# Roadmap

**Approved direction:** national multi-school SaaS; all capability domains delivered in stages; cross-school student identity only through official transfer; continuous location only during explicitly authorized and disclosed, time-bounded sessions. See `docs/PRODUCT-BLUEPRINT.md`.

1. **Phase 0 — Foundation and evidence**: PWA shell, schema and threat model, data inventory/retention, CI, secret handling, audit contract, synthetic-data tests, release gates.
2. **Phase 1 — Tenant identity and card lifecycle**: authentication, school membership, server-side RBAC, negative tenant-isolation tests, Card Studio, secure QR token issuance/verification/expiry/revocation, audit and rate limits.
3. **Phase 2 — Attendance and classroom operations**: QR-first attendance, class sessions, teacher handover, offline queue/idempotency, corrections, confidence/status labels, device revocation.
4. **Phase 3 — Guardian connection and trip safety**: verified guardian links, notifications and permissions, time-limited trip mode, checkpoints, emergency workflow, session-scoped disclosed location with expiry and audited access.
5. **Phase 4 — Cross-school transfer and SaaS operations**: formal transfer workflow, tenant provisioning, school configuration, support access controls, subscription entitlements, tenant-safe analytics.
6. **Phase 5 — Campus services and integrations**: library/facility/achievement credentials, versioned APIs/webhooks/import-export; payment services only after separate compliance/security review.
7. **Phase 6 — Intelligence and national scale**: evidence-based analytics and role-scoped AI assistant with source freshness and human approval, capacity/availability/monitoring, disaster recovery and support readiness.
8. **Pilot and scale authorization**: synthetic-data validation first; limited real-school pilot only after all applicable gates are evidenced and explicitly approved.

## Non-negotiable release gates

- No real student data in prototypes or unapproved environments.
- No merge to the default branch or production deployment until tenant-isolation/authorization tests, authentication review, QR security tests, privacy/location controls, data rights/retention, monitoring/backups/restore, rollback, incident response, and independent security review have passed.
- Location is off by default and must stop automatically when an authorized, disclosed session ends.
- Presence signals alone do not prove identity or departure; uncertain states must remain uncertain.
- AI cannot autonomously punish students, declare emergencies, approve transfers, or grant access.
- Record test evidence and obtain explicit owner approval before each production release.

No phase is complete until its acceptance criteria and review evidence are recorded.
