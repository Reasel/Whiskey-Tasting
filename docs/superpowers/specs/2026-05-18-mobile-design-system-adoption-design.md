# Mobile Design System Adoption — Design

Date: 2026-05-18
Branch: `claude/plan-mobile-apps-QG3gd`
App: `apps/mobile` (Expo / React Native, Expo SDK 54)

## Background

A complete design system was handed off in
`.claude/skills/whiskey-tasting-design/` (extracted from the
"Whiskey Tasting Design System" bundle). It defines a warm **Swiss
International Style × Neo-Brutalist** identity: canvas-cream paper, square
corners everywhere, hard offset (no-blur) shadows, a fixed Merriweather /
JetBrains Mono / Inter type triad, and a terse imperative voice.

The current mobile app is the visual opposite: a **dark** theme
(`#1a1a1a`), warm-tan accent (`#d4a574`), and **heavily rounded** corners
(`borderRadius` up to 16 / `full` 9999), system fonts only. This spec
covers re-skinning the existing mobile app to adhere to the handoff design
system, without changing app behavior, data flow, or navigation model.

The handoff files under `.claude/skills/whiskey-tasting-design/` are
**reference only** — they are not shipped and not imported by app code.

## Resolved decisions (from brainstorming)

1. **Primary color: Whiskey Amber, fully.** `#F59E0B` is the primary
   action color everywhere blue previously appeared (primary buttons,
   active tab, toggles, grid texture). Hyper Blue `#1D4ED8` is removed
   except the single dialog info `?` icon (kept as the only place blue
   carries "info" meaning). Amber pressed/darkened step: `#D97706`.
2. **Visual language, native navigation.** Adopt all visual tokens, type,
   shadow, copy, and voice — but keep the existing mobile bottom-tab
   navigation. Do **not** reproduce the web centered-panel / footer-bar /
   "← HOME" desktop chrome on the phone.
3. **Mono text tab bar, no icons.** Drop the Ionicons added earlier. The
   bottom tab bar shows JetBrains Mono uppercase labels only; the active
   tab is an amber fill (square, no indicator line).

## Architecture

**Approach: token-driven primitive layer + screen pass.** The entire
system lives in `lib/theme.ts` (tokens + typography presets + shadow
specs) plus a small set of shared primitives that enforce the
non-negotiable rules in one place. Screens are transformed to consume the
primitives; screen logic, state, and data flow are untouched. This makes
the "radius 0 / no fourth font / hard shadow" rules impossible to drift,
and is the lowest-risk incremental path on a working app.

### Headline rules (must not be violated)

1. `borderRadius: 0` everywhere. No exceptions.
2. Shadows are solid offset blocks with **no blur**.
3. Background is always canvas cream `#F0F0E8`; white is reserved for
   sub-cards (Card) inside sections.
4. Type triad is fixed (Merriweather serif / JetBrains Mono / Inter). No
   fourth family.
5. Eyebrow pattern: mono uppercase prefixed with `// `.
6. No emoji. No "we"/"us". No exclamations except Home's
   `// HAVE A DRINK!`.
7. Buttons use hard-state press: translate `(2,2)` and shadow collapses to
   zero on press. 150ms ease-out.

## Foundation

### `lib/theme.ts` (single source of truth, full rewrite)

- **Colors:** `canvasCream #F0F0E8`, `panelGrey #E5E5E0`,
  `lightGrey #D8D8D2`, `cardWhite #FFFFFF`, `inkBlack #000000`,
  `steelGrey #4B5563`, `mutedText #6B7280`, `whiskeyAmber #F59E0B`,
  `amberDark #D97706`, `signalGreen #15803D`, `alertOrange #F97316`,
  `alertRed #DC2626`, `hyperBlue #1D4ED8` (dialog info `?` icon only).
  The old dark palette keys are fully removed.
- **`borderRadius` export is deleted entirely.** Removing it makes any
  remaining rounded-corner reference a TypeScript compile error
  (intentional — surfaces drift during `npm run lint`).
- **Spacing:** `{ xs: 4, sm: 8, smd: 12, md: 16, lg: 24, xl: 32,
  xxl: 48, xxxl: 64, huge: 96 }`.
