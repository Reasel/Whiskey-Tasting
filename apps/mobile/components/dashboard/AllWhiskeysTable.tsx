import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { allWhiskeys } from '../../lib/scoring';
import type { ThemeScoresResponse } from '../../lib/api';

interface Props {
  allScores: ThemeScoresResponse[];
}

export function AllWhiskeysTable({ allScores }: Props) {
  const rows = allWhiskeys(allScores);

  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodyMuted">No scored whiskeys yet.</AppText>
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.colName}>
          <AppText variant="fieldLabel" numberOfLines={1}>WHISKEY</AppText>
        </View>
        <View style={styles.colTheme}>
          <AppText variant="fieldLabel" numberOfLines={1}>THEME</AppText>
        </View>
        <View style={styles.colProof}>
          <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
            PRF
          </AppText>
        </View>
        <View style={styles.colAvg}>
          <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
            AVG
          </AppText>
        </View>
        <View style={styles.colTasters}>
          <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>
            T
          </AppText>
        </View>
      </View>

      {rows.map((r, i) => (
        <View key={`${r.theme_name}-${r.whiskey_name}-${i}`} style={styles.row}>
          <View style={styles.colName}>
            <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
              {r.whiskey_name}
            </AppText>
          </View>
          <View style={styles.colTheme}>
            <AppText
              variant="tableCell"
              style={styles.themeText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {r.theme_name}
            </AppText>
          </View>
          <View style={styles.colProof}>
            <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
              {r.proof != null ? r.proof : '—'}
            </AppText>
          </View>
          <View style={styles.colAvg}>
            <AppText
              variant="tableCell"
              style={[styles.right, styles.avgValue]}
              numberOfLines={1}
            >
              {r.score.toFixed(1)}
            </AppText>
          </View>
          <View style={styles.colTasters}>
            <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
              {r.tasters}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerRow: { borderBottomColor: colors.amber },
  colName: { flex: 1.4, marginRight: spacing.xs },
  colTheme: { flex: 1, marginRight: spacing.xs },
  colProof: { width: 34, marginRight: spacing.xs },
  colAvg: { width: 36, marginRight: spacing.xs },
  colTasters: { width: 22 },
  right: { textAlign: 'right' },
  themeText: { color: colors.dim },
  avgValue: { color: colors.amber },
});
