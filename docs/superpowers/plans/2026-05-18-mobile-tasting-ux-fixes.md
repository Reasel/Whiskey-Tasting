# Mobile Tasting UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five mobile-app issues: broken tab icons, no theme picker, no precise rating entry, awkward proxy submissions, and the obsolete "active theme" concept.

**Architecture:** Pure client-side changes in `apps/mobile` (Expo SDK 54 / React Native). The "active theme" concept is dropped from the UI; theme is chosen per submission via a new reusable `Dropdown`. Ratings become a slider plus an editable numeric field. Tab icons use `@expo/vector-icons` Ionicons (already installed). No backend changes.

**Tech Stack:** TypeScript, React Native 0.81, expo-router 6, `@react-navigation/bottom-tabs` 7, `@react-native-community/slider`, `@expo/vector-icons` 15.

**Testing note (read first):** This app has **no unit-test harness**; its only `lint`/check is `tsc --noEmit` (run as `npm run lint` from `apps/mobile`). Classic red/green TDD does not apply. For every task the verification loop is:
1. `npm run lint` → must report no errors.
2. Live check in the already-running Android emulator. The Expo dev server (`npx expo start --android`, pid noted in `/tmp/expo.log`) and the FastAPI backend (`http://localhost:8010`) are running; `adb reverse tcp:8010` and `tcp:8081` are set. Fast Refresh applies saved files automatically. Capture the **device** screen only (not the host desktop) with:
   `nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 exec-out screencap -p > /tmp/v.png'` then view `/tmp/v.png`.
   If the app is not on screen, relaunch with:
   `nix-shell apps/mobile/shell.nix --run 'adb -s emulator-5554 shell am start -a android.intent.action.VIEW -d "exp://192.168.1.2:8081" host.exp.exponent'`
   (the `127.0.0.1` deep link hangs on the splash — use the `192.168.1.2` LAN URL).
3. Commit.

