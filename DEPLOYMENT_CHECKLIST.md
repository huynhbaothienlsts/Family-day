# Family Day deployment checklist

## Cloud configuration

- [ ] Firebase project created
- [ ] Cloud Firestore enabled
- [ ] Firestore Rules deployed
- [ ] Microsoft provider configured in Firebase Authentication
- [ ] Microsoft Entra auth-handler redirect URI configured
- [ ] `USERNAME.github.io` added to Firebase Authorized domains
- [ ] School tenant ID confirmed

## Event data and access

- [ ] Initial Admin email created
- [ ] Teacher accounts added and active
- [ ] 4 Houses, 32 Families and 32 matches seeded
- [ ] Unauthorized and deactivated accounts denied

## GitHub Pages

- [ ] Source pushed to `main`
- [ ] All seven GitHub Actions secrets added
- [ ] Pages source set to GitHub Actions
- [ ] Deployment completed successfully
- [ ] `/#/schedule`, `/#/score-entry`, `/#/admin`, and `/#/live` refresh correctly

## Event readiness

- [ ] Production build passed
- [ ] Microsoft login tested on production URL
- [ ] Score entry and completion tested
- [ ] Same-match conflict tested with two teachers
- [ ] Real-time updates tested on multiple devices
- [ ] Mobile layout tested
- [ ] Projector/fullscreen view tested
- [ ] Offline/error states tested
- [ ] Audit log and Admin reset tested
- [ ] Final scoring method confirmed by organizer
