# After Dark Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the Expo/React Native mobile app (`apps/mobile/`) to the dark, candlelit "After Dark" design and add two feature areas it lacks: "The Results" reveal (podium + animated ranked bars + "Closest to the group" consensus) and a tabbed, nested-group Data View.

**Architecture:** Dark-only token rewrite (no `ThemeProvider`) in `lib/theme.ts`; a library of new RN-`Animated` + `react-native-svg` primitives; screen reskins on top of those primitives; and a pure-logic `lib/scoring.ts` (TDD with jest-expo) that derives the leaderboard/consensus client-side from the existing API — **zero backend changes**. Work proceeds in sequential phases: Foundation (1) → Migrate Existing Primitives (1B) → Component Library (2) → Screen Reskins (3) → Features (4).

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-router, TypeScript, RN `Animated` (built-in), `react-native-svg` (installed), `@expo-google-fonts/fraunces`, `expo-haptics`; jest + jest-expo for `lib/scoring.ts` unit tests.

**Design spec:** `docs/superpowers/specs/2026-05-30-afterdark-mobile-redesign-design.md`

**Branch:** `afterdark-mobile-redesign`

**Conventions:** Commit messages must NOT include any AI attribution (no `Co-Authored-By`, no "Generated with").

**Phase ordering note:** Phases are sequential layers (each builds on the prior). Because Phase 1 renames theme tokens, screens/components touched in later phases will not type-check until their phase lands — each phase's verification scopes `npm run lint` accordingly, and the app is fully green again at the end of Phase 4.

---

## Phase 1 — Foundation

This phase converts the mobile app's design layer to the "After Dark" dark-only theme: new color/typography/font/glow tokens, Fraunces fonts, dark status bar + tab bar, dark splash/adaptive backgrounds, and the two new visual primitives (`AfterDarkBackground`, `GlowBox`). It leaves all existing screens compiling against the new token names by also re-exporting backward-compatible aliases is **not** done — instead, this phase only touches files that are safe to update in isolation (`theme.ts`, `_layout.tsx`, `app.json`, `package.json`, `HardShadow.tsx`, `AppText.tsx`, and the two new components). All other consumers of the old token names (admin/dashboard/tasting/settings/index screens and other `ui` components) are updated in later phases; **`npm run lint` will report errors in those untouched files until those phases land.** The verification step below scopes the lint check to the files this phase owns.

> Note on font export names: `@expo-google-fonts/fraunces` exports `Fraunces_900Black` and `Fraunces_600SemiBold` (confirmed naming convention matches the existing `@expo-google-fonts/jetbrains-mono` / `inter` packages already in use).

---

### Phase 1 — Task 1: Rewrite `lib/theme.ts` to After Dark tokens

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/theme.ts` (full rewrite, current 114 lines)

- [ ] **Step 1: Replace the entire file contents.** Overwrite `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/theme.ts` with:

```ts
import type { TextStyle, ViewStyle } from 'react-native';

// ── After Dark palette ───────────────────────────────────────────────
// Dark-only. A candlelit speakeasy: warm near-black surfaces, whiskey
// amber promoted from accent to hero. No light token names remain.
export const colors = {
  bg: '#15120c', // page background
  bg2: '#1d1810', // panel gradient bottom
  panel: '#221c13', // panel gradient top / modal card
  raise: '#2a2317', // tiles, raised surfaces
  cream: '#efe7d4', // primary text
  dim: '#b8ad94', // secondary text
  muted: '#8a8068', // tertiary text, placeholders, proof labels
  line: '#3a3120', // borders / hairlines
  amber: '#f4a937', // hero accent, primary buttons, active states
  amberSoft: '#f6c069', // fill top, focus text
  ember: '#c9742a', // fill bottom, bar gradient start
  deep: '#8a4a16', // deep amber
  red: '#e0563f', // destructive (Delete User)
  green: '#8fbf6a', // success/positive
  glow: 'rgba(244,169,55,0.30)', // strong amber glow
  glowSoft: 'rgba(244,169,55,0.14)', // soft amber glow
};

export const spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 96,
};

export const fonts = {
  serifBlack: 'Fraunces_900Black',
  serifSemi: 'Fraunces_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
  monoMedium: 'JetBrainsMono_500Medium',
  monoRegular: 'JetBrainsMono_400Regular',
  sans: 'Inter_400Regular',
};

export type TypoVariant =
  | 'pageTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'eyebrow'
  | 'fieldLabel'
  | 'buttonLabel'
  | 'body'
  | 'bodyMuted'
  | 'tableCell';

// letterSpacing is in points (RN has no em tracking). The handoff uses
// `.22em` on the eyebrow; at 13px that is ~2.86pt.
export const typography: Record<TypoVariant, TextStyle> = {
  pageTitle: {
    fontFamily: fonts.serifBlack,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
    textTransform: 'uppercase',
    color: colors.cream,
  },
  sectionTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.cream,
  },
  cardTitle: {
    fontFamily: fonts.serifSemi,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    color: colors.cream,
  },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 2.86, // ~.22em at 13px
    textTransform: 'uppercase',
    color: colors.amber,
  },
  fieldLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: colors.dim,
  },
  buttonLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 0.52,
    textTransform: 'uppercase',
    color: colors.cream,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.cream,
  },
  bodyMuted: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  tableCell: {
    fontFamily: fonts.monoRegular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.cream,
    fontVariant: ['tabular-nums'],
  },
};

// Structural offset block shadows (HardShadow). On dark surfaces the
// offset block reads as a slightly darker shape, not a soft black blur.
export const shadowSpec = {
  card: { dx: 2, dy: 2, color: 'rgba(0,0,0,0.55)' },
  cardSoft: { dx: 2, dy: 2, color: 'rgba(0,0,0,0.35)' },
  panel: { dx: 8, dy: 8, color: 'rgba(0,0,0,0.45)' },
  hero: { dx: 12, dy: 12, color: 'rgba(0,0,0,0.45)' },
  modal: { dx: 8, dy: 8, color: 'rgba(0,0,0,0.60)' },
};

export const hairline: ViewStyle = {
  borderWidth: 1,
  borderColor: colors.line,
};

// Amber glow used by GlowBox. iOS renders a colored blur via shadow*
// props; Android cannot, so GlowBox layers a translucent amber halo View
// plus an amber border using the halo* values below.
export const glowSpec = {
  soft: {
    ios: {
      shadowColor: colors.amber,
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      haloColor: colors.glowSoft,
      borderColor: 'rgba(244,169,55,0.35)',
      inset: -8,
    },
  },
  strong: {
    ios: {
      shadowColor: colors.amber,
      shadowOpacity: 0.7,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      haloColor: colors.glow,
      borderColor: 'rgba(244,169,55,0.6)',
      inset: -10,
    },
  },
};
export type GlowIntensity = keyof typeof glowSpec;
```

- [ ] **Step 2: Verify the new token file type-checks in isolation.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit lib/theme.ts --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext` and expect no errors emitted for `lib/theme.ts` itself (transitive RN type warnings from `--skipLibCheck` suppression are acceptable; the goal is no errors in `theme.ts`).

- [ ] **Step 3: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add lib/theme.ts && git commit -m "Rewrite theme tokens to After Dark dark-only palette"
```

---

### Phase 1 — Task 2: Add Fraunces dependency, remove Merriweather

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/package.json` (dependencies block, lines 13–34)

- [ ] **Step 1: Edit the dependency list.** In `/home/reasel/git/Whiskey-Tasting/apps/mobile/package.json`, replace this block:

```json
  "dependencies": {
    "@expo-google-fonts/inter": "^0.4.2",
    "@expo-google-fonts/jetbrains-mono": "^0.4.1",
    "@expo-google-fonts/merriweather": "^0.4.2",
    "@expo/ngrok": "^4.1.3",
```

with:

```json
  "dependencies": {
    "@expo-google-fonts/fraunces": "^0.4.2",
    "@expo-google-fonts/inter": "^0.4.2",
    "@expo-google-fonts/jetbrains-mono": "^0.4.1",
    "@expo/ngrok": "^4.1.3",
```

(This both adds Fraunces and removes the Merriweather line.)

- [ ] **Step 2: Install the new package.** This project runs on NixOS; install through the project's normal workflow. Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm install @expo-google-fonts/fraunces@^0.4.2 && npm uninstall @expo-google-fonts/merriweather
```

  If `npm install` is blocked by the sandbox network policy, instead invoke the `nixos-environment` skill and run the install inside the project dev shell; then re-run to confirm `node_modules/@expo-google-fonts/fraunces` exists.

- [ ] **Step 3: Verify the package resolves.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && node -e "require.resolve('@expo-google-fonts/fraunces/Fraunces_900Black'); require.resolve('@expo-google-fonts/fraunces/Fraunces_600SemiBold'); console.log('fraunces ok')"` and expect `fraunces ok`.

- [ ] **Step 4: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add package.json package-lock.json && git commit -m "Add Fraunces fonts, drop Merriweather dependency"
```

---

### Phase 1 — Task 3: Load Fraunces, dark StatusBar, reskin tab bar in `app/_layout.tsx`

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/_layout.tsx` (font import line 8, WTTabBar lines 21–83, useFonts line 86–92, fallback line 99, StatusBar line 104)

- [ ] **Step 1: Swap the font import.** Replace:

```ts
import { Merriweather_700Bold } from '@expo-google-fonts/merriweather';
```

with:

```ts
import {
  Fraunces_900Black,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
```

- [ ] **Step 2: Add `fonts` to the theme import.** Replace:

```ts
import { colors } from '../lib/theme';
```

with:

```ts
import { colors, fonts } from '../lib/theme';
```

- [ ] **Step 3: Reskin the tab bar container.** In `WTTabBar`, replace the outer `<View style={{...}}>`:

```tsx
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.canvasCream,
        borderTopWidth: 1,
        borderTopColor: colors.inkBlack,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
```

with:

```tsx
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.panel,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom,
      }}
    >
```

- [ ] **Step 4: Reskin the active tab fill.** Replace:

```tsx
              backgroundColor: focused ? colors.whiskeyAmber : 'transparent',
```

with:

```tsx
              backgroundColor: focused ? colors.amber : 'transparent',
```

- [ ] **Step 5: Reskin the tab label colors + font.** Replace the label `style` object:

```tsx
              style={{
                fontFamily: 'JetBrainsMono_700Bold',
                fontSize: 10,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
                textAlign: 'center',
                paddingHorizontal: 2,
                color: focused ? colors.cardWhite : colors.steelGrey,
              }}
```

with:

```tsx
              style={{
                fontFamily: fonts.monoBold,
                fontSize: 10,
                letterSpacing: 0.2,
                textTransform: 'uppercase',
                textAlign: 'center',
                paddingHorizontal: 2,
                color: focused ? colors.bg : colors.dim,
              }}
```

- [ ] **Step 6: Update `useFonts` to load Fraunces.** Replace:

```tsx
  const [fontsLoaded, fontError] = useFonts({
    Merriweather_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
  });
```

with:

```tsx
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_900Black,
    Fraunces_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
  });
```

- [ ] **Step 7: Dark the pre-font fallback + status bar.** Replace:

```tsx
    return <View style={{ flex: 1, backgroundColor: colors.canvasCream }} />;
```

with:

```tsx
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
```

  and replace:

```tsx
      <StatusBar style="dark" />
```

with:

```tsx
      <StatusBar style="light" />
```

- [ ] **Step 8: Dark the root View.** Replace:

```tsx
    <View style={{ flex: 1 }} onLayout={onReady}>
```

with:

```tsx
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onReady}>
```

- [ ] **Step 9: Verify.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit app/_layout.tsx --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext 2>&1 | grep "_layout.tsx" || echo "no _layout.tsx errors"` and expect `no _layout.tsx errors`.

- [ ] **Step 10: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/_layout.tsx && git commit -m "Load Fraunces fonts, dark StatusBar, reskin tab bar"
```

---

### Phase 1 — Task 4: Dark splash + adaptive icon + `userInterfaceStyle` in `app.json`

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app.json` (line 7 userInterfaceStyle, line 13 splash bg, line 21 adaptiveIcon bg)

- [ ] **Step 1: Force dark interface style.** Replace:

```json
    "userInterfaceStyle": "automatic",
```

with:

```json
    "userInterfaceStyle": "dark",
```

- [ ] **Step 2: Dark the splash background.** Replace:

```json
      "backgroundColor": "#F0F0E8"
```

with:

```json
      "backgroundColor": "#15120c"
```

- [ ] **Step 3: Dark the Android adaptive icon background.** Replace:

```json
        "backgroundColor": "#151515",
```

with:

```json
        "backgroundColor": "#15120c",
```

- [ ] **Step 4: Verify JSON is valid.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json valid')"` and expect `app.json valid`.

- [ ] **Step 5: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app.json && git commit -m "Set dark splash and adaptive icon backgrounds, dark interface style"
```

---

### Phase 1 — Task 5: Create `AfterDarkBackground`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AfterDarkBackground.tsx`

- [ ] **Step 1: Create the component.** Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AfterDarkBackground.tsx` with the full contents below. It is a full-bleed absolute SVG: a solid `bg` rect plus two amber radial-gradient haze layers (top-center, bottom-right), `pointerEvents="none"`. It sizes itself to the window via `useWindowDimensions` so the radial gradients scale correctly (RN SVG `RadialGradient` needs concrete `cx/cy/rx/ry` in user units).

```tsx
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { colors } from '../../lib/theme';

/**
 * Full-bleed candlelight backdrop for every After Dark screen. A solid
 * near-black fill plus two large amber radial-gradient haze layers
 * (top-center and bottom-right). Absolutely fills its parent (parent must
 * be `position: relative`). Never intercepts touches.
 */
export function AfterDarkBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      width={width}
      height={height}
    >
      <Defs>
        <RadialGradient
          id="ad-haze-top"
          cx={width * 0.5}
          cy={height * 0.08}
          rx={width * 0.9}
          ry={height * 0.45}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.amber} stopOpacity={0.14} />
          <Stop offset="1" stopColor={colors.amber} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="ad-haze-br"
          cx={width * 0.92}
          cy={height * 0.92}
          rx={width * 0.8}
          ry={height * 0.5}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={colors.ember} stopOpacity={0.1} />
          <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={colors.bg} />
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#ad-haze-top)"
      />
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#ad-haze-br)"
      />
    </Svg>
  );
}
```

- [ ] **Step 2: Verify.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit components/ui/AfterDarkBackground.tsx --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext 2>&1 | grep "AfterDarkBackground.tsx" || echo "no AfterDarkBackground errors"` and expect `no AfterDarkBackground errors`.

- [ ] **Step 3: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add components/ui/AfterDarkBackground.tsx && git commit -m "Add AfterDarkBackground candlelight SVG backdrop"
```

---

### Phase 1 — Task 6: Create `GlowBox`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/GlowBox.tsx`

- [ ] **Step 1: Create the component.** Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/GlowBox.tsx` with the full contents below. On iOS it applies the colored blur via `shadowColor`/`shadowRadius`/`shadowOpacity` from `glowSpec`. On Android (no colored blur support) it layers an absolutely-positioned translucent amber halo `View` behind the children plus an amber border, per `glowSpec.android`. `color` overrides the glow hue on both platforms.

```tsx
import React from 'react';
import {
  Platform,
  View,
  type ViewStyle,
} from 'react-native';
import { glowSpec, type GlowIntensity } from '../../lib/theme';

interface GlowBoxProps {
  children: React.ReactNode;
  intensity?: GlowIntensity;
  /** Override the glow hue (defaults to amber from glowSpec). */
  color?: string;
  style?: ViewStyle;
}

/**
 * Amber glow wrapper. iOS renders a true colored blur via shadow* props.
 * Android cannot blur a colored shadow, so we approximate with a layered
 * translucent amber halo View behind the children plus an amber border.
 */
export function GlowBox({
  children,
  intensity = 'soft',
  color,
  style,
}: GlowBoxProps) {
  const spec = glowSpec[intensity];

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          {
            shadowColor: color ?? spec.ios.shadowColor,
            shadowOpacity: spec.ios.shadowOpacity,
            shadowRadius: spec.ios.shadowRadius,
            shadowOffset: spec.ios.shadowOffset,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Android fallback: halo View + amber border approximation.
  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: spec.android.inset,
          left: spec.android.inset,
          right: spec.android.inset,
          bottom: spec.android.inset,
          backgroundColor: color ?? spec.android.haloColor,
        }}
      />
      <View
        style={{
          borderWidth: 1,
          borderColor: color ?? spec.android.borderColor,
        }}
      >
        {children}
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Verify.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit components/ui/GlowBox.tsx --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext 2>&1 | grep "GlowBox.tsx" || echo "no GlowBox errors"` and expect `no GlowBox errors`.

- [ ] **Step 3: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add components/ui/GlowBox.tsx && git commit -m "Add GlowBox amber glow wrapper (iOS shadow / Android halo)"
```

---

### Phase 1 — Task 7: Adjust `HardShadow` for dark surfaces

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/HardShadow.tsx` (current 46 lines)

The `shadowSpec` color values were already darkened/re-opacified for dark in Task 1, so `HardShadow` continues consuming `shadowSpec[offset]` unchanged in logic. The only change needed is documentation accuracy: the component's doc comment says "solid offset block shadow" — on dark surfaces these are now translucent dark blocks. Update the comment so the contract is correct; no behavioral change.

- [ ] **Step 1: Update the doc comment.** Replace:

```tsx
/**
 * Solid offset block shadow with NO blur, on both platforms. RN native
 * shadow props cannot do offset-no-blur on Android (elevation is always
 * blurred + centered), so we render a sibling solid View behind the child.
 */
```

with:

```tsx
/**
 * Offset block shadow with NO blur, on both platforms. On the After Dark
 * surfaces the block is a translucent dark rectangle (see shadowSpec),
 * reading as a structural drop offset rather than a soft glow. RN native
 * shadow props cannot do offset-no-blur on Android (elevation is always
 * blurred + centered), so we render a sibling View behind the child.
 */
```

- [ ] **Step 2: Verify.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit components/ui/HardShadow.tsx --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext 2>&1 | grep "HardShadow.tsx" || echo "no HardShadow errors"` and expect `no HardShadow errors`.

- [ ] **Step 3: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add components/ui/HardShadow.tsx && git commit -m "Clarify HardShadow doc for dark translucent offset blocks"
```

---

### Phase 1 — Task 8: Update `AppText` doc for the new variants

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AppText.tsx` (current 36 lines)

`AppText` is generic over `TypoVariant`, so the new `cardTitle` / `bodyMuted` variants are picked up automatically — the only outdated thing is the doc comment referencing "Merriweather". No API change.

- [ ] **Step 1: Update the doc comment.** Replace:

```tsx
/** The ONLY text component. `variant` selects a fixed type-triad preset
 *  so Merriweather/JetBrains Mono/Inter can never drift. The large
 *  `pageTitle` auto-scales to a single line so long unbreakable titles
 *  (e.g. "ADMINISTRATION") never clip — RN's adjustsFontSizeToFit is
 *  only reliable on Android with numberOfLines={1}. Callers can still
 *  override. */
```

with:

```tsx
/** The ONLY text component. `variant` selects a fixed After Dark preset
 *  so Fraunces/JetBrains Mono/Inter can never drift. The large
 *  `pageTitle` auto-scales to a single line so long unbreakable titles
 *  (e.g. "ADMINISTRATION") never clip — RN's adjustsFontSizeToFit is
 *  only reliable on Android with numberOfLines={1}. Callers can still
 *  override. */
```

- [ ] **Step 2: Verify.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit components/ui/AppText.tsx --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext 2>&1 | grep "AppText.tsx" || echo "no AppText errors"` and expect `no AppText errors`. Confirm `cardTitle` and `bodyMuted` are accepted as `variant` values by running `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && node -e "const t=require('fs').readFileSync('lib/theme.ts','utf8'); ['cardTitle','bodyMuted'].forEach(v=>{ if(!t.includes(\"'\"+v+\"'\")) throw new Error('missing '+v); }); console.log('variants present')"` and expect `variants present`.

- [ ] **Step 3: Commit.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add components/ui/AppText.tsx && git commit -m "Update AppText doc for After Dark Fraunces variants"
```

