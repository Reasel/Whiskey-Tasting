# Mobile Default Submitter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings-configurable "default submitter" and stop resetting the selected user when the theme changes, so the mobile app opens straight into scoring for the configured user and stays there through theme switches.

**Architecture:** Pure client-side changes in `apps/mobile` (Expo SDK 54 / React Native). Two AsyncStorage keys back the behavior: a new sticky `default_username` (written only from Settings) and the existing transient `last_username`. The Taste tab resolves the initial submitter as `default || last`; the theme-change callback drops its picker-reset side effect. Settings gains a new "Default Submitter" panel.

**Tech Stack:** TypeScript, React Native 0.81, expo-router 6, `@react-native-async-storage/async-storage` 2.2.

**Spec:** `docs/superpowers/specs/2026-05-27-mobile-default-submitter-design.md` (commit `854f35f`).

**Testing note (read first):** This app has **no unit-test harness**; its only check is `tsc --noEmit` (run as `npm run lint` from `apps/mobile`). Classic red/green TDD does not apply. For every task the verification loop is:

1. `cd apps/mobile && npm run lint` → must report no errors.
2. Live check in the running Android emulator. If Expo dev server is not already running, the spec includes a runbook in `memory/mobile-dev.md`; otherwise just save the file and rely on Fast Refresh. Capture the device screen with:
   `nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 exec-out screencap -p > /tmp/v.png'` and view `/tmp/v.png`.
3. Commit.

**Commit-message rule:** no AI attribution (no `Co-Authored-By`, no "Generated with" lines). Match the existing repo style (short imperative summary; a one-paragraph body when the change is non-obvious).

All paths below are relative to repo root `/home/reasel/git/Whiskey-Tasting`.

---

## File map

| File | What changes | Why |
| --- | --- | --- |
| `apps/mobile/lib/storage.ts` | Add `default_username` key + three helpers | New sticky default-submitter setting |
| `apps/mobile/app/tasting/index.tsx` | `loadData()` resolution; `handleThemeChange()` no-reset; focus effect re-evaluation; picker `Default` badge | Skip picker for default user; keep selection across theme switches; refresh default after Settings change |
| `apps/mobile/app/settings.tsx` | New `<Panel title="Default Submitter">` | Surface the setting to users |

No backend files, no schema, no shared web code.

---

### Task 1: Add default-username storage helpers

**Files:**
- Modify: `apps/mobile/lib/storage.ts`

- [ ] **Step 1: Add the new key and three helpers**

Open `apps/mobile/lib/storage.ts` and replace the entire file contents with:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SERVER_URL } from './config';

const KEYS = {
  SERVER_URL: 'server_url',
  USERNAME: 'last_username',
  DEFAULT_USERNAME: 'default_username',
} as const;

export async function getServerUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(KEYS.SERVER_URL);
  return url || DEFAULT_SERVER_URL;
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SERVER_URL, url.replace(/\/+$/, ''));
}

export async function getLastUsername(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USERNAME);
}

export async function setLastUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERNAME, name);
}

export async function getDefaultUsername(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.DEFAULT_USERNAME);
}

export async function setDefaultUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEFAULT_USERNAME, name);
}

export async function clearDefaultUsername(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DEFAULT_USERNAME);
}
```

- [ ] **Step 2: Lint**

Run: `cd apps/mobile && npm run lint`
Expected: no output / no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/storage.ts
git commit -m "Add default_username storage helpers for mobile

Introduces a sticky default-submitter key alongside the existing
last_username transient key. Sets up storage primitives for the
Settings-configurable default that the Taste tab will consume next."
```

---

### Task 2: Auto-select submitter on Taste tab and stop resetting on theme switch

**Files:**
- Modify: `apps/mobile/app/tasting/index.tsx` (imports near top; `loadData` ~lines 99–125; `useFocusEffect` body ~lines 144–178; `handleThemeChange` ~lines 180–188)

- [ ] **Step 1: Update the storage import**

Find the line that imports from `'../../lib/storage'` (near line 33). Replace it with:

```tsx
import {
  getLastUsername,
  setLastUsername,
  getDefaultUsername,
} from '../../lib/storage';
```

- [ ] **Step 2: Replace `loadData` to resolve initial submitter from default → last**

