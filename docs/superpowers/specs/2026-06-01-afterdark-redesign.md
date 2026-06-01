# After Dark Redesign — Implementation Spec

**Design source:** `~/Downloads/whiskey-afterdark/design_handoff_after_dark_redesign/`  
**Target:** `apps/frontend/` — Next.js 16 / React 19 / Tailwind CSS 4 / TypeScript

---

## 1. Foundation

### Typography
Add **Fraunces** (weights 600, 900) via `next/font/google` in `apps/frontend/app/layout.tsx` alongside existing Inter + JetBrains Mono.

### CSS Custom Properties
Add to `apps/frontend/app/(default)/css/globals.css` (as `:root` vars):
```
--bg: #15120c        page background
--bg2: #1d1810       panel gradient bottom
--panel: #221c13     panel gradient top
--raise: #2a2317     tiles, raised surfaces
--cream: #efe7d4     primary text
--dim: #b8ad94       secondary text
--muted: #8a8068     tertiary / placeholders
--line: #3a3120      borders / hairlines
--amber: #f4a937     hero accent
--amber-soft: #f6c069
--ember: #c9742a
--glow: rgba(244,169,55,.30)
--glow-soft: rgba(244,169,55,.14)
--red: #e0563f       destructive
--green: #8fbf6a
```

### Body
`body`: background `var(--bg)`, color `var(--cream)`. Remove the current `bg-[#F0F0E8] text-black`.

### Keyframes (add to globals.css)
- `ad-pulse` — amber dot opacity oscillation (used on tonight strip live dot)
- `screen-in` — `opacity 0→1 + translateY 14px→0` at 0.42s (all screen-level divs)
- `stagger-in` — `opacity 0→1 + translateY 18px→0` with per-child delays
- `pip-pop` — `scale .6→1.12→1` (pip cascade tap animation)
- All respect `prefers-reduced-motion: reduce`

---

## 2. Shared Layout Pattern

Every page gets a **screen wrapper** and a **panel**:
```
<div className="screen">          ← dark page bg, min-h-screen, padding 40px 24px 80px
  <div className="panel">         ← max-w-[1180px] mx-auto, gradient bg, border, shadow
    <div className="panel-head">  ← padding 44px, border-bottom
    <div className="panel-body">  ← padding 34px 44px 48px
```
Panel styles: `background: linear-gradient(180deg, var(--panel), var(--bg2))`, `border: 1px solid var(--line)`, `box-shadow: 0 30px 80px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(244,169,55,.04)`. Square corners (radius 0) everywhere.

---

## 3. Pages

### 3a. Home (`app/(default)/page.tsx`)
Full viewport flex-center, `max-width: 920px`.

**Hero section:**
- Logo `<img src="/logo.svg">` 70px with `filter: drop-shadow(0 0 22px var(--glow))`
- Title: `WHISKEY TASTING` — Fraunces 900, `clamp(52px, 9vw, 110px)`, cream, text-shadow amber glow
- Eyebrow: `// HAVE A DRINK!` — JetBrains Mono 500, 13px, `#f4a937`, tracking `.22em`

**Tonight strip:**
- Flex row: pulsing amber dot + `TONIGHT` label | theme name (Fraunces 600 22px) | `N POURS · N TASTERS IN` right-aligned
- Background `rgba(0,0,0,.3)`, border `var(--line)`, Mono uppercase

**Tile grid (3 columns → 1 col below 720px):**
Each tile: `background: var(--raise)`, border, min-height 168px, flex-column. Contents: mono amber sub-label (`// RATE THE POURS`), Fraunces 600 27px label, amber `→` arrow bottom-right.
Hover: border → amber, `translateY(-3px)`, amber box-shadow glow, arrow slides +5px, radial amber glow fades in from bottom via `::after` pseudo.

Data: fetch `activeTheme` to populate tonight strip (whiskey count + taster count).

### 3b. Tasting Submission (`app/tasting-submission/page.tsx`)
Panel layout. Header: `TASTING SUBMISSION` + eyebrow + `← HOME` ghost button.

**Meta row (2 col → 1 col below 760px):**
- Taster select: dark `<select>` styled with `var(--line)` border, `rgba(0,0,0,.3)` bg. Label row has `Custom` toggle button beside it.
- Custom toggle: when active, swaps the `<select>` for a free-text input; button label flips `Custom ↔ List`.
- Theme select: same styling.

**Scores section:**
- Header: amber marker square + `// Scores` (Fraunces 600) + instruction line
- Pour cards: dark card with header row (mono pour number, Fraunces whiskey name, mono proof right-aligned) + 4-col score grid (→ 2-col below 760px)
- Hover on pour card: amber border tint + glow

**New: `PipRater` component** (`components/ui/pip-rater.tsx`):
Used for Aroma / Flavor / Finish.
- 5 vertical pips (36×40px each), amber gradient fill from bottom via `scaleY`
- Tap pip N → set value N; tapping already-selected pip → decrement by 1
- Cascade pop animation: staggered 0.04s per pip on fill, `cubic-bezier(.34,1.56,.64,1)`
- Decimal input below (74px wide): accepts values 0–5 including decimals; pip 5 shows fractional fill for `scaleY = fractional part`
- Input and pips stay in sync; blur reformats display to ≤2 decimals

