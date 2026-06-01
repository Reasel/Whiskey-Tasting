# After Dark — Mobile Redesign

- **Date:** 2026-05-30
- **Status:** Approved (design); ready for implementation plan
- **Target:** `apps/mobile/` (Expo / React Native, SDK 54)
- **Source of truth for visuals:** the "After Dark" design handoff (`~/Downloads/Whiskey Tasting After Dark Redesign.zip`) — high-fidelity, locked. Web prototype (`base.css`, `theme-afterdark.css`, `app.js`, `data.js`) is the behavior/visual reference to re-express in React Native.

## Overview

Reskin the mobile Whiskey Tasting app from its current light, Swiss/neo-brutalist
"design system" (cream canvas, ink black, Merriweather serif) into **"After Dark"**
— a candlelit speakeasy: warm near-black surfaces, whiskey **amber** promoted from
accent to hero color, low amber glow throughout, square corners retained. Beyond
the reskin, add the two feature areas the redesign introduced and that the app
lacks today:

1. **"The Results"** — a results reveal: podium (top 3, filling glasses), animated
   ranked bars with count-up scores, and a **"Closest to the group"** consensus
   stat.
2. **Nested-group Data View** — the results screen becomes tabbed:
   *The Results · All Whiskeys · By Theme · By Person*, with an accordion under
   By Theme.

Plus full-fidelity adoption of the handoff's new interactions (tactile rating
pips, rank pills, custom-taster toggle, New Theme stepper, celebrate overlay).

## Goals

- App becomes **dark-only** After Dark; the light palette is removed.
- Both new features work **with zero backend changes** (the existing API already
  exposes everything needed — confirmed during mapping).
- Match the handoff's look and motion closely, using the codebase's existing
  patterns (token-driven styling, `AppText` variants, `HardShadow`-style
  primitives, expo-router).

## Non-goals (YAGNI)

- No light/dark toggle or `ThemeProvider` — dark-only token swap.
- No backend changes; no new endpoints (optional server-side computation is
  explicitly declined).
- No live polling / websockets — the reveal animates on mount and on
  pull-to-refresh only.
- No auth changes (admin password gate stays as-is).
- No charts/animation libraries beyond what's installed; **no `react-native-reanimated`**, **no `expo-linear-gradient`**.

## Decisions (resolved)

| Decision | Choice |
|---|---|
| Theme strategy | **Replace with After Dark, dark-only.** Rewrite tokens; remove light palette. |
| Interaction scope | **Full After Dark fidelity** — reskin every screen + all new interactions. |
| Display font | **Switch to Fraunces** (900 for page titles, 600 for section/card titles); drop Merriweather. |
| Animation tech | **RN `Animated`** (built-in). No new native module. |
| Home layout | **Lean home** — hero + "tonight" strip + the two existing CTAs (Start Tasting / View Results). **No tile grid.** |
| Duplicate data screen | **Remove `app/admin/data.tsx`**; Admin "View Results" routes to the RESULTS tab. |
| Gradients/glass | Use **`react-native-svg`** (already installed) for the filling glass and gradient fills. |

## Theme architecture

Rewrite `lib/theme.ts` to After Dark **semantic tokens** (renaming away from
light-mode names like `canvasCream`/`inkBlack`). All consumers updated to the new
names.

**Color tokens** (from the handoff "After Dark palette"):

```
bg        #15120c   page background
bg2       #1d1810   panel gradient bottom
panel     #221c13   panel gradient top / modal card
raise     #2a2317   tiles, raised surfaces
cream     #efe7d4   primary text
dim       #b8ad94   secondary text
muted     #8a8068   tertiary text, placeholders, proof labels
line      #3a3120   borders / hairlines
amber     #f4a937   hero accent, primary buttons, active states
amberSoft #f6c069   fill top, focus text
ember     #c9742a   fill bottom, bar gradient start
deep      #8a4a16   deep amber
red       #e0563f   destructive (Delete User)
green     #8fbf6a   success/positive
glow      rgba(244,169,55,.30)   strong amber glow
glowSoft  rgba(244,169,55,.14)   soft amber glow
```

- **Page background** carries two faint radial amber glows (candlelight). On RN,
  implement as a static dark `bg` fill plus two large `react-native-svg`
  `<RadialGradient>` amber-haze layers (top-center and bottom-right), in a new
  `AfterDarkBackground` component that replaces `GridBackground` on dark screens.
