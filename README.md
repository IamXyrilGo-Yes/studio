
# CX Loan Tracker

**CX Loan Tracker** is an application for tracking your clients who loaned to you or you lend money to. It helps you manage balances, payment history, and collection statistics effortlessly.

## 1. How to use `npm` (On your PC)

You run `npm` commands in your computer's terminal (Command Prompt) while inside the project folder.

### Step-by-Step Terminal Instructions:

1.  **Open Command Prompt**.
2.  **Navigate to your project folder**:
    ```bash
    cd "C:\Users\LENOVO\OneDrive\Documents\studio-main\studio-main"
    ```
3.  **Install the build tools** (Only needed the first time):
    ```bash
    npm install
    ```
4.  **Generate the Web Assets**:
    ```bash
    npm run export
    ```
    *This creates the `out/` folder containing your local app.*

5.  **Sync with Android**:
    ```bash
    npx cap sync android
    ```
    *This moves the latest files into the Android project.*

---

## 2. Building the Android APK (Standalone)

Follow these steps **after** running the `npm` commands above:

1. **Open Android Studio**.
2. Go to **File > Open** and select the `android/` folder specifically inside your project.
3. Wait for the "Gradle Sync" to finish.
4. **Build the APK**:
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once done, a notification will appear. Click **Locate** to find `app-debug.apk`.

---

## 3. Important Runtime Notes

- **Zero Server Dependency**: The installed APK does **not** need `npm`, `node`, or a server to run. It loads files locally.
- **Data Control**: All data is stored securely on the phone's local storage.
- **Single Source of Truth**: Statistics are calculated dynamically from payment records for 100% accuracy.

---
Developed by Xyril Go
