## QrBasedAttendenceManager - Backend

This is the backend for the QrBasedAttendenceManager project. It provides a small Express API used by the frontend to perform Google OAuth sign-in and manage authenticated users.

This README explains how to configure, run and debug the backend locally.

## Table of contents
- Requirements
- Quick start
- Environment variables (demo)
- Running the server
- Endpoints
- Debugging & common issues

## Requirements
- Node.js (v18+ recommended)
- npm
- MongoDB (optional for local dev; the server can start without DB_URL but user creation/persistence will not work)

## Quick start

1. Copy the demo env file to `.env` in the `backend/` folder and edit values:

   cp .env.demo .env

2. Install dependencies and start the backend:

   npm install
   npm run start

3. Start the frontend (see frontend/ README) and use the Google sign in flow.

## Environment variables (demo)

Create `backend/.env` by copying `backend/.env.demo`. Example contents:

```
# Google OAuth credentials (Web application client created in Google Cloud Console)
GOOGLE_CLIENT_ID=924470151805-d3g0lu6lbtciednojk7jnfgbsjgpqb1p.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=CHANGE_ME_TO_YOUR_CLIENT_SECRET

# JWT settings
JWT_SECRET=change_this_to_a_long_random_secret
JWT_TIMEOUT=7d

# MongoDB connection string (optional)
DB_URL=mongodb://localhost:27017/qr-attendance-db

# Server port (optional)
PORT=8080
```

Notes:
- `GOOGLE_CLIENT_ID` used by the frontend must match this value exactly. If they differ, Google will reject the token exchange with `invalid_client`.
- `GOOGLE_CLIENT_SECRET` is required on the backend for exchanging codes for tokens.
- For the auth flow used by the frontend (`flow: "auth-code"` with `postmessage` redirect), use a **Web application** client in Google Cloud Console. Add your dev origin (e.g. `http://localhost:5173`) to Authorized JavaScript origins if needed.

## Running the server

From the `backend/` directory:

```
npm install
npm run start   # starts nodemon which runs index.js
```

If the server prints `Warning: Missing environment variables: ...` ensure you filled `.env` correctly.

## Endpoints

- GET /auth/google?code=<AUTH_CODE>
  - Exchanges a Google auth code for tokens, fetches userinfo, creates/returns a user and a JWT.

- GET /auth/debug
  - Dev helper: returns masked presence-checks for required environment variables (does not expose secrets).

## Debugging & common issues

- Error: `invalid_client` (from Google, returned during token exchange)
  - Cause: the backend `GOOGLE_CLIENT_ID` and/or `GOOGLE_CLIENT_SECRET` do not match the OAuth client used on the frontend, or the client type is not Web application.
  - Fix: Use the same Web OAuth client ID in `frontend/.env.local (VITE_GOOGLE_CLIENT_ID)` and backend `.env` (GOOGLE_CLIENT_ID). Use the secret from the same client for `GOOGLE_CLIENT_SECRET` on the backend.

- Error: `EADDRINUSE: address already in use :::8080`
  - Cause: another process is already listening on the configured port.
  - Fix: stop the other process or change `PORT` in `.env` and update `frontend/.env.local`'s `VITE_API_URL` if needed. On macOS you can find the process with `lsof -nP -iTCP:8080 -sTCP:LISTEN` and `kill -9 <PID>`.

- Cross-Origin-Opener-Policy warnings in dev when using the Google popup
  - These are dev-only warnings about popup isolation. The frontend dev server is configured to send `Cross-Origin-Opener-Policy: same-origin-allow-popups` to reduce noise. Restart the frontend dev server after any Vite config change.

- JWT signing errors (e.g., `secretOrPrivateKey must have a value`)
  - Cause: `JWT_SECRET` is not set in `.env`.
  - Fix: set a strong string in `.env`.

## Useful commands

- Start backend (from backend/):
  - `npm run start`
- Run a quick env check (if backend running):
  - `curl http://localhost:8080/auth/debug`

## Support
If you still see errors after verifying envs and restarting the servers, paste the exact server-side error printed in the backend console and the `curl /auth/debug` output (it masks secrets) and I will help further.