---

### Phase 1 — Task 9: Verification — scoped lint clean + emulator smoke test

This phase intentionally leaves other screens/components referencing old token names; a full `npm run lint` will fail on those until later phases. Verify only the files this phase owns compile, then smoke-test the dark foundation on the Android emulator.

**Files:**
- (none — verification only)

- [ ] **Step 1: Lint the Phase 1 files only.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npx tsc --noEmit \
  lib/theme.ts \
  components/ui/AfterDarkBackground.tsx \
  components/ui/GlowBox.tsx \
  components/ui/HardShadow.tsx \
  components/ui/AppText.tsx \
  app/_layout.tsx \
  --skipLibCheck --esModuleInterop --jsx react-jsx --moduleResolution bundler --module esnext \
  2>&1 | grep -E "theme\.ts|AfterDarkBackground\.tsx|GlowBox\.tsx|HardShadow\.tsx|AppText\.tsx|_layout\.tsx" || echo "PHASE 1 FILES CLEAN"
```

  Expect `PHASE 1 FILES CLEAN`. (A full `npm run lint` is deferred to the end of the redesign once all consumers are migrated.)

- [ ] **Step 2: Confirm no old light token names remain in Phase 1 files.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile && grep -nE "canvasCream|inkBlack|cardWhite|whiskeyAmber|steelGrey|panelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|lightGrey|hyperBlue|Merriweather" \
  lib/theme.ts components/ui/AfterDarkBackground.tsx components/ui/GlowBox.tsx components/ui/HardShadow.tsx components/ui/AppText.tsx app/_layout.tsx \
  || echo "NO LIGHT TOKEN LEAKS IN PHASE 1 FILES"
```

  Expect `NO LIGHT TOKEN LEAKS IN PHASE 1 FILES`.

- [ ] **Step 3: Launch the Android emulator.** Follow `mobile-dev.md` (invoke the `nixos-environment` skill for the dev shell): start the AVD `wt_emulator`, run `npx expo start --clear` (never kill Metro by port 8081), and open the app on the emulator with `adb reverse` already set up.

- [ ] **Step 4: Manual visual check — dark foundation.** On the emulator confirm:
  - The status bar text/icons are **light** (white) over the dark app chrome.
  - The bottom tab bar is the dark **`panel`** color (`#221c13`) with a thin amber-brown **`line`** top border; the active tab cell is filled **amber** (`#f4a937`) with near-black (`bg`) label text, and inactive labels are **`dim`** (`#b8ad94`), all in JetBrains Mono.
  - The app background behind content is the dark **`bg`** (`#15120c`) (no cream/light flash after the splash; splash itself is dark `#15120c`).
  - Any existing `pageTitle`/`sectionTitle` text renders in **Fraunces** (serif, heavy for the page title) rather than the old Merriweather. (Screens not yet migrated may still throw on old token names — that is expected this phase; the goal here is to confirm fonts load and the tab bar/status bar/background are dark.)

- [ ] **Step 5: Commit (verification artifacts only if any).** No code changes in this task; nothing to commit. If a `package-lock.json` churn from the emulator run appears, do not commit it.

---

**Phase 1 deliverables (absolute paths):**
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/theme.ts` (rewritten: After Dark `colors`, `spacing`, `fonts`, `typography` incl. `cardTitle`/`bodyMuted`, `shadowSpec`, `hairline`, `glowSpec`)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/_layout.tsx` (Fraunces load, `StatusBar style="light"`, dark `WTTabBar`)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/package.json` (+`@expo-google-fonts/fraunces`, −merriweather)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/app.json` (dark splash/adaptive/`userInterfaceStyle`)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AfterDarkBackground.tsx` (new)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/GlowBox.tsx` (new)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/HardShadow.tsx` (doc-only)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AppText.tsx` (doc-only; new variants flow through automatically)

**Handoff note for later phases:** `lib/theme.ts` no longer exports any light token names (`canvasCream`, `inkBlack`, `cardWhite`, `whiskeyAmber`, `steelGrey`, `panelGrey`, `mutedText`, `amberDark`, `signalGreen`, `alertOrange`, `alertRed`, `lightGrey`, `hyperBlue`), so every remaining consumer listed by `grep` (admin/dashboard/tasting/settings/index screens; `Button`, `Card`, `Dropdown`, `Input`, `Panel`, `Tabs`, `Toast`; `RatingSlider`, `ScoreDisplay`, `WhiskeyCard`) will fail `tsc` until migrated in their respective phases. Map old→new for those phases: `canvasCream/cardWhite→bg|panel|raise`, `inkBlack→cream` (text) / `line` (borders), `whiskeyAmber→amber`, `amberDark→ember`, `steelGrey/mutedText→muted|dim`, `panelGrey/lightGrey→raise|line`, `signalGreen→green`, `alertRed/alertOrange→red`, `fonts.serif→fonts.serifBlack|serifSemi`.


---

## Phase 1B — Migrate Existing UI Primitives & Remove Dead Components

> **Why this phase exists:** Phase 1 renamed the theme tokens. The existing `components/ui/` primitives (`Button`, `Card`, `Dropdown`, `Input`, `Panel`, `Tabs`, `Toast`) and `app/tasting/_layout.tsx` still reference the old light token names and must be migrated, or `npm run lint` (`tsc --noEmit`, which type-checks the whole project) can never go green. `ScoreDisplay.tsx` is already dead code that references removed tokens. **Project-wide `npm run lint` stays red until Phase 3/4 migrate the screens** — each task below scopes its verification to the file it touches.


### Phase 1B — Task 1: Migrate `components/ui/Button.tsx`

**Files:** `apps/mobile/components/ui/Button.tsx`

- [ ] **Step 1: Migrate fill colors** — `default` button is the primary amber action (`whiskeyAmber -> amber`); its pressed state uses `amberDark -> ember`. `destructive`/`warning` collapse onto `red`, `success -> green`. `outline` is a surface-on-bg control (`canvasCream -> panel`), `secondary` is a raised control (`panelGrey -> raise`).
- [ ] **Step 2: Migrate label colors** — Filled variants (`default`, `destructive`, `success`, `warning`) sit on amber/red/green fills, so their labels need dark contrast: `cardWhite -> bg`. `outline`/`secondary`/`ghost` labels read as primary text on a dark surface: `inkBlack -> cream`. The `link` label keeps the accent: `whiskeyAmber -> amber`.
- [ ] **Step 3: Migrate the border color** — The base border is a hairline: `inkBlack -> line`.
- [ ] **Step 4: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Button.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step 5: Commit** — `git add components/ui/Button.tsx && git commit -m "Migrate Button to After Dark tokens"` (no AI attribution in the message).

```tsx
import React, { useState } from 'react';
import {
  Pressable,
  View,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { colors } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

type Variant =
  | 'default'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';
type Size = 'sm' | 'default' | 'lg' | 'xl' | 'icon';

type LegacyVariant = 'primary' | 'danger';
type LegacySize = 'md';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant | LegacyVariant;
  size?: Size | LegacySize;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_ALIAS: Record<LegacyVariant, Variant> = {
  primary: 'default',
  danger: 'destructive',
};
const SIZE_ALIAS: Record<LegacySize, Size> = { md: 'default' };

const FILL: Record<Variant, string> = {
  default: colors.amber,
  destructive: colors.red,
  success: colors.green,
  warning: colors.red,
  outline: colors.panel,
  secondary: colors.raise,
  ghost: 'transparent',
  link: 'transparent',
};
const PRESSED_FILL: Partial<Record<Variant, string>> = {
  default: colors.ember,
};
const LABEL_COLOR: Record<Variant, string> = {
  default: colors.bg,
  destructive: colors.bg,
  success: colors.bg,
  warning: colors.bg,
  outline: colors.cream,
  secondary: colors.cream,
  ghost: colors.cream,
  link: colors.amber,
};
const HEIGHT: Record<Size, number> = {
  sm: 32,
  default: 40,
  lg: 48,
  xl: 96,
  icon: 40,
};
const PAD_X: Record<Size, number> = {
  sm: 12,
  default: 16,
  lg: 20,
  xl: 24,
  icon: 0,
};

export function Button({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  block = false,
  style,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);

  const v: Variant =
    variant in VARIANT_ALIAS
      ? VARIANT_ALIAS[variant as LegacyVariant]
      : (variant as Variant);
  const sz: Size =
    size in SIZE_ALIAS ? SIZE_ALIAS[size as LegacySize] : (size as Size);

  const flat = v === 'ghost' || v === 'link';
  const isDisabled = disabled || loading;
  const fill =
    pressed && PRESSED_FILL[v] ? (PRESSED_FILL[v] as string) : FILL[v];

  const body = (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        {
          height: HEIGHT[sz],
          paddingHorizontal: PAD_X[sz],
          width: sz === 'icon' ? HEIGHT.icon : undefined,
          backgroundColor: fill,
          borderWidth: flat ? 0 : 1,
          borderColor: colors.line,
          opacity: isDisabled ? 0.5 : 1,
          transform: [
            { translateX: pressed && !flat ? 2 : 0 },
            { translateY: pressed && !flat ? 2 : 0 },
          ],
        },
        block && styles.fill,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={LABEL_COLOR[v]} size="small" />
      ) : (
        <AppText
          variant="buttonLabel"
          style={[
            { color: LABEL_COLOR[v] },
            v === 'link' && styles.linkLabel,
          ]}
        >
          {title}
        </AppText>
      )}
    </Pressable>
  );

  const outerStyle = [block && styles.block, style];

  if (flat) {
    return <View style={outerStyle}>{body}</View>;
  }

  return (
    <HardShadow
      offset="card"
      collapsed={pressed || isDisabled}
      style={outerStyle}
    >
      {body}
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  block: { alignSelf: 'stretch', width: '100%' },
  fill: { width: '100%' },
  linkLabel: { textDecorationLine: 'underline' },
});
```

### Phase 1B — Task 2: Migrate `components/ui/Card.tsx`

**Files:** `apps/mobile/components/ui/Card.tsx`

- [ ] **Step 1: Migrate the card surface** — The card is a control/card surface on the dark background: `cardWhite -> panel`.
- [ ] **Step 2: Migrate the card border** — The 1px border is a hairline: `inkBlack -> line`.
- [ ] **Step 3: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Card.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step 4: Commit** — `git add components/ui/Card.tsx && git commit -m "Migrate Card to After Dark tokens"` (no AI attribution in the message).

```tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, title, onPress, style }: CardProps) {
  const inner = (
    <View style={[styles.card, style]}>
      {title ? (
        <AppText variant="sectionTitle" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );

  const content = <HardShadow offset="cardSoft">{inner}</HardShadow>;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { marginBottom: spacing.md },
});
```

### Phase 1B — Task 3: Migrate `components/ui/Dropdown.tsx`

**Files:** `apps/mobile/components/ui/Dropdown.tsx`

- [ ] **Step 1: Migrate the trigger control surface.** `control` background `cardWhite` -> `panel`, border `inkBlack` -> `line`; `valueText` color `inkBlack` -> `cream`; `placeholderText` color `mutedText` -> `muted`; chevron `Ionicons` color `steelGrey` -> `dim`.
- [ ] **Step 2: Migrate the modal sheet + options.** Keep the backdrop `rgba(0,0,0,0.5)` (deepen to match dark theme is fine but not required; leave as-is). `sheet` background `cardWhite` -> `panel`, border `inkBlack` -> `line`; `option` divider `lightGrey` -> `line` and option background `cardWhite` -> `panel`.
- [ ] **Step 3: Migrate the active/selected option.** `optionActive` background `whiskeyAmber` -> `amber`; active-on-amber text `optionTextActive` color `cardWhite` -> `bg` (dark text for contrast on amber); checkmark `Ionicons` color `cardWhite` -> `bg`. Inactive `optionText` color `inkBlack` -> `cream`.
- [ ] **Step 4: Migrate empty state.** `emptyText` color `mutedText` -> `muted`.
- [ ] **Step 5: Write the full file.** Replace the entire file with the contents below (preserves all props, structure, behavior, and `borderRadius: 0`).

```tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

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
  const valueKey = value == null ? null : String(value);
  const selected = options.find((o) => String(o.value) === valueKey);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <AppText variant="fieldLabel" style={styles.label}>{label}</AppText>}
      <HardShadow offset="card">
        <TouchableOpacity
          style={styles.control}
          activeOpacity={0.7}
          onPress={() => setOpen(true)}
        >
          <AppText variant="body" style={selected ? styles.valueText : styles.placeholderText}>
            {selected ? selected.label : placeholder}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.dim} />
        </TouchableOpacity>
      </HardShadow>

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
              {options.length === 0 ? (
                <View style={styles.empty}>
                  <AppText variant="body" style={styles.emptyText}>No options</AppText>
                </View>
              ) : (
                options.map((opt, index) => {
                  const isActive = String(opt.value) === valueKey;
                  const isLast = index === options.length - 1;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[
                        styles.option,
                        isLast && styles.optionLast,
                        isActive && styles.optionActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                    >
                      <AppText
                        variant="body"
                        style={[
                          styles.optionText,
                          isActive && styles.optionTextActive,
                        ]}
                      >
                        {opt.label}
                      </AppText>
                      {isActive && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.bg}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
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
    marginBottom: spacing.xs,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  valueText: {
    color: colors.cream,
  },
  placeholderText: {
    color: colors.muted,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.panel,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.line,
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
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
  },
  optionLast: {
    borderBottomWidth: 0,
  },
  optionActive: {
    backgroundColor: colors.amber,
  },
  optionText: {
    color: colors.cream,
  },
  optionTextActive: {
    color: colors.bg,
    fontWeight: '700',
  },
  empty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
  },
});
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Dropdown.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add components/ui/Dropdown.tsx && git commit -m "Migrate Dropdown to After Dark theme tokens"` (NO AI attribution in the message).

### Phase 1B — Task 4: Migrate `components/ui/Input.tsx`

**Files:** `apps/mobile/components/ui/Input.tsx`

- [ ] **Step 1: Migrate the text input surface.** `input` background `cardWhite` -> `panel`, border `inkBlack` -> `line`, text color `inkBlack` -> `cream`; `placeholderTextColor` prop `mutedText` -> `muted`.
- [ ] **Step 2: Migrate the error state.** `inputError` border `alertRed` -> `red`; `errorText` color `alertRed` -> `red`.
- [ ] **Step 3: Write the full file.** Replace the entire file with the contents below (preserves all props, structure, behavior, `fontFamily: 'Inter_400Regular'`, and `borderRadius: 0`).

```tsx
import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <AppText variant="fieldLabel" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {error ? (
        <AppText variant="fieldLabel" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.md },
  label: {},
  input: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.cream,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
  },
});
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Input.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add components/ui/Input.tsx && git commit -m "Migrate Input to After Dark theme tokens"` (NO AI attribution in the message).

### Phase 1B — Task 5: Migrate `components/ui/Panel.tsx`

**Files:** `apps/mobile/components/ui/Panel.tsx`

- [ ] **Step 1: Swap the panel fill token** — `panel.backgroundColor` was a card/sheet surface (`canvasCream`); on dark it becomes the `panel` surface token.
- [ ] **Step 2: Swap the border tokens** — `panel.borderColor` and `header.borderBottomColor` were hairline borders (`inkBlack`); on dark, borders/hairlines become `line`.
- [ ] **Step 3: Keep `borderRadius: 0`, `borderWidth`, structure, props, and `HardShadow` usage exactly as-is** — this is a token rename + dark restyle only.
- [ ] **Step 4: Write the complete new file** (full contents below).

```tsx
import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { Eyebrow } from './Eyebrow';
import { HardShadow } from './HardShadow';

interface PanelProps {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
  style?: StyleProp<ViewStyle>;
}

/** A bordered section block (panel fill, hard panel shadow). Full width
 *  on phone — NOT a centered max-width box. Optional header sub-block. */
export function Panel({ children, title, eyebrow, style }: PanelProps) {
  return (
    <HardShadow offset="panel" style={style}>
      <View style={styles.panel}>
        {(title || eyebrow) && (
          <View style={styles.header}>
            {title ? (
              <AppText variant="sectionTitle">{title}</AppText>
            ) : null}
            {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          </View>
        )}
        <View style={styles.body}>{children}</View>
      </View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.xs,
  },
  body: { padding: spacing.xl },
});
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Panel.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add components/ui/Panel.tsx && git commit -m "Migrate Panel to After Dark tokens"` (no AI attribution in the message).

### Phase 1B — Task 6: Migrate `components/ui/Tabs.tsx`

**Files:** `apps/mobile/components/ui/Tabs.tsx`

- [ ] **Step 1: Swap the active-tab fill** — active `backgroundColor` `whiskeyAmber` → `amber`.
- [ ] **Step 2: Swap the inactive-tab fill** — inactive `backgroundColor` `panelGrey` → `raise` (inactive raised fill).
- [ ] **Step 3: Swap the active-tab label color** — the label sits on the amber fill, so for contrast use the dark `bg` token; active `cardWhite` → `colors.bg`.
- [ ] **Step 4: Swap the inactive-tab label color** — inactive label was secondary text (`steelGrey`) → `dim`.
- [ ] **Step 5: Swap the `ToggleRow` Switch colors** — `trackColor.true` `whiskeyAmber` → `amber`; `trackColor.false` was a track/inactive-fill (`lightGrey`) → `line`; `thumbColor` `cardWhite` → `cream` (the thumb reads as a foreground knob on dark).
- [ ] **Step 6: Swap the `ToggleRow` row surface** — `row.backgroundColor` `cardWhite` → `panel` (control surface).
- [ ] **Step 7: Swap all border tokens** — `tabs.borderColor`, `tabDivider.borderLeftColor`, and `row.borderColor` `inkBlack` → `line`.
- [ ] **Step 8: Keep `borderRadius: 0`, all `borderWidth`, structure, props, and component APIs exactly as-is** — token rename + dark restyle only. Update the `Tabs` doc comment to reflect new tokens (amber fill + dark label; inactive raise + dim).
- [ ] **Step 9: Write the complete new file** (full contents below).

```tsx
import React from 'react';
import {
  View,
  Pressable,
  Switch,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';

interface TabsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

/** Square segmented control. Active = amber fill + dark mono label;
 *  inactive = raise fill + dim label. Instant swap, no animation. */
export function Tabs({ options, value, onChange, style }: TabsProps) {
  return (
    <View style={[styles.tabs, style]}>
      {options.map((opt, i) => {
        const active = String(opt.value) === String(value);
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[
              styles.tab,
              i > 0 && styles.tabDivider,
              { backgroundColor: active ? colors.amber : colors.raise },
            ]}
          >
            <AppText
              variant="buttonLabel"
              style={{ color: active ? colors.bg : colors.dim }}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

export function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <AppText variant="fieldLabel">{label}</AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.amber, false: colors.line }}
        thumbColor={colors.cream}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.smd,
  },
  tabDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
});
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Tabs.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add components/ui/Tabs.tsx && git commit -m "Migrate Tabs and ToggleRow to After Dark tokens"` (no AI attribution in the message).

### Phase 1B — Task 7: Migrate `components/ui/Toast.tsx`

**Files:** `components/ui/Toast.tsx`

- [ ] **Step 1: Swap text color token** — change the `AppText` color from `colors.inkBlack` to `colors.cream` (toast message text on a dark surface).
- [ ] **Step 2: Swap container surface token** — change `backgroundColor` from `colors.cardWhite` to `colors.panel` (the toast is a floating sheet/control surface).
- [ ] **Step 3: Swap border token** — change `borderColor` from `colors.inkBlack` to `colors.line` (hairline border).
- [ ] **Step 4: Update the stale comment** — the comment references "white box, black border"; update it to reflect the dark restyle.
- [ ] **Step 5: Write the full file** — replace the entire file with the contents below.

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from './AppText';
import { HardShadow } from './HardShadow';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
  duration = 3000,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }
  }, [visible, duration, onHide, opacity]);

  if (!visible) return null;

  // type is kept in the interface for API compatibility but visual style is
  // now uniform (dark panel, hairline border) per the After Dark design system.
  void type;

  return (
    <Animated.View style={[styles.positioner, { opacity }]}>
      <HardShadow offset="card">
        <View style={styles.container}>
          <AppText variant="tableCell" style={{ color: colors.cream }}>
            {message}
          </AppText>
        </View>
      </HardShadow>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl,
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    padding: spacing.md,
  },
});
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' components/ui/Toast.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add components/ui/Toast.tsx && git commit -m "Migrate Toast to After Dark theme tokens"`

