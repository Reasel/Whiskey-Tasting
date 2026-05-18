# Mobile Tasting UX Fixes — Design

Date: 2026-05-18
Branch: `claude/plan-mobile-apps-QG3gd`
App: `apps/mobile` (Expo / React Native, Expo SDK 54)

## Background

While running the mobile app live in an Android emulator, the user found five
problems. This spec covers the design to fix all five. The web frontend
(`apps/frontend`) is the parity reference except where the user explicitly chose
to diverge (the "active theme" concept is removed on mobile).

## Issues and Goals

1. **No theme selection for tasting** — the tasting screen only loads the
   backend "active" theme; the user cannot choose which theme to submit for.
2. **Admin cannot set the active theme** — resolved by removing the "active
   theme" concept entirely (user decision); a per-submission theme dropdown
   replaces it. No admin set-active UI, no `ACTIVE` badge.
3. **Ratings cannot be set precisely** — aroma/flavor/finish use a slider with
   `step=0.5` displayed at one decimal; the user wants exact values like
   `4.126`. Backend already accepts floats.
4. **Tab bar icons render as tofu** — no `tabBarIcon` is configured, so
   React Navigation renders its `MissingIcon` placeholder, the glyph `⏷`
   (U+23F7), which Android's default font has no glyph for.
5. **Cannot easily re-select the current person** — the host wants to submit
   tastings on behalf of people who do not have the app, so switching the
   current user must be easy and repeatable, especially after a submit.

## Design

### Cross-cutting decision: no "active theme" concept on mobile

The mobile app stops calling `fetchActiveTheme()` from screens. Theme choice is
made per submission via a dropdown on the Tasting screen. The backend's
`/themes/active` endpoint and `fetchActiveTheme()` API wrapper are left in place
(harmless, unused by screens) to avoid unrelated churn.

### #1 + #2 — Theme dropdown

- **New component `components/ui/Dropdown.tsx`.** React Native has no native
  `<select>`. A reusable dropdown: a `TouchableOpacity` showing the current
  selection that opens a `Modal` containing a scrollable list of options,
  styled with the existing `colors`/`Card` conventions. Props:
  `label?`, `value`, `options: { label: string; value: T }[]`,
  `onChange(value: T)`, `placeholder?`. No new dependency.
- **`app/tasting/index.tsx`**:
  - Fetch all themes with `fetchThemes()` (drop `fetchActiveTheme()` usage).
  - Render the Theme dropdown at the top of the selection step.
  - Default selection: the first theme in the list (no persistence).
  - Changing the theme loads that theme's whiskeys
    (`fetchWhiskeysByTheme`) and re-initialises scores.
  - Empty state ("No themes") shows only when **zero** themes exist; the old
    "No Active Theme" block is removed.
- **`app/index.tsx` (Home)**: remove the "ACTIVE THEME" card and the
  `fetchActiveTheme` import/usage. Keep the stats grid, error card, and the
  Start Tasting / View Results buttons.
- **`app/admin/themes.tsx`**: remove the hardcoded `index === 0` → `ACTIVE`
  badge (it was always misleading). No other admin change.

### #5 — Proxy submissions / re-select user

The Tasting screen has two phases after load: a **selection phase** and the
**tasting form**.

- Selection phase shows the **Theme dropdown** and the existing **"Who are
  you?"** picker (existing users as cards + free-text new name) together.
- The selected theme persists across user switches (one flight, many people).
- The existing "Change User" button on the form remains
  (`setUserSelected(false)` returns to the selection phase).
- After a **successful submit**: show the success toast **and** return to the
  selection phase with the theme retained. The name input is cleared and the
  user picker is reset so the host starts the next person fresh; scores reset.
- Selecting an existing user still loads that user's saved scores for the
  current theme (existing `handleSelectUser` / `fetchUserTastingsForTheme`
  behaviour is preserved) so review/editing works.

### #3 — Slider + editable number field

