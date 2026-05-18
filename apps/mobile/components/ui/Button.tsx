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
  outline: colors.canvasCream,
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
