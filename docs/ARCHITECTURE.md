# Architecture foundation

## Runtime boundaries
- PWA client renders the card and requests server APIs.
- A server-only backend authenticates the caller, resolves active school membership, and enforces tenant scope on every read/write.
- Neon PostgreSQL is private application storage. The browser must never connect directly to Neon.
- GitHub Actions runs quality checks and non-destructive health checks.

## Multi-tenancy
Every school-owned record carries a school identifier. Queries must scope by the caller's authorized school membership. Never trust a client-supplied school ID as authorization. Add database constraints and, where practical, row-level safeguards as defense in depth.

## QR verification
Generate a cryptographically random opaque token on the server. Store only a cryptographic hash. QR payload contains only the opaque token or a URL carrying it, never a student name, student number, class, birth date, or other personal data. Verification checks card status, expiry, and revocation, and returns the minimum necessary confirmation. Rate-limit verification and avoid logging tokens.

## Privacy and security
- Use synthetic data in development until privacy review and access controls are approved.
- Keep DATABASE_URL server-side; never use NEXT_PUBLIC_DATABASE_URL.
- Restrict logs and audit metadata; do not put secrets or student PII in prompts.
- Require human approval for production migration, bulk export, and release.
- Establish retention, correction, access, incident-response, and deletion procedures before real student records are onboarded.

## Current limitations
This is an initial schema and repository foundation. Authentication, authorization middleware, QR API, real DB integration, and production controls remain to be implemented and tested.
