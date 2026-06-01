import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from './AppText';

interface RankPillsProps {
  value: number;
  count: number;
  onChange: (n: number) => void;
}

/** Square 1..count single-select. Selected pill = amber fill + soft glow. */
export function RankPills({ value, count, onChange }: RankPillsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => {
        const n = i + 1;
        const active = value === n;
        const pill = (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(n);
            }}
            style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
          >
            <AppText
              style={[styles.label, { color: active ? colors.bg : colors.dim }]}
            >
              {String(n)}
            </AppText>
          </Pressable>
        );
        return (
          <View key={n} style={styles.cell}>
            {pill}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
  },
  pill: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 0,
  },
  pillIdle: {
    backgroundColor: colors.raise,
    borderColor: colors.line,
  },
  pillActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
  },
});
