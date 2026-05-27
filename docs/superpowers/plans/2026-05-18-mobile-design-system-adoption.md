# Mobile Design System Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the `apps/mobile` Expo/React Native app to adhere to the Whiskey Tasting design system (cream, square, hard-offset shadows, Merriweather/JetBrains Mono/Inter triad, amber primary) without changing behavior, data flow, or navigation.

**Architecture:** A token-driven primitive layer enforces the non-negotiable rules in one place. `lib/theme.ts` holds all tokens + typography presets + shadow specs. New primitives (`HardShadow`, `AppText`, `Eyebrow`, `Panel`, `Tabs`, `GridBackground`) and rewritten ones (`Button`, `Card`, `Input`, `Dropdown`, `Toast`) are consumed by each screen. Screen logic is untouched — only the visual layer and copy change.

**Tech Stack:** Expo SDK 54, React Native 0.81, expo-router 6, `@expo-google-fonts/*`, `expo-font`, `expo-splash-screen`, `react-native-svg`.

**Testing note:** This app has **no test runner**. The only automated gate is the lint script `npm run lint` (= `npx tsc --noEmit`). Every task's "verify" step is the type-check. To keep every commit green, the `borderRadius` token export is kept as an all-zero shim until the final task removes it. Final visual verification is done live in the Android emulator (device-only `adb exec-out screencap`) per the spec.

**Spec:** `docs/superpowers/specs/2026-05-18-mobile-design-system-adoption-design.md`

**Working directory for all commands:** `apps/mobile/` (run `cd apps/mobile` first). Lint command: `npm run lint`.

---

### Task 1: Dependencies + token rewrite (`lib/theme.ts`)

**Files:**
- Modify: `apps/mobile/lib/theme.ts` (full rewrite)
- Modify: `apps/mobile/package.json` (deps added by `expo install`)

- [ ] **Step 1: Install font + svg dependencies**

Run (inside `apps/mobile`, inside the nix shell if needed for node):
```bash
npx expo install @expo-google-fonts/merriweather @expo-google-fonts/jetbrains-mono @expo-google-fonts/inter expo-font expo-splash-screen react-native-svg
```
Expected: packages added to `package.json` dependencies, no peer-dependency errors.

- [ ] **Step 2: Rewrite `lib/theme.ts`**

Replace the entire file with:

```ts
import type { TextStyle } from 'react-native';

export const colors = {
  canvasCream: '#F0F0E8',
  panelGrey: '#E5E5E0',
  lightGrey: '#D8D8D2',
  cardWhite: '#FFFFFF',
  inkBlack: '#000000',
  steelGrey: '#4B5563',
  mutedText: '#6B7280',
  whiskeyAmber: '#F59E0B',
  amberDark: '#D97706',
  signalGreen: '#15803D',
  alertOrange: '#F97316',
  alertRed: '#DC2626',
  hyperBlue: '#1D4ED8', // dialog info "?" icon ONLY
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

// Legacy size scale kept so existing screens compile during migration.
// Superseded by AppText variants; do not use in new code.
export const fontSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 40,
};

// TEMPORARY back-compat shim: every value is 0 so existing
// `borderRadius.*` references render square. Removed in the final task.
export const borderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  full: 0,
};

export const fonts = {
  serif: 'Merriweather_700Bold',
  monoBold: 'JetBrainsMono_700Bold',
  monoMedium: 'JetBrainsMono_500Medium',
  monoRegular: 'JetBrainsMono_400Regular',
  sans: 'Inter_400Regular',
};

export type TypoVariant =
  | 'pageTitle'
  | 'sectionTitle'
  | 'eyebrow'
  | 'fieldLabel'
  | 'buttonLabel'
  | 'body'
  | 'tableCell';

// letterSpacing is in points (RN has no em tracking) = trackingPct * fontSize.
export const typography: Record<TypoVariant, TextStyle> = {
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 38,
    letterSpacing: -0.8,
    textTransform: 'uppercase',
    color: colors.inkBlack,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.24,
    color: colors.inkBlack,
  },
  eyebrow: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: colors.inkBlack,
  },
  fieldLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
    color: colors.inkBlack,
  },
  buttonLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: colors.inkBlack,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkBlack,
  },
  tableCell: {
    fontFamily: fonts.monoRegular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkBlack,
    fontVariant: ['tabular-nums'],
  },
};

export const shadowSpec = {
  card: { dx: 2, dy: 2, color: 'rgba(0,0,0,1)' },
  cardSoft: { dx: 2, dy: 2, color: 'rgba(0,0,0,0.10)' },
  panel: { dx: 8, dy: 8, color: 'rgba(0,0,0,0.10)' },
  hero: { dx: 12, dy: 12, color: 'rgba(0,0,0,0.10)' },
  modal: { dx: 8, dy: 8, color: 'rgba(0,0,0,0.20)' },
};

export const hairline = { borderWidth: 1, borderColor: colors.inkBlack };
```

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS. (Old color keys like `colors.primary` are now gone — if lint reports errors here, that is expected to be fixed by later tasks; **only** proceed if errors are confined to color-name references in screens not yet migrated. If `borderRadius`/`spacing`/`fontSize` references error, the shim is wrong — fix it.)