- **Typography** presets rewritten to After Dark sizes/colors/families:
  page title Fraunces 900 (`clamp`→ RN: large fixed size with `adjustsFontSizeToFit`),
  section title Fraunces 600, eyebrow/labels/table JetBrains Mono, body Inter.
  Fonts loaded in `app/_layout.tsx` via `@expo-google-fonts/fraunces`
  (`Fraunces_900Black`, `Fraunces_600SemiBold`); remove Merriweather import.
- **Glow:** add a `glow`/`glowSoft` spec. A `GlowBox` wrapper renders amber glow
  via `shadowColor`/`shadowRadius`/`shadowOpacity` on iOS; on **Android** (which
  cannot render a colored blur) approximate with an amber 1px border + a layered
  translucent amber halo `View`. Documented fidelity compromise on Android.
- **`HardShadow`** stays for structural offset shadows but its default color
  shifts to read correctly on dark (darker, lower-opacity offsets); the panel's
  big soft drop shadow stays black.
- **Square corners** (`borderRadius: 0`) everywhere — unchanged.
- **`StatusBar`** → `style="light"`; `app.json` splash/adaptive backgrounds → `#15120c`.

## Navigation & screen map

Keep the 5 bottom tabs (`HOME · TASTE · RESULTS · ADMIN · SETTINGS`) and the
custom `WTTabBar` (reskinned to dark: `bg`/`panel` bar, amber active fill,
`line` top border).

| Tab / screen | Change |
|---|---|
| **HOME** (`app/index.tsx`) | Hero (logo w/ amber `drop-shadow` glow, Fraunces title, `// HAVE A DRINK!`), **"tonight" strip** (`PulsingDot` + active theme name + `N POURS · M TASTERS IN`), two reskinned CTAs (START TASTING → `/tasting/`, VIEW RESULTS → `/dashboard`). **No tiles.** Needs `fetchActiveTheme()` + a tasters-in count. |
| **TASTE** (`app/tasting/index.tsx`, `WhiskeyCard`) | Full submit redesign (§ Tasting Submission). |
| **RESULTS** (`app/dashboard.tsx`) | Becomes the **tabbed Data View**; default sub-tab = **The Results** reveal. |
| **ADMIN** (`app/admin/*`) | Reskin tiles/forms; New Theme gets a stepper. "View Results" → RESULTS tab. **Delete `app/admin/data.tsx`** and its route registration in `app/admin/_layout.tsx`. |
| **SETTINGS** (`app/settings.tsx`) | Reskin to dark tokens. |

## New shared components

`components/ui/`:

| Component | API (sketch) | Notes / modeled on |
|---|---|---|
| `TactileRating` | `{ value:number; onChange:(n:number)=>void; max?=5 }` | 5 pips (tap to set integer; tapping current clears to one below) + **fractional fill** (last pip `scaleY`=frac) + exact-decimal `TextInput` (accepts digits+one dot, clamp 0–5, sync both ways, reformat ≤2dp on blur). Reuse `RatingSlider`'s clamp/format/commit logic; pip taps fire `expo-haptics`; press feedback echoes `Button`. |
| `RankPills` | `{ value:number; count:number; onChange:(n:number)=>void }` | Square 1..N single-select; selected = amber fill + glow. Replaces the integer rank slider. |
| `Stepper` | `{ value:number; min?:number; max?:number; onChange:(n:number)=>void }` | `− N +`. New Theme whiskey count (clamp 1–8). |
| `CustomTasterToggle` | `{ custom:boolean; onToggle:()=>void }` | Mono toggle button ("Custom"/"List"); parent swaps dropdown ↔ name `Input`. Modeled on `ToggleRow`. |
| `PodiumGlass` | `{ place:1\|2\|3; fillPct:number; animate:boolean }` | `react-native-svg` trapezoid (clipPath) with an `Animated` amber-gradient fill rect + glow. |
| `RankedBar` | `{ rank:number; name:string; proof:number\|null; score:number; max:number; top?:boolean; animate:boolean }` | Animated-width amber bar (gradient) + `CountUp` score; `top` adds glow. |
| `CountUp` | `{ value:number; decimals?=1; animate:boolean }` | `Animated.Value` 0→target over 850ms, cubic ease-out, tabular-nums via `AppText`. |
| `Accordion` | `{ header:ReactNode; children:ReactNode; defaultOpen?:boolean }` | Chevron rotate + animated height (measure content; `Animated` height or `LayoutAnimation`). |
| `CelebrateOverlay` | `{ visible:boolean; userName:string; themeName:string; onSeeResults:()=>void; onHome:()=>void }` | `Modal` scrim + slide/fade card + filling glass; `// LOGGED`, "Cheers, <name>.". Modeled on `Toast` lifecycle. |
| `PulsingDot` | `{ size?:number }` | Looping amber opacity/glow pulse for "tonight". |
| `GlowBox` | `{ intensity?:'soft'\|'strong'; color?:string; children }` | Reusable amber glow wrapper (iOS shadow / Android halo). |

