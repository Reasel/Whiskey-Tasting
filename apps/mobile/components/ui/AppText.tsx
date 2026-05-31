import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypoVariant } from '../../lib/theme';

interface AppTextProps extends TextProps {
  variant?: TypoVariant;
}

/** The ONLY text component. `variant` selects a fixed After Dark preset
 *  so Fraunces/JetBrains Mono/Inter can never drift. The large
 *  `pageTitle` auto-scales to a single line so long unbreakable titles
 *  (e.g. "ADMINISTRATION") never clip — RN's adjustsFontSizeToFit is
 *  only reliable on Android with numberOfLines={1}. Callers can still
 *  override. */
export function AppText({
  variant = 'body',
  style,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
  ...rest
}: AppTextProps) {
  const isPageTitle = variant === 'pageTitle';
  return (
    <Text
      {...rest}
      numberOfLines={numberOfLines ?? (isPageTitle ? 1 : undefined)}
      adjustsFontSizeToFit={
        adjustsFontSizeToFit ?? (isPageTitle ? true : undefined)
      }
      minimumFontScale={minimumFontScale ?? (isPageTitle ? 0.5 : undefined)}
      style={[typography[variant], style]}
    />
  );
}
