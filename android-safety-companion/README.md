# Digital Card Wallet (Android)

Native Android full-screen shell for the Digital Card OS Wallet at `https://digital-card-os.hatchable.site/wallet/`.

## Current behavior

- Opens the Wallet directly with no native header or sensor-control panel, so the card-first mobile UI can use the available screen.
- Requests camera permission only when the Wallet explicitly opens its camera-based feature.
- Uses a restricted WebView: JavaScript and local web storage are enabled for the Wallet; local file access is disabled.
- The Wallet's card, sign-in, synchronization, OCR engine download, and map functions still need internet. This APK is an installable Android app, **not a complete offline copy of the Wallet**.
- Camera and location remain user-initiated. The app does not make automatic emergency calls or send automatic SOS messages.

## Build

The GitHub Actions workflow `.github/workflows/android-safety-companion.yml` builds the debug APK. Download the artifact named `digital-card-wallet-debug-apk` from a successful workflow run. This is an unsigned debug build for controlled testing, not a Play Store release.

Local build (JDK 17 + Gradle 8.9):
```bash
gradle --no-daemon -p android-safety-companion assembleDebug
```

## Test checklist

1. Install on an Android device and confirm the Wallet fills the screen.
2. Confirm the card is the main view and the hamburger menu contains Scan e-KTP/Documents, QR/Attendance, Save Contact, Share Card, Safety Center, Maps, and emergency contacts.
3. Grant camera/location permissions only when choosing those features.
4. Confirm the card view remains usable without signing in and clearly labels sample cards as previews.
5. Verify online-dependent features show an understandable message when the network is unavailable.
