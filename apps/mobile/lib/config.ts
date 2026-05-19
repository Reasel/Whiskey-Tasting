export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Whiskey Tasting';

/**
 * Default backend the app talks to before the user overrides it in Settings
 * (the stored value always wins — see lib/storage.ts `getServerUrl`).
 *
 * Source default stays local so `npm start` / local dev keeps hitting a
 * dev backend. Distribution builds (EAS `preview`/`production` profiles,
 * and the release CI workflow) inject `EXPO_PUBLIC_SERVER_URL`, which
 * Expo inlines at build time, so the shared APK/AAB ships pointing at the
 * real backend instead of localhost.
 */
export const DEFAULT_SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:8010';