- **Borders:** `hairline = { borderWidth: 1, borderColor: '#000000' }`;
  status-icon border is `2px`.
- **Shadow specs** (offset + color, consumed by `HardShadow`):
  - `card`     → offset 2/2, color `#000000` (opacity 1)
  - `cardSoft` → offset 2/2, color `rgba(0,0,0,0.10)`
  - `panel`    → offset 8/8, color `rgba(0,0,0,0.10)`
  - `hero`     → offset 12/12, color `rgba(0,0,0,0.10)`
  - `modal`    → offset 8/8, color `rgba(0,0,0,0.20)`
- **Typography presets** (see table under `AppText`), exported as a
  `typography` map of `{ fontFamily, fontWeight, fontSize, lineHeight,
  letterSpacing, textTransform }`.

### Fonts

The triad is non-negotiable, so fonts are loaded properly:

- Add dependencies: `@expo-google-fonts/merriweather`,
  `@expo-google-fonts/jetbrains-mono`, `@expo-google-fonts/inter`,
  `expo-font`, `expo-splash-screen` (install via `npx expo install`).
- Root `app/_layout.tsx` calls `useFonts({...})` with the specific weights
  used (Merriweather 700; JetBrains Mono 500 & 700 & 400; Inter 400),
  keeps the splash screen visible (`SplashScreen.preventAutoHideAsync()`)
  until `fontsLoaded`, then `SplashScreen.hideAsync()` and renders. No
  system-font fallback flash, no FOUT.
- Font-family string names used in `typography` match the
  `@expo-google-fonts` export names exactly (e.g. `Merriweather_700Bold`,
  `JetBrainsMono_500Medium`, `JetBrainsMono_700Bold`,
  `JetBrainsMono_400Regular`, `Inter_400Regular`).

### Hard offset shadows — `components/ui/HardShadow.tsx`

React Native cannot render an offset, zero-blur shadow portably (Android
`elevation` is always blurred and centered; iOS shadow has a blur radius).
So shadows do **not** use native shadow props.

`<HardShadow offset="card|cardSoft|panel|hero|modal">` wraps a child and
renders a solid-color sibling `View`, absolutely positioned and shifted
by the token's offset, behind the child:

- The shadow `View` is `position: 'absolute'`, `top: dy`, `left: dx`,
  `right: -dx`, `bottom: -dy` relative to a `position: 'relative'`
  wrapper, filled with the token color, `zIndex` below the child.
- The child renders normally on top.
- Press-driven shadow collapse (buttons) is achieved by the Button
  conditionally rendering `HardShadow` with zero offset while pressed
  (see Button below) — `HardShadow` itself is presentational and stateless.

Every panel/card/button/toast shadow goes through `HardShadow`.

## Shared primitives

All primitives hardcode `borderRadius: 0` and pull color/spacing/type
from `lib/theme.ts`.

### `components/ui/AppText.tsx`

Replaces raw `<Text>` across the app. A `variant` prop selects a fixed
typography preset so the triad cannot drift:

| variant | family | weight | size | line-height | tracking | transform |
|---|---|---|---|---|---|---|
| `pageTitle` | Merriweather | 700 | 40 | 38 | -2% | UPPER |
| `sectionTitle` | Merriweather | 700 | 24 | 32 | -1% | as written |
| `eyebrow` | JetBrains Mono | 700 | 14 | 20 | +4% | UPPER |
| `fieldLabel` | JetBrains Mono | 700 | 12 | 16 | +8% | UPPER |
| `buttonLabel` | JetBrains Mono | 500 | 14 | 18 | +4% | UPPER |
| `body` | Inter | 400 | 16 | 24 | 0 | as written |
| `tableCell` | JetBrains Mono | 400 | 13 | 18 | 0 | as written |

- Default text color `inkBlack`; `color` prop overrides for semantic use.
- `letterSpacing` is computed in points from the percentage at the
  preset's font size (RN has no em-based tracking).
- `tableCell` sets `fontVariant: ['tabular-nums']`.
- Accepts standard `Text` props (`numberOfLines`, `style`, etc.).

### `components/ui/Eyebrow.tsx`

