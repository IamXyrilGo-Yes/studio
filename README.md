
# Xy Loan - Android Deployment Report

**Xy Loan** is a private loan and payment tracker designed for local-only, offline-first use. This project has been converted into a self-contained Android application using Capacitor.

## Final Android Application Report

- **Framework**: Next.js 15 (Static Export)
- **Mobile Engine**: Capacitor 7.0
- **App Identity**: `com.xyloan.app`
- **Branding**: Xy Loan - Private Loan & Payment Tracker
- **Developer**: Xyril Garret Go
- **Offline Mode**: 100% Functional (Wi-Fi/Data Off compatible)
- **Data Storage**: `localStorage` (Persistent within Android WebView)
- **Back Navigation**: Hardware back button integration handled via `@capacitor/app`.

## 1. Prerequisites
- **Node.js**: Installed on your development machine.
- **Android Studio**: Required to compile and build the APK.
- **Android SDK**: Latest SDK installed via Android Studio.

## 2. Building the APK
To generate the static assets and prepare the Android project, follow these steps:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build and Export the Web App**:
   Generate the static `out` directory:
   ```bash
   npm run export
   ```

3. **Sync with Android**:
   Copy the static files to the Android project:
   ```bash
   npx cap copy
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

5. **In Android Studio**:
   - Wait for Gradle to finish syncing.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once finished, click **Locate** on the notification to find your `app-debug.apk`.

## 3. Important Notes
- **Self-Contained**: The APK bundles all HTML, CSS, and JS assets. It does NOT require a server, Node.js, or internet to run.
- **Single Source of Truth**: All financial calculations are derived dynamically from transaction history.
- **Local Data**: Data survives app restarts and reboots as it is stored in persistent device-local storage.
- **Back Button**: The Android hardware back button will close open views or details before exiting the app.

---
Developed by Xyril Garret Go
