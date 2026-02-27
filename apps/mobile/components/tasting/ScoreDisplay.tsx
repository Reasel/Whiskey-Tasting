import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';

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
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{whiskeyName}</Text>
        {proof != null && (
          <Text style={styles.proof}>{proof}% ABV</Text>
        )}
        <Text style={styles.tasters}>{tasterCount} tasters</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{averageScore.toFixed(1)}</Text>
        <Text style={styles.scoreLabel}>avg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  proof: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  tasters: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  score: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
