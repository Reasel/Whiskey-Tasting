import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { Eyebrow } from '../ui/Eyebrow';
import { PodiumGlass } from '../ui/PodiumGlass';
import { RankedBar } from '../ui/RankedBar';
import { leaderboard, consensus } from '../../lib/scoring';
import type { ThemeScoresResponse } from '../../lib/api';

// Podium fill percentages by medal place (handoff spec).
const PODIUM_FILL: Record<1 | 2 | 3, number> = { 1: 82, 2: 64, 3: 50 };

interface Props {
  // revealKey changes on each refresh to retrigger the cascade.
  revealKey: number;
  activeTheme: { name: string } | null;
  scores: ThemeScoresResponse | null;
}

export function ResultsReveal({ revealKey, activeTheme, scores }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v) => setReduceMotion(v),
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  if (!activeTheme) {
    return (
      <View style={styles.empty}>
        <AppText variant="sectionTitle" style={styles.emptyTitle}>
          No active theme
        </AppText>
        <AppText variant="bodyMuted" style={styles.emptyBody}>
          Create a theme in Admin to start a tasting.
        </AppText>
      </View>
    );
  }

  const lb = scores ? leaderboard(scores) : [];
  const scored = lb.filter((r) => r.scored);

  if (scored.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="sectionTitle" style={styles.emptyTitle}>
          No scores yet
        </AppText>
        <AppText variant="bodyMuted" style={styles.emptyBody}>
          {activeTheme.name} is live — be the first to log a pour.
        </AppText>
      </View>
    );
  }

  const cons = scores ? consensus(scores) : [];
  const maxScore = Math.max(...scored.map((r) => r.score), 5);

  // Top 3 for the podium; arrange in visual order 2 · 1 · 3.
  const podium = scored.slice(0, 3);
  const byPlace = (place: 1 | 2 | 3) => podium[place - 1];
  const visualOrder: (1 | 2 | 3)[] = [2, 1, 3];

  return (
    <View>
      {/* Podium */}
      <Eyebrow style={styles.sectionEyebrow}>THE PODIUM</Eyebrow>
      <View style={styles.podiumRow}>
        {visualOrder.map((place) => {
          const w = byPlace(place);
          if (!w) return <View key={place} style={styles.podiumCol} />;
          return (
            <View key={place} style={styles.podiumCol}>
              <AppText
                variant="cardTitle"
                numberOfLines={2}
                style={styles.podiumName}
              >
                {w.whiskey_name}
              </AppText>
              <PodiumGlass
                place={place}
                fillPct={PODIUM_FILL[place]}
                animate={!reduceMotion}
              />
              <AppText
                style={[
                  styles.medal,
                  place === 1 && styles.medalGold,
                ]}
              >
                {place === 1 ? '1ST' : place === 2 ? '2ND' : '3RD'}
              </AppText>
            </View>
          );
        })}
      </View>

      {/* Ranked bars */}
      <Eyebrow style={styles.sectionEyebrow}>EVERY POUR</Eyebrow>
      <View style={styles.bars}>
        {scored.map((r, i) => (
          <RankedBar
            key={`${revealKey}-${r.whiskey_id}`}
            rank={r.rank}
            name={r.whiskey_name}
            proof={r.proof}
            score={r.score}
            max={maxScore}
            top={i === 0}
            animate={!reduceMotion}
          />
        ))}
      </View>

      {/* Consensus */}
      <Eyebrow style={styles.sectionEyebrow}>CLOSEST TO THE GROUP</Eyebrow>
      <View style={styles.consensus}>
        {cons.map((c) => (
          <ConsensusRow
            key={`${revealKey}-${c.user_name}`}
            userName={c.user_name}
            deviation={c.meanAbsDeviation}
            rank={c.rank}
            maxDeviation={Math.max(
              ...cons.map((x) => x.meanAbsDeviation),
              0.01,
            )}
            animate={!reduceMotion}
          />
        ))}
      </View>
    </View>
  );
}

// Closeness bar: shorter = closer to group. We render an inverted fill so
// rank #1 (lowest deviation) has the fullest "closeness" bar.
function ConsensusRow({
  userName,
  deviation,
  rank,
  maxDeviation,
  animate,
}: {
  userName: string;
  deviation: number;
  rank: number;
  maxDeviation: number;
  animate: boolean;
}) {
  const closeness = 1 - deviation / maxDeviation; // 0..1, higher = closer
  const fill = useRef(new Animated.Value(animate ? 0 : closeness)).current;
  const top = rank === 1;

  useEffect(() => {
    if (!animate) {
      fill.setValue(closeness);
      return;
    }
    fill.setValue(0);
    const anim = Animated.timing(fill, {
      toValue: closeness,
      duration: 1000,
      delay: 120 + rank * 90,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [animate, closeness, rank, fill]);

  const width = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const row = (
    <View style={[styles.consRow, top && styles.consRowTop]}>
      <View style={styles.consRank}>
        <AppText style={top ? styles.consStar : styles.consRankNum}>
          {top ? '★' : String(rank).padStart(2, '0')}
        </AppText>
      </View>
      <View style={styles.consBody}>
        <AppText variant="body" numberOfLines={1} style={styles.consName}>
          {userName}
        </AppText>
        <View style={styles.consTrack}>
          <Animated.View style={[styles.consFill, { width }]} />
        </View>
      </View>
      <AppText style={styles.consOff}>
        {`±${deviation.toFixed(2)} avg off`}
      </AppText>
    </View>
  );

  return row;
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: { color: colors.cream, marginBottom: spacing.sm },
  emptyBody: { textAlign: 'center' },
  sectionEyebrow: {
    marginTop: spacing.lg,
    marginBottom: spacing.smd,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  podiumCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  podiumName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  medal: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    color: colors.dim,
    marginTop: spacing.sm,
  },
  medalGold: { color: colors.amber },
  bars: { marginTop: spacing.xs },
  consensus: { marginTop: spacing.xs },
  consRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.smd,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  consRowTop: {
    backgroundColor: colors.glowSoft,
    borderBottomColor: colors.amber,
  },
  consRank: { width: 28 },
  consStar: { color: colors.amber, fontSize: 16 },
  consRankNum: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: colors.muted,
  },
  consBody: { flex: 1, marginRight: spacing.smd },
  consName: { color: colors.cream, marginBottom: spacing.xs },
  consTrack: {
    height: 6,
    backgroundColor: colors.raise,
    overflow: 'hidden',
  },
  consFill: {
    height: 6,
    backgroundColor: colors.amber,
  },
  consOff: {
    fontFamily: fonts.monoRegular,
    fontSize: 12,
    color: colors.dim,
  },
});
