# Card Type Registry v1

The registry at `src/lib/card-types/registry.ts` is the shared catalog for Digital Card OS. It is metadata for product design, not an authorization engine.

## Initial types

- Student ID (first vertical; preserves Student ID OS)
- Project Identity
- Digital Name Card
- Event Participant
- Organization Membership
- Achievement / Certificate
- Hajj / Umrah Service Card (prototype only; issuance disabled)

## Rules

1. Card-type configuration cannot grant issuing privileges. Server-side authorization is required for every issue, update, revoke, and verify action.
2. Public views must use an allowlist. Fields marked `privateByDefault` are excluded from public payloads and QR data.
3. QR codes should contain an opaque, revocable reference—not a complete profile or sensitive personal information.
4. Issuance must remain disabled until the production backend, tenant authorization, security review, and issuer authorization gates are verified.
5. A Hajj/Umrah service card is not an official travel document and must not replace official identity or travel documents. Keep this type prototype-only until the relevant issuer authorizes it and legal/privacy/security reviews pass.
6. The static GitHub Pages preview is for synthetic data and design review only. It must never issue production credentials.

## Adding a type

- Add a stable ID and minimal purpose-specific fields.
- Keep contact, membership identifiers, and service references private by default unless a documented use case proves otherwise.
- Add tests for default capabilities, public-field allowlists, and issuance gates.
- Define retention, revocation, issuer roles, audit events, and verifier behavior before activating a new module.