### Phase 1B — Task 8: Migrate `app/tasting/_layout.tsx`

**Files:** `app/tasting/_layout.tsx`

- [ ] **Step 1: Swap content background token** — change `contentStyle.backgroundColor` from `colors.canvasCream` to `colors.bg` (full-screen Stack content background).
- [ ] **Step 2: Write the full file** — replace the entire file with the contents below.

```tsx
import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function TastingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
```

- [ ] **Step: Verify token swap** — run `grep -nE 'canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|lightGrey|steelGrey|mutedText|amberDark|signalGreen|alertOrange|alertRed|hyperBlue|fonts\.serif\b' app/tasting/_layout.tsx` and expect NO matches. Note: project-wide `npm run lint` stays red until Phase 3/4 migrate the screens; that is expected.
- [ ] **Step: Commit** — `git add app/tasting/_layout.tsx && git commit -m "Migrate tasting layout to After Dark theme tokens"`

### Phase 1B — Task 9: Delete dead `components/tasting/ScoreDisplay.tsx`

**Files:**
- Delete: `apps/mobile/components/tasting/ScoreDisplay.tsx`

`ScoreDisplay` is no longer imported anywhere (the only reference is the file itself) and it references removed light tokens (`cardWhite`, `inkBlack`, `whiskeyAmber`, `steelGrey`, `mutedText`), so it would fail `tsc`. Its role (a static ranked-score row) is superseded by the new `RankedBar`/`PodiumGlass` primitives (Phase 2) and the Data View (Phase 4).

- [ ] **Step 1: Confirm it is unused.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && grep -rn "ScoreDisplay" app components | grep -v 'ScoreDisplay.tsx:'` and expect NO output.
- [ ] **Step 2: Delete the file.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git rm components/tasting/ScoreDisplay.tsx`
- [ ] **Step 3: Commit.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git commit -m "Remove unused ScoreDisplay component"`


---

## Phase 2 — Component Library

All files below live under `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/`. They assume Phase 1 has already rewritten `lib/theme.ts` to the After Dark tokens (`colors`, `spacing`, `fonts`, `typography`, `hairline`, `glowSpec`) and created `GlowBox.tsx` + `AfterDarkBackground.tsx`. Every component imports tokens from `../../lib/theme` and renders text through the existing `AppText`. RN `Animated` only — no `react-native-reanimated`. Gradients/glass use `react-native-svg@15.12.1` (already installed). Haptics use `expo-haptics@~15.0.8` (already installed). Verification for every task is `npm run lint` (alias for `tsc --noEmit`) plus a concrete emulator check; there is no RN component test harness and we are not adding one.

> Reduced-motion convention (used by several components): read `AccessibilityInfo.isReduceMotionEnabled()` once on mount and subscribe to `reduceMotionChanged`; when enabled, snap straight to the final value instead of animating.

---

### Phase 2 — Task 1: `CountUp.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/CountUp.tsx`

- [ ] **Step 1: Write the complete `CountUp.tsx` file.** Animates an `Animated.Value` 0→1 over 850ms with a cubic ease-out, multiplies by the target in a listener, formats to `decimals` (default 1), and renders through `AppText` with `tabular-nums`. Honors reduce-motion (snaps to final). Cancels the animation and removes the listener on unmount and whenever `value` changes.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo, type TextStyle } from 'react-native';
import { AppText } from './AppText';

interface CountUpProps {
  value: number;
  decimals?: number;
  animate?: boolean;
  style?: TextStyle;
}

/** Counts 0 -> value over 850ms (cubic ease-out). Honors reduce-motion by
 *  snapping straight to the final value. Renders through AppText so it keeps
 *  the mono tabular-nums look used in tables/scores. */
export function CountUp({ value, decimals = 1, animate = true, style }: CountUpProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(() => value.toFixed(decimals));

  useEffect(() => {
    let cancelled = false;

    const run = (reduceMotion: boolean) => {
      if (reduceMotion || !animate) {
        setDisplay(value.toFixed(decimals));
        return;
      }
      progress.setValue(0);
      const id = progress.addListener(({ value: p }) => {
        if (!cancelled) setDisplay((p * value).toFixed(decimals));
      });
      Animated.timing(progress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (!cancelled) setDisplay(value.toFixed(decimals));
        progress.removeListener(id);
      });
      return () => progress.removeListener(id);
    };

    let cleanup: (() => void) | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (!cancelled) cleanup = run(rm);
    });

    return () => {
      cancelled = true;
      progress.stopAnimation();
      if (cleanup) cleanup();
    };
  }, [value, decimals, animate, progress]);

  return (
    <AppText variant="tableCell" style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {display}
    </AppText>
  );
}
```

- [ ] **Step 2: Verify lint.** Run `npm run lint` from `/home/reasel/git/Whiskey-Tasting/apps/mobile` and expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** This component has no standalone screen yet; it will be visually verified in the Results phase (podium/bars). For now confirm it imports cleanly — no runtime check needed in this task.
- [ ] **Step 4: Commit.** `git add components/ui/CountUp.tsx && git commit -m "Add CountUp animated count-up text component"`

---

### Phase 2 — Task 2: `PulsingDot.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/PulsingDot.tsx`

- [ ] **Step 1: Write the complete `PulsingDot.tsx` file.** A small amber dot with a looping opacity+scale pulse and a layered glow halo View behind it. Uses `Animated.loop` of a sequence. Honors reduce-motion by holding the dot at full opacity with no loop.

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

interface PulsingDotProps {
  size?: number;
  color?: string;
}

/** Looping amber "live" dot for the tonight strip: opacity + scale pulse with
 *  a soft amber glow halo. Snaps to a steady dot under reduce-motion. */
export function PulsingDot({ size = 9, color = colors.amber }: PulsingDotProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: color,
            opacity: reduceMotion ? 0.25 : haloOpacity,
            transform: [{ scale }],
          },
        ]}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: reduceMotion ? 1 : opacity,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute' },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** Visual verification happens on the Home "tonight" strip in a later phase. Confirm clean import here.
- [ ] **Step 4: Commit.** `git add components/ui/PulsingDot.tsx && git commit -m "Add PulsingDot looping amber pulse component"`

---

### Phase 2 — Task 3: `TactileRating.tsx` (replaces `RatingSlider` behavior)

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/TactileRating.tsx`

This reuses the `clamp` / `format` / `commitText` two-way-sync pattern from `components/tasting/RatingSlider.tsx` (read in this phase): `clamp(n) = min(max, max(0, n))`, format strips IEEE float noise, the `TextInput` holds local `text` state, syncs from `value` via `useEffect`, and commits on blur. The slider is replaced by 5 tappable pips: tapping a pip sets the integer; tapping the current integer value clears to one below (down to 0); the last partially-filled pip shows a fractional fill via `scaleY` on an overlay. Pip taps fire `expo-haptics`. Min is 0 here (so a pour can be "unscored"); the parent clamps to 1–5 only at submit time per the spec.

- [ ] **Step 1: Write the complete `TactileRating.tsx` file.**

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';

interface TactileRatingProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}

/** Tap-to-fill pip rating with a fractional last-pip fill plus an exact-decimal
 *  TextInput. Clamp/format/commit logic mirrors the old RatingSlider so saved
 *  scores load and reformat identically. Min is 0 (unscored allowed); the
 *  submit flow clamps to 1..max. */
export function TactileRating({ value, onChange, max = 5 }: TactileRatingProps) {
  const [text, setText] = useState(() => format(value));

  // Sync the field when value changes from outside (pip tap, loading saved
  // scores, theme switch rebuild).
  useEffect(() => {
    setText(format(value));
  }, [value]);

  function clamp(n: number) {
    return Math.min(max, Math.max(0, n));
  }

  // Strip IEEE float noise (e.g. 3.2000000000000002) while keeping real typed
  // precision, then cap at 2 decimal places for display.
  function format(n: number) {
    const cleaned = Math.round(n * 1e6) / 1e6;
    return Number.isInteger(cleaned) ? String(cleaned) : String(Math.round(cleaned * 100) / 100);
  }

  // Accept digits plus a single dot only.
  function onChangeText(raw: string) {
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
    }
    setText(cleaned);
    const parsed = parseFloat(cleaned);
    if (!Number.isNaN(parsed)) {
      const next = clamp(parsed);
      if (next !== value) onChange(next);
    }
  }

  function commitText() {
    const parsed = parseFloat(text);
    if (Number.isNaN(parsed)) {
      setText(format(value));
      return;
    }
    const next = clamp(parsed);
    onChange(next);
    setText(format(next));
  }

  function tapPip(index: number) {
    Haptics.selectionAsync().catch(() => {});
    const pipValue = index + 1; // pips are 1..max
    // Tapping the current integer value clears to one below.
    const next = Math.ceil(value) === pipValue && value === pipValue ? pipValue - 1 : pipValue;
    onChange(clamp(next));
  }

  return (
    <View style={styles.container}>
      <View style={styles.pips}>
        {Array.from({ length: max }).map((_, i) => {
          const pipNumber = i + 1;
          const filled = value >= pipNumber;
          const frac = value > i && value < pipNumber ? value - i : filled ? 1 : 0;
          return (
            <Pressable
              key={i}
              onPress={() => tapPip(i)}
              style={({ pressed }) => [styles.pip, pressed && styles.pipPressed]}
            >
              {frac > 0 && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.pipFill,
                    { transform: [{ scaleY: frac }] },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={styles.valueInput}
        value={text}
        onChangeText={onChangeText}
        onBlur={commitText}
        onSubmitEditing={() => Keyboard.dismiss()}
        keyboardType="decimal-pad"
        selectTextOnFocus
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
  },
  pips: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  pip: {
    flex: 1,
    height: 40,
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  pipPressed: {
    borderColor: colors.amber,
  },
  pipFill: {
    height: '100%',
    backgroundColor: colors.amber,
    transformOrigin: 'bottom',
  },
  valueInput: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colors.cream,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 72,
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`. If `transformOrigin` errors under this RN type version, replace the `pipFill` fractional approach with a bottom-anchored absolute fill: set `styles.pipFill` to `{ position:'absolute', left:0, right:0, bottom:0, backgroundColor: colors.amber }` and drive its `height` as `${frac * 100}%` instead of `scaleY` (the visual is identical: bottom-up fill). Re-run `npm run lint` until clean.
- [ ] **Step 3: Manual emulator check (deferred).** Pip interaction is verified on the Tasting submission screen in a later phase. For this task confirm only that lint passes.
- [ ] **Step 4: Commit.** `git add components/ui/TactileRating.tsx && git commit -m "Add TactileRating pip + decimal rating control"`

---

### Phase 2 — Task 4: `RankPills.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/RankPills.tsx`

- [ ] **Step 1: Write the complete `RankPills.tsx` file.** Square single-select pills numbered `1..count`. Selected pill gets an amber fill, dark label, amber border, and a soft glow (wrapped in `GlowBox`). Haptics on select.

```tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';
import { GlowBox } from './GlowBox';

interface RankPillsProps {
  value: number;
  count: number;
  onChange: (n: number) => void;
}

/** Square 1..count single-select. Selected pill = amber fill + soft glow. */
export function RankPills({ value, count, onChange }: RankPillsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const n = i + 1;
        const active = value === n;
        const pill = (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(n);
            }}
            style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
          >
            <AppText
              style={[styles.label, { color: active ? colors.bg : colors.dim }]}
            >
              {String(n)}
            </AppText>
          </Pressable>
        );
        return active ? (
          <GlowBox key={n} intensity="soft" style={styles.cell}>
            {pill}
          </GlowBox>
        ) : (
          <View key={n} style={styles.cell}>
            {pill}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
  pill: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 0,
  },
  pillIdle: {
    backgroundColor: colors.raise,
    borderColor: colors.line,
  },
  pillActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** Verified on the Tasting screen's PERSONAL RANK row later. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/RankPills.tsx && git commit -m "Add RankPills square single-select control"`

---

### Phase 2 — Task 5: `Stepper.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Stepper.tsx`

- [ ] **Step 1: Write the complete `Stepper.tsx` file.** A `− N +` integer control clamped to `min..max` (defaults 1 / 99). Disabled buttons dim at the bounds. Haptics on step.

```tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}

/** "- N +" integer control, clamped to min..max. */
export function Stepper({ value, min = 1, max = 99, onChange }: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const step = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => step(-1)}
        disabled={atMin}
        style={[styles.btn, atMin && styles.btnDisabled]}
      >
        <AppText style={styles.sign}>−</AppText>
      </Pressable>
      <View style={styles.valueBox}>
        <AppText style={styles.value}>{String(value)}</AppText>
      </View>
      <Pressable
        onPress={() => step(1)}
        disabled={atMax}
        style={[styles.btn, atMax && styles.btnDisabled]}
      >
        <AppText style={styles.sign}>+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
  },
  btn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  sign: {
    fontFamily: fonts.monoBold,
    fontSize: 22,
    color: colors.amber,
  },
  valueBox: {
    minWidth: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  value: {
    fontFamily: fonts.monoBold,
    fontSize: 18,
    color: colors.cream,
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** Verified on the New Theme admin form (whiskey count) later. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/Stepper.tsx && git commit -m "Add Stepper integer increment control"`

---

### Phase 2 — Task 6: `CustomTasterToggle.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/CustomTasterToggle.tsx`

- [ ] **Step 1: Write the complete `CustomTasterToggle.tsx` file.** A mono toggle button showing the action to switch INTO the other mode: when `custom` is false (list mode) it reads `CUSTOM`; when true it reads `LIST`. Amber border highlight when in custom mode. Haptics on toggle.

```tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface CustomTasterToggleProps {
  custom: boolean;
  onToggle: () => void;
}

/** Mono toggle: label is the mode you switch INTO. List mode shows "CUSTOM",
 *  custom mode shows "LIST". Parent swaps Dropdown <-> name Input. */
export function CustomTasterToggle({ custom, onToggle }: CustomTasterToggleProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onToggle();
      }}
      style={[styles.btn, custom && styles.btnActive]}
    >
      <AppText style={[styles.label, { color: custom ? colors.amber : colors.dim }]}>
        {custom ? 'LIST' : 'CUSTOM'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
  },
  btnActive: {
    borderColor: colors.amber,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** Verified on the Tasting taster-select row later. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/CustomTasterToggle.tsx && git commit -m "Add CustomTasterToggle mode switch button"`

---

### Phase 2 — Task 7: `PodiumGlass.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/PodiumGlass.tsx`

A `react-native-svg` glass trapezoid masked by a `ClipPath`, with an `Animated` amber-gradient fill `Rect` whose `y`/`height` animate up to `fillPct`. `place` sets the glass height (1 tallest → 3 shortest). The whole glass sits inside `GlowBox` (1st place strong glow). Uses `Animated.createAnimatedComponent(Rect)` and a non-native-driver timing with `Easing.bezier(.16,1,.3,1)`. Honors reduce-motion (snap to final).

- [ ] **Step 1: Write the complete `PodiumGlass.tsx` file.**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Path,
  Rect,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../../lib/theme';
import { GlowBox } from './GlowBox';

