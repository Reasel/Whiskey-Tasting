import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { byPerson } from '../../lib/scoring';
import type { ThemeScoresResponse, Theme } from '../../lib/api';

interface Props {
  activeTheme: Theme | null;
  scores: ThemeScoresResponse | null;
}

export function ByPersonView({ activeTheme, scores }: Props) {
  if (!activeTheme) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodyMuted">No active theme.</AppText>
      </View>
    );
  }

  const groups = scores ? byPerson(scores) : [];

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodyMuted">
          No one has scored {activeTheme.name} yet.
        </AppText>
      </View>
    );
  }

  return (
    <View>
      {groups.map((g) => (
        <Card key={g.user_name} title={g.user_name} style={styles.personCard}>
          <View style={[styles.row, styles.headerRow]}>
            <View style={styles.colName}>
              <AppText variant="fieldLabel" numberOfLines={1}>WHISKEY</AppText>
            </View>
            <View style={styles.colScore}>
              <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>A</AppText>
            </View>
            <View style={styles.colScore}>
              <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>F</AppText>
            </View>
            <View style={styles.colScore}>
              <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>Fi</AppText>
            </View>
            <View style={styles.colAvg}>
              <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>AVG</AppText>
            </View>
            <View style={styles.colRank}>
              <AppText variant="fieldLabel" style={styles.right} numberOfLines={1}>RK</AppText>
            </View>
          </View>
          {g.rows.map((r) => (
            <View key={r.whiskey_name} style={styles.row}>
              <View style={styles.colName}>
                <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
                  {r.whiskey_name}
                </AppText>
                {r.proof != null ? (
                  <AppText variant="tableCell" style={styles.proof} numberOfLines={1}>
                    {r.proof} PRF
                  </AppText>
                ) : null}
              </View>
              <View style={styles.colScore}>
                <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                  {r.aroma.toFixed(1)}
                </AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                  {r.flavor.toFixed(1)}
                </AppText>
              </View>
              <View style={styles.colScore}>
                <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                  {r.finish.toFixed(1)}
                </AppText>
              </View>
              <View style={styles.colAvg}>
                <AppText
                  variant="tableCell"
                  style={[styles.right, styles.avgValue]}
                  numberOfLines={1}
                >
                  {r.average.toFixed(1)}
                </AppText>
              </View>
              <View style={styles.colRank}>
                <AppText variant="tableCell" style={styles.right} numberOfLines={1}>
                  {r.rank}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  personCard: { marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerRow: { borderBottomColor: colors.amber },
  colName: { flex: 1, marginRight: spacing.xs },
  colScore: { width: 28, marginRight: spacing.xs },
  colAvg: { width: 34, marginRight: spacing.xs },
  colRank: { width: 24 },
  right: { textAlign: 'right' },
  proof: { color: colors.muted },
  avgValue: { color: colors.amber },
});
