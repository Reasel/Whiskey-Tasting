# Mobile Taste Tab Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline THEME dropdown to the Taste tab scoring view and default to the most recently created theme on cold start.

**Architecture:** Client-side sort the themes array by `created_at` descending (the `/api/v1/themes` endpoint returns insertion order — no backend change). Reuse the existing `Dropdown` component and the existing `handleThemeChange` callback (already refetches whiskeys + scores for the selected user on theme change). All changes live in a single file: `apps/mobile/app/tasting/index.tsx`.

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-router 6, TypeScript. No test framework in the mobile app; verification is `tsc --noEmit` plus manual on-device.

**Spec:** `docs/superpowers/specs/2026-05-27-mobile-taste-theme-switcher-design.md`

---

## File Touch Points

Only `apps/mobile/app/tasting/index.tsx` is modified. No new files, no new components, no new API endpoints, no new storage keys.

Three logical edits:
1. New module-scope sort helper + use it in both fetch sites (`loadData` and the focus-effect refresh).
2. Replace the standalone theme-name title in the scoring-phase header with the `Dropdown` component, and remove the now-unused `selectedTheme` derived value.
3. On-device verification + mark Issues.md acceptance criteria complete.

---

## Task 1: Sort themes by recency in both fetch sites

**Why:** The backend returns themes in TinyDB insertion order. To default to the most recently created theme AND to list dropdown options recent-first (selection phase + new scoring-phase dropdown), sort once on the client immediately after fetch. A pure helper keeps both call sites consistent.

**Files:**
- Modify: `apps/mobile/app/tasting/index.tsx`

- [ ] **Step 1: Read the current top-of-file imports**

Open `apps/mobile/app/tasting/index.tsx` and confirm `Theme` is already imported from `../../lib/api` (it is — line 28). No new imports needed for this task.

- [ ] **Step 2: Add the `sortThemesByRecent` helper at module scope**

Insert the helper between the imports block and the `type WhiskeyScores = ...` declaration (just before line 39 / `type WhiskeyScores`). The `created_at` field is an ISO 8601 string set by the backend via `datetime.now(timezone.utc).isoformat()` — ISO 8601 strings compare lexicographically in chronological order, so `localeCompare` works without parsing.

```ts
// `created_at` is a UTC ISO 8601 string from the backend; lexicographic
// compare matches chronological order, so no Date parsing is needed.
function sortThemesByRecent(themes: Theme[]): Theme[] {
  return [...themes].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
```

- [ ] **Step 3: Apply the sort in `loadData`**

In the `loadData` callback (currently ~lines 140–181), find this block:

```ts
      setThemes(themesResp.themes);
      setUsers(usersData.users);
      setDefaultUserName(defaultName ?? null);

      const firstTheme = themesResp.themes[0];
      let freshWhiskeys: Whiskey[] = [];
      if (firstTheme) {
        setSelectedThemeId(firstTheme.id);
        freshWhiskeys = await loadWhiskeys(firstTheme.id);
      }
```

Replace it with:

```ts
      const sortedThemes = sortThemesByRecent(themesResp.themes);
      setThemes(sortedThemes);
      setUsers(usersData.users);
      setDefaultUserName(defaultName ?? null);

      const firstTheme = sortedThemes[0];
      let freshWhiskeys: Whiskey[] = [];
      if (firstTheme) {
        setSelectedThemeId(firstTheme.id);
        freshWhiskeys = await loadWhiskeys(firstTheme.id);
      }
```

- [ ] **Step 4: Apply the sort in the focus-effect refresh**

In the `useFocusEffect` block (currently ~lines 211–260), find this block:

```ts
          if (!active) return;
          setThemes(themesResp.themes);
          setUsers(usersData.users);
          setDefaultUserName(defaultName ?? null);

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
```

Replace it with:

```ts
          if (!active) return;
          const sortedThemes = sortThemesByRecent(themesResp.themes);
          setThemes(sortedThemes);
          setUsers(usersData.users);
          setDefaultUserName(defaultName ?? null);

          const cur = selectedThemeIdRef.current;
          if (cur != null && !sortedThemes.some((t) => t.id === cur)) {
            // The selected theme was deleted elsewhere — fall back to the
            // most recent remaining theme and return to the selection screen.
            const first = sortedThemes[0] ?? null;
            setSelectedThemeId(first ? first.id : null);
            setUserSelected(false);
            if (first) loadWhiskeys(first.id);
            return;
          }
```

