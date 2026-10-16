# Hatchable deployment — Digital Card OS

Last verified: 2026-10-16

## Live deployment

- Application: https://digital-card-os.hatchable.site
- Hatchable project console: https://hatchable.com/console/projects/digital-card-os
- Current deployed version: v3
- Project ID: `proj_PmzkrePfXLLw`
- Status: deployed and running on Hatchable, **visibility is still personal/private**
- Public marketing route: `/`
- Authenticated workspace: `/app/`
- Email one-time-code sign-in: `/login`
- Anonymous credential verification: `/verify/`

The short-lived preview URL is for review only. It is not a permanent public URL. To let real customers visit, the project owner must open the console, go to Settings, and change project visibility to Public. That action cannot be performed through the deployment API.

## Current modules

- Organization tenants and membership roles (`org_admin`, `operator`, `viewer`)
- Seven specific card types: student ID, project identity, digital name card, event participant, organization membership, achievement certificate, Hajj/Umrah service concept
- Organization-scoped card drafts and inventories
- Issue flow that generates a 256-bit random verification token; only its SHA-256 hash is stored
- Revoke flow that clears the token hash so the old verification token no longer verifies
- Public verification page with a minimal response (issuer, card type, masked-purpose card number, dates/status; no holder name or personal reference)
- Organization-admin audit view
- Seven-day trial record and plan catalogue
- Branded email one-time-code login using Hatchable's auth helper

## Verification performed

- Hatchable dry-run deploy validator: no blocking errors.
- Deployed version v3 confirmed live.
- Browser smoke checks passed for landing page, workspace shell, login page, and verification page.
- Authenticated `GET /api/card-types`: 200; seven catalog entries returned.
- Anonymous `GET /api/me`: 401 as expected.
- Invalid public verification token: 400 as expected.
- End-to-end QA tenant test: create organization, create draft, issue token, verify valid, revoke, verify the previous token is invalid. Temporary QA tenant/card were deleted after the test.
- Organization access denial for an unrelated organization ID: 403 as expected.
- Deployed functions currently report zero runtime errors in the observed 24-hour window; this is an early smoke-test observation, not a production SLA.

## Commercial release blockers

1. Change Hatchable project visibility from personal/private to Public before inviting real customers.
2. Exercise the real email sign-in and account-recovery experience with a controlled owner account after public visibility is enabled.
3. Add request-rate limiting / abuse monitoring for public verification and confirm platform-level limits.
4. Perform a formal tenant-isolation review with two real test accounts and independent roles.
5. Add backup/restore drills, monitoring/alerting, incident response, retention/deletion/export flows, and privacy review appropriate to Indonesian data protection and any student/minor data.
6. Payment gateway is deliberately disabled. Plan prices are drafts; no checkout, invoicing, refunds, or payment reconciliation are active.
7. The code currently deployed in Hatchable is not automatically mirrored to this GitHub repository. Treat the Hatchable project files as the deployment copy until a reviewed source-sync/export workflow is established.
8. Do not use real student, pilgrim, or other personal data until the privacy/security gates have been approved.

A successful deploy and smoke tests do not equal a complete penetration test, legal compliance review, or commercial-readiness certification.