`AppText variant="eyebrow"` that auto-uppercases its children and
prefixes `// ` (idempotent — does not double-prefix if `// ` already
present). Used under every screen title and above forms.

### `components/ui/Button.tsx` (rewrite)

- **Variants:** `default` (amber `#F59E0B`, white label),
  `destructive` (red `#DC2626`, white), `success` (green `#15803D`,
  white), `warning` (orange `#F97316`, white), `outline` (transparent +
  1px black border, ink label), `secondary` (panelGrey, ink label),
  `ghost` (transparent, no border, no shadow), `link` (amber label,
  underline on press, no border/shadow/fill).
- **Sizes:** `sm` 32, `default` 40, `lg` 48, `xl` 96 (Home/Admin tiles),
  `icon` 40×40. Height is fixed; horizontal padding scales with size.
- Square, 1px black border (except `ghost`/`link`), wrapped in
  `HardShadow` `card` (except `ghost`/`link` which have no shadow).
- **Hard-state press** (RN has no hover; press merges hover+active):
  on `pressIn` the button content translates `(2, 2)` and the
  `HardShadow` offset collapses to zero; on `pressOut` it restores.
  `Animated`/transition ~150ms ease-out. The button looks like it
  physically presses into the page.
- **Disabled:** opacity `0.5`, no shadow, no press handler.
- Label always rendered via `AppText variant="buttonLabel"`.
- `block` prop = full width. Preserves existing `onPress`/`disabled`
  call sites.

### `components/ui/Card.tsx`

White fill, 1px black border, `HardShadow cardSoft`, `borderRadius: 0`,
padding `lg` (24). No title slot (callers compose `sectionTitle`
themselves).

### `components/ui/Panel.tsx` (new)

A screen section container (not a centered max-width box — phone uses
full width with screen padding). Cream fill, 1px black border,
`HardShadow panel`. Optional header sub-block: serif `sectionTitle` +
optional `Eyebrow`, 32px padding, 1px bottom black border. Body padding
`xl` (32) — `lg` (24) when screen width is narrow.

### `components/ui/Input.tsx` (rewrite)

Square, 1px black border, `cardWhite` fill, `fieldLabel` label above,
Inter value text, `mutedText` placeholder. No rounding, no focus glow —
focus is a 2px amber border. Preserves existing
`value`/`onChangeText`/`placeholder`/`keyboardType` props.

### `components/ui/Dropdown.tsx` (restyle only)

Keep the existing TouchableOpacity + Modal + ScrollView structure and
the String()-coerced equality logic. Restyle: square, 1px black border,
white fill, mono label, `HardShadow card` on the trigger, flat
`rgba(0,0,0,0.5)` modal overlay (no blur), square option rows separated
by 1px `lightGrey`, active/selected row amber-tinted. No API change.

### `components/ui/Toast.tsx` (restyle)

White fill, 1px black border, mono text (`AppText` body in mono context
→ use `tableCell`-style mono), `HardShadow card`, bottom-left,
auto-dismiss after 3 seconds. No rounding, no fade-blur.

### `components/ui/Tabs.tsx` + `ToggleRow` (new, used by screens & nav)

Square segmented control. Active segment = amber fill + white mono
(`buttonLabel`) label; inactive = panelGrey fill + steelGrey label.
1px black border around the group, 1px black dividers between segments.
Instant state swap — no slide, no fade. `ToggleRow` is the white-row
variant for settings-style on/off rows (amber "on" fill).

## Per-screen pass

Every screen sits on `canvasCream`, scrolls within a `Panel`-style
section, and leads with a Merriweather `pageTitle` + `Eyebrow`. Screen
logic, state, hooks, and data flow are **unchanged** — only the visual
layer and copy strings change. The recently delivered tasting/results
behavior (theme dropdown, proxy submit, focus-refresh, 0.5 slider step,
precise typed entry, integer rank, Results theme/person/sort filters,
rank-default sort) is fully preserved.

### `app/_layout.tsx` — tab bar + font gate

