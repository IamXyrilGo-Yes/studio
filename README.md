
# PisoMate Android App

This project is a Next.js application converted into a mobile Android app using Capacitor.

## Prerequisites

1.  **Node.js**: Ensure Node.js is installed.
2.  **Android Studio**: Required to compile and build the APK.
3.  **Android SDK**: Ensure you have the latest SDK installed via Android Studio.

## Building the APK

Follow these steps to generate the Android APK:

1.  **Install dependencies**:
    The system will automatically install the new Capacitor dependencies.

2.  **Initialize Android Platform** (Run this once in your terminal):
    ```bash
    npx cap add android
    ```

3.  **Build and Export the App**:
    Generate the static web files for Capacitor:
    ```bash
    npm run android:build
    ```
    This command will:
    - Build the Next.js app (`next build`).
    - Generate the static export (`out` folder).
    - Copy the files to the Android project (`npx cap copy`).
    - Open the project in Android Studio.

4.  **In Android Studio**:
    - Wait for Gradle to sync.
    - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
    - Android Studio will generate the `.apk` file.
    - A notification will appear; click **Locate** to find your `app-debug.apk`.

## Offline Storage

The app uses `localStorage` via `src/lib/db.ts`, which Capacitor persists automatically on the device.

## Responsive Design

The UI has been optimized for full-width mobile screens and includes support for safe areas (status bars and navigation notches).