interface PodiumGlassProps {
  place: 1 | 2 | 3;
  fillPct: number; // 0..100
  animate: boolean;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const GLASS_WIDTH = 72;
const HEIGHT_BY_PLACE: Record<1 | 2 | 3, number> = { 1: 150, 2: 120, 3: 100 };
const TOP_INSET = 6; // px the rim is wider than the base (trapezoid)

/** A glass trapezoid (wider at top) with an animated amber-gradient fill that
 *  rises to fillPct. Place sets the glass height. 1st place glows strongest. */
export function PodiumGlass({ place, fillPct, animate }: PodiumGlassProps) {
  const h = HEIGHT_BY_PLACE[place];
  const fill = useRef(new Animated.Value(0)).current; // 0..1
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, fillPct)) / 100;
    if (!animate || reduceMotion) {
      fill.setValue(target);
      return;
    }
    fill.setValue(0);
    const anim = Animated.timing(fill, {
      toValue: target,
      duration: 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [fillPct, animate, reduceMotion, fill]);

  // Fill grows from the bottom: height = h * fill, y = h - height.
  const fillHeight = fill.interpolate({ inputRange: [0, 1], outputRange: [0, h] });
  const fillY = fill.interpolate({ inputRange: [0, 1], outputRange: [h, 0] });

  // Trapezoid path: top edge wider (rim) than the base.
  const path = `M${TOP_INSET} 0 L${GLASS_WIDTH - TOP_INSET} 0 L${GLASS_WIDTH - TOP_INSET * 2} ${h} L${TOP_INSET * 2} ${h} Z`;

  return (
    <GlowBox intensity={place === 1 ? 'strong' : 'soft'} color={colors.glow}>
      <View style={styles.wrap}>
        <Svg width={GLASS_WIDTH} height={h}>
          <Defs>
            <ClipPath id={`glass-${place}`}>
              <Path d={path} />
            </ClipPath>
            <LinearGradient id={`fill-${place}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.amberSoft} />
              <Stop offset="1" stopColor={colors.ember} />
            </LinearGradient>
          </Defs>
          {/* Glass body */}
          <Path d={path} fill={colors.panel} stroke={colors.line} strokeWidth={1} />
          {/* Animated amber fill, masked to the glass shape */}
          <AnimatedRect
            x={0}
            y={fillY}
            width={GLASS_WIDTH}
            height={fillHeight}
            fill={`url(#fill-${place})`}
            clipPath={`url(#glass-${place})`}
          />
        </Svg>
      </View>
    </GlowBox>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
```

- [ ] **Step 2: Add the missing `Easing` import.** The file uses `Easing.bezier(...)` but only imports `Animated` from `react-native`. Add `Easing` to that import line.

```tsx
import { Animated, AccessibilityInfo, View, StyleSheet, Easing } from 'react-native';
```

- [ ] **Step 3: Verify lint.** Run `npm run lint`. If the SVG type defs reject the animated `clipPath`/`y`/`height` props on `AnimatedRect`, cast the animated values with `as unknown as number` on those three props (keep the `AnimatedRect` element). Re-run until clean.
- [ ] **Step 4: Manual emulator check (deferred).** The podium is assembled on the Results sub-tab in a later phase; visual verification (glasses filling to 82/64/50%) happens there. Confirm lint only here.
- [ ] **Step 5: Commit.** `git add components/ui/PodiumGlass.tsx && git commit -m "Add PodiumGlass SVG filling-glass component"`

---

### Phase 2 — Task 8: `RankedBar.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/RankedBar.tsx`

A row with a zero-padded mono rank, a serif whiskey name, a mono proof, an `Animated`-width amber→ember gradient bar filling to `score/max`, and the `CountUp` score on the right. `top` wraps the bar in `GlowBox`. The gradient uses an SVG `LinearGradient` inside a full-width SVG bar whose visible portion is controlled by an animated wrapper width. Honors reduce-motion.

- [ ] **Step 1: Write the complete `RankedBar.tsx` file.**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';
import { CountUp } from './CountUp';
import { GlowBox } from './GlowBox';

interface RankedBarProps {
  rank: number;
  name: string;
  proof: number | null;
  score: number;
  max: number;
  top?: boolean;
  animate: boolean;
}

const BAR_HEIGHT = 10;
const TRACK_WIDTH = 1000; // virtual SVG width; the wrapper View clips it

/** A leaderboard row: mono rank, serif name + mono proof, an animated-width
 *  amber/ember gradient bar, and a count-up score. #1 row glows. */
export function RankedBar({ rank, name, proof, score, max, top, animate }: RankedBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current; // 0..1
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!animate || reduceMotion) {
      widthAnim.setValue(pct);
      return;
    }
    widthAnim.setValue(0);
    const anim = Animated.timing(widthAnim, {
      toValue: pct,
      duration: 950,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [pct, animate, reduceMotion, widthAnim]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bar = (
    <Animated.View style={[styles.barFill, { width: barWidth }]}>
      <Svg width={TRACK_WIDTH} height={BAR_HEIGHT}>
        <Defs>
          <LinearGradient id={`bar-${rank}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.amber} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={TRACK_WIDTH} height={BAR_HEIGHT} fill={`url(#bar-${rank})`} />
      </Svg>
    </Animated.View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <AppText style={styles.rank}>{String(rank).padStart(2, '0')}</AppText>
        <AppText variant="cardTitle" style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        {proof != null && <AppText style={styles.proof}>{proof} PROOF</AppText>}
        <CountUp value={score} decimals={1} animate={animate} style={styles.score} />
      </View>
      <View style={styles.track}>
        {top ? (
          <GlowBox intensity="soft" color={colors.glow} style={styles.glowWrap}>
            {bar}
          </GlowBox>
        ) : (
          bar
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.smd,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rank: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    color: colors.amber,
  },
  name: {
    flex: 1,
    fontSize: 18,
  },
  proof: {
    fontFamily: fonts.monoRegular,
    fontSize: 12,
    color: colors.muted,
  },
  score: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
    color: colors.cream,
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: colors.raise,
    overflow: 'hidden',
  },
  glowWrap: {
    height: BAR_HEIGHT,
  },
  barFill: {
    height: BAR_HEIGHT,
    overflow: 'hidden',
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** The bars are placed in the Results reveal in a later phase; the animated fill + count-up are verified there. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/RankedBar.tsx && git commit -m "Add RankedBar animated leaderboard bar"`

---

### Phase 2 — Task 9: `Accordion.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Accordion.tsx`

Header row (caller-supplied `ReactNode`) with an Ionicons `chevron-down` (same icon family/pattern as `Dropdown.tsx`) that rotates 180° via an `Animated` interpolation, and a body whose height animates between 0 and its measured content height. Measures content with `onLayout`. Honors reduce-motion (instant toggle, no animation).

- [ ] **Step 1: Write the complete `Accordion.tsx` file.**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  View,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../lib/theme';

interface AccordionProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/** Header row + rotating chevron + animated-height body. Body height is
 *  measured via onLayout. Reduce-motion toggles instantly. */
export function Accordion({ header, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current; // 0 closed, 1 open

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (reduceMotion) {
      anim.setValue(next ? 1 : 0);
      return;
    }
    Animated.timing(anim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) setContentHeight(h);
  };

  const bodyHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerContent}>{header}</View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={colors.amber} />
        </Animated.View>
      </Pressable>

      <Animated.View style={[styles.bodyClip, { height: bodyHeight }]}>
        {/* Absolutely positioned measurer so the clipped wrapper can size to it */}
        <View style={styles.measurer} onLayout={onContentLayout}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.smd,
    gap: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  measurer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`; expect no errors.
- [ ] **Step 3: Manual emulator check (deferred).** The accordion is used under the By Theme tab in a later phase; expand/collapse + chevron rotation are verified there. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/Accordion.tsx && git commit -m "Add Accordion animated-height disclosure component"`

---

### Phase 2 — Task 10: `CelebrateOverlay.tsx`

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/CelebrateOverlay.tsx`

A full-screen RN `Modal` with a scrim `rgba(10,8,5,.75)`, a card that slides up + fades in (lifecycle modeled on `Toast.tsx` — an `Animated.sequence` driven by the `visible` prop), a filling `PodiumGlass`, the `// LOGGED` eyebrow, `Cheers, <name>.` serif headline, a mono sub-line, and two actions: `SEE THE RESULTS` (primary `Button`) and `← HOME` (ghost `Button`). Honors reduce-motion (snap in).

- [ ] **Step 1: Write the complete `CelebrateOverlay.tsx` file.**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Modal,
  View,
  StyleSheet,
} from 'react-native';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';
import { Eyebrow } from './Eyebrow';
import { Button } from './Button';
import { PodiumGlass } from './PodiumGlass';

interface CelebrateOverlayProps {
  visible: boolean;
  userName: string;
  themeName: string;
  onSeeResults: () => void;
  onHome: () => void;
}

/** Post-submit celebration. Modal scrim + slide/fade card + filling glass,
 *  lifecycle modeled on Toast. Reduce-motion snaps the card in. */
export function CelebrateOverlay({
  visible,
  userName,
  themeName,
  onSeeResults,
  onHome,
}: CelebrateOverlayProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  // Keep the Modal mounted through the exit; gate render on internal state.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (active) setReduceMotion(rm);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (reduceMotion) {
        fade.setValue(1);
        slide.setValue(0);
        return;
      }
      fade.setValue(0);
      slide.setValue(40);
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      if (reduceMotion) {
        setMounted(false);
        return;
      }
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(
        () => setMounted(false),
      );
    }
  }, [visible, reduceMotion, fade, slide, mounted]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onHome}>
      <Animated.View style={[styles.scrim, { opacity: fade }]}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fade, transform: [{ translateY: slide }] },
          ]}
        >
          <View style={styles.glass}>
            <PodiumGlass place={1} fillPct={82} animate={!reduceMotion} />
          </View>
          <Eyebrow>LOGGED</Eyebrow>
          <AppText variant="sectionTitle" style={styles.headline} numberOfLines={2}>
            Cheers, {userName}.
          </AppText>
          <AppText style={styles.sub}>
            Your scores for {themeName} are in.
          </AppText>
          <View style={styles.actions}>
            <Button title="SEE THE RESULTS" onPress={onSeeResults} block />
            <Button title="← HOME" onPress={onHome} variant="ghost" block />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10,8,5,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 0,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.smd,
  },
  glass: {
    marginBottom: spacing.sm,
  },
  headline: {
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.monoRegular,
    fontSize: 13,
    color: colors.dim,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.smd,
  },
});
```

- [ ] **Step 2: Verify lint.** Run `npm run lint`. Note `Button`'s `ghost` variant exists today but Phase 1 retokenizes its colors; the `variant="ghost"` + `block` usage here is API-stable. If lint flags it, fall back to `variant="link"`. Re-run until clean.
- [ ] **Step 3: Manual emulator check (deferred).** The overlay is wired into the Tasting submit flow in a later phase, where the slide/fade, filling glass, and both buttons are verified end-to-end. Confirm lint only here.
- [ ] **Step 4: Commit.** `git add components/ui/CelebrateOverlay.tsx && git commit -m "Add CelebrateOverlay post-submit modal"`

---

### Phase 2 — Task 11: Full-phase lint gate + barrel review

**Files:**
- Modify (only if a barrel exists): `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/index.ts` (this repo currently imports each component by path — there is no `ui` barrel — so this step is a no-op unless one was introduced in Phase 1).

- [ ] **Step 1: Run the full type check across the new components together.** From `/home/reasel/git/Whiskey-Tasting/apps/mobile` run `npm run lint`. Expect zero errors with all 10 new files present (`CountUp`, `PulsingDot`, `TactileRating`, `RankPills`, `Stepper`, `CustomTasterToggle`, `PodiumGlass`, `RankedBar`, `Accordion`, `CelebrateOverlay`).
- [ ] **Step 2: Confirm no light-token leaks in the new files.** Run `grep -rEn "canvasCream|inkBlack|cardWhite|whiskeyAmber|panelGrey|steelGrey|lightGrey|mutedText|alertRed|signalGreen|amberDark|alertOrange" components/ui/CountUp.tsx components/ui/PulsingDot.tsx components/ui/TactileRating.tsx components/ui/RankPills.tsx components/ui/Stepper.tsx components/ui/CustomTasterToggle.tsx components/ui/PodiumGlass.tsx components/ui/RankedBar.tsx components/ui/Accordion.tsx components/ui/CelebrateOverlay.tsx` and expect no matches (all must use After Dark tokens only).
- [ ] **Step 3: Manual emulator smoke (deferred to screen phases).** None of these primitives mount on a screen yet; their visual behavior is verified when the screens (Tasting, Results, By Theme, New Theme, Home) consume them in later phases. No isolated emulator step is required here beyond a clean `npm run lint`.
- [ ] **Step 4: Commit (only if Step 2 produced fixes).** `git commit -am "Tidy After Dark component library token usage"` — skip if there is nothing to commit.

---

Relevant files for this phase (all absolute):
- New: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/{CountUp,PulsingDot,TactileRating,RankPills,Stepper,CustomTasterToggle,PodiumGlass,RankedBar,Accordion,CelebrateOverlay}.tsx`
- Depends on Phase 1: `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/theme.ts`, `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/GlowBox.tsx`, `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AfterDarkBackground.tsx`
- Modeled on (read this phase): `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/tasting/RatingSlider.tsx` (clamp/format/commit), `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Toast.tsx` (Animated lifecycle), `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Dropdown.tsx` (Ionicons chevron, Modal), `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Button.tsx`, `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/AppText.tsx`, `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/ui/Eyebrow.tsx`

Verified during planning: deps present (`react-native-svg@15.12.1`, `expo-haptics@~15.0.8`, `react-native@0.81.5`); `npm run lint` = `tsc --noEmit`; GlowBox/AfterDarkBackground/CountUp not yet created (Phase 1 owns the first two); no `components/ui` barrel exists today.


---

## Phase 3 — Screen Reskins & Wiring

> **Assumes Phases 1–2 complete:** `lib/theme.ts` exports the After Dark tokens (`colors.bg/bg2/panel/raise/cream/dim/muted/line/amber/amberSoft/ember/deep/red/green/glow/glowSoft`, `spacing`, `fonts`, `typography`, `hairline`, `glowSpec`); all `components/ui/` primitives consume the new tokens; `AfterDarkBackground`, `GlowBox`, `PulsingDot`, `CountUp`, `TactileRating`, `RankPills`, `Stepper`, `CustomTasterToggle`, `CelebrateOverlay` exist; `fetchThemeScores(themeId)` is exported from `lib/api/tastings.ts` via the barrel. Old token names (`canvasCream`, `whiskeyAmber`, `inkBlack`, `steelGrey`, `mutedText`, `cardWhite`, `lightGrey`, `panelGrey`, `signalGreen`, `alertRed`) are gone — every reference below is rewritten to After Dark tokens.

> All `cd` paths are relative to `/home/reasel/git/Whiskey-Tasting/apps/mobile`. Lint = `npm run lint` (`tsc --noEmit`). Emulator per `mobile-dev.md`.

---

### Phase 3 — Task 1: Lean Home (`app/index.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/index.tsx` (full rewrite — drops the 4-stat tile grid, swaps `GridBackground`→`AfterDarkBackground`, adds hero glow + "tonight" strip + 2 CTAs)

The "tasters-in" count is derived from `fetchThemeScores(activeTheme.id)`: union of `score.user_name` across all `whiskeys[].scores[]`. "Pours" = `whiskeys.length`.

- [ ] **Step 1: Replace the whole file with the lean-home implementation.**

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../lib/theme';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { GlowBox } from '../components/ui/GlowBox';
import { PulsingDot } from '../components/ui/PulsingDot';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
import {
  fetchActiveTheme,
  fetchThemeScores,
  type Theme,
} from '../lib/api';

type Tonight = { theme: Theme; pours: number; tasters: number };

