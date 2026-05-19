import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypoVariant } from '../../lib/theme';

interface AppTextProps extends TextProps {
  variant?: TypoVariant;
}

/** The ONLY text component. `variant` selects a fixed type-triad preset
 *  so Merriweather/JetBrains Mono/Inter can never drift. The large
 *  `pageTitle` auto-scales within two lines so long titles (e.g.
 *  "ADMINISTRATION") never clip; callers can still override. */
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
      numberOfLines={numberOfLines ?? (isPageTitle ? 2 : undefined)}
      adjustsFontSizeToFit={
        adjustsFontSizeToFit ?? (isPageTitle ? true : undefined)
      }
      minimumFontScale={minimumFontScale ?? (isPageTitle ? 0.5 : undefined)}
      style={[typography[variant], style]}
    />
  );
}
