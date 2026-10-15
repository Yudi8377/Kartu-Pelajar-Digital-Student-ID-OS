# Archived: Hatchable compatibility exploration

## Current decision

The product owner has selected GitHub as the only third-party platform for the current phase. Hatchable is **not the selected host**. Do not create/import/deploy a Hatchable project unless the owner explicitly revises this decision and the account operator meets the provider's terms.

This file is retained only as project history so earlier implementation work is not confused with the current deployment plan.

## Legacy prototype status

- `hatchable-port/` is a static, framework-free UI prototype.
- It uses fictional data and has no authentication, database persistence, valid QR credential, or attendance integration.
- No Student ID OS project was connected/deployed on Hatchable during the previous check.
- The AppDeploy preview URL was a separate static snapshot, not the operational service.

## GitHub-only limitation

GitHub Pages can host static assets. It cannot run this repository's Next.js server routes, private database transactions, managed auth, or server-only secrets. The GitHub-only scope can provide a public website and a static demo; it cannot honestly be called a production multi-school SaaS.

To support real student records while honoring a strict no-third-party-hosting requirement, the owner would need infrastructure under their own control (for example, a school/organization-operated server and database). That is still infrastructure to operate and secure, not something GitHub Pages supplies.

## Safety and release rule

- Do not use real student data in the static demo.
- Do not publish database credentials, auth secrets, or student personal data in Git.
- Do not claim QR verification, attendance, or sign-in works in static mode.
- Keep PR/release reviewable and require documented security, privacy, restore, and operator-approval evidence before operational use.