Note: because screens still reference removed color keys (`colors.primary`, `colors.background`, etc.), lint will not be fully clean until all screen tasks are done. That is acceptable for this task only. Record the failing files; each is fixed by its own task below. To keep this commit self-consistent, also do Step 4.

- [ ] **Step 4: Add temporary legacy color aliases to keep the build green**

Append to `lib/theme.ts` so unmigrated screens compile (these are removed in the final task):

```ts
// TEMPORARY legacy color aliases — removed in the final cleanup task.
// Maps old dark-theme keys onto the new palette so unmigrated screens
// compile and render in-palette until each screen task replaces them.
export const legacyColors = {
  background: colors.canvasCream,
  surface: colors.cardWhite,
  surfaceLight: colors.panelGrey,
  primary: colors.whiskeyAmber,
  primaryDark: colors.amberDark,
  text: colors.inkBlack,
  textSecondary: colors.steelGrey,
  textMuted: colors.mutedText,
  border: colors.inkBlack,
  error: colors.alertRed,
  success: colors.signalGreen,
  white: colors.cardWhite,
};

Object.assign(colors, legacyColors);
```

Then add the legacy keys to the `colors` object's inferred type by declaring them inline instead of via `Object.assign` if `tsc` complains about unknown properties. Concretely, if `npm run lint` reports "Property 'primary' does not exist", merge the legacy keys directly into the `colors` literal instead:

```ts
export const colors = {
  // ... new tokens above ...
  hyperBlue: '#1D4ED8',
  // legacy aliases (removed in final task):
  background: '#F0F0E8',
  surface: '#FFFFFF',
  surfaceLight: '#E5E5E0',
  primary: '#F59E0B',
  primaryDark: '#D97706',
  text: '#000000',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  border: '#000000',
  error: '#DC2626',
  success: '#15803D',
  white: '#FFFFFF',
};
```
Use the inline-literal form (delete the `Object.assign`/`legacyColors` block). This guarantees `tsc` sees every key.

- [ ] **Step 5: Verify type-check is fully clean**

Run: `npm run lint`
Expected: PASS with zero errors (all color refs resolve via legacy aliases; all `borderRadius`/`spacing`/`fontSize` refs resolve).

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/theme.ts apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "Add design-system tokens, fonts, and svg deps to mobile"
```

---

### Task 2: Font-loading splash gate (`app/_layout.tsx`)

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

This task adds the font gate ONLY. The tab bar restyle (removing Ionicons) is Task 12, after `AppText` exists.

- [ ] **Step 1: Add the font gate to `RootLayout`**

At the top of `app/_layout.tsx`, add imports:

```tsx
import { useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Merriweather_700Bold } from '@expo-google-fonts/merriweather';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { colors } from '../lib/theme';
```

Immediately after the imports (module scope), add:

```tsx
SplashScreen.preventAutoHideAsync().catch(() => {});
```

Inside `RootLayout`, before the existing `return`, add:

```tsx
const [fontsLoaded, fontError] = useFonts({
  Merriweather_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  Inter_400Regular,
});

const onReady = useCallback(() => {
  SplashScreen.hideAsync().catch(() => {});
}, []);

if (!fontsLoaded && !fontError) {
  return <View style={{ flex: 1, backgroundColor: colors.canvasCream }} />;
}
```

Wrap the existing top-level returned fragment's outermost element with an `onLayout={onReady}` container. Concretely, change the returned JSX so the first rendered element calls `onReady` on layout. If the current return is `<>...</>`, replace the fragment with:

```tsx
return (
  <View style={{ flex: 1 }} onLayout={onReady}>
    <StatusBar style="dark" />
    <Tabs
      /* ...existing screenOptions/screens unchanged in THIS task... */
    >
      {/* existing <Tabs.Screen .../> entries unchanged */}
    </Tabs>
  </View>
);
```

Also change `<StatusBar style="light" />` to `<StatusBar style="dark" />` (cream background needs dark status text).

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "Gate mobile app render on design-system font loading"
```

