import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize } from '../../lib/theme';
import { RatingSlider } from './RatingSlider';

interface WhiskeyScores {
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  personal_rank: number;
}

interface WhiskeyCardProps {
  index: number;
  name: string;
  proof: number | null;
  scores: WhiskeyScores;
  totalWhiskeys: number;
  onScoreChange: (field: keyof WhiskeyScores, value: number) => void;
}

export function WhiskeyCard({
  index,
  name,
  proof,
  scores,
  totalWhiskeys,
  onScoreChange,
}: WhiskeyCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.number}>{index + 1}</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{name}</Text>
          {proof != null && (
            <Text style={styles.proof}>{proof}% ABV</Text>
          )}
        </View>
      </View>

      <RatingSlider
        label="Aroma"
        value={scores.aroma_score}
        onValueChange={(v) => onScoreChange('aroma_score', v)}
      />
      <RatingSlider
        label="Flavor"
        value={scores.flavor_score}
        onValueChange={(v) => onScoreChange('flavor_score', v)}
      />
      <RatingSlider
        label="Finish"
        value={scores.finish_score}
        onValueChange={(v) => onScoreChange('finish_score', v)}
      />
      <RatingSlider
        label="Personal Rank"
        value={scores.personal_rank}
        onValueChange={(v) => onScoreChange('personal_rank', Math.round(v))}
        minimumValue={1}
        maximumValue={totalWhiskeys}
        step={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  number: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginRight: spacing.md,
    width: 32,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  proof: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
