import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';

interface ScoreDisplayProps {
  whiskeyName: string;
  proof: number | null;
  averageScore: number;
  rank: number;
  tasterCount: number;
}

export function ScoreDisplay({
  whiskeyName,
  proof,
  averageScore,
  rank,
  tasterCount,
}: ScoreDisplayProps) {
  return (
    <View style={styles.card}>
      <View style={styles.rankBadge}>
        <AppText variant="fieldLabel" style={styles.rankText}>#{rank}</AppText>
      </View>
      <View style={styles.info}>
        <AppText variant="body" style={styles.name}>{whiskeyName}</AppText>
        {proof != null && (
          <AppText variant="tableCell" style={styles.proof}>{proof}% ABV</AppText>
        )}
        <AppText variant="tableCell" style={styles.tasters}>{tasterCount} tasters</AppText>
      </View>
      <View style={styles.scoreContainer}>
        <AppText variant="tableCell" style={styles.score}>{averageScore.toFixed(1)}</AppText>
        <AppText variant="fieldLabel" style={styles.scoreLabel}>avg</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardWhite,
    borderRadius: 0,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inkBlack,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 0,
    backgroundColor: colors.whiskeyAmber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    color: colors.inkBlack,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.inkBlack,
  },
  proof: {
    color: colors.steelGrey,
  },
  tasters: {
    color: colors.mutedText,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  score: {
    color: colors.inkBlack,
    fontSize: 24,
  },
  scoreLabel: {
    color: colors.mutedText,
  },
});
