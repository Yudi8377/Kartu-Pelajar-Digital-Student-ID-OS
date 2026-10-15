# Roadmap

1. **Foundation** — PWA shell, schema, CI, scenario catalogue, secret-handling rules.
2. **Identity and tenant authorization** — choose an auth provider, sessions, membership checks, role policies, negative tests.
3. **School and student workflows** — validated import, duplicate detection, status lifecycle, auditable changes.
4. **Admin card designer prototype** — editable school identity, theme, card fields, preview, and planned QR issuance UI (not yet connected to backend).
5. **Card issuance and QR verification** — secure random tokens, hash-only storage, expiry/revocation checks, rate limits.
6. **Attendance and safety** — QR first, then device-validated NFC/BLE options; session-based teacher handover, offline sync, time-limited study-tour mode, and strict location access policies. See `docs/ATTENDANCE-AND-SAFETY.md`.
7. **Operational readiness** — backup/restore exercises, monitoring, incident playbooks, accessibility, offline behavior.
8. **Pilot** — synthetic-data test, privacy/security review, limited school pilot with explicit approval.
9. **Scale and AI assistance** — AI agents may draft issues/PRs and tests; least privilege, sandboxed work, human approval for production.

No phase is considered complete until tests and review evidence are recorded.
