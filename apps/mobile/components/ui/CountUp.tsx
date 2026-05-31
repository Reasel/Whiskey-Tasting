import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, AccessibilityInfo, type TextStyle } from 'react-native';
import { AppText } from './AppText';

interface CountUpProps {
  value: number;
  decimals?: number;
  animate?: boolean;
  style?: TextStyle;
}

/** Counts 0 -> value over 850ms (cubic ease-out). Honors reduce-motion by
 *  snapping straight to the final value. Renders through AppText so it keeps
 *  the mono tabular-nums look used in tables/scores. */
export function CountUp({ value, decimals = 1, animate = true, style }: CountUpProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(() => value.toFixed(decimals));

  useEffect(() => {
    let cancelled = false;

    const run = (reduceMotion: boolean) => {
      if (reduceMotion || !animate) {
        setDisplay(value.toFixed(decimals));
        return;
      }
      progress.setValue(0);
      const id = progress.addListener(({ value: p }) => {
        if (!cancelled) setDisplay((p * value).toFixed(decimals));
      });
      Animated.timing(progress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        if (!cancelled) setDisplay(value.toFixed(decimals));
        progress.removeListener(id);
      });
      return () => progress.removeListener(id);
    };

    let cleanup: (() => void) | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (!cancelled) cleanup = run(rm);
    });

    return () => {
      cancelled = true;
      progress.stopAnimation();
      if (cleanup) cleanup();
    };
  }, [value, decimals, animate, progress]);

  return (
    <AppText variant="tableCell" style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {display}
    </AppText>
  );
}
