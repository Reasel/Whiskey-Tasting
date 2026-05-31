import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { TactileRating } from '../ui/TactileRating';
import { RankPills } from '../ui/RankPills';

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
  const pourNo = String(index + 1).padStart(2, '0');
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="eyebrow" style={styles.pourNo}>{pourNo}</AppText>
        <View style={styles.headerText}>
          <AppText variant="cardTitle" numberOfLines={2} adjustsFontSizeToFit>
            {name}
          </AppText>
          {proof != null && (
            <AppText variant="fieldLabel" style={styles.proof}>{proof} PROOF</AppText>
          )}
        </View>
      </View>

      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>AROMA</AppText>
        <TactileRating
          value={scores.aroma_score}
          onChange={(v) => onScoreChange('aroma_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>FLAVOR</AppText>
        <TactileRating
          value={scores.flavor_score}
          onChange={(v) => onScoreChange('flavor_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>FINISH</AppText>
        <TactileRating
          value={scores.finish_score}
          onChange={(v) => onScoreChange('finish_score', v)}
        />
      </View>
      <View style={styles.field}>
        <AppText variant="fieldLabel" style={styles.label}>PERSONAL RANK</AppText>
        <RankPills
          value={scores.personal_rank}
          count={totalWhiskeys}
          onChange={(v) => onScoreChange('personal_rank', v)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pourNo: {
    color: colors.amber,
    marginTop: 4,
  },
  headerText: {
    flex: 1,
  },
  proof: {
    color: colors.muted,
    marginTop: 2,
  },
  field: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  label: {
    color: colors.dim,
  },
});
