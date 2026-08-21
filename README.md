# LSTS Family Day Live Score

Production-ready React + Firebase application for the Lawrence S. Ting School Family Day sports event on 21 August 2026.

## Architecture

```text
Microsoft Entra ID → Firebase Authentication → users/{lowercase email} allowlist
                                                   ↓
React client ← Firestore realtime listeners ← matches (source of truth)
      ↓                    ↓
derived Family totals   transaction + version check → immutable auditLogs
      ↓
derived House totals and tied rankings
```

House and Family totals are deliberately derived from completed match documents. The current `pointsFor()` policy in `src/scoring.ts` uses raw match points because the official rules do not define a win-points conversion.

## Structure

- `src/App.tsx` — routes and all public, teacher, and admin screens
- `src/firebase.ts` — Microsoft authentication, realtime listeners, atomic score saves
- `src/data.ts` — exact 32-match schedule and Family/House configuration
- `src/scoring.ts` — isolated aggregation and competition-ranking logic
- `firestore.rules` — database-enforced public/teacher/admin permissions
- `scripts/seed.mjs` — idempotent seed for event configuration and initial admin

## Firebase setup

1. Create a Firebase project and enable Cloud Firestore.
2. In Firebase Authentication, enable the Microsoft provider. Register the Firebase callback URL shown in the console as a redirect URI in the Microsoft Entra app registration, then paste its client ID and secret into Firebase.
3. Copy `.env.example` to `.env` and fill in the Firebase web configuration. Set `VITE_MICROSOFT_TENANT` to the school's Entra tenant ID to restrict sign-in attempts to the organization, or leave `common` during setup.
4. Create/download a service-account key outside source control and seed the data:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\secure\service-account.json'
$env:INITIAL_ADMIN_EMAIL='admin@school.edu.vn'
npm run seed
```

The initial admin email is stored as the Firestore document ID in lowercase. Authentication alone never grants access: every protected action also checks that allowlist record, its role, and `active` status.

## Local development and deployment

```powershell
npm install
npm run test
npm run dev
firebase login
firebase use --add
npm run deploy
```

For Vercel, import the repository, add every `VITE_FIREBASE_*` environment variable, use build command `npm run build`, and output directory `dist`. Deploy Firestore rules separately with `firebase deploy --only firestore`.

## Data model

| Collection | Key | Purpose |
|---|---|---|
| `users` | lowercase email | role, active status, display name, created timestamp |
| `houses` | `F/E/A/T` | reference configuration |
| `families` | `F-01` etc. | House membership |
| `sports` | sport code | reference configuration |
| `matches` | deterministic schedule ID | competitors, time, scores, status, version, editor |
| `auditLogs` | generated ID | immutable before/after score change and actor |
| `settings` | `event` | event metadata and configured scoring method |

Each score save is a Firestore transaction. It succeeds only if the match `version` still equals the version loaded by the teacher; otherwise it reports a conflict and prevents silent overwriting. The same transaction updates the match and creates its audit record.

## Acceptance checklist

- Separate matches can be saved concurrently without collision.
- Same-match edits are guarded by an optimistic version check.
- Public access is read-only; score writes require an active allowlisted account.
- Teachers can change only score/status/audit fields; admins manage users/configuration.
- Deactivating a user blocks their next protected database request even if their Microsoft session remains open.
- Completed score corrections immediately change derived Family and House totals on every connected client.
- Equal totals use competition ranking (`1, 1, 1, 1` or `1, 2, 2, 4`) and display “ĐỒNG HẠNG”.
- Firebase persists results across refreshes and synchronizes phone, laptop, and projector views.

For formal pre-event testing, use two teacher accounts and one admin in separate browsers/devices, then execute Tests 1–10 from the project brief against the Firebase project or Firestore Emulator.