`components/tasting/`:
- **Replace** `RatingSlider` usage in `WhiskeyCard` with `TactileRating` (aroma/
  flavor/finish) + `RankPills` (personal rank). `RatingSlider` may be deleted
  once unused; `@react-native-community/slider` dependency removed if nothing else
  uses it.

## Feature 1 — "The Results" reveal

Default sub-tab of the Data View, **scoped to the active theme**.

- Data: `fetchActiveTheme()` → new wrapper `fetchThemeScores(themeId)` (GET
  `/tastings/themes/{id}/scores`). Ignore `rank_by_average` (returns 0 / buggy);
  derive order from `average_score` desc.
- **Podium (top 3):** visual order **2 · 1 · 3**, glasses fill to **82% / 64% /
  50%**, medal labels (1st amber-glow), whiskey name, **count-up score**.
- **Ranked bars:** every whiskey best-first — mono rank `01`, Fraunces name +
  mono proof, amber bar animating to `score / max` (max = `max(scores, 5)`),
  count-up score; #1 bar glows.
- **Consensus — "Closest to the group":**
  - For each whiskey, group per-dimension average = mean of `aroma_score` /
    `flavor_score` / `finish_score` across that whiskey's `scores[]`.
  - For each taster: mean absolute deviation = mean over every
    `whiskey × {aroma, flavor, finish}` of `|tasterScore − groupAvg|`. **Skip
    whiskeys a taster didn't score** (don't penalize partial participation).
  - Sort ascending (lowest = closest). Render ranked list: ★ for #1 (else
    `02/03…`), taster name, animated closeness bar, `±X.XX avg off` (2 dp).
    #1 row highlighted amber + glow.
- **Reveal timeline** (RN `Animated`, on mount / refresh, staggered; honor
  `prefers-reduced-motion` via `AccessibilityInfo.isReduceMotionEnabled`):
  glasses fill → podium columns rise (opacity + translateY, 120ms stagger) →
  scores count up → bars fill (90ms stagger) → consensus bars fill. Count-up
  850ms cubic; fills ~0.9–1.1s `cubic-bezier(.16,1,.3,1)` (RN: `Easing.bezier`).
- **Empty states:** no active theme → prompt to create one; active theme with no
  submissions → "no scores yet."

## Feature 2 — Nested-group Data View

`app/dashboard.tsx` rebuilt around the existing unused `Tabs` segmented control:
**The Results · All Whiskeys · By Theme · By Person**.

- **The Results** — § Feature 1 (active theme).
- **All Whiskeys** — table across all themes with submissions:
  `Whiskey · Theme · Proof · Avg Score · Tasters` (from `fetchAllThemesScores`).
- **By Theme** — one card per theme (name + notes); an **`Accordion`** row per
  whiskey (chevron, name, proof, `N.N AVG`, `N TASTERS`) expanding to a per-taster
  table `Taster · Aroma · Flavor · Finish · Avg · Rank`.
- **By Person** — card per taster (active theme): `Whiskey · Proof · Aroma ·
  Flavor · Finish · Avg · Rank`.
- Tables tightened (cell padding / font) to fit phone width without horizontal
  scroll, per the handoff's stated owner preference; a scroll wrapper remains as a
  safety net only.

## Tasting Submission redesign

`app/tasting/index.tsx` + `WhiskeyCard`:

- Theme select + taster select side-by-side (stack on phone); taster field has the
  **`CustomTasterToggle`** (swap dropdown ↔ "Type a name…" input).
- `// Scores` header + instruction line.
- One **pour card** per whiskey: header (mono pour number `01`, Fraunces name,
  mono proof), then `TactileRating` for AROMA / FLAVOR / FINISH and `RankPills`
  for PERSONAL RANK.
- **Submit bar:** amber **progress meter** (= filled fields / total fields) +
  SUBMIT, disabled until taster set and every aroma/flavor/finish/rank is non-zero.
- On submit → **`CelebrateOverlay`** → "SEE THE RESULTS" (RESULTS tab, Results
  sub-tab) or "← HOME". Keep existing haptics.
