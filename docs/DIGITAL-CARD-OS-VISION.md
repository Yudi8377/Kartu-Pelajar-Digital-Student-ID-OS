# Digital Card OS — Platform Vision & Product Architecture

**Status:** proposed umbrella direction for the existing repository; existing student/school work is retained.  
**Repository:** `Yudi8377/Kartu-Pelajar-Digital-Student-ID-OS`  
**Implementation rule:** this document broadens the product vision; it does not authorize deleting modules, changing production data, or claiming unimplemented functions are live.

## 1. Product direction

Evolve the current Kartu Pelajar Digital / Student ID OS into **Digital Card OS**: a configurable platform for designing, issuing, managing, presenting, and verifying digital cards for different purposes.

The platform should let an authorized organization choose:
1. **What the card is for** — for example, student identity, project/team identity, event participant, organization member, professional contact/name card, volunteer, or a Hajj/Umrah service credential.
2. **What it proves or enables** — identity confirmation, membership, role, project assignment, attendance, access permission, contact sharing, achievement/certificate, or service workflow.
3. **Who issues and verifies it** — an explicitly identified issuer, approved verifier roles, and a defined verification policy.
4. **What data is shown** — only fields necessary for that purpose, with separate public, holder-only, and authorized-verifier views.
5. **How long it is valid** — issue date, expiry, renewal, suspend/revoke, replacement, and audit history.
6. **What integrations are allowed** — only approved APIs or imports with clear authority, data scope, and audit trail.

The product is not merely a card image generator. It is an identity-card lifecycle and verification platform. The card layout is only one part of the system.

## 2. Preserve the work already completed

Do not delete or rewrite working code merely to rename the concept. Keep the current repository and its history.

- Keep the current school/student domain as the **first product module**: Student ID OS.
- Preserve existing student API, card-designer UI, QR/security contracts, attendance and safety documentation, CI workflows, and static demo while they are useful.
- Reuse shared foundations only after confirming their security boundaries and test coverage.
- Add the generic platform layer around the existing student module gradually, with changes on reviewable branches and CI.
- Maintain backward compatibility where feasible; use reviewed database migrations rather than destructive schema changes.
- Existing Next.js/Neon code and existing static preview must not be represented as a verified production system.

## 3. Product architecture: shared core + isolated card-purpose modules

### A. Shared Digital Card Core

- Organization/issuer registry and tenant boundaries.
- Card type/template registry with versioned configuration.
- Card issuance, renewal, replacement, suspension, expiry, and revocation lifecycle.
- Opaque, cryptographically random QR/token credentials; store token hashes rather than raw secrets.
- Purpose-bound verification policies and minimal verification responses.
- Role and permission management, audit trail, consent/notice records where applicable.
- Holder wallet and accessible responsive card presentation.
- Import/export with validation, rate limits, idempotency, and scoped credentials.
- Localization, branding, accessibility, retention, correction, export, and deletion controls.

### B. Purpose-specific modules

| Module | Typical use | Potential functions |
|---|---|---|
| Student ID OS | Schools and educational institutions | Student identity, class membership, school card, authorized attendance, guardian workflows |
| Project Identity | Projects, teams, contractors, research or field programs | Project role, organization, assignment, validity period, authorized site check-in |
| Digital Name Card | Individuals and professionals | Shareable contact profile, selected links, QR contact exchange, privacy-controlled fields |
| Event & Participant Card | Conferences, competitions, training, community events | Registration status, attendance, session access, certificate or badge |
| Organization & Membership Card | Associations, communities, clubs, foundations | Membership status, role, renewal, member-only service eligibility |
| Hajj/Umrah Service Card | Authorized Hajj/Umrah organizers and relevant service workflows | Service-specific identity reference, group/route assignment, checkpoint or assistance workflow only when officially authorized |
| Achievement & Certificate Card | Schools, programs, training providers | Issuer, credential, date, scope, verification, expiry/revocation |

These are product modules, not all-ready features. Each module must have its own requirements, data model, authorization matrix, and release gate.

## 4. Card type configuration

Each card type should define a versioned configuration, rather than hard-coding every card category into the same form.

Minimum configuration concepts:
- Stable `card_type_id`, name, description, category, and configuration version.
- Issuer type and who is authorized to issue/revoke.
- Allowed fields, validation rules, and data classification for each field.
- Public display fields vs holder-private fields vs verifier-only fields.
- Purpose-bound capabilities, such as contact sharing, membership check, attendance, or access.
- Verification policy: online/offline support, required claims, expiry, rate limit, and revocation behavior.
- Lifecycle policy: draft, issued, active, suspended, expired, revoked, replaced.
- Branding/template, localization, accessibility, and printable/downloadable views.
- Retention, export, deletion, consent/notice requirements, and audit events.
- Module-specific security tests and acceptance criteria.

