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
 * Offset block shadow with NO blur, on both platforms. On the After Dark
 * surfaces the block is a translucent dark rectangle (see shadowSpec),
 * reading as a structural drop offset rather than a soft glow. RN native
 * shadow props cannot do offset-no-blur on Android (elevation is always
 * blurred + centered), so we render a sibling View behind the child.
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