---

### Task 3: `HardShadow` primitive

**Files:**
- Create: `apps/mobile/components/ui/HardShadow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { shadowSpec } from '../../lib/theme';

type ShadowName = keyof typeof shadowSpec;

interface HardShadowProps {
  children: React.ReactNode;
  offset?: ShadowName;
  /** When true, renders no shadow (e.g. a pressed button bottoming out). */
  collapsed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Solid offset block shadow with NO blur, on both platforms. RN native
 * shadow props cannot do offset-no-blur on Android (elevation is always
 * blurred + centered), so we render a sibling solid View behind the child.
 */
export function HardShadow({
  children,
  offset = 'card',
  collapsed = false,
  style,
}: HardShadowProps) {
  const s = shadowSpec[offset];
  return (
    <View style={[{ position: 'relative' }, style]}>
      {!collapsed && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: s.dy,
            left: s.dx,
            right: -s.dx,
            bottom: -s.dy,
            backgroundColor: s.color,
          }}
        />
      )}
      {children}
    </View>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/HardShadow.tsx
git commit -m "Add HardShadow primitive (offset no-blur shadow)"
```

---

### Task 4: `AppText` primitive

**Files:**
- Create: `apps/mobile/components/ui/AppText.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypoVariant } from '../../lib/theme';

interface AppTextProps extends TextProps {
  variant?: TypoVariant;
}

/** The ONLY text component. `variant` selects a fixed type-triad preset
 *  so Merriweather/JetBrains Mono/Inter can never drift. */
export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[typography[variant], style]} />;
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/AppText.tsx
git commit -m "Add AppText primitive with fixed type-triad variants"
```

---

### Task 5: `Eyebrow` primitive

**Files:**
- Create: `apps/mobile/components/ui/Eyebrow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { type TextProps } from 'react-native';
import { AppText } from './AppText';

/** Mono uppercase caption auto-prefixed with `// `. Idempotent. */
export function Eyebrow({ children, style, ...rest }: TextProps) {
  const raw = String(children ?? '').trim();
  const text = raw.startsWith('//') ? raw : `// ${raw}`;
  return (
    <AppText variant="eyebrow" style={style} {...rest}>
      {text}
    </AppText>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/Eyebrow.tsx
git commit -m "Add Eyebrow primitive"
```

---

### Task 6: `Button` rewrite (with legacy-prop back-compat)

**Files:**
- Modify: `apps/mobile/components/ui/Button.tsx` (full rewrite)

The new API adds variants/sizes from the spec but **accepts the existing
`primary|secondary|danger|ghost` / `sm|md|lg` prop values as aliases** so
all current call sites keep compiling and rendering in-palette. Screen
tasks later migrate call sites to the new names where it matters.

- [ ] **Step 1: Rewrite the file**

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
  default: colors.whiskeyAmber,
  destructive: colors.alertRed,
  success: colors.signalGreen,
  warning: colors.alertOrange,
  outline: 'transparent',
  secondary: colors.panelGrey,
  ghost: 'transparent',
  link: 'transparent',
};
const PRESSED_FILL: Partial<Record<Variant, string>> = {
  default: colors.amberDark,
};
const LABEL_COLOR: Record<Variant, string> = {
  default: colors.cardWhite,
  destructive: colors.cardWhite,
  success: colors.cardWhite,
  warning: colors.cardWhite,
  outline: colors.inkBlack,
  secondary: colors.inkBlack,
  ghost: colors.inkBlack,
  link: colors.whiskeyAmber,
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
          borderColor: colors.inkBlack,
          opacity: isDisabled ? 0.5 : 1,
          transform: [
            { translateX: pressed && !flat ? 2 : 0 },
            { translateY: pressed && !flat ? 2 : 0 },
          ],
        },
        block && styles.block,
        style,
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

  if (flat) {
    return block ? <View style={styles.block}>{body}</View> : body;
  }

  return (
    <HardShadow
      offset="card"
      collapsed={pressed || isDisabled}
      style={block ? styles.block : undefined}
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
  linkLabel: { textDecorationLine: 'underline' },
});
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS (existing call sites using `variant="primary"` / `size="md"` etc. still type-check via the union + aliases).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/Button.tsx
git commit -m "Rewrite Button to design system (amber, square, hard press)"
```

---

### Task 7: `Card` restyle + new `Panel`

**Files:**
- Modify: `apps/mobile/components/ui/Card.tsx`
- Create: `apps/mobile/components/ui/Panel.tsx`

`Card` keeps its existing props (`children`, `title?`, `onPress?`,
`style?`) for back-compat; `title` now renders as `sectionTitle`.

- [ ] **Step 1: Rewrite `Card.tsx`**

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
    backgroundColor: colors.cardWhite,
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.inkBlack,
  },
  title: { marginBottom: spacing.md },
});
```

- [ ] **Step 2: Create `Panel.tsx`**

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

/** A bordered section block (cream fill, hard panel shadow). Full width
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
    backgroundColor: colors.canvasCream,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: colors.inkBlack,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkBlack,
    gap: spacing.xs,
  },
  body: { padding: spacing.xl },
});
```

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/ui/Card.tsx apps/mobile/components/ui/Panel.tsx
git commit -m "Restyle Card and add Panel primitive"
```

---

### Task 8: `Input` rewrite

**Files:**
- Modify: `apps/mobile/components/ui/Input.tsx`

- [ ] **Step 1: Read current props**

Run: `sed -n '1,40p' apps/mobile/components/ui/Input.tsx`
Note the existing prop names (e.g. `label`, `value`, `onChangeText`,
`placeholder`, `keyboardType`, `style`). Preserve every existing prop
name and add nothing that breaks call sites.

- [ ] **Step 2: Rewrite the file preserving the existing prop interface**

Keep the exact `interface` props the file currently exports. Replace only
the rendered structure + styles with:

```tsx
// imports: React, { View, TextInput, StyleSheet } from 'react-native';
// import { colors, spacing } from '../../lib/theme';
// import { AppText } from './AppText';

