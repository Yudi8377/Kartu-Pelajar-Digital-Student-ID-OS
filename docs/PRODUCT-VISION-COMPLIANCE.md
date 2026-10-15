# KPD Product Vision & Compliance Baseline

**Status:** product architecture proposal; not legal advice and not a statement that government integrations are approved.

## Product position

Kartu Pelajar Digital (KPD) is a modular student identity and education-services platform. The card is the entry point, not a container for every record about a child. KPD should keep the identity/card service narrow and connect optional services through separately authorized modules.

### Product pillars

1. **Digital student identity:** school-issued identity, card lifecycle, expiry/replacement/revocation, QR verification with opaque random token and hashed token at rest.
2. **School operations:** school-scoped student roster, class/status updates, card issuance and auditable administrative actions.
3. **Student and guardian portal:** view authorized information, request corrections, receive relevant notices and track service requests.
4. **Welfare and education-benefit bridge:** optional official referral/verification flow for assistance programs, gated by a lawful data-sharing arrangement and access approval.
5. **Learning passport:** validated achievements, certificates and education records with provenance and correction workflows.
6. **Student services:** optional library, extracurricular, transport or facility access; each integration is independently enabled.
7. **Trust & Privacy Center:** access history, data correction, retention, incident handling, consent/notice records and audit controls.

## Family desil / DTSEN integration: the safe design

The social-economic ranking data commonly referred to as *desil* should **not** be printed on the student card, embedded in a QR code, exposed to a general verifier, or used as a public label for a child.

KPD should not copy the full DTSEN dataset. Instead, design a future **Welfare Bridge** that:
- remains disabled until an authorized government/official data provider and the KPD operator establish a documented legal basis, purpose, agreement, security controls and permitted API/verification workflow;
- requests only the minimum information needed for a named program;
- preferably returns a limited response such as `verified / not verified / manual review`, program reference and timestamp, rather than raw household ranking;
- records the source, time of verification, purpose, authorized requester and result in a restricted audit trail;
- supports corrections, appeal/manual review and stale-data handling;
- never automatically denies a student an education opportunity solely because a desil value is absent, outdated, disputed or unavailable;
- separates a family's social-assistance eligibility from the student's general identity and school standing.

Desil/DTSEN is a restricted social-economic data source, not a feature KPD can access merely because it has a student profile. A formal agreement and approved technical access are prerequisites. The official DTSEN framework includes Inpres No. 4 Tahun 2025 and Permensos No. 3 Tahun 2025; current implementing requirements and competent agencies must be revalidated before implementation.

## Privacy and child protection by design

- **Purpose limitation:** document why each field is needed and which service uses it.
- **Data minimization:** do not collect family income, household ranking, health, biometrics or identity numbers unless a specific lawful use case requires them.
- **Role-based access:** student, guardian, teacher, school operator, verifier, district operator, KPD support and auditor have distinct permissions.
- **Tenant isolation:** every school-owned record is scoped server-side; client-side hiding is not authorization.
- **Safe QR:** random high-entropy token only; database stores a cryptographic hash; rate limits and generic invalid responses; no personal details in QR URLs, logs or analytics.
- **Children's data:** provide age-appropriate notices and guardian workflows where applicable; complete child-rights/privacy impact review before handling real records.
- **Data subject requests:** define correction, access, deletion/retention exceptions, complaint and appeal paths.
- **Retention and security:** set documented retention periods, encryption in transit/at rest where supported, backups, incident response, privileged-access review and breach notification procedure.
- **AI restrictions:** no automated eligibility or disciplinary decisions based on inferred poverty, disability, ethnicity, religion, health, behavior or other sensitive traits. Any future AI assistance must be explainable, reviewable by an authorized human and separated from official decisions.

## Legal and policy baseline to validate with counsel/competent agencies

The architecture should be reviewed against, at minimum:

- **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi** — data-subject rights, lawful processing, controller/processor duties and special treatment of children's data.
- **PP No. 17 Tahun 2025 tentang Tata Kelola Penyelenggaraan Sistem Elektronik Dalam Pelindungan Anak** — child-protection governance for electronic systems.
- **PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik** — system reliability, security and electronic-system obligations.
- **Perpres No. 39 Tahun 2019 tentang Satu Data Indonesia** — data standards, metadata, interoperability and governance when sharing government data.
- **UU No. 20 Tahun 2003 tentang Sistem Pendidikan Nasional** — education-system purpose and student rights.
- **Inpres No. 4 Tahun 2025 tentang Data Tunggal Sosial dan Ekonomi Nasional** and **Permensos No. 3 Tahun 2025** — relevant framework for DTSEN use and updates.
- Applicable current Kemendikdasmen rules and official data services, including Dapodik / Pusdatin interoperability requirements where relevant.

These instruments do not automatically authorize a private KPD platform to query government or social-assistance datasets. The responsible institution, legal basis, agreement, data-sharing scope, security review and technical approval must be confirmed for each integration. Keep a versioned legal register because rules can change.

## Modular upgrade model

Modules are registered by stable ID, lifecycle status, data sensitivity, access roles and guardrails. A module can be enabled only after its dependencies, authorization, privacy review, tests and support owner are approved. Planned/gated modules must be clearly labeled as not live in user interfaces.

Suggested rollout:
- **Phase 1 — trustworthy card foundation:** school registry, verified identities, role-based access, card lifecycle, QR, audit, backup and incident process.
- **Phase 2 — school and family services:** guardian verification, correction requests, notices, service requests and accessible/offline-friendly PWA.
- **Phase 3 — education continuity and welfare bridge:** validated learning passport and officially authorized, purpose-specific welfare verification.
- **Phase 4 — optional ecosystem:** library, transport/facility, student discounts, extracurricular and other school services; each is a separate opt-in integration.
- **Phase 5 — analytics and AI support:** aggregated, de-identified operational insights; human-reviewed recommendations only, no profiling or automated high-impact decisions.

## Release gates before real student data

1. Legal basis, roles of controller/processor, privacy notice and child protection review approved.
2. Authentication and guardian/student identity linking implemented and tested.
3. Server-side authorization and school-tenant isolation tested.
4. QR issue/revoke/verify flows tested, rate-limited and privacy reviewed.
5. Data correction, retention, backup/restore and incident response exercised.
6. Production migration approved and applied through the migration workflow.
7. Security testing and operational ownership confirmed.
8. Government integrations remain disabled until written authorization and technical access are verified.