export default function HomeScreen() {
  const router = useRouter();
  const [tonight, setTonight] = useState<Tonight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const active = await fetchActiveTheme();
      if (!active) {
        setTonight(null);
        return;
      }
      const scores = await fetchThemeScores(active.id);
      const tasterNames = new Set<string>();
      scores.whiskeys.forEach((w) =>
        w.scores.forEach((s) => tasterNames.add(s.user_name)),
      );
      setTonight({
        theme: active,
        pours: scores.whiskeys.length,
        tasters: tasterNames.size,
      });
    } catch {
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
        <AfterDarkBackground />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.amber}
          />
        }
      >
        <View style={styles.hero}>
          <GlowBox intensity="strong" style={styles.heroGlow}>
            <AppText variant="pageTitle">WHISKEY TASTING</AppText>
          </GlowBox>
          <Eyebrow style={styles.eyebrow}>HAVE A DRINK!</Eyebrow>
        </View>

        {error && (
          <Panel style={styles.errorPanel}>
            <AppText variant="body" style={styles.errorText}>{error}</AppText>
            <Button
              title="OPEN SETTINGS"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          </Panel>
        )}

        {tonight ? (
          <View style={styles.tonight}>
            <View style={styles.tonightTop}>
              <PulsingDot size={10} color={colors.amber} />
              <AppText variant="eyebrow" style={styles.tonightEyebrow}>TONIGHT</AppText>
            </View>
            <AppText variant="cardTitle" numberOfLines={2} adjustsFontSizeToFit>
              {tonight.theme.name}
            </AppText>
            <AppText variant="fieldLabel" style={styles.tonightMeta}>
              {tonight.pours} POURS · {tonight.tasters} TASTERS IN
            </AppText>
          </View>
        ) : (
          !error && (
            <View style={styles.tonight}>
              <AppText variant="bodyMuted">No active theme. Create one in Admin.</AppText>
            </View>
          )
        )}

        <View style={styles.actions}>
          <Button
            title="START TASTING"
            size="xl"
            block
            onPress={() => router.push('/tasting/')}
          />
          <Button
            title="VIEW RESULTS"
            size="xl"
            variant="outline"
            block
            onPress={() => router.push('/dashboard')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  hero: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  heroGlow: {
    alignSelf: 'flex-start',
  },
  eyebrow: {
    marginTop: spacing.smd,
  },
  errorPanel: {
    marginBottom: spacing.lg,
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    marginBottom: spacing.sm,
  },
  tonight: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  tonightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tonightEyebrow: {
    color: colors.amber,
  },
  tonightMeta: {
    color: colors.dim,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
```

- [ ] **Step 2: Verify — lint.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors (no remaining `colors.canvasCream`/`whiskeyAmber`/`GridBackground`/`fetchSystemStatus`/`Card` references).
- [ ] **Step 3: Verify — emulator.** Launch Home. Confirm: dark `#15120c` background with two faint amber radial glows; "WHISKEY TASTING" in Fraunces 900 with a soft amber halo behind it; "// HAVE A DRINK!" amber eyebrow; a "tonight" strip showing a pulsing amber dot + active theme name + "N POURS · M TASTERS IN" (or "No active theme…" when none); and exactly two CTAs (filled amber START TASTING, outline VIEW RESULTS). No 4-stat tile grid.
- [ ] **Step 4: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/index.tsx && git commit -m "Reskin Home to lean After Dark layout"`

---

### Phase 3 — Task 2: Pour card (`components/tasting/WhiskeyCard.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/tasting/WhiskeyCard.tsx` (full rewrite — 4 `RatingSlider`s → 3 `TactileRating` + 1 `RankPills`; dark pour-card styling with mono pour number, serif name, mono proof)

- [ ] **Step 1: Replace the whole file.** The existing `index: number` prop is used for the pour number (`01`); `totalWhiskeys` becomes `RankPills` `count`.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { TactileRating } from '../ui/TactileRating';
import { RankPills } from '../ui/RankPills';

interface WhiskeyScores {
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  personal_rank: number;
}

interface WhiskeyCardProps {
  index: number;
  name: string;
  proof: number | null;
  scores: WhiskeyScores;
  totalWhiskeys: number;
  onScoreChange: (field: keyof WhiskeyScores, value: number) => void;
}

export function WhiskeyCard({
  index,
  name,
  proof,
  scores,
  totalWhiskeys,
  onScoreChange,
}: WhiskeyCardProps) {
  const pourNo = String(index + 1).padStart(2, '0');
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="eyebrow" style={styles.pourNo}>{pourNo}</AppText>
        <View style={styles.headerText}>
          <AppText variant="cardTitle" numberOfLines={2} adjustsFontSizeToFit>
            {name}
          </AppText>
          {proof != null && (
            <AppText variant="fieldLabel" style={styles.proof}>{proof} PROOF</AppText>
          )}
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>AROMA</AppText>
        <TactileRating
          value={scores.aroma_score}
          onChange={(v) => onScoreChange('aroma_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>FLAVOR</AppText>
        <TactileRating
          value={scores.flavor_score}
          onChange={(v) => onScoreChange('flavor_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>FINISH</AppText>
        <TactileRating
          value={scores.finish_score}
          onChange={(v) => onScoreChange('finish_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>PERSONAL RANK</AppText>
        <RankPills
          value={scores.personal_rank}
          count={totalWhiskeys}
          onChange={(v) => onScoreChange('personal_rank', v)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pourNo: {
    color: colors.amber,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
  },
  proof: {
    color: colors.muted,
    marginTop: 2,
  },
  field: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    color: colors.dim,
  },
});
```

- [ ] **Step 2: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors and no remaining import of `./RatingSlider`, `Card`, or `colors.steelGrey`.
- [ ] **Step 3: Verify — emulator.** On the Taste tab (after picking a taster), each whiskey renders as a dark raised pour card: mono amber "01/02…" pour number, serif whiskey name, mono "NN PROOF". AROMA/FLAVOR/FINISH each show 5 tappable amber pips; PERSONAL RANK shows square pills `1..N` with one selected.
- [ ] **Step 4: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add components/tasting/WhiskeyCard.tsx && git commit -m "Rebuild WhiskeyCard as After Dark pour card with tactile rating and rank pills"`

---

### Phase 3 — Task 3: Tasting submission redesign (`app/tasting/index.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/tasting/index.tsx` (imports, taster field with `CustomTasterToggle`, "// Scores" header + instruction, submit bar with amber progress meter + validation/clamp, `CelebrateOverlay` on success; preserve default/last-submitter + edit-load behavior; dark style tokens)

The existing default/last-submitter resolution, `loadExistingScores`, `useFocusEffect`, `handleThemeChange`, `handleSelectUser` logic is **unchanged**. We add a `customTaster` toggle state, a celebrate-overlay state, validation/clamp, and reskin styles.

- [ ] **Step 1: Update imports.** Replace the import block (lines 12–21) so it brings in the new tokens and components and drops `Eyebrow`/`Panel` (we render headers inline) — add `CustomTasterToggle`, `CelebrateOverlay`, `useRouter`, `typography`.

Replace:
```tsx
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { WhiskeyCard } from '../../components/tasting/WhiskeyCard';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Panel } from '../../components/ui/Panel';
```
with:
```tsx
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { WhiskeyCard } from '../../components/tasting/WhiskeyCard';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { CustomTasterToggle } from '../../components/ui/CustomTasterToggle';
import { CelebrateOverlay } from '../../components/ui/CelebrateOverlay';
```

- [ ] **Step 2: Add router + new state.** Immediately after `export default function TastingScreen() {` (line 52) and the existing `const [themes, ...]` declarations, add (place these right after the `useState` block, before `const [toast, ...]` is fine — put them with the other state):

Insert after line 64 (`const [defaultUserName, ...]`):
```tsx
  const router = useRouter();
  const [customTaster, setCustomTaster] = useState(false);
  const [celebrate, setCelebrate] = useState<{
    visible: boolean;
    userName: string;
    themeName: string;
  }>({ visible: false, userName: '', themeName: '' });
```

- [ ] **Step 3: Clamp 1–5 + validation + celebrate in `handleSubmit`.** Replace the entire `handleSubmit` callback (lines 301–331).

Replace:
```tsx
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
        message: 'Tasting submitted. Pick the next person.',
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
```
with:
```tsx
  const clampRating = (n: number) => Math.min(5, Math.max(1, n));

  const handleSubmit = useCallback(async () => {
    if (!userName.trim() || selectedThemeId == null) return;

    // Clamp aroma/flavor/finish to 1–5 before POST (backend doesn't validate).
    // personal_rank is left as-is (RankPills already constrains it to 1..N).
    const clamped: SubmitTastingRequest['whiskey_scores'] = {};
    Object.entries(scores).forEach(([id, s]) => {
      clamped[Number(id)] = {
        aroma_score: clampRating(s.aroma_score),
        flavor_score: clampRating(s.flavor_score),
        finish_score: clampRating(s.finish_score),
        personal_rank: s.personal_rank,
      };
    });

    const submittedName = userName.trim();
    const submittedTheme =
      themes.find((t) => t.id === selectedThemeId)?.name ?? '';

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: submittedName,
        whiskey_scores: clamped,
      };
      await submitTasting(request);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrate({ visible: true, userName: submittedName, themeName: submittedTheme });
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
  }, [userName, selectedThemeId, scores, themes]);

  // Dismiss the overlay and return to a fresh person picker (proxy flow),
  // keeping the theme — mirrors the previous post-submit reset.
  const resetAfterSubmit = useCallback(() => {
    setCelebrate((c) => ({ ...c, visible: false }));
    setUserSelected(false);
    setUserName('');
    setCustomTaster(false);
    initScores(whiskeys);
  }, [whiskeys, initScores]);
```

- [ ] **Step 4: Add submit readiness + progress derivation.** Add these derived values just before the `if (loading) {` block (line 346). They count filled fields (aroma/flavor/finish must be non-zero; rank must be non-zero) across all whiskeys.

Insert before `if (loading) {`:
```tsx
  const scoreList = whiskeys
    .map((w) => (w.id != null ? scores[w.id] : undefined))
    .filter((s): s is WhiskeyScores => s != null);
  const totalFields = scoreList.length * 4;
  const filledFields = scoreList.reduce(
    (acc, s) =>
      acc +
      (s.aroma_score > 0 ? 1 : 0) +
      (s.flavor_score > 0 ? 1 : 0) +
      (s.finish_score > 0 ? 1 : 0) +
      (s.personal_rank > 0 ? 1 : 0),
    0,
  );
  const progress = totalFields > 0 ? filledFields / totalFields : 0;
  const canSubmit =
    userName.trim().length > 0 &&
    totalFields > 0 &&
    filledFields === totalFields;
```

- [ ] **Step 5: Reskin the selection-phase taster field with `CustomTasterToggle`.** In the `if (!userSelected)` block, replace the page title / eyebrow + the "WHO ARE YOU?" header + the user list/divider/new-name section. Replace lines 378–444 (from `<AppText variant="pageTitle" ...>` through the `CONTINUE` `<Button .../>`).

Replace:
```tsx
          <AppText variant="pageTitle" style={styles.pageTitle}>
            TASTING SUBMISSION
          </AppText>
          <Eyebrow style={styles.eyebrow}>SUBMIT OR EDIT TASTING SCORES</Eyebrow>

          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />

          <View style={styles.sectionHeader}>
            <AppText variant="fieldLabel">WHO ARE YOU?</AppText>
          </View>
          <AppText variant="body" style={styles.sectionSubtitle}>
            Select your name or enter a new one. You can submit for others too.
          </AppText>

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

          <View style={styles.divider} />
          <AppText variant="fieldLabel" style={styles.orLabel}>
            OR ENTER A NEW NAME
          </AppText>
          <Input
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name..."
            autoCapitalize="words"
          />
          <Button
            title="CONTINUE"
            onPress={handleContinueAsNew}
            disabled={!userName.trim() || loadingWhiskeys}
            style={{ marginTop: spacing.md }}
          />
```
with:
```tsx
          <AppText variant="pageTitle" style={styles.pageTitle}>
            TASTING SUBMISSION
          </AppText>
          <Eyebrow style={styles.eyebrow}>SUBMIT OR EDIT TASTING SCORES</Eyebrow>

          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />

          <View style={styles.sectionHeader}>
            <AppText variant="fieldLabel">WHO ARE YOU?</AppText>
            <CustomTasterToggle
              custom={customTaster}
              onToggle={() => {
                setCustomTaster((c) => !c);
                setUserName('');
              }}
            />
          </View>

          {customTaster ? (
            <>
              <AppText variant="bodyMuted" style={styles.sectionSubtitle}>
                Type a name to submit as someone new.
              </AppText>
              <Input
                value={userName}
                onChangeText={setUserName}
                placeholder="Type a name…"
                autoCapitalize="words"
              />
              <Button
                title="CONTINUE"
                onPress={handleContinueAsNew}
                disabled={!userName.trim() || loadingWhiskeys}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : (
            <>
              <AppText variant="bodyMuted" style={styles.sectionSubtitle}>
                Tap your name. You can submit for others too.
              </AppText>
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
            </>
          )}
```

- [ ] **Step 6: Add the Toast + CelebrateOverlay to the selection phase return.** In the selection-phase `return`, the existing `<Toast .../>` stays; add the overlay right after it (before the closing `</SafeAreaView>` at line 453). Insert after the `<Toast ... />` block in the selection phase:
```tsx
        <CelebrateOverlay
          visible={celebrate.visible}
          userName={celebrate.userName}
          themeName={celebrate.themeName}
          onSeeResults={() => {
            resetAfterSubmit();
            router.push('/dashboard');
          }}
          onHome={() => {
            resetAfterSubmit();
            router.push('/');
          }}
        />
```

- [ ] **Step 7: Rebuild the tasting-form header + Scores header + submit bar.** In the tasting-form `return` (line 458+), replace the `<View style={styles.themeHeader}>…</View>` block (lines 473–491) and the `<Panel title="Scores">…` wrapper (lines 496–522) and the submit `<Button .../>` (lines 524–531).

Replace the theme header block:
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
with:
```tsx
        <View style={styles.themeHeader}>
          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />
          <View style={styles.tastingAsRow}>
            <AppText variant="tableCell" style={styles.userLabel}>
              Tasting as: {userName}
            </AppText>
            <Button
              title="CHANGE USER"
              variant="outline"
              size="sm"
              onPress={() => setUserSelected(false)}
            />
          </View>
        </View>
```

Replace the Panel-wrapped scores block:
```tsx
        {loadingWhiskeys ? (
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        ) : (
          <Panel title="Scores">
            <View style={styles.scoreList}>
              {whiskeys.map((whiskey, index) =>
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
              )}
            </View>
          </Panel>
        )}

        <Button
          title="SUBMIT TASTING"
          size="lg"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || loadingWhiskeys}
          style={styles.submitButton}
        />
```
with:
```tsx
        {loadingWhiskeys ? (
          <ActivityIndicator size="large" color={colors.amber} />
        ) : (
          <View>
            <View style={styles.scoresHeader}>
              <Eyebrow>Scores</Eyebrow>
              <AppText variant="bodyMuted" style={styles.scoresInstruction}>
                Rate each pour 1–5 for aroma, flavor and finish, then set your
                personal rank.
              </AppText>
            </View>
            <View style={styles.scoreList}>
              {whiskeys.map((whiskey, index) =>
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
              )}
            </View>
          </View>
        )}

        <View style={styles.submitBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <AppText variant="fieldLabel" style={styles.progressLabel}>
            {filledFields} / {totalFields} FIELDS
          </AppText>
          <Button
            title="SUBMIT"
            size="lg"
            block
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || loadingWhiskeys || !canSubmit}
            style={styles.submitButton}
          />
        </View>
```

- [ ] **Step 8: Add the CelebrateOverlay to the tasting-form return too.** After the second `<Toast ... />` (lines 534–539), before the closing `</SafeAreaView>`, insert the same overlay block:
```tsx
      <CelebrateOverlay
        visible={celebrate.visible}
        userName={celebrate.userName}
        themeName={celebrate.themeName}
        onSeeResults={() => {
          resetAfterSubmit();
          router.push('/dashboard');
        }}
        onHome={() => {
          resetAfterSubmit();
          router.push('/');
        }}
      />
```

- [ ] **Step 9: Reskin the styles.** Replace the entire `StyleSheet.create({...})` (lines 544–634) with dark tokens + new style keys (`tastingAsRow`, `scoresHeader`, `scoresInstruction`, `submitBar`, `progressTrack`, `progressFill`, `progressLabel`). Removes `divider`/`orLabel`/`emptyTitle` if unused — keep `emptyTitle`/`emptyText` (still referenced by the no-themes branch).

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
  },
  pageTitle: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    marginBottom: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.amber,
    borderWidth: 2,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardDefault: {
    borderColor: colors.amber,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  defaultBadge: {
    color: colors.amber,
    marginLeft: spacing.sm,
  },
  userName: {
    color: colors.cream,
  },
  userNameActive: {
    color: colors.amber,
  },
  themeHeader: {
    marginBottom: spacing.lg,
  },
  tastingAsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  userLabel: {
    color: colors.dim,
  },
  scoresHeader: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  scoresInstruction: {
    color: colors.muted,
  },
  scoreList: {
    gap: spacing.md,
  },
  submitBar: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.amber,
  },
  progressLabel: {
    color: colors.dim,
    textAlign: 'right',
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 10: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors and no remaining `colors.whiskeyAmber`/`steelGrey`/`inkBlack`, no unused `Panel` import.
- [ ] **Step 11: Verify — emulator.** Taste tab: the taster section shows a "Custom"/"List" toggle that swaps the name list ↔ a "Type a name…" input. After picking a taster, the form shows "// SCORES" + instruction line; the bottom submit bar shows an amber progress meter that grows as fields fill, "X / Y FIELDS", and SUBMIT stays disabled until every aroma/flavor/finish/rank is set. Submitting shows the CelebrateOverlay; "SEE THE RESULTS" navigates to the Results tab and "← HOME" to Home; both reset to a fresh picker. Editing an existing taster still preloads their saved scores.
- [ ] **Step 12: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/tasting/index.tsx && git commit -m "Redesign tasting submission: custom-taster toggle, progress meter, celebrate overlay"`

---

### Phase 3 — Task 4: Admin landing (`app/admin/index.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/admin/index.tsx` (full rewrite — dark reskin; "VIEW DATA" → "VIEW RESULTS" routing to `/dashboard`; drop the dead `/admin/data` route)

- [ ] **Step 1: Replace the whole file.** Five actions: Create New Theme, Edit Themes, Add User, Delete User (destructive), View Results.

```tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { AfterDarkBackground } from '../../components/ui/AfterDarkBackground';

export default function AdminIndexScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="pageTitle" style={styles.title}>ADMINISTRATION</AppText>
        <Eyebrow style={styles.subtitle}>MANAGE THEMES, USERS, AND SETTINGS</Eyebrow>

        <View style={styles.grid}>
          <View style={styles.tile}>
            <Button
              title="MANAGE THEMES"
              size="xl"
              block
              onPress={() => router.push('/admin/themes')}
            />
          </View>
          <View style={styles.tile}>
            <Button
              title="MANAGE USERS"
              size="xl"
              block
              onPress={() => router.push('/admin/users')}
            />
          </View>
          <View style={styles.tileWide}>
            <Button
              title="VIEW RESULTS"
              size="xl"
              variant="outline"
              block
              onPress={() => router.push('/dashboard')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tile: {
    width: '48%',
  },
  tileWide: {
    width: '100%',
  },
});
```

- [ ] **Step 2: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors; no `/admin/data` reference, no `colors.canvasCream`.
- [ ] **Step 3: Verify — emulator.** Admin landing renders on the dark After Dark background; "MANAGE THEMES" and "MANAGE USERS" sit side-by-side, "VIEW RESULTS" full-width outline below. Tapping VIEW RESULTS opens the Results/dashboard screen.
- [ ] **Step 4: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/admin/index.tsx && git commit -m "Reskin admin landing and route View Results to dashboard"`

---

### Phase 3 — Task 5: New Theme stepper + dynamic whiskey rows (`app/admin/themes.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/admin/themes.tsx` (replace the numeric-text "Number of Whiskeys" `Input` with a `Stepper` (clamp 1–8) driving a dynamic `NN · name · proof` row list; on create, `createTheme` then `updateWhiskeys`; dark reskin)

`createTheme` only seeds `num_whiskeys` blank rows; per-row name/proof are persisted via `updateWhiskeys(themeId, [{name, proof}])`. We chain them.

- [ ] **Step 1: Update imports + add `Stepper` + `updateWhiskeys`.** Replace lines 11–24.

Replace:
```tsx
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import {
  fetchThemes,
  createTheme,
  deleteTheme,
  type Theme,
  type CreateThemeRequest,
} from '../../lib/api';
```
with:
```tsx
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Stepper } from '../../components/ui/Stepper';
import {
  fetchThemes,
  createTheme,
  updateWhiskeys,
  deleteTheme,
  type Theme,
  type CreateThemeRequest,
} from '../../lib/api';
```

- [ ] **Step 2: Swap `numWhiskeys` string state for a number + a whiskey-rows array.** Replace line 34 (`const [numWhiskeys, setNumWhiskeys] = useState('3');`).

Replace:
```tsx
  const [numWhiskeys, setNumWhiskeys] = useState('3');
```
with:
```tsx
  const [count, setCount] = useState(3);
  const [rows, setRows] = useState<{ name: string; proof: string }[]>(
    Array.from({ length: 3 }, () => ({ name: '', proof: '' })),
  );

  const setCountClamped = useCallback((n: number) => {
    const clamped = Math.min(8, Math.max(1, n));
    setCount(clamped);
    setRows((prev) => {
      const next = [...prev];
      if (clamped > next.length) {
        while (next.length < clamped) next.push({ name: '', proof: '' });
      } else {
        next.length = clamped;
      }
      return next;
    });
  }, []);

  const updateRow = useCallback(
    (i: number, field: 'name' | 'proof', value: string) => {
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    },
    [],
  );
```

- [ ] **Step 3: Rewrite `handleCreate` to chain `createTheme` → `updateWhiskeys`.** Replace the whole callback (lines 57–82).

Replace:
```tsx
  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const request: CreateThemeRequest = {
        name: name.trim(),
        notes: notes.trim(),
        num_whiskeys: parseInt(numWhiskeys) || 3,
      };
      await createTheme(request);
      setName('');
      setNotes('');
      setNumWhiskeys('3');
      setShowForm(false);
      setToast({ message: 'Theme created.', type: 'success', visible: true });
      await loadThemes();
    } catch {
      setToast({
        message: 'Failed to create theme.',
        type: 'error',
        visible: true,
      });
    } finally {
      setCreating(false);
    }
  }, [name, notes, numWhiskeys, loadThemes]);
```
with:
```tsx
  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const request: CreateThemeRequest = {
        name: name.trim(),
        notes: notes.trim(),
        num_whiskeys: count,
      };
      const created = await createTheme(request);
      // Persist the per-row name/proof entered in the form.
      const whiskeys = rows.map((r) => {
        const proofNum = parseFloat(r.proof);
        return {
          name: r.name.trim(),
          proof: Number.isFinite(proofNum) ? proofNum : null,
        };
      });
      await updateWhiskeys(created.theme.id, whiskeys);
      setName('');
      setNotes('');
      setCountClamped(3);
      setShowForm(false);
      setToast({ message: 'Theme created.', type: 'success', visible: true });
      await loadThemes();
    } catch {
      setToast({
        message: 'Failed to create theme.',
        type: 'error',
        visible: true,
      });
    } finally {
      setCreating(false);
    }
  }, [name, notes, count, rows, setCountClamped, loadThemes]);
```

- [ ] **Step 4: Replace the form body (number Input → Stepper + dynamic rows).** Replace the `<Card style={styles.formCard}>…</Card>` block (lines 153–183).

Replace:
```tsx
        {showForm && (
          <Card style={styles.formCard}>
            <Input
              label="Theme Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bourbon Night"
            />
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />
            <Input
              label="Number of Whiskeys (1-20)"
              value={numWhiskeys}
              onChangeText={setNumWhiskeys}
              keyboardType="number-pad"
              placeholder="3"
            />
            <Button
              title={creating ? 'Creating...' : 'CREATE THEME'}
              onPress={handleCreate}
              loading={creating}
              disabled={!name.trim() || creating}
            />
          </Card>
        )}
```
with:
```tsx
        {showForm && (
          <Card style={styles.formCard}>
            <Input
              label="THEME NAME"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bourbon Night"
            />
            <Input
              label="NOTES"
              value={notes}
              onChangeText={setNotes}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.stepperRow}>
              <AppText variant="fieldLabel">NUMBER OF WHISKEYS</AppText>
              <Stepper value={count} min={1} max={8} onChange={setCountClamped} />
            </View>

            <View style={styles.whiskeyRows}>
              {rows.map((row, i) => (
                <View key={i} style={styles.whiskeyRow}>
                  <AppText variant="eyebrow" style={styles.rowNo}>
                    {String(i + 1).padStart(2, '0')}
                  </AppText>
                  <View style={styles.rowName}>
                    <Input
                      value={row.name}
                      onChangeText={(v) => updateRow(i, 'name', v)}
                      placeholder="Whiskey name"
                      containerStyle={styles.rowInput}
                    />
                  </View>
                  <View style={styles.rowProof}>
                    <Input
                      value={row.proof}
                      onChangeText={(v) => updateRow(i, 'proof', v)}
                      placeholder="Proof"
                      keyboardType="decimal-pad"
                      containerStyle={styles.rowInput}
                    />
                  </View>
                </View>
              ))}
            </View>

            <Button
              title={creating ? 'Creating...' : 'CREATE THEME'}
              onPress={handleCreate}
              loading={creating}
              disabled={!name.trim() || creating}
            />
          </Card>
        )}
```

- [ ] **Step 5: Reskin the styles.** Replace the entire `StyleSheet.create({...})` (lines 221–271) with dark tokens + the new row/stepper keys.

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  title: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  createButton: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  whiskeyRows: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  whiskeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowNo: {
    color: colors.amber,
    width: 24,
  },
  rowName: {
    flex: 3,
  },
  rowProof: {
    flex: 1,
  },
  rowInput: {
    marginBottom: 0,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
  },
  themeCard: {
    marginBottom: spacing.md,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  themeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  themeNotes: {
    color: colors.dim,
    marginTop: 2,
  },
});
```

- [ ] **Step 6: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors; no `numWhiskeys`, no `colors.steelGrey`/`mutedText`/`canvasCream`.
- [ ] **Step 7: Verify — emulator.** Admin → Manage Themes → "Create New Theme". The form shows a `− N +` Stepper (clamped 1–8); changing it adds/removes numbered whiskey rows (`01`, name input, proof input). Fill name+notes+rows, tap CREATE THEME; the new theme appears in the list and (re-open it on the Taste tab) the entered whiskey names/proofs are present. Form is fully dark.
- [ ] **Step 8: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/admin/themes.tsx && git commit -m "Add whiskey-count stepper and dynamic whiskey rows to New Theme form"`

---

### Phase 3 — Task 6: Users admin reskin (`app/admin/users.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/admin/users.tsx` (dark token swap only; Delete already uses `variant="destructive"` which maps to `colors.red`)

- [ ] **Step 1: Swap the loading spinner + add-title color references.** The only token changes are in the spinner and the StyleSheet. Replace line 110 (the loading-state `ActivityIndicator`).

Replace:
```tsx
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
```
with:
```tsx
          <ActivityIndicator size="large" color={colors.amber} />
```

- [ ] **Step 2: Swap the RefreshControl tint.** Replace line 127.

Replace:
```tsx
            tintColor={colors.whiskeyAmber}
```
with:
```tsx
            tintColor={colors.amber}
```

- [ ] **Step 3: Reskin the styles.** Replace the entire `StyleSheet.create({...})` (lines 183–225).

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  title: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  addCard: {
    marginBottom: spacing.xl,
  },
  addTitle: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.xl,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
```

- [ ] **Step 4: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors; no `colors.canvasCream`/`whiskeyAmber`/`mutedText`.
- [ ] **Step 5: Verify — emulator.** Admin → Manage Users renders fully dark. Add User card works; each user row has a red destructive DELETE button; deleting prompts the confirm alert then removes the user.
- [ ] **Step 6: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/admin/users.tsx && git commit -m "Reskin users admin to After Dark tokens"`

---

### Phase 3 — Task 7: Admin layout — drop data route + reskin password gate (`app/admin/_layout.tsx`) + delete `data.tsx`

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/admin/_layout.tsx` (remove the `data` `Stack.Screen`; dark reskin of the gate + Stack `contentStyle`)
- Delete: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/admin/data.tsx`

- [ ] **Step 1: `git rm` the dead screen.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git rm app/admin/data.tsx`
- [ ] **Step 2: Reskin the gate + wrap with AfterDarkBackground.** Update imports (add `AfterDarkBackground`) and the gate JSX. Replace lines 9–14.