// Render:
//   <View style={styles.wrap}>
//     {label ? <AppText variant="fieldLabel" style={styles.label}>{label}</AppText> : null}
//     <TextInput
//       style={[styles.input, style]}
//       placeholderTextColor={colors.mutedText}
//       {...the existing forwarded props (value, onChangeText, placeholder, keyboardType, secureTextEntry, etc.)}
//     />
//   </View>

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.md },
  label: {},
  input: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.inkBlack,
  },
});
```

Concretely: keep the component's existing exported function name and
props object exactly; only swap the JSX body and `StyleSheet` to the
above. If the current file uses a focus state, set the focused border to
`colors.whiskeyAmber` with `borderWidth: 2` (no shadow, no glow).

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS (no prop signature change → call sites unaffected).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/ui/Input.tsx
git commit -m "Rewrite Input to design system (square, mono label)"
```

---

### Task 9: `Dropdown` restyle (no API change)

**Files:**
- Modify: `apps/mobile/components/ui/Dropdown.tsx`

Keep the entire component logic, props, and String()-coerced equality
**unchanged**. Only replace colors/typography/shapes.

- [ ] **Step 1: Read the file**

Run: `cat apps/mobile/components/ui/Dropdown.tsx`
Identify its `StyleSheet` block and any `<Text>` usages.

- [ ] **Step 2: Apply these style changes only**

- Add imports: `import { AppText } from './AppText';` and
  `import { HardShadow } from './HardShadow';`
- Replace every `<Text ...>` with `<AppText variant="body" ...>`, except
  the field label above the trigger → `<AppText variant="fieldLabel">`
  and the selected/placeholder text in the trigger →
  `<AppText variant="body">`.
- Wrap the trigger `TouchableOpacity` in `<HardShadow offset="card">`.
- In `StyleSheet`, set on every style object that has `borderRadius`:
  `borderRadius: 0`. Map colors: trigger/option background
  `colors.cardWhite`; borders `colors.inkBlack` width 1; modal overlay
  `backgroundColor: 'rgba(0,0,0,0.5)'` (flat, no blur); option row
  separators `borderBottomColor: colors.lightGrey`; the
  currently-selected option row background `colors.whiskeyAmber` with its
  label color `colors.cardWhite`; placeholder/empty text
  `colors.mutedText`.

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/ui/Dropdown.tsx
git commit -m "Restyle Dropdown to design system (square, hard shadow)"
```

---

### Task 10: `Toast` restyle

**Files:**
- Modify: `apps/mobile/components/ui/Toast.tsx`

- [ ] **Step 1: Read the file**

Run: `cat apps/mobile/components/ui/Toast.tsx`
Keep its visibility/auto-dismiss logic. If the current auto-dismiss is
not 3000ms, set it to `3000`.

- [ ] **Step 2: Apply style changes**

- Import `AppText` and `HardShadow`.
- Replace the message `<Text>` with `<AppText variant="tableCell">`
  (mono).
- Wrap the toast container in `<HardShadow offset="card">`.
- Container style: `backgroundColor: colors.cardWhite`, `borderWidth: 1`,
  `borderColor: colors.inkBlack`, `borderRadius: 0`, positioned
  bottom-left (e.g. `position: 'absolute', left: spacing.md,
  bottom: spacing.xl`).

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/ui/Toast.tsx
git commit -m "Restyle Toast to design system (white, mono, hard shadow)"
```

