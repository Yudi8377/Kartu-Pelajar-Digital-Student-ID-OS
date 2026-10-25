# Digital Card OS — Custom Card Designer & Android Innovation Roadmap

## Product direction

The Custom Card Designer is a standalone workspace. It is not a screen inside Card Studio. It creates reusable, structured template assets that can be published to both Card Studio and the Card Type Catalog.

### Core product surfaces

1. **Custom Card Designer** — create, edit, preview, validate, save drafts, duplicate, version, and submit designs.
2. **Template Asset Library** — manage structured templates, ownership, categories, version history, permissions, and publication state.
3. **Card Studio** — select a published template and populate it with a person's or organization's data.
4. **Card Type Catalog** — browse and discover published card types, with access and license restrictions applied.

## Custom Card Designer requirements

- Responsive editor for desktop and mobile.
- Card orientation and dimensions: portrait, landscape, and configurable custom dimensions.
- Editable layers/elements: text, image/photo placeholder, logo, shapes, background, signature placeholder, QR code, barcode, and data-bound fields.
- Basic layer operations: add, select, move, resize, align, reorder, duplicate, lock, and delete.
- Properties panel for typography, colors, spacing, borders, and positioning.
- Preview with sample data and validation for missing required fields or out-of-bounds elements.
- Save drafts and resume editing; duplicate templates without modifying the original.
- Store the design as structured JSON plus asset references, not as a flattened screenshot alone.
- Export preview images for thumbnails; keep the structured source as the canonical template.
- Publication states: draft, review, published, archived. Drafts must not appear in public catalogs.
- Ownership and permissions: private to creator by default; sharing and publication require explicit action.
- Versioning: edits to a published template create a new version; already-issued cards must not silently change without a controlled migration.

## Shared template data contract

A template should include:
- Stable template ID, owner/tenant ID, name, category, description, version, status, and timestamps.
- Card dimensions and orientation.
- Element definitions with stable IDs, type, position, size, z-order, style, and data binding.
- Validation rules for required fields and allowed values.
- Asset references for logos, backgrounds, and images.
- QR/barcode configuration that references a verification URL or opaque signed token; never encode passwords, secret keys, or unnecessary personal data.
- Permissions, license terms, and publication scope.

Both Card Studio and the Catalog must consume the same published template record rather than maintaining independent copies.

## Android innovation roadmap

### Phase 1 — practical, low-cost foundation
- Offline-first wallet for cards saved on the device, with a visible last-sync and last-verification timestamp.
- Camera QR/barcode scanner with explicit confirmation before saving scanned data.
- Android share sheet for sharing a card link or a deliberately limited card view.
- Secure screen lock using Android BiometricPrompt/device credential where supported.
- Dynamic, signed QR verification with expiry and server-side revocation checks when online.
- Accessibility, large-text support, and resilient handling of denied permissions.
- Print/export support for authorized cards and templates.

### Phase 2 — device capabilities
- NFC read/write or tap-to-share only on compatible devices and only after choosing a secure, documented protocol. NFC capability alone is not proof of identity.
- Camera-assisted document capture with on-device cropping and optional OCR; require user review before accepting extracted fields and avoid retaining raw images by default.
- Optional location-based check-in for an explicitly configured venue; use foreground location only where possible and disclose precision and retention.
- User-initiated SOS / trip sharing with a clear active indicator, recipient selection, limited duration, and one-tap stop.
- Optional Android app shortcuts and widgets for quick access to a selected card without exposing sensitive fields.

### Phase 3 — institutional and commercial features
- Attendance check-in using short-lived QR tokens, server validation, replay protection, and an auditable event log.
- Issuer verification portal with public verification that reveals only the minimum necessary information.
- Template marketplace/catalog with creator attribution, licensing, tenant boundaries, review, and moderation.
- Organization-level template branding, delegated roles, usage analytics that avoid unnecessary personal tracking, and controlled template version rollout.

## Security and privacy guardrails

- Request Android permissions only when the user invokes the related feature.
- Never continuously track location by default. Location sharing must be opt-in, visible, time-limited, and easy to stop.
- Do not upload fingerprint or face biometric data. Use platform authentication APIs.
- Do not treat screenshots, static QR codes, NFC presence, GPS, or device binding alone as proof of identity.
- Sign verification payloads server-side; do not put signing secrets in the app.
- Apply tenant isolation and role-based access to template assets and cardholder records.
- Minimize stored personal data, provide deletion/export workflows where applicable, and record sensitive administrative changes in an audit log.
- Provide offline status honestly: a cached card can be displayed offline, but current revocation and issuer status cannot be guaranteed without a fresh check.

## Acceptance criteria

1. A user can create a card design without entering Card Studio.
2. The design can be saved as a structured draft, reopened, and edited.
3. A published template becomes selectable in Card Studio and discoverable in the Catalog according to its access policy.
4. Draft and private templates are not exposed publicly.
5. QR/barcode elements bind to safe verification payloads and are not treated as trusted solely because they can be scanned.
6. Android features degrade gracefully when hardware, permission, or network access is unavailable.
7. Location, camera, and NFC features are not active before a clear user action and the required permission.
8. Offline cards display their freshness/verification limitation.
9. Automated checks cover template schema validation, tenant/role permissions, publication transitions, and QR expiry/replay handling.

## Implementation note

Implement incrementally against the existing application architecture. Inspect current routes, components, persistence layer, Android packaging, and CI workflows before replacing or moving existing features. Keep existing Card Studio functionality intact while introducing the standalone designer and shared template asset model.
