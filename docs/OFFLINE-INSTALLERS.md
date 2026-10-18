# Digital Card OS installers

## Current web release
The hosted application is live at https://digital-card-os.hatchable.site (release v55).

- Windows Admin Control Center opens `/app/?view=overview`.
- Android Digital Card Wallet opens `/wallet/`.
- The hosted Wallet now displays linked personal cards only after both phone and identity statuses are verified, includes an embedded Google Maps view, and provides a camera action for Smart Identity Scanner.
- The Admin Control Center includes Master User, platform administrator assignment, customer license controls, and browser-based physical-card printing for CR80 or A4 media.
- KTP images selected in the admin panel are only previewed in the browser; they are not uploaded or stored. SMS/WhatsApp OTP delivery is not configured, so administrators must not mark a phone verified unless independent verification actually happened.

## Android — Digital Card Wallet
The Android workflow `.github/workflows/android-safety-companion.yml` builds the Wallet APK. On a successful run, download the `digital-card-wallet-debug-apk` artifact from the workflow run. This is an unsigned debug APK for controlled testing, not a signed production release.

## Windows — Admin Control Center
The Windows workflow `.github/workflows/windows-installer.yml` builds the Admin Control Center installer. On a successful run, download the `digital-card-os-windows-installer` artifact from the workflow run. The desktop shell opens `/app/?view=overview`, not the Wallet. GitHub Actions artifacts are temporary (14-day retention), not a permanent public release.

## Offline boundary
Both packages are installable shells, but they are not complete offline applications. The Android Wallet loads the hosted Wallet UI; the Windows Admin Control Center loads the hosted admin UI. Login, organization data, synchronization, official verification, Google Maps, and some external libraries require internet. The Windows package includes a local offline/error page. Do not present stale data as verified. A complete offline version requires bundling the UI and its dependencies locally and designing secure local storage/synchronization separately.

## Release checklist
- Test the Windows installer on a clean Windows device and confirm network failure shows the offline page.
- Test the Android APK on real devices and confirm the card-first screen, hamburger menu, camera permission prompt, and Google Maps view.
- Do not enter real student or government ID data in test builds.
- Before public distribution, create signed production builds for Android and Windows, publish versioned release notes, and test update/recovery flows.
