# Digital Card Safety Companion (Android)

Native Android companion for the Digital Card OS Safety Center.

## What it does

- Opens the Digital Card OS Wallet/Safety Center inside a restricted WebView.
- Provides an explicit start/stop control for a foreground sensor-monitoring service.
- Uses the device's linear-acceleration sensor to detect provisional high-motion events.
- Shows a notification with **Saya aman** and **Butuh bantuan** actions and vibrates when supported.
- Does not automatically call, text, or send a location to anyone.
- The web-based camera fatigue experiment runs only when opened by the user in the Wallet; the video is processed in the browser and is not uploaded by the feature.

## Important limits

This is an experimental aid, not a certified crash detector or medical device. The threshold is provisional and may miss real incidents or trigger false alarms. Device sensor availability, Android battery policies, notification settings, and vendor-specific restrictions affect behavior. The foreground notification must remain visible while monitoring is active. The service is not guaranteed to survive every force-stop, reboot, or manufacturer power-management action.

The first version intentionally does not implement background camera use, continuous location tracking, automatic SMS, or automatic emergency calls. Those require explicit product/privacy design, platform policy review, and testing with real devices and emergency-contact workflows.

## Build

The GitHub Actions workflow `.github/workflows/android-safety-companion.yml` builds a debug APK on push to this folder or by manual workflow dispatch. Download the artifact named `digital-card-safety-debug-apk` from the successful workflow run. It is an unsigned debug build for controlled testing, not a Play Store release.

Local build (JDK 17 + Gradle 8.9):
```bash
gradle --no-daemon -p android-safety-companion assembleDebug
```

## Test checklist

1. Install on a spare Android device and grant notification permission.
2. Open the app and explicitly enable monitoring.
3. Confirm the ongoing notification appears and the stop control disables monitoring.
4. Test notification actions without creating real impact events; do not deliberately drop or strike a phone.
5. Test camera permission and local eye-closure experiment separately under ordinary, safe conditions.
6. Confirm the app never sends an SOS automatically and can stop sensor/camera use.