- Add the `useFonts` + `SplashScreen` gate (see Fonts).
- Remove all Ionicons / `tabBarIcon`.
- Tab bar: `canvasCream` background, 1px black top border, no rounding.
  Five tabs labelled in JetBrains Mono uppercase:
  `HOME / TASTE / RESULTS / ADMIN / SETTINGS`. Active tab = amber fill +
  white label; inactive = `steelGrey` label on cream. Instant swap.
  Implemented via `screenOptions`/`tabBar` custom render or
  `tabBarLabel` + `tabBarActiveBackgroundColor` — whichever cleanly
  yields a square amber active fill with a mono label and no icon row.

### `app/index.tsx` — Home

- `<GridBackground>` (amber-tinted, see below) behind content.
- `WHISKEY TASTING` `pageTitle`; `// HAVE A DRINK!` eyebrow (the one
  sanctioned exclamation).
- Stats rendered as white `Card`s.
- Primary destinations as `xl` amber `Button`s: `START TASTING`,
  `VIEW RESULTS`. The "ACTIVE THEME" card stays removed (prior decision).

### `app/tasting/index.tsx` — Taste

- `TASTING SUBMISSION` `pageTitle` + `// SUBMIT OR EDIT TASTING SCORES`.
- Theme & user `Dropdown`s restyled. A single bordered "Scores" `Panel`
  holds one whiskey `Card` each.
- Proxy submit + focus-refresh + deleted-theme fallback logic preserved
  verbatim.

### `components/tasting/WhiskeyCard.tsx`, `RatingSlider.tsx`, `ScoreDisplay.tsx`

- Square `Card`s; mono `fieldLabel`s reading
  `AROMA (1-5)` / `FLAVOR (1-5)` / `FINISH (1-5)` /
  `PERSONAL RANK (1-N)` (N = whiskey count).
- `RatingSlider`: amber `minimumTrackTintColor` + `thumbTintColor`,
  `maximumTrackTintColor` `lightGrey`; square mono value `TextInput`.
  `step 0.5` (1 for integer), precise typed entry, 6-decimal float-noise
  formatting, integer rank — all preserved.

### `app/dashboard.tsx` — Results / Data View

- `DATA VIEW` `pageTitle` + `// VIEW SUBMITTED TASTINGS` eyebrow.
- Theme / Person / Sort `Dropdown`s restyled and kept (defaults
  all/all/rank). Results render in white `Card`s with mono
  `tableCell` text, right-aligned numeric columns, 1px `lightGrey` row
  rules, no zebra striping. Rank-default sort and all filters preserved.

### `app/admin/*`

- `app/admin/_layout.tsx` password gate: small centered `Panel`,
  `fieldLabel` + square `Input` + amber `ENTER` `Button`. Dev password
  unchanged (`admin`).
- `app/admin/index.tsx`: `ADMINISTRATION` `pageTitle` +
  `// MANAGE THEMES, USERS, AND SETTINGS`; a 2-column grid of `xl`
  tiles. **Delete User** is the only `destructive` (red) tile.
- `app/admin/themes.tsx`, `users.tsx`, `data.tsx`: restyled to the same
  `Panel` / `Card` / `Input` / `Button` system. The fake "ACTIVE" badge
  stays removed (prior decision).

### `app/settings.tsx`

Same `Panel` / `Input` / `Button` system. Server-URL field becomes a
mono `Input`; save is an amber primary `Button`. Any on/off rows use
`ToggleRow`.

### `app/tasting/_layout.tsx`

Restyle the stack header (or keep headerless) consistent with cream +
no-rounding; no structural change.

## Voice & copy

Applied during the screen pass:

- No emoji anywhere. No "we"/"us". No exclamations except Home's
  `// HAVE A DRINK!`.
- Buttons command in mono uppercase (`SUBMIT TASTING`, `CREATE THEME`,
  `ENTER PASSWORD`, `SAVE`). Instructions use imperative + "you"
  (`Rate each whiskey on a scale of 1–5`).
- `// VERB-PHRASE` eyebrow under every page title; numeric ranges in
  parentheses (`AROMA (1-5)`, `PERSONAL RANK (1-3)`).
- Where any back affordance exists, use the literal `←` glyph, not an
  icon.
- Whiskey / person / theme names stay Title Case — never uppercased.

## Grid background — `components/ui/GridBackground.tsx`