Do not permit a template author to grant themselves issuer authority or bypass authorization by editing a card configuration. Server-side policy must validate every operation.

## 5. Identity, privacy, and trust boundaries

- A card is a purpose-specific credential, not automatically a universal identity or government-issued ID.
- Do not merge people or records across schools, projects, employers, or service providers merely because names, phone numbers, or IDs match.
- Shared identity links, where necessary, require an explicit, authorized linking workflow and a clear legal/operational purpose.
- QR codes must not expose names, national identity numbers, birth dates, medical details, travel details, or other sensitive data. Use opaque tokens and minimal responses.
- Verification must clearly distinguish valid, expired, revoked, suspended, pending, unavailable, and unknown states.
- Sensitive cards need narrower access, minimal data, stronger audit, limited validity, and stricter issuance controls.
- Location is off by default. Any location or trip feature must be purpose-limited, disclosed, explicitly authorized, time-bound, stoppable, and audited.
- AI can assist with summaries and workflow drafts, but must not autonomously approve identities, deny access, issue official credentials, or make emergency/disciplinary decisions.

## 6. Hajj/Umrah and official credential caution

A Hajj/Umrah card can begin as an **organizer-specific service card or prototype**. It must not be marketed as an official government credential or substitute for government-issued documents. Any official integration, pilgrim data processing, travel/health data handling, identity verification, or operational use requires authorization from the relevant authority and a separate legal, security, and privacy review. Do not collect sensitive pilgrim data merely because a card template supports it.

The same rule applies to any card claiming official status: the issuer's authority and the card's actual legal scope must be verified and displayed honestly.

## 7. Commercial product model

Potential customer groups:
- Schools and education providers.
- Project owners and contractors.
- Event and training organizers.
- Associations, clubs, and membership organizations.
- Authorized service providers for travel or other specialized workflows.
- Professionals who need a privacy-controlled digital contact card.

Potential packaging can be considered later: free/demo tier, organization subscription, or per-active-card/verification limits. Do not implement billing until tenant isolation, entitlements, support processes, and the hosting model are ready. Do not promise zero operating cost for production without a verified cost model.

## 8. Delivery roadmap

### Phase 0 — Product and safety foundation
- Keep existing Student ID OS as the first vertical.
- Document shared-core boundaries, card-type configuration, data classification, threat model, and migration strategy.
- Create synthetic test fixtures and module-specific acceptance tests.
- No real personal data.

### Phase 1 — General Card Studio prototype
- Add a purpose selector and guided setup: card purpose, issuer, fields, functions, validity, and verification rules.
- Support preview with synthetic data only.
- Do not claim a preview card is issued, legally official, or verifiable unless the relevant backend and issuer authorization exist.

### Phase 2 — Shared secure lifecycle
- Implement issuer permissions, versioned templates, secure token lifecycle, verification endpoint, audit, expiry/revocation, and negative authorization tests.
- Test cross-tenant isolation before any production issuance.

### Phase 3 — First operational vertical
- Complete Student ID OS as the initial full module, including authorized school membership, card issuance/revocation, QR verification, and attendance only after their own release gates pass.

### Phase 4 — Additional low-risk verticals
- Add digital name card, project identity, event participant, and membership modules after the shared core is proven.
- Each module uses a scoped data model and its own test matrix.

### Phase 5 — Specialized / sensitive modules
- Consider Hajj/Umrah and other regulated or sensitive uses only after authorized issuer partnerships, legal review, privacy review, and purpose-specific security design.

### Phase 6 — Organization scale and commercial operations
- Tenant provisioning, support access controls, usage limits, billing entitlements, audit exports, backups/restore, monitoring, incident response, service terms, and support processes.

## 9. Definition of done for each card module

A module is not “commercial-ready” until it has:
1. Named and authorized issuer(s), clear intended use, and documented limits.
2. Data inventory/classification and minimum-field review.
3. Server-side authorization and cross-tenant negative tests.
4. Secure issuance, expiry, suspension, revocation, and replacement.
5. QR/token security, rate limiting, audit, and anti-replay tests where applicable.
6. Accessibility and mobile usability checks.
7. Retention, correction, export/delete, incident response, and recovery procedures.
8. Operational owner, support route, monitoring, rollback, and release evidence.
9. Verified hosting/backend and a tested deployment of the exact release commit.
10. Legal/privacy review appropriate to the issuer, users, and jurisdiction.

## 10. Hosting constraint and current reality

The currently selected direction is GitHub for source control, review, CI, and a static public preview. GitHub Pages does not run private server APIs or provide a private transactional database. The platform cannot operate as a real multi-tenant commercial identity service on GitHub Pages alone.

Keep the static website and all examples clearly marked as a preview with fictional data. Do not onboard customers or real identity data until the owner selects and verifies a viable backend/hosting model and all mandatory release gates pass.