- [ ] **Step 5: Run TypeScript check**

Run from the repo root:

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no output (clean exit). If you see errors, fix them before moving on.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/tasting/index.tsx
git commit -m "Sort Taste tab themes by recency on mobile

Default the picker to the most recently created theme and list
dropdown options recent-first in both the selection and scoring
phases. The backend /themes endpoint returns insertion order, so
the sort happens client-side via a small helper."
```

---

## Task 2: Add the THEME dropdown to the scoring-phase header

**Why:** With a default user configured (Issue 1), the selection phase is skipped and the user lands directly in the scoring view, which currently has no way to change theme. Adding the dropdown right in the scoring header — using the same `Dropdown` component and `handleThemeChange` callback the selection phase already uses — closes the gap with zero new wiring.

**Files:**
- Modify: `apps/mobile/app/tasting/index.tsx`

- [ ] **Step 1: Remove the now-unused `selectedTheme` derived value**

In `apps/mobile/app/tasting/index.tsx`, find this block (currently ~lines 65–66):

```ts
  const selectedTheme =
    themes.find((t) => t.id === selectedThemeId) ?? null;
```

Delete it. After Step 2 below, no other reference to `selectedTheme` remains, and leaving it would cause an unused-variable warning.

- [ ] **Step 2: Replace the static theme title with the Dropdown in the scoring-phase header**

In the scoring-phase JSX (currently ~lines 467–481), find this block:

```tsx
        <View style={styles.themeHeader}>
          <AppText variant="sectionTitle">{selectedTheme?.name ?? ''}</AppText>
          <AppText variant="tableCell" style={styles.userLabel}>
            Tasting as: {userName}
          </AppText>
          <View style={styles.changeUserWrap}>
            <Button
              title="CHANGE USER"
              variant="outline"
              size="sm"
              onPress={() => setUserSelected(false)}
            />
          </View>
        </View>
```

Replace it with:

```tsx
        <View style={styles.themeHeader}>
          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />
          <AppText variant="tableCell" style={styles.userLabel}>
            Tasting as: {userName}
          </AppText>
          <View style={styles.changeUserWrap}>
            <Button
              title="CHANGE USER"
              variant="outline"
              size="sm"
              onPress={() => setUserSelected(false)}
            />
          </View>
        </View>
```

Note: `Dropdown`, `selectedThemeId`, `themeOptions`, and `handleThemeChange` are all already imported / defined in this file. `Dropdown` carries its own `marginBottom: spacing.md` so it sits naturally inside the existing `themeHeader` container.

- [ ] **Step 3: Run TypeScript check**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: no output. If `selectedTheme` errors persist, double-check Step 1 of this task.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/tasting/index.tsx
git commit -m "Add THEME dropdown to mobile Taste scoring view

Replaces the static theme-name title in the scoring header with the
same Dropdown the selection phase uses. Wired to the existing
handleThemeChange callback, so switching themes mid-tasting refetches
whiskeys and the active user's scores."
```

---

## Task 3: On-device verification + mark acceptance criteria complete

**Why:** The mobile app has no automated test framework; the spec requires manual verification on the emulator. After verification, flip the Issues.md acceptance checkboxes for Issue 3 to record completion.

**Files:**
- Verify (no edits expected): `apps/mobile/app/tasting/index.tsx`
- Modify: `Issues.md`

- [ ] **Step 1: Confirm the emulator + backend + Metro are running**

The session-context infrastructure was: `wt_emulator` on port 5554, backend uvicorn on 8010, Expo Metro on 8081, with `adb reverse tcp:8010 tcp:8010 && adb reverse tcp:8081 tcp:8081` tunnels active.

Run:

```bash
adb devices
```

Expected: `emulator-5554   device` in the output.

If the emulator isn't listed, start it from `apps/mobile/` per `MEMORY.md` → `mobile-dev.md`. If listed but the app isn't responding, re-establish the reverse tunnels:

```bash
adb reverse tcp:8010 tcp:8010 && adb reverse tcp:8081 tcp:8081
```

- [ ] **Step 2: Reload the app and trigger a Metro rebuild**

