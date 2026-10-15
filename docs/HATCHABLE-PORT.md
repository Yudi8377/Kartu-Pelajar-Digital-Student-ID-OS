# Hatchable compatibility plan

## Decision
Keep the current Next.js + TypeScript application as the source of truth. Hatchable is not a drop-in host for this repository: the current application uses Next.js, React, TSX, server route handlers, and Neon Postgres. The Hatchable-compatible approach is a separate, framework-free prototype/port, not importing this whole repository and expecting it to run unchanged.

## Safe implementation sequence
1. Maintain the main app and existing Neon schema; do not migrate production records.
2. Prototype the card designer using plain HTML, CSS, and browser JavaScript with synthetic data only.
3. Validate the visual workflow and product assumptions before choosing a backend.
4. Decide whether Hatchable's built-in database/auth can satisfy the multi-tenant authorization, export, privacy, audit, and cost requirements. Do not assume it can connect to the existing Neon project.
5. Do not place government identifiers, biometric identifiers, or real student records in a Hatchable prototype until the platform's current terms, security controls, and legal/privacy fit have been independently confirmed. Never use a free-tier project as production infrastructure for paying customers if its terms prohibit that.
6. If the port is accepted, maintain explicit migration/export tests and keep the current Next.js/Neon path available until the replacement passes the same release gates.

## Import limitation
The `hatchable-port/` directory is a framework-free prototype package, but no Hatchable account/connector is connected in this workspace. It has not been imported, published, or deployed. Upload/import only the files inside that directory if testing manually; do not import the repository root as a Hatchable app.