Replace:
```tsx
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Panel } from '../../components/ui/Panel';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
```
with:
```tsx
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Panel } from '../../components/ui/Panel';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { AfterDarkBackground } from '../../components/ui/AfterDarkBackground';
```

- [ ] **Step 3: Add the background to the gate `SafeAreaView`.** Replace lines 32–34.

Replace:
```tsx
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Panel style={{ maxWidth: 420, alignSelf: 'center', width: '100%' }}>
```
with:
```tsx
      <SafeAreaView style={styles.container}>
        <AfterDarkBackground />
        <View style={styles.loginContainer}>
          <Panel style={{ maxWidth: 420, alignSelf: 'center', width: '100%' }}>
```

- [ ] **Step 4: Remove the `data` Stack.Screen + dark `contentStyle`.** Replace the `<Stack ...>` block (lines 53–64).

Replace:
```tsx
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvasCream },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="themes" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="data" options={{ headerShown: false }} />
    </Stack>
```
with:
```tsx
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="themes" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
    </Stack>
```

- [ ] **Step 5: Reskin the gate `container` background.** Replace the `container` style (lines 69–72).

Replace:
```tsx
  container: {
    flex: 1,
    backgroundColor: colors.canvasCream,
  },
```
with:
```tsx
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
```

- [ ] **Step 6: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors; `grep -rn "admin/data" app/` returns nothing.
- [ ] **Step 7: Verify — emulator.** Cold-open the Admin tab: the password gate is fully dark with the After Dark glow background. Entering `admin` unlocks; the landing shows only Themes / Users / View Results (no "View Data"). Navigating around Admin never reaches a `data` route.
- [ ] **Step 8: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/admin/_layout.tsx app/admin/data.tsx && git commit -m "Remove admin data screen and reskin admin password gate"`

---

### Phase 3 — Task 8: Settings reskin (`app/settings.tsx`)

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/settings.tsx` (dark token swap — Server Connection, Default Submitter, About; replace `signalGreen`/`alertRed`/`mutedText`/`whiskeyAmber`/`canvasCream`/`inkBlack` with `green`/`red`/`muted`/`amber`/`bg`/`cream`)

- [ ] **Step 1: Wrap with AfterDarkBackground.** Add the import and render it. Replace lines 9–15.

Replace:
```tsx
import { colors, spacing } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Panel } from '../components/ui/Panel';
import { Card } from '../components/ui/Card';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
```
with:
```tsx
import { colors, spacing } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Panel } from '../components/ui/Panel';
import { Card } from '../components/ui/Card';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
```

- [ ] **Step 2: Render the background inside the root `SafeAreaView`.** Replace line 112–113.

Replace:
```tsx
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
```
with:
```tsx
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView contentContainerStyle={styles.content}>
```

- [ ] **Step 3: Recolor the connection status text.** Replace the connection-status color expression (lines 159–162).

Replace:
```tsx
                  color:
                    connectionStatus === 'connected'
                      ? colors.signalGreen
                      : colors.alertRed,
```
with:
```tsx
                  color:
                    connectionStatus === 'connected'
                      ? colors.green
                      : colors.red,
```

- [ ] **Step 4: Reskin the styles.** Replace the entire `StyleSheet.create({...})` (lines 243–305) with After Dark tokens. (`userName` drops the hard-coded weight; color comes from the `body` variant.)

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    color: colors.muted,
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
    color: colors.muted,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.amber,
    borderWidth: 2,
  },
  userName: {
    color: colors.cream,
  },
  userNameActive: {
    color: colors.amber,
  },
});
```

- [ ] **Step 5: Verify — lint.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm run lint`. Expect no errors; no `colors.signalGreen`/`alertRed`/`mutedText`/`whiskeyAmber`/`canvasCream`/`inkBlack`.
- [ ] **Step 6: Verify — emulator.** Settings tab renders fully dark with the glow background. Server Connection: TEST CONNECTION shows green "Connected successfully." (or red failure). Default Submitter: tapping a user highlights it amber; CLEAR DEFAULT works. About shows app name/version.
- [ ] **Step 7: Commit.** `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add app/settings.tsx && git commit -m "Reskin settings to After Dark tokens"`


---

### Phase 3 — Task 9: Remove dead `RatingSlider` + `GridBackground` and drop the slider dependency

**Files:**
- Delete: `apps/mobile/components/tasting/RatingSlider.tsx`
- Delete: `apps/mobile/components/ui/GridBackground.tsx`
- Modify: `apps/mobile/package.json` (remove `@react-native-community/slider`)

After Task 2 (`WhiskeyCard` → `TactileRating`/`RankPills`) nothing imports `RatingSlider`, and after Task 1 (lean Home → `AfterDarkBackground`) nothing imports `GridBackground`. `RatingSlider` references removed light tokens, so it must go for `tsc` to pass; `GridBackground` is now unused.

- [ ] **Step 1: Confirm both are unused.** Run:

```bash
cd /home/reasel/git/Whiskey-Tasting/apps/mobile
grep -rn "RatingSlider" app components | grep -v 'RatingSlider.tsx:'     # expect no output
grep -rn "GridBackground" app components | grep -v 'GridBackground.tsx:' # expect no output
```

- [ ] **Step 2: Delete the files.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git rm components/tasting/RatingSlider.tsx components/ui/GridBackground.tsx`

- [ ] **Step 3: Remove the slider dependency.** In `apps/mobile/package.json`, delete the line:

```json
    "@react-native-community/slider": "5.0.1",
```

- [ ] **Step 4: Update the lockfile.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && npm install` and expect it to complete (updates `package-lock.json`).

- [ ] **Step 5: Verify no dangling references.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && grep -rn "@react-native-community/slider\|RatingSlider\|GridBackground" app components lib` and expect NO output.

- [ ] **Step 6: Commit.** Run `cd /home/reasel/git/Whiskey-Tasting/apps/mobile && git add -A && git commit -m "Remove obsolete RatingSlider, GridBackground, and slider dependency"`

---

## Phase 4 — Features: Scoring + Data View Reveal

This phase assumes Phases 1–3 are done: `lib/theme.ts` rewritten to the After Dark tokens (`colors.amber`, `colors.cream`, `colors.line`, etc. — no light names like `canvasCream`/`inkBlack`/`whiskeyAmber`); `components/ui/Tabs.tsx` reskinned to dark tokens; and the new presentational primitives already exist with the contract APIs: `AfterDarkBackground`, `GlowBox`, `PulsingDot`, `CountUp`, `PodiumGlass`, `RankedBar`, `Accordion`. All work happens in `/home/reasel/git/Whiskey-Tasting/apps/mobile` on branch `afterdark-mobile-redesign`.

---

### Phase 4 — Task 1: Add jest + jest-expo TDD infrastructure

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/package.json` (add devDeps + `test` script + `jest` config block)
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/jest.config.js`

- [ ] **Step 1: Install jest devDeps pinned for SDK 54 / RN 0.81.**
  Run (from the mobile dir; on NixOS use the project dev shell):
  ```bash
  npm install --save-dev jest@^29 jest-expo@~54.0.0 @types/jest@^29
  ```
  This adds `jest`, `jest-expo`, and `@types/jest` to `devDependencies`. Do not change any other dependency versions.

- [ ] **Step 2: Add the `test` script to package.json.**
  In `/home/reasel/git/Whiskey-Tasting/apps/mobile/package.json`, change the `"scripts"` block from:
  ```json
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "tsc --noEmit"
  },
  ```
  to:
  ```json
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "lint": "tsc --noEmit",
    "test": "jest"
  },
  ```

- [ ] **Step 3: Create the jest config.**
  Create `/home/reasel/git/Whiskey-Tasting/apps/mobile/jest.config.js` with the complete contents:
  ```js
  /** @type {import('jest').Config} */
  module.exports = {
    preset: 'jest-expo',
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    // lib/scoring.ts is pure data logic with no RN imports, so the
    // jest-expo transform is sufficient. No setup files are needed.
  };
  ```

- [ ] **Step 4 (verify): jest is wired up.**
  Run:
  ```bash
  npx jest --version
  ```
  Expect a version string (e.g. `29.x.x`) and no error. (No tests exist yet — running `npm test` now would report "No tests found"; that is expected and confirmed in Task 2.)

- [ ] **Step 5 (commit):**
  ```bash
  git add package.json package-lock.json jest.config.js
  git commit -m "mobile: add jest + jest-expo test infrastructure"
  ```

---

### Phase 4 — Task 2: `lib/scoring.ts` via TDD

Pure aggregation logic lifted out of `dashboard.tsx`. Build one function at a time: **write the failing test first, run `npm test` (expect fail), implement, run `npm test` (expect pass), commit.** All types/signatures are exactly as in the contract. `mean([])` returns `0`.

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/__tests__/scoring.test.ts`
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/scoring.ts`

#### Shared fixture (used by all sub-tasks)

The fixture is built once at the top of the test file. **3 whiskeys, 4 tasters, with deliberate gaps** so the skip-unscored behavior is exercised. The numbers below are pre-computed so the assertions are exact.

Whiskey A (Bourbon, 90 proof) — scored by Ann, Bob, Cy:
- Ann a/f/fi = 5/5/5 (avg 5.0)
- Bob a/f/fi = 4/4/4 (avg 4.0)
- Cy  a/f/fi = 3/3/3 (avg 3.0)
- group dim avg: aroma=(5+4+3)/3=4, flavor=4, finish=4. Whiskey A `average_score` = mean of the three `average_score` = (5+4+3)/3 = **4.0**, 3 tasters.

Whiskey B (Rye, 100 proof) — scored by Ann, Bob (Cy and Dee skip):
- Ann a/f/fi = 2/2/2 (avg 2.0)
- Bob a/f/fi = 4/4/4 (avg 4.0)
- group dim avg: aroma=(2+4)/2=3, flavor=3, finish=3. Whiskey B `average_score` = (2+4)/2 = **3.0**, 2 tasters.

Whiskey C (Scotch, 80 proof) — scored by Dee only:
- Dee a/f/fi = 1/1/1 (avg 1.0)
- group dim avg: aroma=1, flavor=1, finish=1. Whiskey C `average_score` = **1.0**, 1 taster.

**Consensus mean-abs-deviation (skip whiskeys the taster didn't score):**
- Ann: A dims |5-4|,|5-4|,|5-4| = 1,1,1; B dims |2-3|,|2-3|,|2-3| = 1,1,1 → 6 deviations, sum 6 → MAD = 6/6 = **1.0**
- Bob: A |4-4|×3 = 0,0,0; B |4-3|×3 = 1,1,1 → 6 deviations, sum 3 → MAD = 3/6 = **0.5**
- Cy:  A only |3-4|×3 = 1,1,1 → 3 deviations, sum 3 → MAD = 3/3 = **1.0**
- Dee: C only |1-1|×3 = 0,0,0 → 3 deviations, sum 0 → MAD = **0.0**
- Sorted ascending: Dee (0.0, rank 1), Bob (0.5, rank 2), then Ann & Cy tie at 1.0 — stable sort keeps Ann before Cy → Ann rank 3, Cy rank 4.

- [ ] **Step 1: Write the failing test file with the fixture + leaderboard test.**
  Create `/home/reasel/git/Whiskey-Tasting/apps/mobile/__tests__/scoring.test.ts`:
  ```ts
  import type {
    ThemeScoresResponse,
    WhiskeyScores,
    TastingScore,
  } from '../lib/api/tastings';
  import {
    leaderboard,
    consensus,
    allWhiskeys,
    byPerson,
    whiskeyBreakdown,
  } from '../lib/scoring';

  function score(
    user_name: string,
    a: number,
    f: number,
    fi: number,
    rank = 0,
  ): TastingScore {
    return {
      user_name,
      aroma_score: a,
      flavor_score: f,
      finish_score: fi,
      average_score: (a + f + fi) / 3,
      personal_rank: rank,
    };
  }

  function whiskey(
    whiskey_id: number,
    whiskey_name: string,
    proof: number | null,
    scores: TastingScore[],
  ): WhiskeyScores {
    const avg = scores.length
      ? scores.reduce((s, x) => s + x.average_score, 0) / scores.length
      : 0;
    return {
      whiskey_id,
      whiskey_name,
      proof,
      scores,
      average_score: avg,
      rank_by_average: 0, // intentionally buggy/zero — never trusted
    };
  }

  // 3 whiskeys, 4 tasters, deliberate participation gaps.
  const theme: ThemeScoresResponse = {
    theme: { id: 7, name: 'Bourbon Night', notes: 'n', created_at: '2026-01-01' },
    whiskeys: [
      whiskey(1, 'Whiskey A', 90, [
        score('Ann', 5, 5, 5, 1),
        score('Bob', 4, 4, 4, 2),
        score('Cy', 3, 3, 3, 3),
      ]),
      whiskey(2, 'Whiskey B', 100, [
        score('Ann', 2, 2, 2, 3),
        score('Bob', 4, 4, 4, 1),
      ]),
      whiskey(3, 'Whiskey C', 80, [score('Dee', 1, 1, 1, 1)]),
    ],
  };

  // A theme whose whiskeys have NO scores (unscored edge case).
  const emptyTheme: ThemeScoresResponse = {
    theme: { id: 8, name: 'Empty', notes: '', created_at: '2026-01-02' },
    whiskeys: [whiskey(10, 'No Scores', 95, [])],
  };

  describe('leaderboard', () => {
    it('ranks whiskeys by average_score desc, derived locally', () => {
      const lb = leaderboard(theme);
      expect(lb.map((r) => r.whiskey_name)).toEqual([
        'Whiskey A',
        'Whiskey B',
        'Whiskey C',
      ]);
      expect(lb.map((r) => r.rank)).toEqual([1, 2, 3]);
      expect(lb[0].score).toBeCloseTo(4.0, 5);
      expect(lb[1].score).toBeCloseTo(3.0, 5);
      expect(lb[2].score).toBeCloseTo(1.0, 5);
      expect(lb.map((r) => r.tasters)).toEqual([3, 2, 1]);
      expect(lb.every((r) => r.scored)).toBe(true);
    });

    it('marks unscored whiskeys scored=false and sorts them last', () => {
      const mixed: ThemeScoresResponse = {
        ...theme,
        whiskeys: [...theme.whiskeys, whiskey(99, 'Unscored', 70, [])],
      };
      const lb = leaderboard(mixed);
      const last = lb[lb.length - 1];
      expect(last.whiskey_name).toBe('Unscored');
      expect(last.scored).toBe(false);
      expect(last.tasters).toBe(0);
      expect(last.score).toBe(0);
    });
  });
  ```

- [ ] **Step 2: Run the test — expect FAIL.**
  ```bash
  npm test
  ```
  Expect a failure: `lib/scoring.ts` does not exist / `leaderboard is not a function`.

- [ ] **Step 3: Implement scoring.ts skeleton + `leaderboard`.**
  Create `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/scoring.ts`:
  ```ts
  import type {
    ThemeScoresResponse,
    WhiskeyScores,
    TastingScore,
  } from './api/tastings';

  export type RankedWhiskey = {
    whiskey_id: number;
    whiskey_name: string;
    proof: number | null;
    score: number;
    tasters: number;
    rank: number;
    scored: boolean;
  };

  export type ConsensusEntry = {
    user_name: string;
    meanAbsDeviation: number;
    rank: number;
  };

  export type AllWhiskeyRow = {
    whiskey_name: string;
    theme_name: string;
    proof: number | null;
    score: number;
    tasters: number;
  };

  export type PersonWhiskeyRow = {
    whiskey_name: string;
    proof: number | null;
    aroma: number;
    flavor: number;
    finish: number;
    average: number;
    rank: number;
  };

  export type PersonGroup = {
    user_name: string;
    rows: PersonWhiskeyRow[];
  };

  export type TasterRow = {
    user_name: string;
    aroma: number;
    flavor: number;
    finish: number;
    average: number;
    rank: number;
  };

  const mean = (xs: number[]): number =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

  /**
   * Whiskeys sorted by average_score desc. Rank is derived locally (never
   * trust rank_by_average). Unscored whiskeys (no tasters) are marked
   * scored=false and, because their computed score is 0, sort last.
   */
  export function leaderboard(theme: ThemeScoresResponse): RankedWhiskey[] {
    const rows: RankedWhiskey[] = theme.whiskeys.map((w) => {
      const tasters = w.scores.length;
      const score = tasters ? mean(w.scores.map((s) => s.average_score)) : 0;
      return {
        whiskey_id: w.whiskey_id,
        whiskey_name: w.whiskey_name,
        proof: w.proof,
        score,
        tasters,
        rank: 0,
        scored: tasters > 0,
      };
    });
    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => {
      r.rank = i + 1;
    });
    return rows;
  }
  ```

- [ ] **Step 4: Run the test — expect PASS for leaderboard.**
  ```bash
  npm test
  ```
  Both `leaderboard` tests pass. (The other `describe` blocks aren't written yet.)

- [ ] **Step 5 (commit):**
  ```bash
  git add lib/scoring.ts __tests__/scoring.test.ts
  git commit -m "mobile: add scoring.leaderboard with tests"
  ```

- [ ] **Step 6: Add the failing `consensus` test.**
  Append to `__tests__/scoring.test.ts`:
  ```ts
  describe('consensus', () => {
    it('computes mean-abs-deviation per taster, skipping unscored whiskeys', () => {
      const c = consensus(theme);
      const byName = Object.fromEntries(c.map((e) => [e.user_name, e]));
      expect(byName['Ann'].meanAbsDeviation).toBeCloseTo(1.0, 5);
      expect(byName['Bob'].meanAbsDeviation).toBeCloseTo(0.5, 5);
      expect(byName['Cy'].meanAbsDeviation).toBeCloseTo(1.0, 5);
      expect(byName['Dee'].meanAbsDeviation).toBeCloseTo(0.0, 5);
    });

    it('sorts ascending (closest first) and ranks 1..N', () => {
      const c = consensus(theme);
      expect(c.map((e) => e.user_name)).toEqual(['Dee', 'Bob', 'Ann', 'Cy']);
      expect(c.map((e) => e.rank)).toEqual([1, 2, 3, 4]);
    });
  });
  ```

- [ ] **Step 7: Run — expect FAIL** (`consensus is not a function`).
  ```bash
  npm test
  ```

- [ ] **Step 8: Implement `consensus`.**
  Append to `lib/scoring.ts`:
  ```ts
  /**
   * "Closest to the group." For each whiskey, the group per-dimension average
   * is the mean of aroma/flavor/finish across that whiskey's scores[]. For
   * each taster, meanAbsDeviation is the mean over every
   * whiskey × {aroma, flavor, finish} they DID score of
   * |tasterScore - groupAvg|. Whiskeys a taster did not score are skipped so
   * partial participation is not penalized. Sorted ascending; rank 1 = lowest
   * deviation. A stable sort keeps original taster order on ties.
   */
  export function consensus(theme: ThemeScoresResponse): ConsensusEntry[] {
    // Per-whiskey group dimension averages.
    const groupAvgs = new Map<
      number,
      { aroma: number; flavor: number; finish: number }
    >();
    for (const w of theme.whiskeys) {
      if (w.scores.length === 0) continue;
      groupAvgs.set(w.whiskey_id, {
        aroma: mean(w.scores.map((s) => s.aroma_score)),
        flavor: mean(w.scores.map((s) => s.flavor_score)),
        finish: mean(w.scores.map((s) => s.finish_score)),
      });
    }

    // Accumulate absolute deviations per taster, in first-seen order.
    const order: string[] = [];
    const sums = new Map<string, { sum: number; count: number }>();
    for (const w of theme.whiskeys) {
      const g = groupAvgs.get(w.whiskey_id);
      if (!g) continue;
      for (const s of w.scores) {
        if (!sums.has(s.user_name)) {
          sums.set(s.user_name, { sum: 0, count: 0 });
          order.push(s.user_name);
        }
        const acc = sums.get(s.user_name)!;
        acc.sum +=
          Math.abs(s.aroma_score - g.aroma) +
          Math.abs(s.flavor_score - g.flavor) +
          Math.abs(s.finish_score - g.finish);
        acc.count += 3;
      }
    }

    const entries: ConsensusEntry[] = order.map((user_name) => {
      const acc = sums.get(user_name)!;
      return {
        user_name,
        meanAbsDeviation: acc.count ? acc.sum / acc.count : 0,
        rank: 0,
      };
    });
    entries.sort((a, b) => a.meanAbsDeviation - b.meanAbsDeviation);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });
    return entries;
  }
  ```
  Note: `Array.prototype.sort` is stable in all React Native JS engines (Hermes/JSC), so the Ann-before-Cy tie order is guaranteed.

- [ ] **Step 9: Run — expect PASS.** `npm test`

- [ ] **Step 10 (commit):**
  ```bash
  git add lib/scoring.ts __tests__/scoring.test.ts
  git commit -m "mobile: add scoring.consensus with tests"
  ```

- [ ] **Step 11: Add the failing `allWhiskeys` test.**
  Append to `__tests__/scoring.test.ts`:
  ```ts
  describe('allWhiskeys', () => {
    it('flattens all themes, one row per scored whiskey, excludes unscored', () => {
      const rows = allWhiskeys([theme, emptyTheme]);
      expect(rows).toHaveLength(3); // emptyTheme's whiskey is excluded
      const a = rows.find((r) => r.whiskey_name === 'Whiskey A')!;
      expect(a.theme_name).toBe('Bourbon Night');
      expect(a.proof).toBe(90);
      expect(a.score).toBeCloseTo(4.0, 5);
      expect(a.tasters).toBe(3);
      expect(rows.some((r) => r.whiskey_name === 'No Scores')).toBe(false);
    });
  });
  ```

- [ ] **Step 12: Run — expect FAIL.** `npm test`

- [ ] **Step 13: Implement `allWhiskeys`.**
  Append to `lib/scoring.ts`:
  ```ts
  /**
   * Flatten every theme's scored whiskeys into rows for the All Whiskeys
   * table. Whiskeys with no scores are excluded.
   */
  export function allWhiskeys(all: ThemeScoresResponse[]): AllWhiskeyRow[] {
    const rows: AllWhiskeyRow[] = [];
    for (const theme of all) {
      for (const w of theme.whiskeys) {
        if (w.scores.length === 0) continue;
        rows.push({
          whiskey_name: w.whiskey_name,
          theme_name: theme.theme.name,
          proof: w.proof,
          score: mean(w.scores.map((s) => s.average_score)),
          tasters: w.scores.length,
        });
      }
    }
    return rows;
  }
  ```

- [ ] **Step 14: Run — expect PASS.** `npm test`

- [ ] **Step 15 (commit):**
  ```bash
  git add lib/scoring.ts __tests__/scoring.test.ts
  git commit -m "mobile: add scoring.allWhiskeys with tests"
  ```

- [ ] **Step 16: Add the failing `byPerson` test.**
  Append to `__tests__/scoring.test.ts`. Ann scored A (5/5/5, avg 5) and B (2/2/2, avg 2). Per-person rank is the taster's own ordering by their average desc, so for Ann: A=rank1, B=rank2.
  ```ts
  describe('byPerson', () => {
    it('groups the active theme by taster with their own whiskey rows', () => {
      const groups = byPerson(theme);
      const names = groups.map((g) => g.user_name);
      expect(names).toContain('Ann');
      expect(names).toContain('Dee');

      const ann = groups.find((g) => g.user_name === 'Ann')!;
      expect(ann.rows.map((r) => r.whiskey_name)).toEqual([
        'Whiskey A',
        'Whiskey B',
      ]);
      const annA = ann.rows.find((r) => r.whiskey_name === 'Whiskey A')!;
      expect(annA.aroma).toBe(5);
      expect(annA.average).toBeCloseTo(5.0, 5);
      // Ann's personal leaderboard: A (5) ahead of B (2).
      expect(annA.rank).toBe(1);
      const annB = ann.rows.find((r) => r.whiskey_name === 'Whiskey B')!;
      expect(annB.rank).toBe(2);

      const dee = groups.find((g) => g.user_name === 'Dee')!;
      expect(dee.rows).toHaveLength(1);
      expect(dee.rows[0].whiskey_name).toBe('Whiskey C');
      expect(dee.rows[0].rank).toBe(1);
    });
  });
  ```

- [ ] **Step 17: Run — expect FAIL.** `npm test`

- [ ] **Step 18: Implement `byPerson`.**
  Append to `lib/scoring.ts`:
  ```ts
  /**
   * Group the active theme's scores by taster. Each taster's rows are their
   * own whiskeys, ranked by that taster's average desc (their personal
   * leaderboard, not personal_rank, which may be unset).
   */
  export function byPerson(theme: ThemeScoresResponse): PersonGroup[] {
    const order: string[] = [];
    const map = new Map<string, PersonWhiskeyRow[]>();
    for (const w of theme.whiskeys) {
      for (const s of w.scores) {
        if (!map.has(s.user_name)) {
          map.set(s.user_name, []);
          order.push(s.user_name);
        }
        map.get(s.user_name)!.push({
          whiskey_name: w.whiskey_name,
          proof: w.proof,
          aroma: s.aroma_score,
          flavor: s.flavor_score,
          finish: s.finish_score,
          average: s.average_score,
          rank: 0,
        });
      }
    }
    return order.map((user_name) => {
      const rows = map.get(user_name)!;
      // Rank each taster's whiskeys by their own average desc.
      [...rows]
        .sort((a, b) => b.average - a.average)
        .forEach((r, i) => {
          r.rank = i + 1;
        });
      return { user_name, rows };
    });
  }
  ```

- [ ] **Step 19: Run — expect PASS.** `npm test`

- [ ] **Step 20 (commit):**
  ```bash
  git add lib/scoring.ts __tests__/scoring.test.ts
  git commit -m "mobile: add scoring.byPerson with tests"
  ```

- [ ] **Step 21: Add the failing `whiskeyBreakdown` test.**
  Append to `__tests__/scoring.test.ts`. Whiskey A scored by Ann(5), Bob(4), Cy(3); ranked by average desc → Ann 1, Bob 2, Cy 3.
  ```ts
  describe('whiskeyBreakdown', () => {
    it('returns per-taster rows ranked by their average desc', () => {
      const w = theme.whiskeys[0]; // Whiskey A
      const rows = whiskeyBreakdown(w);
      expect(rows.map((r) => r.user_name)).toEqual(['Ann', 'Bob', 'Cy']);
      expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
      expect(rows[0].aroma).toBe(5);
      expect(rows[0].average).toBeCloseTo(5.0, 5);
      expect(rows[2].average).toBeCloseTo(3.0, 5);
    });

    it('handles a whiskey with no scores', () => {
      const w = emptyTheme.whiskeys[0];
      expect(whiskeyBreakdown(w)).toEqual([]);
    });
  });
  ```

- [ ] **Step 22: Run — expect FAIL.** `npm test`

- [ ] **Step 23: Implement `whiskeyBreakdown`.**
  Append to `lib/scoring.ts`:
  ```ts
  /**
   * Per-taster breakdown for one whiskey (the By Theme accordion body),
   * sorted by each taster's average desc with rank derived locally.
   */
  export function whiskeyBreakdown(whiskey: WhiskeyScores): TasterRow[] {
    const rows: TasterRow[] = whiskey.scores.map((s) => ({
      user_name: s.user_name,
      aroma: s.aroma_score,
      flavor: s.flavor_score,
      finish: s.finish_score,
      average: s.average_score,
      rank: 0,
    }));
    rows.sort((a, b) => b.average - a.average);
    rows.forEach((r, i) => {
      r.rank = i + 1;
    });
    return rows;
  }
  ```

- [ ] **Step 24: Run — expect PASS (full suite green).**
  ```bash
  npm test
  ```
  All five `describe` blocks pass.

- [ ] **Step 25 (verify lint too):**
  ```bash
  npm run lint
  ```
  Expect no `tsc` errors (the new types are sound).

- [ ] **Step 26 (commit):**
  ```bash
  git add lib/scoring.ts __tests__/scoring.test.ts
  git commit -m "mobile: add scoring.whiskeyBreakdown with tests"
  ```

---

### Phase 4 — Task 3: Add `fetchThemeScores(themeId)` API wrapper

No unit test — this is a thin network wrapper; lint only.

**Files:**
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/api/tastings.ts` (add function after `fetchAllThemesScores`, ~line 77)
- (Barrel `lib/api/index.ts` already does `export * from './tastings'`, so no barrel edit is required — the new export is picked up automatically.)

