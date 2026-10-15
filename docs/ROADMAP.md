# Roadmap

1. **Foundation** — PWA shell, schema, CI, scenario catalogue, secret-handling rules.
2. **Identity and tenant authorization** — choose an auth provider, sessions, membership checks, role policies, negative tests.
3. **Card OS shared core** — issuer/organization namespace, configurable card-domain templates, membership lifecycle, branding/field policy, card issue/expire/replace/revoke, opaque QR tokens and minimum-result verification.
4. **Student operations** — validated student roster, duplicate detection, class and academic-year setup, status lifecycle, auditable changes.
5. **Student attendance (first domain module)** — attendance sessions, check-in/out, present/late/permission/sick/absent/early-departure statuses, duplicate-event policy, auditable corrections, guardian visibility, class-period reports.
6. **School and family workflows** — leave requests, schedules, notices, verified guardian links and accessible/offline-friendly PWA.
7. **Project-worker domain** — separate organization/project membership, contractor assignment, work attendance, certifications, safety induction and optional site access. No access to school tenant data.
8. **Institution-member domain and template configuration** — reusable membership lifecycle, event check-in and facility access with independently enabled modules.
9. **Operational readiness** — backup/restore exercises, monitoring, incident playbooks, accessibility, offline behavior, privacy/security review.
10. **Pilot** — synthetic-data test, limited school pilot with explicit approval and real-data release gates.
11. **Scale and AI assistance** — aggregated/de-identified operational insights; AI agents may draft issues/PRs and tests with least privilege, sandboxed work and human approval for production.

## Release discipline

- The card-domain registry describes templates; it does not mean those workflows are live.
- Each module must have an owner, documented purpose, data classification, permissions, retention and correction path.
- Each tenant boundary must be enforced on the server and tested with negative authorization cases.
- Student attendance must not collect continuous location by default; QR scanning alone is not proof of identity or physical presence.
- No phase is complete until tests and review evidence are recorded. Do not process real student/worker data before authentication, authorization, privacy/security review and release approval.
