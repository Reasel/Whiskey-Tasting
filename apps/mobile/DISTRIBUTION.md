# Distributing the mobile app (Android — invite-only)

The app is shipped to a private group via the **Google Play internal testing**
track: an email allowlist (≤100 testers). It is never publicly listed or
searchable. Builds run on **EAS** (Expo's cloud) — no Android SDK or signing
keystore is needed locally or in CI; EAS creates and stores the keystore once.

## Backend URL

`lib/config.ts` defaults to `http://localhost:8010` so local dev keeps hitting
a dev backend. The `preview` and `production` EAS profiles (`eas.json`) set
`EXPO_PUBLIC_SERVER_URL=https://whiskey.mjelde.us`, which Expo inlines at build
time, so every shared APK/AAB points at the real backend. Testers can still
change the server in-app under Settings (the stored value always wins).

## One-time setup

1. **Expo account** — create one at https://expo.dev (free).
   - `cd apps/mobile && npx eas-cli@latest login`
   - `npx eas-cli@latest init` — links the project and writes
     `expo.extra.eas.projectId` into `app.json`. **Commit that change.**
2. **Android keystore (EAS-managed)** —
   - `npx eas-cli@latest build:configure -p android`
   - On first build EAS generates the upload keystore and stores it in your
     account. Back it up: `npx eas-cli@latest credentials` → Android → download.
     **If this key is lost you can never update the app again.**
3. **Google Play Developer account** — register (one-time **$25**) at
   https://play.google.com/console.
   - Create the app (package `com.whiskeytasting.app`).
   - **First upload must be manual:** build once (`npx eas-cli@latest build
     -p android --profile production`), download the `.aab`, and upload it in
     the Play Console under **Testing → Internal testing → Create release**.
     `eas submit` only works after the app exists with one manual upload.
   - In **Internal testing → Testers**, add tester emails (or a Google Group).
     Share the generated opt-in link; testers accept, then install from the
     Play Store with automatic updates.
4. **Service account for automated submits** —
   - In Google Cloud / Play Console, create a service account, grant it the
     Play Console "Release to testing tracks" permission, and download its
     JSON key.
   - This JSON is referenced by `eas.json` as `./google-service-account.json`
     (git-ignored). Locally, drop the file there to run `eas submit`.
5. **GitHub Actions secrets** (repo → Settings → Secrets → Actions):
   - `EXPO_TOKEN` — an Expo access token (expo.dev → Account → Access tokens).
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the full contents of the service-account
     JSON from step 4 (only needed for the auto-submit path).

## Routine releases

**Automated (recommended).** The `Mobile Release` GitHub workflow
(`.github/workflows/mobile-release.yml`):

- **Production + auto-submit to Play internal:** push a tag —
  ```
  git tag mobile-v1.0.1 && git push origin mobile-v1.0.1
  ```
  Builds the AAB on EAS and submits it to the internal testing track.
  versionCode is auto-incremented by EAS (`appVersionSource: remote`).
- **Manual run** (Actions tab → *Mobile Release* → *Run workflow*):
  - `preview` → an internal-distribution **APK** with a shareable EAS link
    (good for a quick one-off without touching Play).
  - `production` + *submit* checkbox → AAB to Play internal.

Bump the user-facing version in `app.json` (`expo.version`) when meaningful;
`versionCode` is managed remotely by EAS and need not be touched.

**Local equivalents** (from `apps/mobile/`, after one-time setup):

```
npx eas-cli@latest build  -p android --profile preview                 # shareable APK link
npx eas-cli@latest build  -p android --profile production --auto-submit # AAB → Play internal
```

## Notes

- EAS free tier is sufficient for this cadence (builds may queue).
- The local NixOS `./gradlew assembleRelease` flow (debug-signed APK) still
  works for ad-hoc sideloading but is unrelated to Play distribution — Play
  builds must come through EAS so they use the managed upload key.