---

### Task 11: `Tabs` + `ToggleRow` primitive

**Files:**
- Create: `apps/mobile/components/ui/Tabs.tsx`

- [ ] **Step 1: Create the file (Tabs + ToggleRow exports)**

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

/** Square segmented control. Active = amber fill + white mono label;
 *  inactive = panel-grey + steel-grey. Instant swap, no animation. */
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
              { backgroundColor: active ? colors.whiskeyAmber : colors.panelGrey },
            ]}
          >
            <AppText
              variant="buttonLabel"
              style={{ color: active ? colors.cardWhite : colors.steelGrey }}
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
        trackColor={{ true: colors.whiskeyAmber, false: colors.lightGrey }}
        thumbColor={colors.cardWhite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.inkBlack,
    borderRadius: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.smd,
  },
  tabDivider: { borderLeftWidth: 1, borderLeftColor: colors.inkBlack },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    padding: spacing.md,
  },
});
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/Tabs.tsx
git commit -m "Add Tabs and ToggleRow primitives"
```

---

### Task 12: `GridBackground` primitive

**Files:**
- Create: `apps/mobile/components/ui/GridBackground.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

/** Amber-tinted 40px grid, absolutely filling its parent, behind content.
 *  Used on Home only. Parent must be `position: relative`. */
export function GridBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern
          id="wt-grid"
          width={40}
          height={40}
          patternUnits="userSpaceOnUse"
        >
          <Path
            d="M40 0 H0 V40"
            fill="none"
            stroke="rgba(245,158,11,0.12)"
            strokeWidth={1}
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#wt-grid)" />
    </Svg>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS. (If `react-native-svg` types are missing, confirm Task 1
Step 1 installed it; re-run `npx expo install react-native-svg`.)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/ui/GridBackground.tsx
git commit -m "Add amber GridBackground primitive"
```

---

### Task 13: Tab bar restyle — mono text, no icons (`app/_layout.tsx`)

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Remove Ionicons, restyle the tab bar**

- Delete the `import { Ionicons } from '@expo/vector-icons';` line and the
  entire `tabIcon` helper function.
- Remove every `tabBarIcon: tabIcon(...)` entry from the five
  `Tabs.Screen` `options`.
- Replace the `screenOptions` object with:

```tsx
screenOptions={{
  headerShown: false,
  tabBarActiveBackgroundColor: colors.whiskeyAmber,
  tabBarActiveTintColor: colors.cardWhite,
  tabBarInactiveTintColor: colors.steelGrey,
  tabBarStyle: {
    backgroundColor: colors.canvasCream,
    borderTopColor: colors.inkBlack,
    borderTopWidth: 1,
    height: 64,
  },
  tabBarItemStyle: { borderRadius: 0 },
  tabBarLabelStyle: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
}}
```

- For each `Tabs.Screen`, keep `name` unchanged; set `tabBarLabel` to the
  uppercase mono label: `HOME`, `TASTE`, `RESULTS`, `ADMIN`, `SETTINGS`.
  Remove any `headerTitle`/`title` that referenced the old chrome (header
  is now hidden globally). Keep `headerShown: false` semantics (now
  global).
- Keep the Task 2 font gate and `onLayout={onReady}` wrapper intact.

- [ ] **Step 2: Verify type-check passes**

Run: `npm run lint`
Expected: PASS (no more `@expo/vector-icons` reference; if its types
linger elsewhere, ensure no other file imports it).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/_layout.tsx
git commit -m "Restyle tab bar: mono text labels, amber active, no icons"
```

---

### Task 14: Home screen (`app/index.tsx`)

**Files:**
- Modify: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Read the screen**

Run: `cat apps/mobile/app/index.tsx`
Note the data hooks (stats fetch) and the existing button targets — do
not change any logic, navigation, or fetch.

- [ ] **Step 2: Apply the visual + copy pass**

- Imports: add `AppText`, `Eyebrow`, `Card`, `Button`, `GridBackground`;
  `import { colors, spacing } from '../lib/theme';`. Remove any old
  color-key usage (`colors.background`, etc.) by switching to the new
  token names.
- Root container: `backgroundColor: colors.canvasCream`,
  `flex: 1`, `position: 'relative'`. Render `<GridBackground />` as the
  first child, then a `ScrollView`/content `View` above it.