Find the `loadData` callback (currently lines 99–125, starting with `const loadData = useCallback(async () => {`). Replace the entire `useCallback` with:

```tsx
const loadData = useCallback(async () => {
  try {
    const [themesResp, usersData, defaultName, savedName] = await Promise.all([
      fetchThemes(),
      fetchUsers(),
      getDefaultUsername(),
      getLastUsername(),
    ]);
    setThemes(themesResp.themes);
    setUsers(usersData.users);

    const firstTheme = themesResp.themes[0];
    if (firstTheme) {
      setSelectedThemeId(firstTheme.id);
      await loadWhiskeys(firstTheme.id);
    }

    // Resolve initial submitter: explicit default wins; otherwise last
    // picker selection. Skip the picker only if the resolved name still
    // exists in the fetched users list — otherwise fall back silently.
    const resolved = (defaultName || savedName || '').trim();
    if (resolved) {
      setUserName(resolved);
      const stillExists = usersData.users.some((u) => u.name === resolved);
      if (stillExists && firstTheme) {
        setUserSelected(true);
        await loadExistingScores(resolved, firstTheme.id);
      }
    }
  } catch {
    setToast({
      message: 'Could not connect to server.',
      type: 'error',
      visible: true,
    });
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [loadWhiskeys, loadExistingScores]);
```

Note: `loadExistingScores` is already defined later in the file (around line 190). The dependency array now lists it; if the lint reports an order-of-declaration warning, hoist the `loadExistingScores` `useCallback` above `loadData`. The file is one component, so reordering callbacks is safe.

- [ ] **Step 3: Extend the focus effect to re-apply default when picker is showing**

Find the `useFocusEffect` block (currently lines 144–178). Replace the entire block with:

```tsx
const didInitialLoad = useRef(false);
useFocusEffect(
  useCallback(() => {
    if (!didInitialLoad.current) {
      didInitialLoad.current = true;
      return;
    }
    let active = true;
    (async () => {
      try {
        const [themesResp, usersData, defaultName] = await Promise.all([
          fetchThemes(),
          fetchUsers(),
          getDefaultUsername(),
        ]);
        if (!active) return;
        setThemes(themesResp.themes);
        setUsers(usersData.users);

        const cur = selectedThemeIdRef.current;
        if (cur != null && !themesResp.themes.some((t) => t.id === cur)) {
          // The selected theme was deleted elsewhere — fall back to the
          // first theme and return to the selection screen.
          const first = themesResp.themes[0] ?? null;
          setSelectedThemeId(first ? first.id : null);
          setUserSelected(false);
          if (first) loadWhiskeys(first.id);
          return;
        }

        // If the picker is currently visible (no user selected), re-apply
        // a newly-configured default. Never yank a user already in scoring.
        if (!userSelectedRef.current && defaultName) {
          const stillExists = usersData.users.some((u) => u.name === defaultName);
          if (stillExists && cur != null) {
            setUserName(defaultName);
            setUserSelected(true);
            await loadExistingScores(defaultName, cur);
          }
        }
      } catch {
        // keep current state on a transient failure
      }
    })();
    return () => {
      active = false;
    };
  }, [loadWhiskeys, loadExistingScores]),
);
```

- [ ] **Step 4: Add a `userSelectedRef` so the focus effect can read the latest value**

The focus effect now references `userSelectedRef.current`. Add the ref next to `selectedThemeIdRef`. Find the block (currently lines 131–136):

```tsx
const selectedThemeIdRef = useRef<number | null>(null);
useEffect(() => {
  selectedThemeIdRef.current = selectedThemeId;
}, [selectedThemeId]);
```

Replace with:

```tsx
const selectedThemeIdRef = useRef<number | null>(null);
useEffect(() => {
  selectedThemeIdRef.current = selectedThemeId;
}, [selectedThemeId]);

const userSelectedRef = useRef(false);
useEffect(() => {
  userSelectedRef.current = userSelected;
}, [userSelected]);
```

- [ ] **Step 5: Stop resetting the user on theme change; reload scores instead**

Find `handleThemeChange` (currently lines 180–188). Replace the entire callback with:

