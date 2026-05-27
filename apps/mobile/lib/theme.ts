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