- [ ] **Step 1: Add the wrapper.**
  In `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/api/tastings.ts`, immediately after the closing brace of `fetchAllThemesScores` (after line 77), insert:
  ```ts
  export async function fetchThemeScores(
    themeId: number,
  ): Promise<ThemeScoresResponse> {
    const response = await apiFetch(`/tastings/themes/${themeId}/scores`);
    if (!response.ok) {
      throw new Error(`Failed to fetch theme scores: ${response.statusText}`);
    }
    return response.json();
  }
  ```

- [ ] **Step 2 (verify):**
  ```bash
  npm run lint
  ```
  Expect no errors. Confirm the symbol is exported from the barrel:
  ```bash
  node -e "require('ts-node') || 0" 2>/dev/null; grep -q "export \* from './tastings'" lib/api/index.ts && echo "barrel re-exports tastings: OK"
  ```

- [ ] **Step 3 (commit):**
  ```bash
  git add lib/api/tastings.ts
  git commit -m "mobile: add fetchThemeScores API wrapper"
  ```

---

### Phase 4 — Task 4a: Dashboard shell — Tabs + state + data fetch

Replace the entire current flat-table `dashboard.tsx` with the tabbed Data View shell. This sub-task lands the shell with all four tabs wired but only placeholders inside each tab body; sub-tasks 4b–4e fill them in. The shell uses the After Dark tokens, `AfterDarkBackground`, the existing dark `Tabs`, page title "DATA VIEW", and pull-to-refresh. Default tab = `results`.

Data sourcing per the contract:
- Active theme: `fetchActiveTheme()` → if non-null, `fetchThemeScores(theme.id)` for the Results + By Person tabs.
- All themes: `fetchAllThemesScores()` for the All Whiskeys + By Theme tabs.

**Files:**
- Modify (full rewrite): `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx`