From the running Metro window (or by tapping `r` in the Expo CLI), reload the bundle. Confirm the rebuild completes without errors in `/tmp/expo.log` or the Metro terminal.

- [ ] **Step 3: Verify default theme is the most recent on cold launch (default user set)**

Preconditions: a default user is configured in Settings (carried over from Issue 1), and at least two themes exist (create one in Admin if needed so there's something to switch between).

1. Force-stop the app on the emulator:
   ```bash
   adb shell am force-stop host.exp.exponent
   ```
   (Or the dev-client package id if running outside Expo Go.)
2. Reopen the app and tap **Start Tasting**.
3. Confirm the scoring view loads directly (no user picker shown).
4. Confirm the **THEME** dropdown at the top of the header shows the *most recently created* theme name as its current value.

- [ ] **Step 4: Verify the scoring-phase dropdown switches themes**

1. Tap the THEME dropdown — the modal sheet should open, listing all themes with the most recent at the top.
2. Pick a different theme.
3. Confirm: the whiskey list updates to the new theme's whiskeys, the THEME control now shows the new theme's name, the "Tasting as:" line is unchanged, and you remain in the scoring view (no bounce back to the picker).
4. If you previously submitted scores for this user/theme combination, confirm those scores populate; otherwise the default scores (3/3/3, rank by index) render.

- [ ] **Step 5: Verify selection-phase dropdown is also recent-first**

1. Tap **CHANGE USER** to return to the selection phase.
2. Tap the THEME dropdown there.
3. Confirm the option order matches the scoring-phase dropdown (most recent at the top).

- [ ] **Step 6: Flip Issue 3 acceptance criteria in `Issues.md`**

Edit `Issues.md`. In the Issue 3 section, change these three lines:

```markdown
- [ ] Theme switcher is visible on the Taste tab.
- [ ] Default selection is the most recently created theme.
- [ ] Switching themes from the Taste tab updates the whiskey list / submission target accordingly.
```

to:

```markdown
- [x] Theme switcher is visible on the Taste tab.
- [x] Default selection is the most recently created theme.
- [x] Switching themes from the Taste tab updates the whiskey list / submission target accordingly.
```

Then append a one-line **Status:** paragraph below the "Notes / open questions" block, mirroring the Issue 1 format:

```markdown
**Status:** Resolved on branch `claude/plan-mobile-apps-QG3gd`. Mobile only — web frontend out of scope (matches Issue 1 scope). Themes are sorted client-side by `created_at` desc; the new scoring-phase Dropdown reuses the existing `handleThemeChange` callback, so switching themes mid-tasting refetches whiskeys and the active user's existing scores. Verified on-device: default user lands in the scoring view on the most recent theme; the dropdown switches themes without leaving the scoring view; both phases list themes recent-first.
```

- [ ] **Step 7: Commit Issues.md update**

```bash
git add Issues.md
git commit -m "Mark Issue 3 acceptance criteria complete"
```

---

## Self-Review

**Spec coverage:**
- Architecture (inline Dropdown reusing existing handler, client-side sort) → Tasks 1 + 2.
- UI placement (THEME above "Tasting as:" line in scoring header) → Task 2, Step 2.
- Default theme = most recent → Task 1, Step 3 (sorts in `loadData`).
- Recent-first dropdown ordering in both phases → Task 1, Step 3 + Step 4 (sorted state drives both dropdowns).
- Theme-switching mid-tasting delegates to existing `handleThemeChange` → Task 2, Step 2.
- Deleted-theme fallback updated to fall back to most recent → Task 1, Step 4.
- `tsc --noEmit` passes → Task 1, Step 5 + Task 2, Step 3.
- On-device verification → Task 3, Steps 3–5.
- Issues.md acceptance ticked → Task 3, Step 6.

**Placeholder scan:** None. Each code step shows the exact replacement; each verification step shows expected behavior; no "TBD" / "handle errors" / "similar to" text.

**Type consistency:** `Theme`, `Whiskey`, `selectedThemeId`, `themeOptions`, `handleThemeChange`, `loadWhiskeys`, `sortThemesByRecent` — all names match between tasks. `sortThemesByRecent` signature is `(themes: Theme[]) => Theme[]` and is used the same way in both call sites.
