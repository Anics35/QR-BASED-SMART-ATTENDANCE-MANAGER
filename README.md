Here is a complete, step-by-step `README.md` style documentation to initialize and run the entire QR-Based Smart Attendance Manager project on Windows, Mac, or Linux.

-----

# 📱 QR-Based Smart Attendance Manager - Complete Setup Guide

This guide covers how to set up and run all three components of the project:

1.  **Backend** (Node.js/Express/MongoDB)
2.  **Web Dashboard** (React/Vite for Teachers)
3.  **Mobile App** (React Native/Expo for Students)

-----

## 🛠 Prerequisites

Before starting, ensure you have the following installed on your machine:

1.  **Node.js & npm**: (LTS version recommended) - [Download](https://nodejs.org/)
2.  **MongoDB**:
      * **Local**: Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and ensure it is running.
      * **Cloud**: Alternatively, get a connection string from MongoDB Atlas.
3.  **Git**: [Download](https://git-scm.com/)
4.  **Mobile Development Tools**:
      * **Expo Go App**: Install on your physical Android or iOS device from the Play Store/App Store.
      * *(Optional)* **Android Studio**: For running on an Android Emulator.
      * *(Optional, Mac only)* **Xcode**: For running on an iOS Simulator.

-----

## 🚀 Phase 1: Backend Setup

The backend controls the database, authentication, and API logic.

### 1\. Navigate to the folder

Open your terminal/command prompt:

```bash
cd QrBasedAttendenceManager-Backend
```

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Configure Environment Variables

Create a new file named `.env` in this folder. You can copy the structure from `.env.demo`.
**File: `.env`**

```env
# Google OAuth Credentials (Required for Google Login)
# Create these in Google Cloud Console (Web Application)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Security
JWT_SECRET=your_super_secret_random_string
JWT_TIMEOUT=7d

# Database
# Use 127.0.0.1 instead of localhost to avoid connection issues on some systems
DB_URL=mongodb://127.0.0.1:27017/qr-attendance-db

# Port
PORT=8080
```

> **Note:** If you don't have Google Credentials yet, the backend will still run, but Google Login will fail. You can use the `/dev-login` feature provided in the code for testing.

### 4\. Start the Server

```bash
npm start
```

  * **Success Message:** You should see `Server is running on 8080` and `DB connection established ✅`.
  * **Troubleshooting:** If you see `EADDRINUSE`, something is already running on port 8080. Kill that process or change the port in `.env`.

-----

## 💻 Phase 2: Teacher Dashboard (Web)

This is the web portal for teachers to create sessions and view reports.

### 1\. Navigate to the folder

Open a **new** terminal window (keep the backend running):

```bash
cd TeacherDashboard
```

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Configure API URL

Open `src/api.js`. Ensure the URL points to your backend.

```javascript
// src/api.js
const API_URL = 'http://localhost:8080'; // This is correct for the web dashboard
```

### 4\. Run the Web App

```bash
npm run dev
```

  * The terminal will show a local URL (usually `http://localhost:5173`). Open this in your browser.

-----

## 📱 Phase 3: Mobile App (Student)

This is the React Native app for students. **This requires a critical configuration step.**

### 1\. Navigate to the folder

Open a **new** terminal window:

```bash
cd SmartAttendanceApp
```

### 2\. Install Dependencies

```bash
npm install
```

### 3\. ⚠️ CRITICAL: Configure Local IP Address

Your phone/emulator cannot understand `localhost`. You **MUST** replace it with your computer's local IP address.

1.  **Find your IP:**
      * **Windows**: Run `ipconfig` in terminal. Look for `IPv4 Address` (e.g., `192.168.1.5`).
      * **Mac/Linux**: Run `ifconfig` or `ipconfig getifaddr en0`.
2.  **Update Code**: Open `src/services/api.js`.

<!-- end list -->

```javascript
// src/services/api.js

// REPLACE THIS IP with your computer's actual IP address found above
const API_URL = 'http://192.168.1.X:8080'; 
```

  * *Make sure your phone and computer are on the same Wi-Fi network.*

### 4\. Start Expo

```bash
npx expo start
```

You will see a QR code in the terminal.

### 5\. Run on Device/Simulator

#### **Option A: Physical Device (Recommended)**

1.  Open the **Expo Go** app on your phone.
2.  **Android**: Scan the QR code from the terminal using the Expo Go app.
3.  **iOS**: Open the standard Camera app, scan the QR code, and tap the notification to open in Expo Go.

#### **Option B: Emulators**

  * **Android**: Press `a` in the terminal (Requires Android Studio running).
  * **iOS (Mac only)**: Press `i` in the terminal (Requires Xcode).

-----

## 📋 Usage Workflow

Now that everything is running, follow this sequence to test the app:

1.  **Backend**: Ensure it's running on port 8080.
2.  **Web Dashboard (Teacher)**:
      * Go to `http://localhost:5173`.
      * Register a **Teacher** account (check "Register as Administrator" or just "Teacher").
      * Go to "My Courses" -\> "Create New Course".
      * Click "Start Class" on the course. A QR code will appear on screen.
3.  **Mobile App (Student)**:
      * Open the app on your phone.
      * **Register** a new Student account. **Note:** This binds your specific phone to this account.
      * On the Home Screen, verify the IP connection works (if you see a network error, check Step 3 in Phase 3).
      * Go to "Scan QR" and scan the QR code displayed on the **Web Dashboard**.
4.  **Result**:
      * Mobile App: Should say "Attendance Marked".
      * Web Dashboard: The student's name should instantly appear in the "Live Attendees" list.

-----

## 🔧 Platform Specific Troubleshooting

### Windows Users

  * **PowerShell Security**: If you get errors running scripts, try running PowerShell as Administrator or use Command Prompt (cmd).
  * **Firewall**: If the mobile app cannot connect to the backend, ensure your Windows Firewall allows Node.js to accept connections on port 8080.

### Mac Users

  * **Port Issues**: MacOS AirPlay Receiver sometimes hogs port 5000 or 8080. Go to *System Settings -\> General -\> AirDrop & Handoff* and turn off "AirPlay Receiver" if you have port conflicts.

### Common Errors

1.  **"Network Error" on Mobile**:
      * Did you update `src/services/api.js` with your IP?
      * Are phone and laptop on the same Wi-Fi?
      * Is the backend server running?
2.  **"Device mismatch"**:
      * The system binds a user to the first device they use. If you reinstall the app or use a simulator, the device ID might change. Use the Teacher Dashboard -\> Student Detail -\> "Unbind Device" to reset this.
3.  **"Invalid Client" (Google Auth)**:
      * This means your `GOOGLE_CLIENT_ID` in `.env` is either missing or doesn't match the one configured in Google Cloud Console. You can use the Manual Registration form for testing if you don't want to set up Google Cloud.