- **Clamp scores 1–5** client-side before POST (backend doesn't validate).
- Preserve existing behaviors: proxy/default submitter, loading saved scores for
  edit, theme switch rebuilds a fresh sheet.

## Admin / New Theme / Settings

- **Admin landing:** reskinned tile/button grid (Create New Theme, Edit Themes,
  Add User, Delete User [destructive/red glow], View Results → RESULTS tab).
- **New Theme:** dark form — Theme Name, Description/Notes, **`Stepper`** for
  number of whiskeys (clamp 1–8) driving a dynamic whiskey-row list
  (`NN · name · proof`), CREATE THEME. Wired to existing `createTheme` /
  `updateWhiskeys`.
- **Settings:** reskin to dark tokens (Server Connection, Default Submitter, About).

## Data / scoring layer

New `lib/scoring.ts` — single source of truth, lifting aggregation currently
inline in `dashboard.tsx`:

- `leaderboard(theme: ThemeScoresResponse): RankedWhiskey[]` — whiskeys by
  `average_score` desc; rank derived locally; mark unscored whiskeys (avg 0,
  0 tasters) so they aren't shown as "worst."
- `consensus(theme: ThemeScoresResponse): ConsensusEntry[]` —
  `{ user_name, meanAbsDeviation, rank }`, ascending; per the formula above,
  skipping unscored whiskeys per taster.
- `allWhiskeys(all: ThemeScoresResponse[]): AllWhiskeyRow[]`.
- `byPerson(theme: ThemeScoresResponse): Record<userName, PersonWhiskeyRow[]>`.
- `whiskeyBreakdown(whiskey: WhiskeyScores): TasterRow[]` (for the accordion).

New API wrapper in `lib/api/tastings.ts`:
- `fetchThemeScores(themeId: number): Promise<ThemeScoresResponse>` →
  GET `/tastings/themes/{themeId}/scores`.

Tasters are joined by `user_name` (scores carry no user id). Handle
missing/renamed users gracefully.

## Animation patterns (RN `Animated`)

- **Bars / glass fill:** `Animated.timing` on width / fill height,
  `Easing.bezier(.16,1,.3,1)`, ~900–1100ms, staggered via `delay`.
- **Count-up:** `Animated.Value` 0→1 over 850ms with a listener formatting
  `value*target` (cubic ease-out); cancel on unmount.
- **Pulsing dot / glow:** `Animated.loop` opacity/scale.
- **Celebrate overlay:** `Animated.sequence` (fade scrim, slide+fade card, then
  fill glass), like `Toast`.
- **Reduced motion:** if enabled, render final state immediately (no entrance/
  cascade), matching the prototype's `prefers-reduced-motion` handling.
- SVG fills animated via `react-native-svg`'s `createAnimatedComponent`.

## Edge cases

- No active theme; active theme with zero submissions.
- Fewer than 3 whiskeys → podium shows fewer columns.
- Single taster → consensus deviation 0 for all; render gracefully.
- Whiskey with no scores → "unscored," excluded from podium/penalty.
- Long whiskey/theme names → `numberOfLines` / `adjustsFontSizeToFit`.
- `rank_by_average` is unreliable from the all-themes endpoint — never trust it.

## File-by-file impact

**Created:** `lib/scoring.ts`; `components/ui/{TactileRating,RankPills,Stepper,CustomTasterToggle,PodiumGlass,RankedBar,CountUp,Accordion,CelebrateOverlay,PulsingDot,GlowBox,AfterDarkBackground}.tsx`.

**Modified:** `lib/theme.ts` (token rewrite + glow + fonts), `app/_layout.tsx`
(fonts, StatusBar, tab bar reskin), `app.json` (splash/adaptive colors),
`app/index.tsx` (lean home), `app/dashboard.tsx` (tabbed Data View + Results),
`app/tasting/index.tsx` & `components/tasting/WhiskeyCard.tsx` (tactile rating,
rank pills, custom toggle, progress, celebrate), `app/admin/index.tsx`,
`app/admin/themes.tsx` (stepper), `app/admin/users.tsx`, `app/admin/_layout.tsx`
(drop data route), `app/settings.tsx`, `lib/api/tastings.ts` (new wrapper), and
every component in `components/ui/` consuming old color tokens.

**Deleted:** `app/admin/data.tsx`; likely `components/tasting/RatingSlider.tsx`
(+ `@react-native-community/slider` dep if unused elsewhere).

## Verification

- `npm run lint` (`tsc --noEmit`) clean.
- Run on the Android emulator (per `mobile-dev.md`): walk every screen; verify
  dark theme + Fraunces; tactile rating fractional fill + decimal entry;
  rank pills; submit → celebrate → Results reveal (podium fill, count-up, bars,
  consensus); all four Data View tabs; By Theme accordion expand; New Theme
  stepper; empty states.
- Confirm no light-mode color leaks (search for old token names).

## Conventions

Per the user's global instructions, commits and PRs for this work must **not**
include any AI attribution (no `Co-Authored-By`, no "Generated with…").
