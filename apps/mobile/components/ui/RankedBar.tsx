import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, View, StyleSheet, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';
import { CountUp } from './CountUp';
import { GlowBox } from './GlowBox';

interface RankedBarProps {
  rank: number;
  name: string;
  proof: number | null;
  score: number;
  max: number;
  top?: boolean;
  animate: boolean;
}

const BAR_HEIGHT = 10;
const TRACK_WIDTH = 1000; // virtual SVG width; the wrapper View clips it

/** A leaderboard row: mono rank, serif name + mono proof, an animated-width
 *  amber/ember gradient bar, and a count-up score. #1 row glows. */
export function RankedBar({ rank, name, proof, score, max, top, animate }: RankedBarProps) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current; // 0..1
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
    if (!animate || reduceMotion) {
      widthAnim.setValue(pct);
      return;
    }
    widthAnim.setValue(0);
    const anim = Animated.timing(widthAnim, {
      toValue: pct,
      duration: 950,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [pct, animate, reduceMotion, widthAnim]);

  const barWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bar = (
    <Animated.View style={[styles.barFill, { width: barWidth }]}>
      <Svg width={TRACK_WIDTH} height={BAR_HEIGHT}>
        <Defs>
          <LinearGradient id={`bar-${rank}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.amber} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={TRACK_WIDTH} height={BAR_HEIGHT} fill={`url(#bar-${rank})`} />
      </Svg>
    </Animated.View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <AppText style={styles.rank}>{String(rank).padStart(2, '0')}</AppText>
        <AppText variant="cardTitle" style={styles.name} numberOfLines={1}>
          {name}
        </AppText>
        {proof != null && <AppText style={styles.proof}>{proof} PROOF</AppText>}
        <CountUp value={score} decimals={1} animate={animate} style={styles.score} />
      </View>
      <View style={styles.track}>
        {top ? (
          <GlowBox intensity="soft" color={colors.glow} style={styles.glowWrap}>
            {bar}
          </GlowBox>
        ) : (
          bar
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.smd,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rank: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    color: colors.amber,
  },
  name: {
    flex: 1,
    fontSize: 18,
  },
  proof: {
    fontFamily: fonts.monoRegular,
    fontSize: 12,
    color: colors.muted,
  },
  score: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
    color: colors.cream,
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: colors.raise,
    overflow: 'hidden',
  },
  glowWrap: {
    height: BAR_HEIGHT,
  },
  barFill: {
    height: BAR_HEIGHT,
    overflow: 'hidden',
  },
});
