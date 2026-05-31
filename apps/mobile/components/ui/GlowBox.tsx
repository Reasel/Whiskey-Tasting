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