```tsx
const handleThemeChange = useCallback(
  (value: number | string) => {
    const themeId = Number(value);
    setSelectedThemeId(themeId);
    loadWhiskeys(themeId);
    if (userSelectedRef.current && userName.trim()) {
      // Preserve the current submitter across theme switches; refresh
      // their existing scores for the new theme.
      loadExistingScores(userName.trim(), themeId);
    }
  },
  [loadWhiskeys, loadExistingScores, userName],
);
```

- [ ] **Step 6: Lint**

Run: `cd apps/mobile && npm run lint`
Expected: no errors. If the linter reports "Block-scoped variable 'loadExistingScores' used before its declaration", move the `loadExistingScores` `useCallback` (currently lines ~190–218) directly above `loadData`.

- [ ] **Step 7: Smoke check in emulator**

With the dev server running, the screen should Fast-Refresh. Manual checks:

1. **Cold launch with last_username set:** kill the app on the device, reopen. Taste tab should open directly to scoring (no picker) for the last picked user.
2. **Theme switch persistence:** in scoring, switch theme via the dropdown. Stay in scoring. Scores reload.
3. **Stale name fallback:** temporarily edit `apps/mobile/lib/storage.ts` to seed `last_username='Nobody'` (or set via dev shell), reload — picker should appear without crashing. Revert any seeding.

Capture a screenshot:
`nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 exec-out screencap -p > /tmp/v.png'`

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/app/tasting/index.tsx
git commit -m "Keep the submitter selected across theme switches on mobile

