# Mobile App Plan: Android & iOS

## Current Architecture Summary

| Layer    | Technology                                      |
|----------|------------------------------------------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend  | Python FastAPI, TinyDB (file-based JSON DB)     |
| API      | REST at `/api/v1/*` with CORS                   |
| Deploy   | Docker (single container, ports 3010 + 8010)    |

The frontend and backend are already cleanly separated with a REST API, which makes mobile adoption straightforward.

---

## Recommended Approach: Expo (React Native)

**Why Expo/React Native over alternatives:**

| Approach | Pros | Cons |
|----------|------|------|
| **Expo (React Native)** ✅ | True native feel, shared React knowledge, single codebase for iOS + Android, access to native APIs (camera, haptics, push notifications), large ecosystem | New app directory, can't directly reuse Tailwind/Next.js components |
| Capacitor (web wrapper) | Reuses existing web code as-is | Not truly native, limited native API access, janky feel on mobile, poor offline support |
| PWA | Zero new code, works today | No app store presence, limited iOS support (no push notifications until recently), no native feel |

Given the app's goal of being **simple and accessible** (including for elderly users), a native-feeling app with large touch targets and smooth animations is the right choice. Expo gives the best developer experience for React Native.

---

## Proposed Directory Structure

```
apps/
├── backend/          # (existing) Python FastAPI
├── frontend/         # (existing) Next.js web app
└── mobile/           # (new) Expo React Native app
    ├── app/                  # Expo Router file-based routing
    │   ├── _layout.tsx       # Root layout (navigation, providers)
    │   ├── index.tsx         # Home screen (equivalent of web home)
    │   ├── tasting/
    │   │   ├── index.tsx     # Tasting submission
    │   │   └── [id].tsx      # Individual tasting view
    │   ├── dashboard.tsx     # Dashboard/results view
    │   ├── admin/
    │   │   ├── _layout.tsx   # Admin tab layout
    │   │   ├── index.tsx     # Administration panel
    │   │   ├── themes.tsx    # Theme management
    │   │   ├── users.tsx     # User management
    │   │   └── data.tsx      # Data view
    │   └── settings.tsx      # App settings (server URL config)
    ├── components/           # Shared mobile components
    │   ├── ui/               # Reusable UI primitives
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Toast.tsx
    │   │   └── Card.tsx
    │   └── tasting/          # Feature-specific components
    │       ├── WhiskeyCard.tsx
    │       ├── RatingSlider.tsx
    │       └── ScoreDisplay.tsx
    ├── lib/
    │   ├── api/              # API client (shared logic with web)
    │   │   ├── client.ts     # Base fetch/config
    │   │   ├── tastings.ts
    │   │   ├── themes.ts
    │   │   ├── users.ts
    │   │   └── index.ts
    │   ├── storage.ts        # AsyncStorage helpers (server URL, user prefs)
    │   └── config.ts         # App configuration
    ├── assets/               # App icons, splash screen
    ├── app.json              # Expo config
    ├── package.json
    ├── tsconfig.json
    ├── eas.json              # EAS Build configuration
    └── babel.config.js
```

---

## Implementation Phases

### Phase 1: Project Scaffolding & API Client

**Goal:** Set up the Expo project and establish API communication.

1. **Initialize Expo project** in `apps/mobile/`
   ```bash
   npx create-expo-app@latest apps/mobile --template tabs
   ```
