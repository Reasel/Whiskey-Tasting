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