**New: `RankPills` component** (`components/ui/rank-pills.tsx`):
N square pills (40×40px), single-select. Selected = amber fill + glow.

**Submit bar:**
- Progress meter: full-width thin track (8px), amber fill animates as `(filledFields / totalFields)`
- `SUBMIT TASTING` button (primary, disabled until all fields have non-zero values)

**Celebrate overlay** (after successful submit):
- Full-screen scrim `rgba(10,8,5,.75)` with centered card (panel-gradient, amber border, glow)
- Animated filling glass (clip-path trapezoid, amber gradient fill 0→72%)
- `// LOGGED`, `Cheers, <name>.`, `Your scores for <theme> are in.`
- Two buttons: `SEE THE RESULTS` (→ Data View Results tab) and `← HOME`
- Card slides up + fades in; glass fills on mount

### 3c. Data View (`app/data-view/page.tsx`)
Panel layout. Header: `DATA VIEW` + eyebrow + `← HOME`.

**Tab bar** (4 tabs instead of current 3):
`The Results · All Whiskeys · By Theme · By Person`
Active tab: amber fill, dark text, amber glow. Inactive: transparent, `var(--line)` border, dim text.

**Tab 1 — The Results (new):**
- **Podium (top 3):** 3 columns ordered 2nd | 1st (center, taller) | 3rd. Each: mono medal label, clip-path glass that fills amber from bottom (82%/64%/50%), Fraunces name, count-up score. Columns rise on enter (opacity + translateY, staggered 120ms).
- **Ranked bars:** one row per whiskey: mono rank, name+proof, track with amber gradient fill animating to `score/max * 100%`, count-up score.
- **Consensus — "Closest to the Group":** ranked list of tasters by mean absolute deviation from group average per (whiskey × attribute). Each row: rank, name, animated closeness bar, `±X.XX avg off`. #1 row highlighted amber.
- Count-up animation: 0 → target over 850ms, eased `1-(1-t)³`, formatted 1 decimal.
- All fills use `cubic-bezier(.16,1,.3,1)` ~1s.
- `prefers-reduced-motion` disables entrance/count-up animations.

**Tab 2 — All Whiskeys:** dark card with existing table logic, restyled to dark table (amber column headers, cream cells, dim hover).

**Tab 3 — By Theme:** dark cards per theme. Whiskey rows are accordion: click header → body height animates via `grid-template-rows: 0fr → 1fr`, chevron rotates 90°.

**Tab 4 — By Person:** dark cards per taster, same table pattern.

**Consensus formula:** for each taster, for each (whiskey × {aroma, flavor, finish}), compute `|tasterScore − groupAverageForThatCell|`. Mean absolute deviation = their "closeness score". Sort ascending (lower = closer to group).

### 3d. Administration (`app/administration/page.tsx`)
Panel layout.

**Login screen:** dark panel, centered form with dark input + primary button.

**Main screen:** 2-col tile grid (→ 1-col below 720px). Five tiles styled like home tiles but smaller (120px min-height):
- Create New Theme, Edit Themes, Add User → amber hover
- Delete User → `var(--red)` glow on hover (`.admin-danger`)
- View Results → amber hover

### 3e. New Theme (`app/new-theme/page.tsx`)
Panel layout, max-width 720px form.

Fields: Theme Name (dark input), Description/Notes (dark textarea), Number of Whiskeys (stepper: `– N +` with Mono buttons, amber on hover), dynamic whiskey list (numbered rows: name input + proof input).

Stepper: clamp 1–8. Adding/removing whiskeys animates the list.

---

## 4. Shared Components to Update

| Component | Change |
|---|---|
| `components/ui/button.tsx` | Restyle existing variants to After Dark: `default` → amber fill + amber glow; `destructive` → red glow; `outline` → ghost (dim border, cream hover); all lose the hard offset shadow in favor of amber/red glow |
| `components/ui/input.tsx` | Dark bg `rgba(0,0,0,.3)`, `var(--line)` border, cream text, amber focus ring (no blue) |
| `components/ui/label.tsx` | JetBrains Mono 500, 11px, tracking `.18em`, uppercase, `var(--dim)` |
| `components/ui/textarea.tsx` | Same dark style as input |

### Secondary admin pages

`app/add-user/page.tsx`, `app/delete-user/page.tsx`, and `app/edit-themes/page.tsx` all need the same panel layout + dark form control treatment. No logic changes — visual restyle only.

---

## 5. Assets

Copy `~/Downloads/whiskey-afterdark/design_handoff_after_dark_redesign/assets/logo.svg` to `apps/frontend/public/logo.svg` (replaces or supplements current favicon usage).

---

## 6. Responsive

Single breakpoint at 520px (also handle 720px/760px per component):
- Home tiles: 3-col → 1-col below 720px
- Score grid: 4-col → 2-col below 760px, → 1-col below 520px
- Submit meta: 2-col → 1-col below 760px
- Panel padding: 44px → 24px/20px below 520px
- Admin grid: 2-col → 1-col below 720px
- Data tables: tighten padding/font to fit without horizontal scroll

---

## 7. Out of Scope

- Backend changes (all computed stats done client-side from existing API data)
- E2E tests (visual changes; logic unchanged)
- Mobile app (separate codebase)