- **`components/tasting/RatingSlider.tsx`**: replace the static value `Text`
  with an editable `TextInput` (`keyboardType="decimal-pad"`) shown next to the
  label, kept in sync with the slider.
  - While editing, the field holds raw text (so partial input like `4.` is
    allowed); on change, parse with `parseFloat`.
  - On blur (or submit) clamp to `[minimumValue, maximumValue]` and, if empty/
    invalid, revert to the last valid value.
  - The slider keeps working; `step` is lowered to `0.1` for finer dragging.
    The slider's `value` prop reflects the precise number (the thumb tracks it;
    the slider only snaps on user drag, not on programmatic value).
  - Precise typed values (e.g. `4.126`) are stored and submitted unchanged.
- `RatingSlider` gains an optional `integer?: boolean` prop. When set, the
  field uses `keyboardType="number-pad"`, parses with `parseInt`, disallows
  decimals, and the slider `step` is `1`.
- **`components/tasting/WhiskeyCard.tsx`**: Personal Rank reuses `RatingSlider`
  with `integer`, `minimumValue={1}`, `maximumValue={totalWhiskeys}` — no
  duplicated component.

### #4 — Tab bar icons

- **`app/_layout.tsx`**: add `tabBarIcon` to each `Tabs.Screen` using
  `@expo/vector-icons` `Ionicons` (already installed at v15.1.1; its font is
  auto-registered by Expo / expo-router, so no `useFonts` call is needed).
- Glyphs (filled when `focused`, `-outline` otherwise), tinted by the existing
  `tabBarActiveTintColor` / `tabBarInactiveTintColor`:
  - Home → `home` / `home-outline`
  - Taste → `wine` / `wine-outline`
  - Results → `stats-chart` / `stats-chart-outline`
  - Admin → `shield` / `shield-outline`
  - Settings → `settings` / `settings-outline`

## Data Flow

- Tasting screen load → `fetchThemes()` → default to `themes[0]` →
  `fetchWhiskeysByTheme(theme.id)` → init scores.
- Theme dropdown change → `fetchWhiskeysByTheme(newThemeId)` → reset scores.
- User select → `fetchUserTastingsForTheme(name, themeId)` → populate scores if
  the user already has data, else defaults.
- Submit → `submitTasting({ user_name, whiskey_scores })` → on success: toast +
  return to selection phase (theme retained, scores reset).

## Error Handling

- Network/API failures keep the existing pattern: `Toast` with an error message
  (e.g. "Could not connect to server."); screens already wrap calls in
  try/catch. Dropdown with zero themes shows the empty state, not an error.
- Rating field: invalid/empty input never propagates a `NaN` score — it reverts
  to the last valid value on blur and is clamped to range.

## Testing / Verification

No automated test harness exists for the mobile app (its `lint` script is
`tsc --noEmit`). Verification:

1. `npm run lint` in `apps/mobile` — passes type-check.
2. Live verification in the running Android emulator (device-level
   `adb exec-out screencap`, not host screen capture) plus backend access logs:
   - Tab bar shows real icons (no tofu).
   - Theme dropdown lists all themes and switching it changes the whiskeys.
   - Aroma/Flavor/Finish accept a typed precise decimal (e.g. `4.126`) and the
     submitted payload (verified via backend log / data) carries that value;
     Personal Rank stays integer.
   - Submitting for person A returns to the person picker with the theme kept;
     selecting person B then submitting works (proxy flow).
   - Home screen no longer shows the "ACTIVE THEME" card.

## Files Touched

- `apps/mobile/app/_layout.tsx` — tab icons (#4)
- `apps/mobile/app/index.tsx` — remove Active Theme card (#1/#2)
- `apps/mobile/app/tasting/index.tsx` — theme dropdown, proxy submit flow
  (#1/#2/#5)
- `apps/mobile/app/admin/themes.tsx` — remove fake ACTIVE badge (#2)
- `apps/mobile/components/tasting/RatingSlider.tsx` — editable number field (#3)
- `apps/mobile/components/tasting/WhiskeyCard.tsx` — integer rank field (#3)
- `apps/mobile/components/ui/Dropdown.tsx` — new reusable dropdown (#1)

## Out of Scope

- Backend changes (none required; it already accepts float scores and the
  `/themes/active` endpoint is simply no longer used by mobile screens).
- Persisting the last-used theme across app launches (deferred; default is the
  first theme).
- Web frontend changes.
