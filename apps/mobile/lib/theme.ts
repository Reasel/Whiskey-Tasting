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
