import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
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
  name,
  proof,
  scores,
  totalWhiskeys,
  onScoreChange,
}: WhiskeyCardProps) {
  return (
    <Card>
      <View style={styles.header}>
        <AppText variant="sectionTitle" numberOfLines={2} adjustsFontSizeToFit>
          {name}
        </AppText>
        {proof != null && (
          <AppText variant="body" style={styles.proof}>{proof}% ABV</AppText>
        )}
      </View>

      <RatingSlider
        label="AROMA"
        value={scores.aroma_score}
        onValueChange={(v) => onScoreChange('aroma_score', v)}
      />
      <RatingSlider
        label="FLAVOR"
        value={scores.flavor_score}
        onValueChange={(v) => onScoreChange('flavor_score', v)}
      />
      <RatingSlider
        label="FINISH"
        value={scores.finish_score}
        onValueChange={(v) => onScoreChange('finish_score', v)}
      />
      <RatingSlider
        label="PERSONAL RANK"
        value={scores.personal_rank}
        onValueChange={(v) => onScoreChange('personal_rank', v)}
        minimumValue={1}
        maximumValue={totalWhiskeys}
        integer
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  proof: {
    color: colors.steelGrey,
    marginTop: 2,
  },
});