- [ ] **Step 1: Replace `dashboard.tsx` with the shell.**
  Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` with the complete contents (placeholders in each tab; 4b–4e replace those `{/* ... */}` bodies):
  ```tsx
  import React, { useState, useCallback } from 'react';
  import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { useFocusEffect } from 'expo-router';
  import { colors, spacing } from '../lib/theme';
  import { AppText } from '../components/ui/AppText';
  import { Eyebrow } from '../components/ui/Eyebrow';
  import { Tabs } from '../components/ui/Tabs';
  import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
  import {
    fetchActiveTheme,
    fetchThemeScores,
    fetchAllThemesScores,
    type Theme,
    type ThemeScoresResponse,
  } from '../lib/api';

  type TabKey = 'results' | 'all' | 'theme' | 'person';

  const TAB_OPTIONS: { label: string; value: TabKey }[] = [
    { label: 'THE RESULTS', value: 'results' },
    { label: 'ALL WHISKEYS', value: 'all' },
    { label: 'BY THEME', value: 'theme' },
    { label: 'BY PERSON', value: 'person' },
  ];

  export default function DashboardScreen() {
    const [tab, setTab] = useState<TabKey>('results');
    const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
    const [activeScores, setActiveScores] =
      useState<ThemeScoresResponse | null>(null);
    const [allScores, setAllScores] = useState<ThemeScoresResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Bumped on every successful load so child reveals re-animate on refresh.
    const [revealKey, setRevealKey] = useState(0);

    const loadData = useCallback(async () => {
      try {
        const [active, all] = await Promise.all([
          fetchActiveTheme(),
          fetchAllThemesScores(),
        ]);
        setActiveTheme(active);
        setAllScores(all);
        if (active) {
          try {
            setActiveScores(await fetchThemeScores(active.id));
          } catch {
            setActiveScores(null);
          }
        } else {
          setActiveScores(null);
        }
        setRevealKey((k) => k + 1);
      } catch {
        // Silent — pull to refresh retries.
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

    useFocusEffect(
      useCallback(() => {
        loadData();
      }, [loadData]),
    );

    const onRefresh = useCallback(() => {
      setRefreshing(true);
      loadData();
    }, [loadData]);

    return (
      <View style={styles.root}>
        <AfterDarkBackground />
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.amber}
              />
            }
          >
            <AppText variant="pageTitle" style={styles.pageTitle}>
              DATA VIEW
            </AppText>
            <Eyebrow style={styles.eyebrow}>THE TASTING, REVEALED</Eyebrow>

            <Tabs
              options={TAB_OPTIONS}
              value={tab}
              onChange={(v) => setTab(v as TabKey)}
              style={styles.tabs}
            />

            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.amber} />
              </View>
            ) : (
              <View style={styles.tabBody}>
                {tab === 'results' && (
                  <View>{/* 4b: The Results reveal */}</View>
                )}
                {tab === 'all' && (
                  <View>{/* 4c: All Whiskeys table */}</View>
                )}
                {tab === 'theme' && (
                  <View>{/* 4d: By Theme accordion */}</View>
                )}
                {tab === 'person' && (
                  <View>{/* 4e: By Person cards */}</View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    container: { flex: 1, backgroundColor: 'transparent' },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    pageTitle: { marginBottom: spacing.xs },
    eyebrow: { marginBottom: spacing.lg },
    tabs: { marginBottom: spacing.lg },
    tabBody: { marginTop: spacing.sm },
    centered: {
      paddingVertical: spacing.xxl,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  ```

- [ ] **Step 2 (verify lint):**
  ```bash
  npm run lint
  ```
  Expect no errors. (`revealKey` is referenced again in 4b; it is intentionally unused until then, which `tsc --noEmit` permits since `noUnusedLocals` is not enabled in `expo/tsconfig.base`. If lint complains, leave it — 4b consumes it.)

- [ ] **Step 3 (manual emulator check):**
  Launch on the emulator (per `mobile-dev.md`). Tap the RESULTS tab. Verify: dark After Dark background with faint amber haze, Fraunces "DATA VIEW" title, amber eyebrow, the segmented control showing THE RESULTS · ALL WHISKEYS · BY THEME · BY PERSON with THE RESULTS active (amber fill). Tapping each segment switches with no horizontal overflow, and each currently shows an empty body. Pull-to-refresh shows an amber spinner.

- [ ] **Step 4 (commit):**
  ```bash
  git add app/dashboard.tsx
  git commit -m "mobile: rebuild dashboard as tabbed Data View shell"
  ```

---

### Phase 4 — Task 4b: "The Results" reveal sub-view

Podium (top-3 in visual order 2-1-3 with fills 82/64/50), best-first `RankedBar` list (max = `Math.max(...scores, 5)`), and the Consensus "Closest to the group" list. Driven by `scoring.leaderboard` + `scoring.consensus`. Staggered reveal on mount/refresh that honors reduce-motion. Empty states for no active theme / no submissions.

Create a dedicated component so `dashboard.tsx` stays readable.

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ResultsReveal.tsx`
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` (import + render in the `results` tab)

- [ ] **Step 1: Create the ResultsReveal component.**
  Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ResultsReveal.tsx`:
  ```tsx
  import React, { useEffect, useRef, useState } from 'react';
  import {
    View,
    StyleSheet,
    Animated,
    Easing,
    AccessibilityInfo,
  } from 'react-native';
  import { colors, spacing, fonts } from '../../lib/theme';
  import { AppText } from '../ui/AppText';
  import { Eyebrow } from '../ui/Eyebrow';
  import { GlowBox } from '../ui/GlowBox';
  import { PodiumGlass } from '../ui/PodiumGlass';
  import { RankedBar } from '../ui/RankedBar';
  import { leaderboard, consensus } from '../../lib/scoring';
  import type { ThemeScoresResponse } from '../../lib/api';

  // Podium fill percentages by medal place (handoff spec).
  const PODIUM_FILL: Record<1 | 2 | 3, number> = { 1: 64, 2: 82, 3: 50 };

  interface Props {
    // revealKey changes on each refresh to retrigger the cascade.
    revealKey: number;
    activeTheme: { name: string } | null;
    scores: ThemeScoresResponse | null;
  }

  export function ResultsReveal({ revealKey, activeTheme, scores }: Props) {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
      let mounted = true;
      AccessibilityInfo.isReduceMotionEnabled().then((v) => {
        if (mounted) setReduceMotion(v);
      });
      const sub = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (v) => setReduceMotion(v),
      );
      return () => {
        mounted = false;
        sub.remove();
      };
    }, []);

    if (!activeTheme) {
      return (
        <View style={styles.empty}>
          <AppText variant="sectionTitle" style={styles.emptyTitle}>
            No active theme
          </AppText>
          <AppText variant="bodyMuted" style={styles.emptyBody}>
            Create a theme in Admin to start a tasting.
          </AppText>
        </View>
      );
    }

    const lb = scores ? leaderboard(scores) : [];
    const scored = lb.filter((r) => r.scored);

    if (scored.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText variant="sectionTitle" style={styles.emptyTitle}>
            No scores yet
          </AppText>
          <AppText variant="bodyMuted" style={styles.emptyBody}>
            {activeTheme.name} is live — be the first to log a pour.
          </AppText>
        </View>
      );
    }

    const cons = scores ? consensus(scores) : [];
    const maxScore = Math.max(...scored.map((r) => r.score), 5);

    // Top 3 for the podium; arrange in visual order 2 · 1 · 3.
    const podium = scored.slice(0, 3);
    const byPlace = (place: 1 | 2 | 3) => podium[place - 1];
    const visualOrder: (1 | 2 | 3)[] = [2, 1, 3];

    return (
      <View>
        {/* Podium */}
        <Eyebrow style={styles.sectionEyebrow}>THE PODIUM</Eyebrow>
        <View style={styles.podiumRow}>
          {visualOrder.map((place) => {
            const w = byPlace(place);
            if (!w) return <View key={place} style={styles.podiumСol} />;
            return (
              <View key={place} style={styles.podiumCol}>
                <AppText
                  variant="cardTitle"
                  numberOfLines={2}
                  style={styles.podiumName}
                >
                  {w.whiskey_name}
                </AppText>
                <PodiumGlass
                  place={place}
                  fillPct={PODIUM_FILL[place]}
                  animate={!reduceMotion}
                />
                <AppText
                  style={[
                    styles.medal,
                    place === 1 && styles.medalGold,
                  ]}
                >
                  {place === 1 ? '1ST' : place === 2 ? '2ND' : '3RD'}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Ranked bars */}
        <Eyebrow style={styles.sectionEyebrow}>EVERY POUR</Eyebrow>
        <View style={styles.bars}>
          {scored.map((r, i) => (
            <RankedBar
              key={`${revealKey}-${r.whiskey_id}`}
              rank={r.rank}
              name={r.whiskey_name}
              proof={r.proof}
              score={r.score}
              max={maxScore}
              top={i === 0}
              animate={!reduceMotion}
            />
          ))}
        </View>

        {/* Consensus */}
        <Eyebrow style={styles.sectionEyebrow}>CLOSEST TO THE GROUP</Eyebrow>
        <View style={styles.consensus}>
          {cons.map((c) => (
            <ConsensusRow
              key={`${revealKey}-${c.user_name}`}
              userName={c.user_name}
              deviation={c.meanAbsDeviation}
              rank={c.rank}
              maxDeviation={Math.max(
                ...cons.map((x) => x.meanAbsDeviation),
                0.01,
              )}
              animate={!reduceMotion}
            />
          ))}
        </View>
      </View>
    );
  }

  // Closeness bar: shorter = closer to group. We render an inverted fill so
  // rank #1 (lowest deviation) has the fullest "closeness" bar.
  function ConsensusRow({
    userName,
    deviation,
    rank,
    maxDeviation,
    animate,
  }: {
    userName: string;
    deviation: number;
    rank: number;
    maxDeviation: number;
    animate: boolean;
  }) {
    const closeness = 1 - deviation / maxDeviation; // 0..1, higher = closer
    const fill = useRef(new Animated.Value(animate ? 0 : closeness)).current;
    const top = rank === 1;

    useEffect(() => {
      if (!animate) {
        fill.setValue(closeness);
        return;
      }
      fill.setValue(0);
      const anim = Animated.timing(fill, {
        toValue: closeness,
        duration: 1000,
        delay: 120 + rank * 90,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      });
      anim.start();
      return () => anim.stop();
    }, [animate, closeness, rank, fill]);

    const width = fill.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    const row = (
      <View style={[styles.consRow, top && styles.consRowTop]}>
        <View style={styles.consRank}>
          <AppText style={top ? styles.consStar : styles.consRankNum}>
            {top ? '★' : String(rank).padStart(2, '0')}
          </AppText>
        </View>
        <View style={styles.consBody}>
          <AppText variant="body" numberOfLines={1} style={styles.consName}>
            {userName}
          </AppText>
          <View style={styles.consTrack}>
            <Animated.View style={[styles.consFill, { width }]} />
          </View>
        </View>
        <AppText style={styles.consOff}>
          {`\u00B1${deviation.toFixed(2)} avg off`}
        </AppText>
      </View>
    );

    return top ? <GlowBox intensity="soft">{row}</GlowBox> : row;
  }

  const styles = StyleSheet.create({
    empty: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    emptyTitle: { color: colors.cream, marginBottom: spacing.sm },
    emptyBody: { textAlign: 'center' },
    sectionEyebrow: {
      marginTop: spacing.lg,
      marginBottom: spacing.smd,
    },
    podiumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    podiumCol: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
    },
    podiumName: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: spacing.sm,
      minHeight: 40,
    },
    medal: {
      fontFamily: fonts.monoMedium,
      fontSize: 12,
      color: colors.dim,
      marginTop: spacing.sm,
    },
    medalGold: { color: colors.amber },
    bars: { marginTop: spacing.xs },
    consensus: { marginTop: spacing.xs },
    consRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.smd,
      paddingHorizontal: spacing.smd,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    consRowTop: {
      backgroundColor: colors.glowSoft,
      borderBottomColor: colors.amber,
    },
    consRank: { width: 28 },
    consStar: { color: colors.amber, fontSize: 16 },
    consRankNum: {
      fontFamily: fonts.monoMedium,
      fontSize: 13,
      color: colors.muted,
    },
    consBody: { flex: 1, marginRight: spacing.smd },
    consName: { color: colors.cream, marginBottom: spacing.xs },
    consTrack: {
      height: 6,
      backgroundColor: colors.raise,
      overflow: 'hidden',
    },
    consFill: {
      height: 6,
      backgroundColor: colors.amber,
    },
    consOff: {
      fontFamily: fonts.monoRegular,
      fontSize: 12,
      color: colors.dim,
    },
  });
  ```
  Note: there is a deliberate non-ASCII guard above — make sure the placeholder `<View key={place} style={styles.podiumСol} />` uses the ASCII `styles.podiumCol`; correct it to `styles.podiumCol` while typing (the empty-slot branch reuses the same `podiumCol` style).

- [ ] **Step 2: Fix the empty-slot style reference.**
  Ensure the "fewer than 3 whiskeys" branch reads:
  ```tsx
  if (!w) return <View key={place} style={styles.podiumCol} />;
  ```
  (single `podiumCol` style; no second style key).

- [ ] **Step 3: Wire ResultsReveal into the dashboard.**
  In `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx`, add the import below the `AfterDarkBackground` import:
  ```tsx
  import { ResultsReveal } from '../components/dashboard/ResultsReveal';
  ```
  Replace the results placeholder:
  ```tsx
                {tab === 'results' && (
                  <View>{/* 4b: The Results reveal */}</View>
                )}
  ```
  with:
  ```tsx
                {tab === 'results' && (
                  <ResultsReveal
                    revealKey={revealKey}
                    activeTheme={activeTheme}
                    scores={activeScores}
                  />
                )}
  ```

- [ ] **Step 4 (verify lint):**
  ```bash
  npm run lint
  ```
  Expect no errors.

- [ ] **Step 5 (manual emulator check):**
  With an active theme that has submissions: open RESULTS. Verify the three glasses appear in visual order **2nd · 1st · 3rd** (1st center, taller fill), each fills on entry (and again on pull-to-refresh), the center medal reads "1ST" in amber. Below, the "EVERY POUR" ranked bars appear best-first with mono `01/02/…` ranks, amber bars animating to width, count-up scores; the #1 bar glows. The "CLOSEST TO THE GROUP" list shows ★ on rank 1 (amber-highlighted row), animated closeness bars, and `±X.XX avg off`. Toggle the OS "Remove animations" setting and refresh — bars/glasses should render full immediately with no cascade. With no active theme, confirm the "No active theme" prompt; with an active theme but zero submissions, the "No scores yet" message.

- [ ] **Step 6 (commit):**
  ```bash
  git add components/dashboard/ResultsReveal.tsx app/dashboard.tsx
  git commit -m "mobile: add The Results reveal (podium, ranked bars, consensus)"
  ```

---

### Phase 4 — Task 4c: "All Whiskeys" table

Cross-theme table from `scoring.allWhiskeys(allScores)`: columns `Whiskey · Theme · Proof · Avg · Tasters`, tightened to phone width.

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/AllWhiskeysTable.tsx`
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` (import + render in the `all` tab)

- [ ] **Step 1: Create AllWhiskeysTable.**
  Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/AllWhiskeysTable.tsx`:
  ```tsx
  import React from 'react';
  import { View, StyleSheet } from 'react-native';
  import { colors, spacing } from '../../lib/theme';
  import { AppText } from '../ui/AppText';
  import { allWhiskeys } from '../../lib/scoring';
  import type { ThemeScoresResponse } from '../../lib/api';

  interface Props {
    allScores: ThemeScoresResponse[];
  }

  export function AllWhiskeysTable({ allScores }: Props) {
    const rows = allWhiskeys(allScores);

    if (rows.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText variant="bodyMuted">No scored whiskeys yet.</AppText>
        </View>
      );
    }

    return (
      <View>
        <View style={[styles.row, styles.headerRow]}>
          <View style={styles.colName}>
            <AppText variant="fieldLabel" numberOfLines={1}>WHISKEY</AppText>
          </View>
          <View style={styles.colTheme}>
            <AppText variant="fieldLabel" numberOfLines={1}>THEME</AppText>
          </View>
          <View style={styles.colProof}>
            <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
              PRF
            </AppText>
          </View>
          <View style={styles.colAvg}>
            <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
              AVG
            </AppText>
          </View>
          <View style={styles.colTasters}>
            <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
              T
            </AppText>
          </View>
        </View>

        {rows.map((r, i) => (
          <View key={`${r.theme_name}-${r.whiskey_name}-${i}`} style={styles.row}>
            <View style={styles.colName}>
              <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
                {r.whiskey_name}
              </AppText>
            </View>
            <View style={styles.colTheme}>
              <AppText
                variant="tableCell"
                style={styles.themeText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {r.theme_name}
              </AppText>
            </View>
            <View style={styles.colProof}>
              <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                {r.proof != null ? r.proof : '—'}
              </AppText>
            </View>
            <View style={styles.colAvg}>
              <AppText
                variant="tableCell"
                style={[styles.right, styles.avgValue]}
                numberOfLines={1}
              >
                {r.score.toFixed(1)}
              </AppText>
            </View>
            <View style={styles.colTasters}>
              <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                {r.tasters}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerRow: { borderBottomColor: colors.amber },
    colName: { flex: 1.4, marginRight: spacing.xs },
    colTheme: { flex: 1, marginRight: spacing.xs },
    colProof: { width: 34, marginRight: spacing.xs },
    colAvg: { width: 36, marginRight: spacing.xs },
    colTasters: { width: 22 },
    right: { textAlign: 'right' },
    themeText: { color: colors.dim },
    avgValue: { color: colors.amber },
  });
  ```

- [ ] **Step 2: Wire into dashboard.**
  In `app/dashboard.tsx`, add:
  ```tsx
  import { AllWhiskeysTable } from '../components/dashboard/AllWhiskeysTable';
  ```
  Replace the `all` placeholder:
  ```tsx
                {tab === 'all' && (
                  <View>{/* 4c: All Whiskeys table */}</View>
                )}
  ```
  with:
  ```tsx
                {tab === 'all' && <AllWhiskeysTable allScores={allScores} />}
  ```

- [ ] **Step 3 (verify lint):** `npm run lint` — expect no errors.

- [ ] **Step 4 (manual emulator check):**
  Tap ALL WHISKEYS. Verify a single table with header `WHISKEY · THEME · PRF · AVG · T` (amber underline), one row per scored whiskey across all themes, AVG in amber, whiskey/theme names truncating (`adjustsFontSizeToFit`) so the row fits the phone width with **no horizontal scroll**. With no scored whiskeys anywhere, the "No scored whiskeys yet." message shows.

- [ ] **Step 5 (commit):**
  ```bash
  git add components/dashboard/AllWhiskeysTable.tsx app/dashboard.tsx
  git commit -m "mobile: add All Whiskeys cross-theme table"
  ```

---

### Phase 4 — Task 4d: "By Theme" — card per theme, accordion per whiskey

One card per theme; under each, an `Accordion` per whiskey whose body is the per-taster `Taster · Aroma · Flavor · Finish · Avg · Rank` table from `scoring.whiskeyBreakdown`.

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ByThemeView.tsx`
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` (import + render in the `theme` tab)

- [ ] **Step 1: Create ByThemeView.**
  Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ByThemeView.tsx`:
  ```tsx
  import React from 'react';
  import { View, StyleSheet } from 'react-native';
  import { colors, spacing, fonts } from '../../lib/theme';
  import { AppText } from '../ui/AppText';
  import { Card } from '../ui/Card';
  import { Accordion } from '../ui/Accordion';
  import { whiskeyBreakdown } from '../../lib/scoring';
  import type { ThemeScoresResponse, WhiskeyScores } from '../../lib/api';

  interface Props {
    allScores: ThemeScoresResponse[];
  }

  export function ByThemeView({ allScores }: Props) {
    if (allScores.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText variant="bodyMuted">No themes yet.</AppText>
        </View>
      );
    }

    return (
      <View>
        {allScores.map((t) => (
          <Card
            key={t.theme.id}
            title={t.theme.name}
            style={styles.themeCard}
          >
            {t.theme.notes ? (
              <AppText variant="bodyMuted" style={styles.notes}>
                {t.theme.notes}
              </AppText>
            ) : null}
            {t.whiskeys.map((w) => (
              <WhiskeyAccordion key={w.whiskey_id} whiskey={w} />
            ))}
          </Card>
        ))}
      </View>
    );
  }

  function WhiskeyAccordion({ whiskey }: { whiskey: WhiskeyScores }) {
    const rows = whiskeyBreakdown(whiskey);
    const header = (
      <View style={styles.accHeader}>
        <View style={styles.accName}>
          <AppText variant="body" numberOfLines={1} style={styles.accNameText}>
            {whiskey.whiskey_name}
          </AppText>
          {whiskey.proof != null ? (
            <AppText style={styles.accProof}>{whiskey.proof} PRF</AppText>
          ) : null}
        </View>
        <AppText style={styles.accStat}>
          {rows.length
            ? `${whiskey.average_score.toFixed(1)} AVG · ${rows.length} TASTER${
                rows.length === 1 ? '' : 'S'
              }`
            : 'NO SCORES'}
        </AppText>
      </View>
    );

    return (
      <Accordion header={header}>
        {rows.length === 0 ? (
          <AppText variant="bodyMuted" style={styles.noScores}>
            No tasters scored this pour.
          </AppText>
        ) : (
          <View>
            <View style={[styles.row, styles.headerRow]}>
              <View style={styles.colTaster}>
                <AppText variant="fieldLabel" numberOfLines={1}>TASTER</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>A</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>F</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>Fi</AppText>
              </View>
              <View style={styles.colAvg}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>AVG</AppText>
              </View>
              <View style={styles.colRank}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>RK</AppText>
              </View>
            </View>
            {rows.map((r) => (
              <View key={r.user_name} style={styles.row}>
                <View style={styles.colTaster}>
                  <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
                    {r.user_name}
                  </AppText>
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.aroma.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.flavor.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.finish.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colAvg}>
                  <AppText
                    variant="tableCell"
                    style={[styles.right, styles.avgValue]}
                    numberOfLines={1}
                  >
                    {r.average.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colRank}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.rank}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </Accordion>
    );
  }

  const styles = StyleSheet.create({
    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    themeCard: { marginBottom: spacing.lg },
    notes: { marginBottom: spacing.md },
    accHeader: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: spacing.sm,
    },
    accName: { flexShrink: 1, marginRight: spacing.sm },
    accNameText: { color: colors.cream },
    accProof: {
      fontFamily: fonts.monoRegular,
      fontSize: 11,
      color: colors.muted,
    },
    accStat: {
      fontFamily: fonts.monoMedium,
      fontSize: 11,
      color: colors.amber,
    },
    noScores: { paddingVertical: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerRow: { borderBottomColor: colors.amber },
    colTaster: { flex: 1, marginRight: spacing.xs },
    colScore: { width: 28, marginRight: spacing.xs },
    colAvg: { width: 34, marginRight: spacing.xs },
    colRank: { width: 24 },
    right: { textAlign: 'right' },
    avgValue: { color: colors.amber },
  });
  ```

- [ ] **Step 2: Wire into dashboard.**
  In `app/dashboard.tsx`, add:
  ```tsx
  import { ByThemeView } from '../components/dashboard/ByThemeView';
  ```
  Replace the `theme` placeholder:
  ```tsx
                {tab === 'theme' && (
                  <View>{/* 4d: By Theme accordion */}</View>
                )}
  ```
  with:
  ```tsx
                {tab === 'theme' && <ByThemeView allScores={allScores} />}
  ```

- [ ] **Step 3 (verify lint):** `npm run lint` — expect no errors.

- [ ] **Step 4 (manual emulator check):**
  Tap BY THEME. Verify one Card per theme (Fraunces title + notes if present). Each whiskey is a collapsed Accordion row showing name, `N PRF`, and `N.N AVG · N TASTERS` in amber. Tap a row: the chevron rotates and the per-taster table (`TASTER · A · F · Fi · AVG · RK`, amber underline) expands smoothly; AVG column amber. A whiskey with no scores shows "No tasters scored this pour." Confirm no horizontal scrolling on the widest table.

- [ ] **Step 5 (commit):**
  ```bash
  git add components/dashboard/ByThemeView.tsx app/dashboard.tsx
  git commit -m "mobile: add By Theme accordion view"
  ```

---

### Phase 4 — Task 4e: "By Person" — card per taster (active theme)

`scoring.byPerson(activeScores)`: one Card per taster with their whiskey rows `Whiskey · Proof · Aroma · Flavor · Finish · Avg · Rank`.

**Files:**
- Create: `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ByPersonView.tsx`
- Modify: `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` (import + render in the `person` tab)

- [ ] **Step 1: Create ByPersonView.**
  Write `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/ByPersonView.tsx`:
  ```tsx
  import React from 'react';
  import { View, StyleSheet } from 'react-native';
  import { colors, spacing } from '../../lib/theme';
  import { AppText } from '../ui/AppText';
  import { Card } from '../ui/Card';
  import { byPerson } from '../../lib/scoring';
  import type { ThemeScoresResponse, Theme } from '../../lib/api';

  interface Props {
    activeTheme: Theme | null;
    scores: ThemeScoresResponse | null;
  }

  export function ByPersonView({ activeTheme, scores }: Props) {
    if (!activeTheme) {
      return (
        <View style={styles.empty}>
          <AppText variant="bodyMuted">No active theme.</AppText>
        </View>
      );
    }

    const groups = scores ? byPerson(scores) : [];

    if (groups.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText variant="bodyMuted">
            No one has scored {activeTheme.name} yet.
          </AppText>
        </View>
      );
    }

    return (
      <View>
        {groups.map((g) => (
          <Card key={g.user_name} title={g.user_name} style={styles.personCard}>
            <View style={[styles.row, styles.headerRow]}>
              <View style={styles.colName}>
                <AppText variant="fieldLabel" numberOfLines={1}>WHISKEY</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>A</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>F</AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>Fi</AppText>
              </View>
              <View style={styles.colAvg}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>AVG</AppText>
              </View>
              <View style={styles.colRank}>
                <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>RK</AppText>
              </View>
            </View>
            {g.rows.map((r) => (
              <View key={r.whiskey_name} style={styles.row}>
                <View style={styles.colName}>
                  <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
                    {r.whiskey_name}
                  </AppText>
                  {r.proof != null ? (
                    <AppText variant="tableCell" style={styles.proof} numberOfLines={1}>
                      {r.proof} PRF
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.aroma.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.flavor.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colScore}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.finish.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colAvg}>
                  <AppText
                    variant="tableCell"
                    style={[styles.right, styles.avgValue]}
                    numberOfLines={1}
                  >
                    {r.average.toFixed(1)}
                  </AppText>
                </View>
                <View style={styles.colRank}>
                  <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                    {r.rank}
                  </AppText>
                </View>
              </View>
            ))}
          </Card>
        ))}
      </View>
    );
  }

  const styles = StyleSheet.create({
    empty: { paddingVertical: spacing.xl, alignItems: 'center' },
    personCard: { marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    headerRow: { borderBottomColor: colors.amber },
    colName: { flex: 1, marginRight: spacing.xs },
    colScore: { width: 28, marginRight: spacing.xs },
    colAvg: { width: 34, marginRight: spacing.xs },
    colRank: { width: 24 },
    right: { textAlign: 'right' },
    proof: { color: colors.muted },
    avgValue: { color: colors.amber },
  });
  ```

- [ ] **Step 2: Wire into dashboard.**
  In `app/dashboard.tsx`, add:
  ```tsx
  import { ByPersonView } from '../components/dashboard/ByPersonView';
  ```
  Replace the `person` placeholder:
  ```tsx
                {tab === 'person' && (
                  <View>{/* 4e: By Person cards */}</View>
                )}
  ```
  with:
  ```tsx
                {tab === 'person' && (
                  <ByPersonView activeTheme={activeTheme} scores={activeScores} />
                )}
  ```

- [ ] **Step 3 (verify lint):** `npm run lint` — expect no errors.

- [ ] **Step 4 (manual emulator check):**
  Tap BY PERSON. Verify one Card per taster (name as Fraunces title) for the **active theme only**, each listing that taster's whiskey rows `WHISKEY · A · F · Fi · AVG · RK` with amber AVG and the proof sub-label under the whiskey name. Each taster's RK column is their own ranking (their best whiskey = 1). With no active theme, the "No active theme." message; with an active theme but no scores, "No one has scored <name> yet." No horizontal scroll.

- [ ] **Step 5 (commit):**
  ```bash
  git add components/dashboard/ByPersonView.tsx app/dashboard.tsx
  git commit -m "mobile: add By Person view for active theme"
  ```

---

### Phase 4 — Task 5: Final integration verification

- [ ] **Step 1 (full test suite):**
  ```bash
  npm test
  ```
  All `lib/scoring.ts` tests pass.

- [ ] **Step 2 (lint):**
  ```bash
  npm run lint
  ```
  No `tsc --noEmit` errors across the whole app.

- [ ] **Step 3 (full Data View emulator walk):**
  On the emulator, open RESULTS and exercise all four sub-tabs end to end against a live theme with several tasters: THE RESULTS reveal cascade (and re-cascade on pull-to-refresh), ALL WHISKEYS, BY THEME accordion expand/collapse, BY PERSON cards. Pull-to-refresh on each tab. Confirm dark After Dark styling, Fraunces titles, amber accents, no light-token leaks, and no horizontal scrolling on any table.

- [ ] **Step 4 (commit, only if Step 1–3 surfaced fixes):**
  ```bash
  git add -A
  git commit -m "mobile: Data View integration fixes"
  ```

---

Relevant absolute paths produced by this phase:
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/jest.config.js`
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/__tests__/scoring.test.ts`
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/scoring.ts`
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/lib/api/tastings.ts` (modified: `fetchThemeScores`)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/app/dashboard.tsx` (rewritten)
- `/home/reasel/git/Whiskey-Tasting/apps/mobile/components/dashboard/{ResultsReveal,AllWhiskeysTable,ByThemeView,ByPersonView}.tsx`


---