- Title block: `<AppText variant="pageTitle">WHISKEY TASTING</AppText>`
  then `<Eyebrow>HAVE A DRINK!</Eyebrow>` (renders `// HAVE A DRINK!` —
  the one sanctioned exclamation).
- Stats: wrap each stat in `<Card>`; values via
  `<AppText variant="sectionTitle">`, captions via
  `<AppText variant="fieldLabel">`.
- Primary destinations: `<Button title="START TASTING" size="xl" block
  onPress={/* existing nav */} />` and
  `<Button title="VIEW RESULTS" size="xl" block onPress={/* existing nav
  */} />`. Use `variant="default"` (amber) — the prop default.
- Remove any leftover "ACTIVE THEME" UI if present (should already be
  gone). No emoji, no exclamations beyond the eyebrow.
- Replace all remaining `<Text>` with the appropriate `<AppText
  variant=...>`.

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/index.tsx
git commit -m "Restyle Home screen to design system"
```

---

### Task 15: Taste screen (`app/tasting/index.tsx` + `_layout.tsx`)

**Files:**
- Modify: `apps/mobile/app/tasting/index.tsx`
- Modify: `apps/mobile/app/tasting/_layout.tsx`

**Do not change any logic**: theme dropdown, proxy submit flow,
`useFocusEffect` refresh, deleted-theme fallback, score init — all stay
exactly as-is.

- [ ] **Step 1: Read both files**

Run: `cat apps/mobile/app/tasting/_layout.tsx apps/mobile/app/tasting/index.tsx`

- [ ] **Step 2: Restyle `_layout.tsx`**

If it sets a Stack header style, change colors to cream/ink and
`headerShadowVisible: false`; otherwise leave structural config. No
rounded corners. No `colors.*` legacy key references left.

- [ ] **Step 3: Restyle `index.tsx`**

- Imports: add `AppText`, `Eyebrow`, `Panel`, `Card`, `Button`;
  `{ colors, spacing }` from `'../../lib/theme'`.
- Root background `colors.canvasCream`.
- Header: `<AppText variant="pageTitle">TASTING SUBMISSION</AppText>`
  then `<Eyebrow>SUBMIT OR EDIT TASTING SCORES</Eyebrow>`.
- The selection step's Theme and User `Dropdown`s already restyled
  (Task 9) — just ensure their labels read in mono via the Dropdown's
  `label` prop (e.g. `THEME`, `WHO ARE YOU?`).
- Wrap the per-whiskey list in a `<Panel title="Scores">`; each whiskey
  stays a `<Card>` (WhiskeyCard handles internals, Task 16).
- Buttons → new copy: continue/submit button titles uppercase
  (`SUBMIT TASTING`, `CONTINUE`, `CHANGE USER`). Keep their existing
  `onPress` handlers verbatim.
- Replace remaining `<Text>` with `<AppText variant=...>`. No emoji.

- [ ] **Step 4: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/tasting/index.tsx apps/mobile/app/tasting/_layout.tsx
git commit -m "Restyle Taste screen to design system"
```

---

### Task 16: Tasting components (`WhiskeyCard`, `RatingSlider`, `ScoreDisplay`)

**Files:**
- Modify: `apps/mobile/components/tasting/WhiskeyCard.tsx`
- Modify: `apps/mobile/components/tasting/RatingSlider.tsx`
- Modify: `apps/mobile/components/tasting/ScoreDisplay.tsx`

**Do not change rating logic**: 0.5 step, integer rank, precise typed
entry, 6-decimal float-noise formatting, clamp — all preserved.

- [ ] **Step 1: `RatingSlider.tsx`**

- Replace `<Text style={styles.label}>` with
  `<AppText variant="fieldLabel">`; the value `<TextInput>` keeps its
  logic but restyle: `backgroundColor: colors.cardWhite`, `borderWidth:
  1`, `borderColor: colors.inkBlack`, `borderRadius: 0`,
  `fontFamily: 'JetBrainsMono_700Bold'`, `color: colors.inkBlack`,
  `textAlign: 'center'`.
- `<Slider>` props: `minimumTrackTintColor={colors.whiskeyAmber}`,
  `thumbTintColor={colors.whiskeyAmber}`,
  `maximumTrackTintColor={colors.lightGrey}`. Keep `step` logic
  (`integer ? 1 : 0.5`) and all handlers unchanged.
- Range labels via `<AppText variant="tableCell">`.

- [ ] **Step 2: `WhiskeyCard.tsx`**

- Wrap content in the restyled `<Card>` (no `borderRadius`, white).
- Whiskey name → `<AppText variant="sectionTitle">` (Title Case, NOT
  uppercased).
