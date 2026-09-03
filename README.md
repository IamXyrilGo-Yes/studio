# Xy Loan Management - Developer & Build Guide

**Xy Loan Management** is a private loan and payment tracker designed for local-only use. It uses Next.js for the interface and Capacitor to package it into a standalone Android APK.

## 1. How to use `npm` (On your PC)

You run `npm` commands in your computer's terminal (Command Prompt on Windows, or Terminal on Mac/Linux) while inside the `studio-main` folder.

### Common Commands:
- `npm install`: Downloads the libraries needed to build the app (only needed once).
- `npm run export`: Converts the code into static files for the Android app.
- `npx cap sync`: Tells Capacitor to copy the latest files into the Android project.

---

## 2. Building the Android APK (Standalone)

Follow these steps on your computer to create the installer:

1. **Open your Terminal** and navigate to your project folder.
2. **Generate the Web Assets**:
   ```bash
   npm run export
   ```
   *This creates the `out/` folder containing your local app.*

3. **Sync with Android**:
   ```bash
   npx cap sync android
   ```
   *This moves the `out/` folder into the Android Studio project.*

4. **Open Android Studio**:
   Open the `android/` folder specifically.

5. **Build the APK**:
   - In Android Studio, wait for the sync to finish.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once done, a notification will appear. Click **Locate** to find `app-debug.apk`.

---

## 3. Important Runtime Notes

- **Zero Server Dependency**: The installed APK does **not** need `npm`, `node`, or a server to run. It loads files directly from its own internal memory.
- **Offline First**: Works 100% without internet.
- **Local Storage**: All data (Clients, Loans, Payments) is stored securely on the phone's local storage.
- **Single Source of Truth**: Statistics are calculated dynamically from payment records to ensure 100% accuracy.

---
Developed by Xyril Garret Go
