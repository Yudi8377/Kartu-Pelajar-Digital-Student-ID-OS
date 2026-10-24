# Identity Verification OS — Integration Design

**Status: design contract only; no Regula SDK is integrated or licensed in this repository.**

## Product boundary

Identity Verification OS is an optional module of Digital Card OS. It reads and evaluates documents for a declared purpose; it does not itself grant government authority, prove civil-registry status, or guarantee that the person presenting a document is its rightful holder. An OCR result is not an authenticity result. A document authenticity result is not a live registry result. A face match is not a legal identity assertion.

## Intended document categories

Subject to the selected provider's exact supported-document list and licence: passports and e-passports; national identity and citizenship cards; driver licences; visas, residence permits, work permits and immigration documents; age, voter, health-insurance, professional, crew, marine, refugee, and other supported documents; and school/student identity documents where a trusted issuer or suitable verification method exists.

Never promise a specific document type or country until the selected SDK version's supported list is checked.

## Verification stages

1. Capture: camera capture or file selection with user notice and consent; avoid retaining the original image unless the use case requires it.
2. Read: OCR, MRZ, barcode, and document classification supported by the selected SDK.
3. Consistency: check supported internal consistency rules, format, expiry, and cross-field agreement.
4. Authenticity: run only authenticity checks explicitly provided by the licensed SDK/device combination. Record which checks ran and which were unavailable.
5. Optional chip reading: NFC/electronic-chip checks only when the device, document, SDK, and permissions support them.
6. Optional holder binding: liveness/face comparison is a separate, high-impact capability requiring separate consent, security and legal review; do not silently enable it.
7. Decision: show read_only, checks_passed, manual_review, failed, or unavailable. Never collapse these into a generic verified status.
8. Issuer workflow: authorized operator reviews the outcome and independently decides whether to issue a Digital Card OS credential.
9. Audit: store the decision, provider/version, checks actually run, timestamp, issuer, and minimal non-sensitive reason codes. Do not log raw document images, full document numbers, MRZ text, raw QR tokens, or biometric templates.

## Provider adapter contract

Keep the UI and issuer workflow vendor-neutral. The provider adapter should expose capability discovery and provider/version metadata; accept a document image only in an explicitly consented flow; return normalized fields with per-field confidence and source; return each authenticity/chip check as passed, failed, not_supported, or not_run; never claim checks were performed when the SDK or hardware did not perform them; support cancellation and deterministic cleanup of temporary files; provide bounded processing time and safe, non-sensitive errors; and allow a non-Regula provider or local manual-review flow without changing card lifecycle APIs.

A mock adapter may be used in tests only and must be visibly marked as synthetic. Production configuration must fail closed when no licensed provider is configured.

## Deployment targets

- Android/iOS: integrate the vendor's native SDK through a maintained native bridge. Verify platform support, min OS versions, device permissions, offline behavior, and NFC capabilities.
- Web: use only the vendor's supported browser SDK/components and capabilities; do not imply web NFC/e-passport support where unavailable.
- Server: use a supported server SDK/service only after reviewing data flows, residency, secrets, network egress, retention, and vendor terms.

The current Android wrapper is a WebView shell and is not, by itself, an integration of a native document reader SDK.

## Privacy and security requirements

- Provide a clear purpose and explicit consent before capture.
- Process only the minimum fields needed for the selected card purpose.
- Prefer on-device processing when the licensed SDK and product requirements permit it.
- Encrypt any temporary image or extracted data; delete temporary material promptly after the decision.
- Restrict results to authorized issuer staff; apply tenant checks server-side on every request.
- Separate identity-document data from public card claims and QR verification payloads.
- Never put document numbers, dates of birth, MRZ, or photos in QR codes or public verification responses.
- Define retention/deletion/export and incident procedures before real data is accepted.
- Conduct Indonesian personal-data and child-data legal review before school deployment.
- Use synthetic test fixtures or authorized test documents only; never commit real identity scans to Git.

## Acceptance tests before enabling production

- Supported and unsupported documents are classified correctly.
- Invalid, expired, damaged, low-confidence, and unreadable samples produce safe, distinct outcomes.
- OCR-only success never becomes authenticity success.
- Unavailable NFC/chip checks are marked not_supported or not_run, not passed.
- Provider outage, timeout, cancellation, and malformed output fail safely.
- Tenant A cannot view tenant B's scan/result.
- Audit logs exclude raw identity content and secrets.
- Original images and temporary artifacts are removed according to policy.
- Android/iOS/browser builds and target-device tests prove actual capabilities.
- Licensed provider and SDK version are recorded in the release manifest.

## Commercial gate

Do not enable the module for real users until the selected provider contract/licence is approved, SDK binaries and credentials are available through secure build configuration, integration tests pass, privacy/legal review is recorded, and the release owner approves the evidence. Regula pricing and exact capabilities must be confirmed directly from the vendor; this repository does not include a licence.