The Taste tab now opens straight into scoring for the configured
default user (or last picked user, as a fallback), and switching
themes no longer kicks back to the user picker. Scores reload for
the new theme. The focus effect re-applies a newly-set default
only when the picker is visible, never yanking an in-progress user."
```

---

### Task 3: Add the "Default Submitter" panel to Settings

**Files:**
- Modify: `apps/mobile/app/settings.tsx`

- [ ] **Step 1: Replace the file with the panel-enabled version**

Write the entire file:

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Panel } from '../components/ui/Panel';
import { Card } from '../components/ui/Card';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import {
  getServerUrl,
  setServerUrl,
  getDefaultUsername,
  setDefaultUsername,
  clearDefaultUsername,
} from '../lib/storage';
import { clearApiCache, fetchUsers, type User } from '../lib/api';
import { APP_VERSION, APP_NAME } from '../lib/config';

export default function SettingsScreen() {
  const [url, setUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'unknown' | 'connected' | 'failed'
  >('unknown');

  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState(false);
  const [defaultName, setDefaultNameState] = useState<string | null>(null);

  useEffect(() => {
    getServerUrl().then((u) => {
      setUrl(u);
      setSavedUrl(u);
    });
    getDefaultUsername().then((n) => setDefaultNameState(n));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchUsers();
        if (!active) return;
        setUsers(data.users);
        setUsersError(false);
      } catch {
        if (!active) return;
        setUsersError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [savedUrl]);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setConnectionStatus('unknown');
    try {
      const testUrl = `${url.replace(/\/+$/, '')}/api/v1/status`;
      const response = await fetch(testUrl);
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
      }
    } catch {
      setConnectionStatus('failed');
    } finally {
      setTesting(false);
    }
  }, [url]);

  const saveUrl = useCallback(async () => {
    const trimmed = url.replace(/\/+$/, '');
    await setServerUrl(trimmed);
    clearApiCache();
    setSavedUrl(trimmed);
    setUrl(trimmed);
    Alert.alert('Saved', 'Server URL has been updated.');
  }, [url]);

  const pickDefault = useCallback(async (name: string) => {
    await setDefaultUsername(name);
    setDefaultNameState(name);
  }, []);

  const clearDefault = useCallback(async () => {
    await clearDefaultUsername();
    setDefaultNameState(null);
  }, []);

  const hasChanges = url !== savedUrl;

  const defaultStillExists =
    defaultName == null || users.some((u) => u.name === defaultName);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="pageTitle" style={styles.pageTitle}>SETTINGS</AppText>
        <Eyebrow style={styles.eyebrow}>CONFIGURE THE APP</Eyebrow>

        <Panel title="Server Connection" style={styles.panel}>
          <AppText variant="body" style={styles.description}>
            Enter the URL of your Whiskey Tasting server. This is usually the IP
            address of the machine running the backend.
          </AppText>

          <Input
            label="SERVER URL"
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.100:8010"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.buttonRow}>
            <View style={styles.flex1}>
              <Button
                title="TEST CONNECTION"
                variant="secondary"
                onPress={testConnection}
                loading={testing}
                block
              />
            </View>
            <View style={styles.flex1}>
              <Button
                title="SAVE"
                onPress={saveUrl}
                disabled={!hasChanges}
                block
              />
            </View>
          </View>

          {connectionStatus !== 'unknown' && (
            <AppText
              variant="body"
              style={[
                styles.statusText,
                {
                  color:
                    connectionStatus === 'connected'
                      ? colors.signalGreen
                      : colors.alertRed,
                },
              ]}
            >
              {connectionStatus === 'connected'
                ? 'Connected successfully.'
                : 'Connection failed. Check the URL and make sure the server is running.'}
            </AppText>
          )}
        </Panel>

        <Panel title="Default Submitter" style={styles.panel}>
          <AppText variant="body" style={styles.description}>
            Pick who the app should default to when you open it. You can still
            tap a different name on the Taste tab to submit as someone else —
            your default won't change.
          </AppText>

          <View style={styles.currentDefaultRow}>
            <AppText variant="fieldLabel">CURRENT DEFAULT</AppText>
            <AppText variant="body" style={styles.currentDefaultValue}>
              {defaultName
                ? defaultStillExists
                  ? defaultName
                  : `${defaultName} (not found on server)`
                : 'None set'}
            </AppText>
            {defaultName && (
              <View style={styles.clearWrap}>
                <Button
                  title="CLEAR DEFAULT"
                  variant="outline"
                  size="sm"
                  onPress={clearDefault}
                />
              </View>
            )}
          </View>

          {usersError ? (
            <AppText variant="body" style={styles.subtleText}>
              Could not load users. Check the server connection and try again.
            </AppText>
          ) : users.length === 0 ? (
            <AppText variant="body" style={styles.subtleText}>
              Submit a tasting once, then you can set yourself as default here.
            </AppText>
          ) : (
            users.map((u) => (
              <Card
                key={u.id}
                onPress={() => pickDefault(u.name)}
                style={[
                  styles.userCard,
                  defaultName === u.name && styles.userCardActive,
                ]}
              >
                <AppText
                  variant="body"
                  style={[
                    styles.userName,
                    defaultName === u.name && styles.userNameActive,
                  ]}
                >
                  {u.name}
                </AppText>
              </Card>
            ))
          )}
        </Panel>

        <Panel title="About" style={styles.panel}>
          <AppText variant="sectionTitle" style={styles.aboutName}>{APP_NAME}</AppText>
          <AppText variant="tableCell">Version {APP_VERSION}</AppText>
          <AppText variant="tableCell">Built with Expo {'&'} React Native</AppText>
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasCream,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.xl,
  },
  panel: {
    marginBottom: spacing.lg,
  },
  description: {
    color: colors.mutedText,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  statusText: {
    marginTop: spacing.md,
  },
  aboutName: {
    marginBottom: spacing.xs,
  },
  currentDefaultRow: {
    marginBottom: spacing.lg,
  },
  currentDefaultValue: {
    marginTop: spacing.xs,
  },
  clearWrap: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  subtleText: {
    color: colors.mutedText,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.whiskeyAmber,
    borderWidth: 2,
  },
  userName: {
    fontWeight: '600',
  },
  userNameActive: {
    color: colors.whiskeyAmber,
  },
});
```

Notes for the engineer:
- `fetchUsers` and `User` come from `apps/mobile/lib/api/index.ts` (re-exported); confirm with a quick `grep "export.*fetchUsers" apps/mobile/lib/api` if the import line errors.
- The user-card styling (`userCard`, `userCardActive`, `userName`, `userNameActive`) mirrors the picker on the Taste tab. If the existing `Card` component doesn't accept a `borderColor`/`borderWidth` style override, fall back to wrapping the active card in a `<View>` with that border — but check first; the Taste tab uses this exact pattern at `app/tasting/index.tsx:340-354`.
- We deliberately re-fetch users whenever `savedUrl` changes so changing servers in Settings updates the list without a tab switch.

- [ ] **Step 2: Lint**

Run: `cd apps/mobile && npm run lint`
Expected: no errors.

- [ ] **Step 3: Smoke check in emulator**

Navigate to Settings tab. Verify:

