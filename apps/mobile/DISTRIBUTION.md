# Distributing the mobile app (Android + iOS — invite-only)

The app is shipped to private groups on both platforms: **Google Play internal
testing** (Android) and **Apple TestFlight internal testing** (iOS). Neither
build is publicly listed or searchable; each track holds up to 100 testers.
Builds run on **EAS** (Expo's cloud) — no local Android SDK, signing keystore,
or Xcode is needed; EAS manages credentials for both platforms.

> **NixOS / tooling:** there is no global `eas` command (don't `npm i -g`).
> Always invoke it as `npx eas-cli@latest <args>`. `build:configure` is
> optional — the upload keystore is auto-generated on the first
> `npx eas-cli@latest build -p android` (answer "Yes" to generate it).

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

## iOS one-time setup

Most of this is already done (Apple Developer Program enrolled, first production
build completed via EAS, first submit to App Store Connect done — version 1.0.0
build 1, bundle ID `com.whiskeytasting.app` is processing into TestFlight, and
`submit.production.ios.ascAppId` is set in `eas.json` to `6779395691`, the
numeric Apple ID from App Store Connect → App Information).

**What remains before CI iOS submits work non-interactively:**

1. **Verify the stored App Store Connect API key** — EAS stores the ASC API key
   that was set up during the first interactive `eas submit -p ios`. Confirm it
   is still present:
   ```
   npx eas-cli@latest credentials -p ios
   ```
   Look for the **App Store Connect API Key** section. If it is missing, re-run
   `npx eas-cli@latest submit -p ios` interactively once to re-authorize.
2. **Add TestFlight internal testers** — in App Store Connect → TestFlight →
   Internal Testing, invite testers by Apple ID (up to 100). No Apple review is
   required for internal testing; builds are available immediately after
   processing and expire after 90 days.

**No new GitHub secrets are needed.** iOS CI submission uses the ASC API key
stored in EAS credentials, authenticated via the existing `EXPO_TOKEN` secret.
There is no `.p8` file or Apple-specific secret in the repo or in GitHub.

## Routine releases

**Automated (recommended).** The `Mobile Release` GitHub workflow
(`.github/workflows/mobile-release.yml`):

- **Production + auto-submit to both stores:** push a tag —
  ```
  git tag mobile-v1.0.1 && git push origin mobile-v1.0.1
  ```
  Two jobs run in parallel: `release-android` builds the AAB and submits it to
  Play internal testing; `release-ios` builds the IPA and submits it to
  TestFlight. versionCode/buildNumber are auto-incremented by EAS
  (`appVersionSource: remote`).
- **Manual run** (Actions tab → *Mobile Release* → *Run workflow*):
  - `platform` — choose `android`, `ios`, or `all` (default `android`).
  - `profile`:
    - `preview` → Android only: an internal-distribution **APK** with a
      shareable EAS link (good for a quick one-off without touching Play).
      There is no iOS preview path — ad-hoc iOS distribution requires
      registered device UDIDs, so iOS is production-only.
    - `production` → builds the store-ready binary for the selected platform(s).
  - `submit` checkbox → when checked, submits to Play internal (Android) and/or
    TestFlight (iOS) after the build completes. Only applies when
    `profile=production`.

Bump the user-facing version in `app.json` (`expo.version`) when meaningful;
`versionCode`/`buildNumber` is managed remotely by EAS and need not be touched.

**Local equivalents** (from `apps/mobile/`, after one-time setup):

```
# Android
npx eas-cli@latest build  -p android --profile preview                  # shareable APK link
npx eas-cli@latest build  -p android --profile production --auto-submit  # AAB → Play internal

# iOS
npx eas-cli@latest build  -p ios --profile production --auto-submit      # IPA → TestFlight
npx eas-cli@latest submit -p ios --latest                                 # submit existing build
```

## Notes

- EAS free tier is sufficient for this cadence (builds may queue).
- The local NixOS `./gradlew assembleRelease` flow (debug-signed APK) still
  works for ad-hoc sideloading but is unrelated to Play distribution — Play
  builds must come through EAS so they use the managed upload key.
- iOS has no preview/ad-hoc distribution path. To test on a specific device
  before a TestFlight release, register the device UDID in your Apple Developer
  account and use an ad-hoc profile — but for this project's cadence, TestFlight
  internal testing is the intended path.
- TestFlight builds expire after 90 days. Testers must update before expiry or
  re-download from TestFlight.