All commit messages must contain **no AI attribution** (per the user's global instruction): no `Co-Authored-By`, no "Generated with" lines.

All paths below are relative to the repo root `/home/reasel/git/Whiskey-Tasting`.

---

### Task 1: Fix broken tab bar icons (#4)

**Cause:** `app/_layout.tsx` sets no `tabBarIcon`, so `@react-navigation/bottom-tabs` renders `@react-navigation/elements`'s `MissingIcon` — the glyph `⏷` (U+23F7), which Android's default font cannot render (tofu).

**Files:**
- Modify (full replace): `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Replace the file with the icon-enabled version**

Write `apps/mobile/app/_layout.tsx` with exactly:

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IoniconName, inactive: IoniconName) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            headerTitle: 'Whiskey Tasting',
            tabBarIcon: tabIcon('home', 'home-outline'),
          }}
        />
        <Tabs.Screen
          name="tasting"
          options={{
            title: 'Taste',
            tabBarLabel: 'Taste',
            headerTitle: 'Tasting',
            headerShown: false,
            tabBarIcon: tabIcon('wine', 'wine-outline'),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Results',
            tabBarLabel: 'Results',
            headerTitle: 'Results',
            tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline'),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarLabel: 'Admin',
            headerShown: false,
            tabBarIcon: tabIcon('shield', 'shield-outline'),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            headerTitle: 'Settings',
            tabBarIcon: tabIcon('settings', 'settings-outline'),
          }}
        />
      </Tabs>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: completes with no TypeScript errors.

- [ ] **Step 3: Live verify**

Capture the device screen (see Testing note). Expected: the bottom tab bar shows five distinct line/solid icons (house, wine glass, bar chart, shield, gear) above the labels — no boxes/tofu. The active tab's icon is tinted `#d4a574`.

- [ ] **Step 4: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/app/_layout.tsx
git commit -m "Fix broken mobile tab bar icons with Ionicons"
```

---

### Task 2: Reusable Dropdown component (#1 infrastructure)

**Files:**
- Create: `apps/mobile/components/ui/Dropdown.tsx`

- [ ] **Step 1: Create the component**

Write `apps/mobile/components/ui/Dropdown.tsx` with exactly:

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';

export interface DropdownOption {
  label: string;
  value: number | string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value: number | string | null;
  options: DropdownOption[];
  onChange: (value: number | string) => void;
  containerStyle?: ViewStyle;
}

export function Dropdown({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  containerStyle,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.control}
        activeOpacity={0.7}
        onPress={() => setOpen(true)}
      >
        <Text style={selected ? styles.valueText : styles.placeholderText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <ScrollView>
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.option, isActive && styles.optionActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isActive && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isActive && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  valueText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.surfaceLight,
  },
  optionText: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors. (Visual verification happens in Task 3 where it is first used.)

- [ ] **Step 3: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/components/ui/Dropdown.tsx
git commit -m "Add reusable Dropdown component"
```

---

### Task 3: Theme dropdown + proxy-submission flow on the Tasting screen (#1, #2, #5)

Replaces `fetchActiveTheme()` use with a theme `Dropdown` (default = first theme), reloads whiskeys on theme change, and after a successful submit returns to a fresh person picker with the theme retained.

**Files:**
- Modify (full replace): `apps/mobile/app/tasting/index.tsx`

- [ ] **Step 1: Replace the file**

Write `apps/mobile/app/tasting/index.tsx` with exactly:

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { WhiskeyCard } from '../../components/tasting/WhiskeyCard';
import { Toast } from '../../components/ui/Toast';
import {
  fetchThemes,
  fetchWhiskeysByTheme,
  fetchUsers,
  fetchUserTastingsForTheme,
  submitTasting,
  type Theme,
  type Whiskey,
  type User,
  type SubmitTastingRequest,
} from '../../lib/api';
import { getLastUsername, setLastUsername } from '../../lib/storage';

type WhiskeyScores = {
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  personal_rank: number;
};

export default function TastingScreen() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<number, WhiskeyScores>>({});
  const [loading, setLoading] = useState(true);
  const [loadingWhiskeys, setLoadingWhiskeys] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userSelected, setUserSelected] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const selectedTheme =
    themes.find((t) => t.id === selectedThemeId) ?? null;

  const initScores = useCallback((whiskeysData: Whiskey[]) => {
    const initial: Record<number, WhiskeyScores> = {};
    whiskeysData.forEach((w, i) => {
      if (w.id != null) {
        initial[w.id] = {
          aroma_score: 3,
          flavor_score: 3,
          finish_score: 3,
          personal_rank: i + 1,
        };
      }
    });
    setScores(initial);
  }, []);

  const loadWhiskeys = useCallback(
    async (themeId: number) => {
      setLoadingWhiskeys(true);
      try {
        const whiskeysData = await fetchWhiskeysByTheme(themeId);
        setWhiskeys(whiskeysData);
        initScores(whiskeysData);
      } catch {
        setWhiskeys([]);
        setToast({
          message: 'Could not load whiskeys for this theme.',
          type: 'error',
          visible: true,
        });
      } finally {
        setLoadingWhiskeys(false);
      }
    },
    [initScores],
  );

  const loadData = useCallback(async () => {
    try {
      const [themesResp, usersData, savedName] = await Promise.all([
        fetchThemes(),
        fetchUsers(),
        getLastUsername(),
      ]);
      setThemes(themesResp.themes);
      setUsers(usersData.users);
      if (savedName) setUserName(savedName);

      const firstTheme = themesResp.themes[0];
      if (firstTheme) {
        setSelectedThemeId(firstTheme.id);
        await loadWhiskeys(firstTheme.id);
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
  }, [loadWhiskeys]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleThemeChange = useCallback(
    (value: number | string) => {
      const themeId = Number(value);
      setSelectedThemeId(themeId);
      setUserSelected(false);
      loadWhiskeys(themeId);
    },
    [loadWhiskeys],
  );

  const loadExistingScores = useCallback(
    async (name: string, themeId: number) => {
      try {
        const data = await fetchUserTastingsForTheme(name, themeId);
        const loaded: Record<number, WhiskeyScores> = {};
        whiskeys.forEach((w, i) => {
          if (w.id == null) return;
          const existing = data.tastings[w.id];
          loaded[w.id] = existing
            ? {
                aroma_score: existing.aroma_score,
                flavor_score: existing.flavor_score,
                finish_score: existing.finish_score,
                personal_rank: existing.personal_rank,
              }
            : {
                aroma_score: 3,
                flavor_score: 3,
                finish_score: 3,
                personal_rank: i + 1,
              };
        });
        setScores(loaded);
      } catch {
        initScores(whiskeys);
      }
    },
    [whiskeys, initScores],
  );

  const handleSelectUser = useCallback(
    async (name: string) => {
      setUserName(name);
      setUserSelected(true);
      await setLastUsername(name);
      if (selectedThemeId != null) {
        await loadExistingScores(name, selectedThemeId);
      }
    },
    [selectedThemeId, loadExistingScores],
  );

  const handleContinueAsNew = useCallback(async () => {
    if (!userName.trim()) return;
    setUserSelected(true);
    await setLastUsername(userName.trim());
    initScores(whiskeys);
  }, [userName, whiskeys, initScores]);

  const handleSubmit = useCallback(async () => {
    if (!userName.trim() || selectedThemeId == null) return;

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: userName.trim(),
        whiskey_scores: scores,
      };
      await submitTasting(request);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        message: 'Tasting submitted! Pick the next person.',
        type: 'success',
        visible: true,
      });
      // Proxy flow: return to a fresh person picker, keep the theme.
      setUserSelected(false);
      setUserName('');
      initScores(whiskeys);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({
        message: 'Failed to submit. Try again.',
        type: 'error',
        visible: true,
      });
    } finally {
      setSubmitting(false);
    }
  }, [userName, selectedThemeId, scores, whiskeys, initScores]);

  const updateScore = useCallback(
    (whiskeyId: number, field: keyof WhiskeyScores, value: number) => {
      setScores((prev) => ({
        ...prev,
        [whiskeyId]: {
          ...prev[whiskeyId],
          [field]: value,
        },
      }));
    },
    [],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (themes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Themes</Text>
          <Text style={styles.emptyText}>
            Create a theme in the admin panel to start tasting.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const themeOptions = themes.map((t) => ({ label: t.name, value: t.id }));

  // Selection phase: choose theme + person.
  if (!userSelected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Dropdown
            label="Theme"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />

          <Text style={styles.sectionTitle}>Who are you?</Text>
          <Text style={styles.sectionSubtitle}>
            Select a name or enter a new one. You can submit for others too.
          </Text>

          {users.map((u) => (
            <Card
              key={u.id}
              onPress={() => handleSelectUser(u.name)}
              style={[
                styles.userCard,
                userName === u.name && styles.userCardActive,
              ]}
            >
              <Text
                style={[
                  styles.userName,
                  userName === u.name && styles.userNameActive,
                ]}
              >
                {u.name}
              </Text>
            </Card>
          ))}

          <View style={styles.divider} />
          <Text style={styles.orText}>Or enter a new name:</Text>
          <Input
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name..."
            autoCapitalize="words"
          />
          <Button
            title="Continue"
            onPress={handleContinueAsNew}
            disabled={!userName.trim()}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>

        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={() => setToast((t) => ({ ...t, visible: false }))}
        />
      </SafeAreaView>
    );
  }

  // Tasting form.
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.themeHeader}>
          <Text style={styles.themeName}>{selectedTheme?.name ?? ''}</Text>
          <Text style={styles.userLabel}>Tasting as: {userName}</Text>
          <Button
            title="Change Theme / User"
            variant="ghost"
            size="sm"
            onPress={() => setUserSelected(false)}
          />
        </View>

        {loadingWhiskeys ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          whiskeys.map((whiskey, index) =>
            whiskey.id != null ? (
              <WhiskeyCard
                key={whiskey.id}
                index={index}
                name={whiskey.name}
                proof={whiskey.proof}
                scores={
                  scores[whiskey.id] || {
                    aroma_score: 3,
                    flavor_score: 3,
                    finish_score: 3,
                    personal_rank: index + 1,
                  }
                }
                totalWhiskeys={whiskeys.length}
                onScoreChange={(field, value) =>
                  updateScore(whiskey.id!, field, value)
                }
              />
            ) : null,
          )
        )}

        <Button
          title={submitting ? 'Submitting...' : 'Submit Tasting'}
          size="lg"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || loadingWhiskeys}
          style={styles.submitButton}
        />
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  userNameActive: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  orText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  themeHeader: {
    marginBottom: spacing.lg,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  userLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors.

- [ ] **Step 3: Live verify — theme switching**

Open the Taste tab. Expected: a "Theme" dropdown at the top of the "Who are you?" screen, showing the first theme. Tap it → a modal lists all themes with a checkmark on the selected one. Pick a different theme → modal closes, dropdown shows the new name. (With one theme in the DB there is a single option; that is still correct behaviour.)

- [ ] **Step 4: Live verify — proxy submit flow**

Pick/enter a name → Submit Tasting. Expected: success toast "Tasting submitted! Pick the next person." and the screen returns to the theme + "Who are you?" picker with the name field cleared and the same theme still selected. Submitting again for a different name also succeeds. Confirm in `/tmp/wt-backend.log` that two `POST /api/v1/tastings` `200 OK` lines appear.

- [ ] **Step 5: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/app/tasting/index.tsx
git commit -m "Add theme dropdown and proxy submission flow to tasting screen"
```

---

### Task 4: Remove the Active Theme card from Home (#1, #2)

**Files:**
- Modify (full replace): `apps/mobile/app/index.tsx`

- [ ] **Step 1: Replace the file**

Write `apps/mobile/app/index.tsx` with exactly:

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { fetchSystemStatus, type SystemStatus } from '../lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const statusData = await fetchSystemStatus();
      setStatus(statusData);
    } catch (e) {
      setError('Could not connect to server. Check your settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.title}>WHISKEY{'\n'}TASTING</Text>
          <Text style={styles.subtitle}>// Have a drink!</Text>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Open Settings"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          </Card>
        )}

        {status && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_themes}
              </Text>
              <Text style={styles.statLabel}>Themes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_whiskeys}
              </Text>
              <Text style={styles.statLabel}>Whiskeys</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_tastings}
              </Text>
              <Text style={styles.statLabel}>Tastings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_users}
              </Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Start Tasting"
            size="lg"
            onPress={() => router.push('/tasting/')}
            style={styles.actionButton}
          />
          <Button
            title="View Results"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/dashboard')}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: fontSize.hero * 1.1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors (note `fetchActiveTheme` / `Theme` imports are gone).

- [ ] **Step 3: Live verify**

Open the Home tab. Expected: hero title, optional error card, the 4-stat grid, then the two buttons — **no "ACTIVE THEME" card**.

- [ ] **Step 4: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/app/index.tsx
git commit -m "Remove obsolete Active Theme card from Home screen"
```

---

### Task 5: Remove the fake ACTIVE badge from admin themes (#2)

The admin themes list hardcodes `index === 0` as "ACTIVE", which is meaningless now. Remove the badge and its unused style.

**Files:**
- Modify: `apps/mobile/app/admin/themes.tsx`

- [ ] **Step 1: Remove the badge JSX**

In `apps/mobile/app/admin/themes.tsx`, find:

```tsx
              <View style={styles.themeInfo}>
                {index === 0 && (
                  <Text style={styles.activeBadge}>ACTIVE</Text>
                )}
                <Text style={styles.themeName}>{theme.name}</Text>
```

Replace with:

```tsx
              <View style={styles.themeInfo}>
                <Text style={styles.themeName}>{theme.name}</Text>
```

- [ ] **Step 2: Drop the now-unused `index` param**

In the same file, find:

```tsx
          themes.map((theme, index) => (
            <Card key={theme.id} style={styles.themeCard}>
```

Replace with:

```tsx
          themes.map((theme) => (
            <Card key={theme.id} style={styles.themeCard}>
```

- [ ] **Step 3: Remove the unused `activeBadge` style**

In the same file's `StyleSheet.create({...})`, find and delete this entire block:

```tsx
  activeBadge: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
```

- [ ] **Step 4: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors (no unused `index`, no missing `styles.activeBadge`).

- [ ] **Step 5: Live verify**

Admin (password `admin`) → Manage Themes. Expected: theme cards show name/notes/Delete only — **no "ACTIVE" badge** on the first theme.

- [ ] **Step 6: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/app/admin/themes.tsx
git commit -m "Remove misleading hardcoded ACTIVE badge from admin themes"
```

---

### Task 6: RatingSlider — editable number field + integer mode (#3)

Adds an editable numeric field synced to the slider; precise typed values (e.g. `4.126`) are kept; clamps to range on blur; `integer` prop for Personal Rank.

**Files:**
- Modify (full replace): `apps/mobile/components/tasting/RatingSlider.tsx`

- [ ] **Step 1: Replace the file**

Write `apps/mobile/components/tasting/RatingSlider.tsx` with exactly:

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';

interface RatingSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  integer?: boolean;
}

export function RatingSlider({
  label,
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 5,
  integer = false,
}: RatingSliderProps) {
  const [text, setText] = useState(String(value));

  // Keep the field in sync when the value changes from outside (e.g. slider,
  // loading another user's saved scores).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) =>
    Math.min(maximumValue, Math.max(minimumValue, n));

  const commitText = () => {
    const parsed = integer ? parseInt(text, 10) : parseFloat(text);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const next = clamp(parsed);
    onValueChange(next);
    setText(String(next));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.valueInput}
          value={text}
          onChangeText={setText}
          onBlur={commitText}
          onSubmitEditing={commitText}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          selectTextOnFocus
          returnKeyType="done"
        />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={integer ? 1 : 0.1}
        value={value}
        onValueChange={(v) => onValueChange(integer ? Math.round(v) : v)}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.surfaceLight}
        thumbTintColor={colors.primary}
      />
      <View style={styles.labels}>
        <Text style={styles.rangeLabel}>{minimumValue}</Text>
        <Text style={styles.rangeLabel}>{maximumValue}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  valueInput: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors. (Visual verification is combined with Task 7, which feeds it the `integer` prop.)

- [ ] **Step 3: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/components/tasting/RatingSlider.tsx
git commit -m "Add editable numeric field and integer mode to RatingSlider"
```

---

### Task 7: WhiskeyCard — integer Personal Rank via RatingSlider (#3)

`RatingSlider` no longer takes `step`; Personal Rank now uses the new `integer` prop. Also drop the now-redundant `Math.round` wrapper.

**Files:**
- Modify: `apps/mobile/components/tasting/WhiskeyCard.tsx`

- [ ] **Step 1: Update the Personal Rank slider**

In `apps/mobile/components/tasting/WhiskeyCard.tsx`, find:

```tsx
      <RatingSlider
        label="Personal Rank"
        value={scores.personal_rank}
        onValueChange={(v) => onScoreChange('personal_rank', Math.round(v))}
        minimumValue={1}
        maximumValue={totalWhiskeys}
        step={1}
      />
```

Replace with:

```tsx
      <RatingSlider
        label="Personal Rank"
        value={scores.personal_rank}
        onValueChange={(v) => onScoreChange('personal_rank', v)}
        minimumValue={1}
        maximumValue={totalWhiskeys}
        integer
      />
```

- [ ] **Step 2: Type-check**

Run: `cd apps/mobile && npm run lint`
Expected: no TypeScript errors (no `step` prop passed anywhere; `RatingSlider` no longer declares it).

- [ ] **Step 3: Live verify — precise decimals + integer rank**

Taste tab → pick theme + name → on the form, for a whiskey:
- Tap the Aroma value field, type `4.126`, dismiss the keyboard. Expected: field shows `4.126`, slider thumb moves near it, value is **not** rounded to `4.1`.
- Type `9` into Flavor and blur. Expected: it clamps to `5`.
- Personal Rank field only accepts integers (number-pad), clamps to `1..N`.
- Submit, then check `/tmp/wt-backend.log` / the backend data: the submitted `aroma_score` for that whiskey is `4.126` (capture the device screen and, if needed, `curl -s http://localhost:8010/api/v1/tastings/...` is not required — the POST 200 plus the on-screen value is sufficient evidence).

- [ ] **Step 4: Commit**

```bash
cd /home/reasel/git/Whiskey-Tasting
git add apps/mobile/components/tasting/WhiskeyCard.tsx
git commit -m "Use integer RatingSlider mode for Personal Rank"
```

---

### Task 8: Full regression pass

- [ ] **Step 1: Type-check the whole app**

Run: `cd apps/mobile && npm run lint`
Expected: no errors.

- [ ] **Step 2: End-to-end live walkthrough**

With the emulator app reloaded, verify all five fixes in one pass and capture device screenshots:
1. Tab bar: five real Ionicons, no tofu (#4).
2. Home: no Active Theme card; stats + buttons only (#1/#2).
3. Taste: Theme dropdown lists all themes; switching reloads whiskeys (#1).
4. Taste: enter `4.126` for a score — kept precise; Personal Rank integer-only (#3).
5. Submit → returns to a cleared person picker, theme retained; submit a second person successfully; both `POST /api/v1/tastings` `200` in `/tmp/wt-backend.log` (#5).
6. Admin → Manage Themes: no ACTIVE badge (#2).

- [ ] **Step 3: Final commit (if any uncommitted touch-ups)**

```bash
cd /home/reasel/git/Whiskey-Tasting
git status --porcelain
# commit only if something remains, message e.g.:
# git commit -am "Polish mobile tasting UX fixes"
```

---

## Self-Review

**Spec coverage:**
- #1 theme selection → Task 2 (Dropdown) + Task 3 (wired into Tasting).
- #2 remove active concept → Task 3 (no `fetchActiveTheme` in Tasting), Task 4 (Home card removed), Task 5 (admin badge removed). No `setActiveTheme` added — matches the user's decision.
- #3 precise ratings → Task 6 (editable field + clamp) + Task 7 (integer rank).
- #4 tab icons → Task 1.
- #5 proxy submissions → Task 3 (post-submit returns to cleared picker, theme retained; existing "Change Theme / User" button).
- Home/Tasting empty states, error handling (Toast), data flow → covered in Task 3/4 code.

**Placeholder scan:** No TBD/TODO; every code step contains complete file/edit content; commands have expected output. The single "commit only if needed" in Task 8 Step 3 is intentional and explicit, not a placeholder.

**Type consistency:** `Dropdown` props (`value: number | string | null`, `options: {label,value}`, `onChange(value)`) are used consistently in Task 3 (`value={selectedThemeId}`, `onChange={handleThemeChange}` with `Number(value)`). `RatingSlider` final signature (no `step`; adds `integer`) matches its only callers in `WhiskeyCard` (Task 7) — Aroma/Flavor/Finish use defaults, Personal Rank uses `integer`. `SubmitTastingRequest`, `Theme`, `Whiskey`, `User` names match `lib/api`. `fetchThemes()` returns `{ themes }`, used as `themesResp.themes`.

No issues found requiring structural change.