2. **Configure Expo Router** for file-based navigation (matching the web app's page structure)
3. **Port the API client** from `apps/frontend/lib/api/` to `apps/mobile/lib/api/`
   - Replace `window.location` logic with configurable server URL stored in `AsyncStorage`
   - Reuse the same endpoint paths and response types
   - Add a **Settings screen** where users enter their server URL (e.g., `http://192.168.1.2:8010`)
4. **Add shared TypeScript types** — extract API response types into a shared location or duplicate them in the mobile app

**Key dependencies:**
- `expo` + `expo-router`
- `@react-native-async-storage/async-storage`
- `expo-secure-store` (for admin password storage)

### Phase 2: Core User Screens

**Goal:** Build the participant-facing screens that let users join and rate whiskeys.

1. **Home screen** — select active theme, see whiskey lineup
2. **User selection/creation** — simple name entry (matching the web app's low-friction approach)
3. **Tasting submission** — rate aroma, flavor, and finish for each whiskey
   - Use native sliders (`@react-native-community/slider`) for ratings
   - Large touch targets for elderly users
4. **Results/dashboard** — view scores and rankings

**UI approach:**
- Use [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native) to keep styling familiar
- Or use [Tamagui](https://tamagui.dev/) / [React Native Paper](https://reactnativepaper.com/) for pre-built accessible components
- Ensure minimum 48dp touch targets and 16sp+ font sizes for accessibility

### Phase 3: Admin Screens

**Goal:** Build the administration screens.

1. **Theme management** — create/edit themes and whiskeys
2. **User management** — add/delete users
3. **Data view** — view all tasting data
4. **Admin authentication** — password gate (same `ADMIN_PASSWORD` as web)

### Phase 4: Mobile-Specific Enhancements

**Goal:** Add features that take advantage of being a native app.

1. **Push notifications** via the existing `ntfy` integration
   - Use `expo-notifications` to register for push
   - Backend already supports ntfy — connect mobile devices as subscribers
2. **Offline support**
   - Cache active theme + whiskey data locally
   - Queue tasting submissions when offline, sync when back online
3. **Dark mode** — respect system theme preference
4. **Haptic feedback** on rating submission (`expo-haptics`)
5. **App icon & splash screen** — match the existing whiskey tasting branding

### Phase 5: Build & Distribution

**Goal:** Get the app into users' hands.

1. **EAS Build** configuration for cloud builds
   ```json
   // eas.json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": { "buildType": "apk" }
       },
       "production": {
         "android": { "buildType": "app-bundle" },
         "ios": { "autoIncrement": true }
       }
     }
   }
   ```
2. **Android**: Generate APK for sideloading (primary use case for a self-hosted app) + optional Play Store listing
3. **iOS**: TestFlight for distribution, optional App Store listing
4. **OTA updates** via `expo-updates` for pushing fixes without app store review

---

## Backend Changes Required

The backend needs minimal changes to support mobile clients:

1. **CORS configuration** — add mobile app origins (or use `*` for development)
   - Expo dev client uses `exp://` scheme, so CORS needs to accommodate this
   - In production, mobile apps make direct HTTP requests (not browser-origin-restricted), so CORS is less of a concern
2. **API URL flexibility** — ensure the API works with both relative paths (web) and absolute URLs (mobile)
   - Already supported: `API_BASE` in the client uses absolute URLs
3. **Push notification endpoint** (optional) — add a device registration endpoint if you want targeted push notifications instead of topic-based ntfy

No changes needed to the database schema, API routes, or business logic.

---

## Shared Code Strategy

To maximize code reuse between web and mobile:

| Layer | Strategy |
|-------|----------|
| API types/interfaces | Extract to a shared `packages/api-types/` directory or duplicate (small codebase) |
| API client logic | Port `apps/frontend/lib/api/*.ts` — same endpoints, swap `fetch` for React Native's `fetch` (compatible) |
| Business logic | Any pure TypeScript logic can be shared directly |
| UI components | Must be rewritten — React DOM components ≠ React Native components |
| Styling | NativeWind lets you use Tailwind class names in React Native |

---

## CI/CD Additions

Add to `.github/workflows/ci-cd.yml`:

```yaml
mobile-build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: expo/expo-github-action@v8
      with:
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}
    - run: cd apps/mobile && npm install
    - run: cd apps/mobile && npx eas-cli build --platform all --non-interactive
```

---

## Estimated Effort by Phase

| Phase | Scope | Complexity |
|-------|-------|------------|
| 1 - Scaffolding & API | Project setup, API client, settings screen | Low |
| 2 - Core user screens | Home, user entry, tasting form, results | Medium |
| 3 - Admin screens | Theme/user/data management | Medium |
| 4 - Mobile enhancements | Push, offline, dark mode, haptics | Medium-High |
| 5 - Build & distribution | EAS config, app store prep | Low-Medium |

---

## Key Decisions to Make

1. **UI framework**: NativeWind (Tailwind familiarity) vs. React Native Paper (pre-built accessible components) vs. Tamagui (performance-focused)
2. **State management**: React Context (current web approach) vs. Zustand/Jotai (better for offline sync)
3. **Distribution model**: Sideloaded APK only, or full app store listings?
4. **Monorepo tooling**: Add Turborepo/Nx to manage `apps/frontend`, `apps/mobile`, and shared packages, or keep them independent?
