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