- Field labels passed to `RatingSlider` become parenthesized ranges:
  `AROMA (1-5)`, `FLAVOR (1-5)`, `FINISH (1-5)`, and personal rank
  `PERSONAL RANK (1-N)` where N is the existing `totalWhiskeys` value
  (keep the existing `integer minimumValue={1} maximumValue={totalWhiskeys}`
  props unchanged).
- Replace remaining `<Text>` with `<AppText variant=...>`.

- [ ] **Step 3: `ScoreDisplay.tsx`**

- Replace `<Text>` with `<AppText>`: numeric values →
  `variant="tableCell"`; captions → `variant="fieldLabel"`. Square,
  cream/white per surrounding context. No rounded corners.

- [ ] **Step 4: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/components/tasting/
git commit -m "Restyle tasting components to design system"
```

---

### Task 17: Results screen (`app/dashboard.tsx`)

**Files:**
- Modify: `apps/mobile/app/dashboard.tsx`

**Do not change logic**: theme/person/sort `Dropdown`s, defaults
(all/all/rank), `buildRows`/`sortRows`/`mean`, focus refetch,
pull-to-refresh, deleted-theme filter reset — all preserved.

- [ ] **Step 1: Read the screen**

Run: `cat apps/mobile/app/dashboard.tsx`

- [ ] **Step 2: Apply the visual + copy pass**

- Imports: add `AppText`, `Eyebrow`, `Card`; `{ colors, spacing }` from
  `'../lib/theme'`. Replace any old color-key usage.
- Root background `colors.canvasCream`.
- Header: `<AppText variant="pageTitle">DATA VIEW</AppText>` then
  `<Eyebrow>VIEW SUBMITTED TASTINGS</Eyebrow>`.
- The three filter `Dropdown`s keep their props; ensure their `label`s
  read `THEME`, `PERSON`, `SORT BY`.
- Each result group → `<Card title={themeOrPersonName}>` (Title Case).
  Inside, render rows with `<AppText variant="tableCell">`; numeric
  columns right-aligned (`textAlign: 'right'` on those cells); row
  separators `borderBottomWidth: 1, borderBottomColor: colors.lightGrey`;
  no zebra striping; header row label cells `<AppText
  variant="fieldLabel">` with `borderBottomColor: colors.inkBlack`.
- Empty state text via `<AppText variant="body">` (e.g.
  `No tastings yet`). No emoji.

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/dashboard.tsx
git commit -m "Restyle Results screen to design system"
```

---

### Task 18: Admin screens (`app/admin/*`)

**Files:**
- Modify: `apps/mobile/app/admin/_layout.tsx`
- Modify: `apps/mobile/app/admin/index.tsx`
- Modify: `apps/mobile/app/admin/themes.tsx`
- Modify: `apps/mobile/app/admin/users.tsx`
- Modify: `apps/mobile/app/admin/data.tsx`

**Do not change logic**: password gate (`admin`), CRUD calls, the removed
fake "ACTIVE" badge stays removed.

- [ ] **Step 1: Read all five files**

Run: `cat apps/mobile/app/admin/_layout.tsx apps/mobile/app/admin/index.tsx apps/mobile/app/admin/themes.tsx apps/mobile/app/admin/users.tsx apps/mobile/app/admin/data.tsx`

- [ ] **Step 2: `_layout.tsx` (password gate)**

- Background `colors.canvasCream`. Wrap the password form in a centered
  `<Panel>` (it is the one place a constrained-width panel reads well —
  cap width with `maxWidth: 420, alignSelf: 'center'`).
- Field label `<AppText variant="fieldLabel">PASSWORD</AppText>`; the
  input restyled (uses the restyled `Input` if it already does, else
  apply the square white/ink style inline); submit
  `<Button title="ENTER" onPress={/* existing */} />` (amber default).
- Keep the auth logic and `admin` password unchanged.

- [ ] **Step 3: `index.tsx` (admin home)**

- Header `<AppText variant="pageTitle">ADMINISTRATION</AppText>` +
  `<Eyebrow>MANAGE THEMES, USERS, AND SETTINGS</Eyebrow>`.
- Destination tiles → `<Button size="xl" block ... />` laid out 2-up
  (wrap in a row with `flexDirection: 'row', flexWrap: 'wrap', gap`).
  **Delete User** tile uses `variant="destructive"`; all others
  `variant="default"`. Titles uppercase
  (`CREATE NEW THEME`, `EDIT THEMES`, `ADD USER`, `DELETE USER`,
  `VIEW RESULTS`).

- [ ] **Step 4: `themes.tsx`, `users.tsx`, `data.tsx`**

