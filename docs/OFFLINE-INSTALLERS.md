# Digital Card OS installers

## Android
The Android safety companion has a GitHub Actions workflow at `.github/workflows/android-safety-companion.yml`. On a successful run, download the `digital-card-safety-debug-apk` artifact from the workflow run. This is a debug APK for controlled testing, not a signed production release.

## Windows
The Windows desktop shell is built by `.github/workflows/windows-installer.yml`. On a successful run, download the `digital-card-os-windows-installer` artifact from the workflow run. GitHub Actions artifacts are temporary (14-day retention), not a permanent public release.

## Offline boundary
The Windows installer includes a local offline/error page, but the Wallet itself currently loads from the hosted service. Login, issuer data, QR verification, OCR library download, maps, and synchronization are not guaranteed offline. This is an online-first desktop shell with offline fallback, **not a complete offline identity system**. Do not present a stale card state as verified. A fully offline build requires packaging the actual static UI and dependencies locally and separately designing safe local storage/sync.

## Release checklist
- Test installer on a clean Windows device.
- Confirm network failure shows the offline page and reconnect button works.
- Verify all external links open outside the app.
- Do not enter real student or government ID data in test builds.
- Before public distribution, create a signed production Android build and a signed Windows release, publish versioned release notes, and test on real devices.
