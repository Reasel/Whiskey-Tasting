import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet, Easing } from 'react-native';
import Svg, {
  Defs,
  ClipPath,
  Path,
  Rect,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../../lib/theme';

interface PodiumGlassProps {
  place: 1 | 2 | 3;
  fillPct: number; // 0..100
  animate: boolean;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const GLASS_WIDTH = 72;
const HEIGHT_BY_PLACE: Record<1 | 2 | 3, number> = { 1: 150, 2: 120, 3: 100 };
const TOP_INSET = 6; // px the rim is wider than the base (trapezoid)

/** A glass trapezoid (wider at top) with an animated amber-gradient fill that
 *  rises to fillPct. Place sets the glass height. 1st place glows strongest. */
export function PodiumGlass({ place, fillPct, animate }: PodiumGlassProps) {
  const h = HEIGHT_BY_PLACE[place];
  const fill = useRef(new Animated.Value(0)).current; // 0..1
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (mounted) setReduceMotion(rm);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, fillPct)) / 100;
    if (!animate || reduceMotion) {
      fill.setValue(target);
      return;
    }
    fill.setValue(0);
    const anim = Animated.timing(fill, {
      toValue: target,
      duration: 1000,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [fillPct, animate, reduceMotion, fill]);

  // Fill grows from the bottom: height = h * fill, y = h - height.
  const fillHeight = fill.interpolate({ inputRange: [0, 1], outputRange: [0, h] });
  const fillY = fill.interpolate({ inputRange: [0, 1], outputRange: [h, 0] });

  // Trapezoid path: top edge wider (rim) than the base.
  const path = `M${TOP_INSET} 0 L${GLASS_WIDTH - TOP_INSET} 0 L${GLASS_WIDTH - TOP_INSET * 2} ${h} L${TOP_INSET * 2} ${h} Z`;

  return (
    <View style={styles.wrap}>
      <Svg width={GLASS_WIDTH} height={h}>
        <Defs>
          <ClipPath id={`glass-${place}`}>
            <Path d={path} />
          </ClipPath>
          <LinearGradient id={`fill-${place}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.amberSoft} />
            <Stop offset="1" stopColor={colors.ember} />
          </LinearGradient>
        </Defs>
        {/* Glass body */}
        <Path d={path} fill={colors.panel} stroke={colors.line} strokeWidth={1} />
        {/* Animated amber fill, masked to the glass shape */}
        <AnimatedRect
          x={0}
          y={fillY}
          width={GLASS_WIDTH}
          height={fillHeight}
          fill={`url(#fill-${place})`}
          clipPath={`url(#glass-${place})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
