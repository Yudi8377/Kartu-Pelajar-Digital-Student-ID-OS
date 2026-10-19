# Digital Card OS — Commercial Readiness Audit

**Status: NOT APPROVED FOR COMMERCIAL PRODUCTION**

This audit records the verified repository-level baseline. It does not claim that a hosted system, signed installer, or end-to-end workflow has passed testing. Keep synthetic data only until every P0 gate has evidence.

## Confirmed architecture boundary

- GitHub Pages can host the static preview in `site/`; it cannot run the Next.js API routes or provide private server-side sessions, database transactions, or secret storage.
- The README and deployment contract specify GitHub-only hosting. Under that constraint, the current product can be a public website/static demo, but not a national multi-school SaaS with real student records. A production backend needs owner-controlled server infrastructure and a database, or an explicit change to the hosting constraint.
- The static preview is not the operational application. Do not describe it as issuing valid credentials, recording attendance, or verifying real QR cards.
- The Android/Windows packages previously produced were described as wrappers dependent on the hosted URL; successful packaging does not prove full offline functionality. The Android artifact was a debug APK, not a signed release build.

## P0 blockers before real data or paid onboarding

- [ ] Choose and provision a supported production backend under the owner's control; define secrets, TLS, environment separation, database connectivity, and rollback.
- [ ] Create a reproducible dependency lockfile and switch CI to deterministic installation; review all dependency advisories.
- [ ] Verify auth lifecycle and server-side authorization on the actual hosted rehearsal.
- [ ] Verify the database runtime role is least-privileged and cannot bypass row-level security; test cross-school read/write/export denial using separate tenants.
- [ ] Complete student UI/API integration and test CRUD, audit atomicity, safe errors, and concurrent operations.
- [ ] Implement and test server-side card issuance, cryptographically random opaque QR tokens, hashed storage, rotation/revocation/expiry, generic invalid responses, and shared rate limiting.
- [ ] Run end-to-end tests for card creation → issuance → Wallet rendering → public verification → revocation.
- [ ] Verify card template parity between Card Studio and Wallet, including portrait, QR, barcode, signature, and small-screen layouts.
- [ ] Build a signed Android release APK/AAB and a Windows installer with documented signing and checksum verification. Test installation, upgrades, uninstall, permissions, and real offline behavior on target devices.
- [ ] Complete backup/restore rehearsal, monitoring/alerting, incident response, retention/deletion/export processes, accessibility, privacy notice, and applicable Indonesian personal/child-data legal review.
- [ ] Obtain an independent security review and record evidence for each gate.

## CI and dependency monitoring added by this branch

- `.github/dependabot.yml` enables weekly update proposals for npm packages and GitHub Actions.
- `.github/workflows/security-audit.yml` runs npm audit on pull requests and weekly, failing for high/critical advisories.
- These checks improve dependency hygiene but do not prove the runtime is secure or production-ready.

## Release policy

Do not merge this audit branch automatically. Review its checks first. Do not deploy or onboard real schools until all P0 gates are implemented and independently evidenced. If the owner retains GitHub-only hosting, the approved release scope is a static preview with fictional data only.
