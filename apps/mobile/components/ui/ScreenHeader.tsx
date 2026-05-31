import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  backLabel?: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, eyebrow, backLabel, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.head}>
      <View style={styles.text}>
        <AppText variant="pageTitle">{title}</AppText>
        {eyebrow ? (
          <AppText style={styles.eyebrow}>// {eyebrow}</AppText>
        ) : null}
      </View>
      {backLabel && onBack ? (
        <Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
          <AppText style={styles.backLabel}>← {backLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.lg,
  },
  text: { flex: 1, marginRight: spacing.md },
  eyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.amber,
    marginTop: spacing.xs,
  },
  back: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  backPressed: { borderColor: colors.cream },
  backLabel: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.dim,
    textTransform: 'uppercase' as const,
  },
});
