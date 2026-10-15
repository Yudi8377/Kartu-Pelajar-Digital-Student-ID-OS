# Modern Business UX/UI migration

## What changed

The public landing page at `site/index.html` now uses the Start Bootstrap Modern Business structure and utility classes:
- responsive Bootstrap navbar and hero section;
- responsive module/feature cards;
- section-based product navigation;
- card studio form and preview panels;
- responsive security and workflow sections;
- footer with product status and source attribution.

## Card Studio behavior

The Card Studio is client-side-only. It allows selecting a card type, field allowlist, capabilities, and a fictional issuer, then creates a JSON preview in the browser. It does not call an API, store data, issue a credential, or generate an operational QR.

## Assets and licensing

- `site/css/cardos.css` contains product-specific styles.
- `site/js/card-studio.js` contains the local preview behavior.
- `THIRD-PARTY-NOTICES.md` records the Start Bootstrap Modern Business MIT license and CDN dependencies.

The page references the Modern Business theme stylesheet and Bootstrap dependencies via jsDelivr for this iteration. A future offline/self-contained build should vendor and pin these assets into the repository and add license files.

## Release status

The site is a static design preview. Production identity workflows require a secure backend, authentication, tenant isolation, issuer permissions, audit logs, revocation, and security/privacy review.