- Each: cream background, header `pageTitle` + `Eyebrow`
  (`THEMES` / `// MANAGE TASTING THEMES`, `USERS` /
  `// MANAGE TASTERS`, `DATA` / `// SUBMITTED TASTING DATA`).
- Lists/forms use `<Card>` / `<Panel>` / restyled `Input` / `Button`.
- Replace all `<Text>` with `<AppText variant=...>`; whiskey/person/theme
  names stay Title Case (`variant="body"` or `sectionTitle`, NOT
  uppercased). Destructive actions (delete) use
  `Button variant="destructive"`.

- [ ] **Step 5: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/admin/
git commit -m "Restyle Admin screens to design system"
```

---

### Task 19: Settings screen (`app/settings.tsx`)

**Files:**
- Modify: `apps/mobile/app/settings.tsx`

**Do not change logic**: server-URL persistence, test-connection.

- [ ] **Step 1: Read the screen**

Run: `cat apps/mobile/app/settings.tsx`

- [ ] **Step 2: Apply the visual + copy pass**

- Background `colors.canvasCream`. Header
  `<AppText variant="pageTitle">SETTINGS</AppText>` +
  `<Eyebrow>CONFIGURE THE APP</Eyebrow>`.
- Server-URL field → restyled `Input` with `label="SERVER URL"`.
- Save action → `<Button title="SAVE" onPress={/* existing */} />`;
  test-connection → `<Button title="TEST CONNECTION" variant="secondary"
  onPress={/* existing */} />`. Any boolean settings → `ToggleRow`.
- Replace all `<Text>` with `<AppText variant=...>`. Replace all
  remaining old color-key references with new tokens. No emoji.

- [ ] **Step 3: Verify type-check passes**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/settings.tsx
git commit -m "Restyle Settings screen to design system"
```

---

### Task 20: Remove the `borderRadius`/legacy-color shims + final verification

**Files:**
- Modify: `apps/mobile/lib/theme.ts`
- Modify: any file `tsc` then flags (should be none if Tasks 14–19 were complete)

- [ ] **Step 1: Delete the shims**

In `lib/theme.ts` delete the entire `borderRadius` export and every
legacy color alias key (`background`, `surface`, `surfaceLight`,
`primary`, `primaryDark`, `text`, `textSecondary`, `textMuted`, `border`,
`error`, `success`, `white`) and the legacy `fontSize` export if no file
still imports it (`grep -rn "fontSize" apps/mobile/app apps/mobile/components`
— if zero hits, remove it; otherwise leave `fontSize` and note the
straggler).

- [ ] **Step 2: Run the type-check and fix every straggler**

Run: `npm run lint`
Expected: Initially may FAIL listing any file still referencing a removed
key (a leftover rounded corner or old color). For each error, replace the
reference with the correct new token (`borderRadius.* → 0`, old color key
→ its new-palette equivalent per the Task 1 alias mapping). Re-run until:

Run: `npm run lint`
Expected: PASS with zero errors. A rounded corner anywhere is now a
compile error — the design's "radius 0 everywhere" rule is enforced.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/theme.ts apps/mobile/app apps/mobile/components
git commit -m "Remove migration shims; enforce square-corner rule"
```

- [ ] **Step 4: Live emulator verification (per spec Testing section)**

Boot the emulator + backend + Metro per
`~/.claude/projects/-home-reasel-git-Whiskey-Tasting/memory/mobile-dev.md`
(nix-shell `apps/mobile/shell.nix`, AVD `wt_emulator`, `adb reverse`).
Capture device-only screenshots with
`adb -s emulator-5554 exec-out screencap -p > /tmp/wt.png` (NOT host
capture). Verify against the handoff `preview/` specimens:

- [ ] Background is canvas cream `#F0F0E8`; no pure-white page bg.
- [ ] Zero rounded corners anywhere.
- [ ] Shadows are solid offset blocks with no blur on Android.
- [ ] All three fonts load with no system-font flash (splash gate works).
- [ ] Amber is primary (buttons, active tab, slider); blue absent except
      any dialog info `?` icon.
- [ ] Tab bar shows mono uppercase labels, no icons; active tab amber.
- [ ] Eyebrows (`// …`) under titles; no emoji anywhere.
- [ ] Tasting + Results behavior unchanged: theme dropdown, proxy submit,
      0.5 slider + precise typed entry, integer rank, Results
      theme/person/sort filters, rank-default sort.

Record any visual gaps and fix with a follow-up styling commit before
finishing the branch.

---

## Final Step

After all tasks pass, use **superpowers:finishing-a-development-branch**
to complete the work (the branch already has an open PR #36).