1. New "Default Submitter" panel appears between Server Connection and About.
2. Current default reads "None set" initially.
3. Tap a user → that user's card gets the active border, "Current default" updates to that name.
4. Tap "Clear default" → returns to "None set".
5. Force-close + reopen app: Taste tab should now open directly to scoring for the default user.

Screenshot:
`nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 exec-out screencap -p > /tmp/v.png'`

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/settings.tsx
git commit -m "Add Default Submitter setting to mobile app

Adds a Settings panel that lets the user pick which person the
Taste tab should default to on launch. The value is stored
separately from the transient last_username so a borrowed phone
never pollutes the configured default."
```

---

### Task 4: Pre-highlight the default user on the Taste picker (polish)

This is the optional cosmetic touch from the spec: when the picker is shown (e.g. after a proxy submission), make the default user's card visually distinct so it's one tap to return.

**Files:**
- Modify: `apps/mobile/app/tasting/index.tsx` (user-picker render block ~lines 336–355; nearby state)

- [ ] **Step 1: Track the default name in component state**

In the state declarations (currently around lines 42–58), add:

```tsx
const [defaultUserName, setDefaultUserName] = useState<string | null>(null);
```

- [ ] **Step 2: Populate it in `loadData`**

In the new `loadData` callback (Task 2 Step 2), set the state from the resolved value. Find the `setUsers(usersData.users);` line, and below the existing block that resolves `resolved`, also call:

```tsx
setDefaultUserName(defaultName ?? null);
```

Place this immediately after `setUsers(usersData.users);` (before the firstTheme block) so it's set even when no user is auto-selected.

- [ ] **Step 3: Refresh it in the focus effect**

In the focus-effect block (Task 2 Step 3), after `setUsers(usersData.users);`, add:

```tsx
setDefaultUserName(defaultName ?? null);
```

- [ ] **Step 4: Render a "Default" badge on the matching card**

Find the picker render block (currently lines 336–355). Replace the `users.map(...)` block with:

```tsx
{users.map((u) => {
  const isDefault = defaultUserName != null && u.name === defaultUserName;
  return (
    <Card
      key={u.id}
      onPress={loadingWhiskeys ? undefined : () => handleSelectUser(u.name)}
      style={[
        styles.userCard,
        userName === u.name && styles.userCardActive,
        isDefault && styles.userCardDefault,
      ]}
    >
      <View style={styles.userCardRow}>
        <AppText
          variant="body"
          style={[
            styles.userName,
            userName === u.name && styles.userNameActive,
          ]}
        >
          {u.name}
        </AppText>
        {isDefault && (
          <AppText variant="fieldLabel" style={styles.defaultBadge}>
            DEFAULT
          </AppText>
        )}
      </View>
    </Card>
  );
})}
```

- [ ] **Step 5: Add the new styles**

Find the `StyleSheet.create({ ... })` block at the bottom of `apps/mobile/app/tasting/index.tsx`. Add these entries (place them next to `userCard` / `userCardActive`; do not remove any existing styles):

```tsx
userCardRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
userCardDefault: {
  borderColor: colors.whiskeyAmber,
  borderStyle: 'dashed',
  borderWidth: 1,
},
defaultBadge: {
  color: colors.whiskeyAmber,
  marginLeft: spacing.sm,
},
```

If `userCard` already has a `borderWidth`/`borderColor`, the `userCardDefault` override will compose correctly because array-style merges later wins. Verify visually that the dashed border is distinct from the solid `userCardActive` border (which uses `borderWidth: 2`).

- [ ] **Step 6: Lint**

Run: `cd apps/mobile && npm run lint`
Expected: no errors.

- [ ] **Step 7: Smoke check in emulator**

Trigger the picker (tap "CHANGE USER" from scoring, or submit a tasting). With a default set, the matching user's card should have the dashed amber border + "DEFAULT" badge.

Screenshot:
`nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 exec-out screencap -p > /tmp/v.png'`

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/app/tasting/index.tsx
git commit -m "Show DEFAULT badge on the default user's picker card