- Add `react-native-svg` (Expo-standard; install via `npx expo install`).
- Draws an SVG `<Pattern>` of 1px lines on a 40×40 cell, color
  `rgba(245,158,11,0.12)` (amber-tinted per the "amber fully" decision),
  absolutely positioned to fill its parent behind content.
- Used on **Home only** (the dashboard/hero-equivalent surface). All
  other screens are plain `canvasCream`.

## Error handling

No new error paths. Existing try/catch + `Toast` patterns are preserved;
`Toast` is only restyled. Font-load failure: the splash gate keeps the
app on the splash screen until fonts resolve; if `useFonts` errors, fall
back to rendering with system fonts rather than blocking forever (Expo
`useFonts` returns an error tuple — render on `error` too, log it).

## Testing / verification

No automated UI test harness exists; the `lint` script is
`tsc --noEmit`.

1. `npm run lint` in `apps/mobile` — must pass type-check. The
   `borderRadius` export removal intentionally turns any remaining
   rounded-corner reference into a compile error; fix all before
   proceeding.
2. Live verification in the running Android emulator via **device-only**
   `adb exec-out screencap` (not host-screen capture), cross-checked
   against the handoff `preview/` specimens:
   - Background is canvas cream; no pure-white page background.
   - Zero rounded corners anywhere.
   - Shadows render as solid offset blocks with no blur on Android.
   - All three fonts load with no system-font flash (splash gate works).
   - Amber is primary (buttons, active tab, slider); blue appears only
     on the dialog info `?` icon.
   - Tab bar shows mono uppercase labels, no icons; active tab amber.
   - Eyebrows (`// …`) present under titles; no emoji anywhere.
   - Tasting / Results behavior unchanged (theme dropdown, proxy submit,
     0.5 slider + precise entry, Results filters, rank-default sort).

## Files touched

- `apps/mobile/lib/theme.ts` — full token rewrite (remove `borderRadius`)
- `apps/mobile/app/_layout.tsx` — font gate + mono text tab bar
- `apps/mobile/app/index.tsx` — Home + grid background
- `apps/mobile/app/tasting/index.tsx` — Taste restyle
- `apps/mobile/app/tasting/_layout.tsx` — header restyle
- `apps/mobile/app/dashboard.tsx` — Results restyle
- `apps/mobile/app/admin/_layout.tsx` — password gate restyle
- `apps/mobile/app/admin/index.tsx` — admin tiles restyle
- `apps/mobile/app/admin/themes.tsx` — restyle
- `apps/mobile/app/admin/users.tsx` — restyle
- `apps/mobile/app/admin/data.tsx` — restyle
- `apps/mobile/app/settings.tsx` — restyle
- `apps/mobile/components/tasting/WhiskeyCard.tsx` — restyle
- `apps/mobile/components/tasting/RatingSlider.tsx` — restyle
- `apps/mobile/components/tasting/ScoreDisplay.tsx` — restyle
- `apps/mobile/components/ui/Button.tsx` — rewrite
- `apps/mobile/components/ui/Card.tsx` — restyle
- `apps/mobile/components/ui/Input.tsx` — rewrite
- `apps/mobile/components/ui/Dropdown.tsx` — restyle (no API change)
- `apps/mobile/components/ui/Toast.tsx` — restyle
- `apps/mobile/components/ui/AppText.tsx` — new
- `apps/mobile/components/ui/Eyebrow.tsx` — new
- `apps/mobile/components/ui/HardShadow.tsx` — new
- `apps/mobile/components/ui/Panel.tsx` — new
- `apps/mobile/components/ui/Tabs.tsx` — new (Tabs + ToggleRow)
- `apps/mobile/components/ui/GridBackground.tsx` — new
- `apps/mobile/package.json` — add font + svg deps

## Out of scope

- Backend changes (none required).
- Reproducing the web centered-panel / footer-bar / "← HOME" desktop
  chrome on the phone (per the "native nav" decision).
- Offline `.woff2` font bundling (Google Fonts via `@expo-google-fonts`
  is sufficient).
- Shipping the `.claude/skills/whiskey-tasting-design/` handoff files
  (reference only).
- Changing app behavior, navigation model, or data flow.
- The web frontend (`apps/frontend`).