After a proxy submission the picker reappears so the next person
can pick themselves. The configured default now stands out with
a dashed border and a small badge, making it one tap to return."
```

---

### Task 5: Final end-to-end verification

No code change. Walks through every spec acceptance criterion on a real device build.

**Files:** none.

- [ ] **Step 1: Run lint one more time across the touched files**

Run: `cd apps/mobile && npm run lint`
Expected: clean.

- [ ] **Step 2: Cold-launch with default set (criterion 3)**

1. In Settings, set default to "Tanner". Confirm "Current default: Tanner".
2. Force-close the app: `nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 shell am force-stop host.exp.exponent'`.
3. Relaunch via the deep link (see `mobile-dev.md`).
4. Expected: Taste tab opens directly in scoring, "Tasting as: Tanner".

- [ ] **Step 3: Default unset, last_username present (criterion 4)**

1. In Settings, tap "Clear default".
2. On Taste, tap "CHANGE USER", then pick "Dave".
3. Force-close + relaunch.
4. Expected: Taste tab opens in scoring as Dave.

- [ ] **Step 4: Neither set, picker shown (criterion 5)**

1. Clear default in Settings.
2. From a dev shell, clear `last_username`:
   `nix-shell apps/mobile/shell.nix --run "adb -s emulator-5554 shell run-as host.exp.exponent 'rm -rf /data/data/host.exp.exponent/shared_prefs/RKStorage.xml' 2>/dev/null || true"`
   If `run-as` is blocked on the release build, simply tap "CHANGE USER" and pick a name, then re-clear it by editing `last_username` via the dev console; otherwise reinstall the app from Expo Go.
3. Relaunch.
4. Expected: picker is shown, no crash, no error toast.

- [ ] **Step 5: Theme switch preserves user (criterion 6)**

1. Set default to "Tanner". Launch into scoring.
2. Use the theme dropdown to switch to another theme.
3. Expected: still in scoring as Tanner. Whiskey list and scores update for the new theme. The "Tasting as: Tanner" line is unchanged.

- [ ] **Step 6: Proxy borrow does not pollute default (criterion 7)**

1. Set default to "Tanner". Launch into scoring as Tanner.
2. Submit a tasting. Picker reappears.
3. Tap "Dave". Submit again.
4. Force-close + relaunch.
5. Expected: opens as **Tanner** (the configured default), not Dave.
6. Open Settings → "Current default" still reads "Tanner".

- [ ] **Step 7: Stale default falls back cleanly (criterion 8)**

1. Set default to a user that doesn't exist server-side (the easiest way: in Settings pick an existing user, then on the server delete that user via the admin UI/DB).
2. Relaunch.
3. Expected: Taste tab shows the picker, no crash. Settings panel shows "<name> (not found on server)" with a Clear button.
4. Tap "Clear default" → returns to "None set".

- [ ] **Step 8: Mark Issue 1 acceptance criteria complete in `Issues.md`**

Edit `Issues.md`:
- Under Issue 1's "Acceptance criteria", flip each box from `[ ]` to `[x]` for the criteria covered by the verification steps above.
- Leave Issues 2 and 3 untouched.

- [ ] **Step 9: Commit the issue-tracker update**

```bash
git add Issues.md
git commit -m "Mark Issue 1 acceptance criteria complete

Default submitter setting and theme-switch persistence verified
on-device. Issues 2 and 3 remain open."
```

---

## Self-review notes

- **Spec coverage:** default_username key + helpers (Task 1) — covers storage model row 1. Taste loadData default→last resolution (Task 2 Step 2) — covers acceptance criteria 3, 4, 5 and the stale-name fallback. handleThemeChange no-reset (Task 2 Step 5) — covers criterion 6. Settings panel (Task 3) — covers criterion 1, 2, and the (not found on server) edge case. Proxy-flow non-pollution (criterion 7) is verified in Task 5 but requires no code beyond what Task 2 already does, since `default_username` is only written from Settings. Picker badge (Task 4) — optional polish from the spec's "picker polish" item. All eight acceptance criteria from the spec have an explicit verification step in Task 5.
- **Placeholder scan:** No TBDs, no "add error handling" hand-waves. Each file change shows the full replacement code or the exact block to edit. The Card-border-override note in Task 3 is a caveat with a concrete fallback.
- **Type/signature consistency:** `getDefaultUsername` / `setDefaultUsername` / `clearDefaultUsername` signatures defined in Task 1 match their consumers in Tasks 2 and 3. `defaultUserName` (component state, camelCase) is distinct from `default_username` (AsyncStorage key, snake_case) intentionally; both are used consistently within their layer.
