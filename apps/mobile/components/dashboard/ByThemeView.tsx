import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../../lib/theme';
import { AppText } from '../ui/AppText';
import { Card } from '../ui/Card';
import { Accordion } from '../ui/Accordion';
import { whiskeyBreakdown } from '../../lib/scoring';
import type { ThemeScoresResponse, WhiskeyScores } from '../../lib/api';

interface Props {
  allScores: ThemeScoresResponse[];
}

export function ByThemeView({ allScores }: Props) {
  if (allScores.length === 0) {
    return (
      <View style={styles.empty}>
        <AppText variant="bodyMuted">No themes yet.</AppText>
      </View>
    );
  }

  return (
    <View>
      {allScores.map((t) => (
        <Card
          key={t.theme.id}
          title={t.theme.name}
          style={styles.themeCard}
        >
          {t.theme.notes ? (
            <AppText variant="bodyMuted" style={styles.notes}>
              {t.theme.notes}
            </AppText>
          ) : null}
          {t.whiskeys.map((w) => (
            <WhiskeyAccordion key={w.whiskey_id} whiskey={w} />
          ))}
        </Card>
      ))}
    </View>
  );
}

function WhiskeyAccordion({ whiskey }: { whiskey: WhiskeyScores }) {
  const rows = whiskeyBreakdown(whiskey);
  const header = (
    <View style={styles.accHeader}>
      <View style={styles.accName}>
        <AppText variant="body" numberOfLines={1} style={styles.accNameText}>
          {whiskey.whiskey_name}
        </AppText>
        {whiskey.proof != null ? (
          <AppText style={styles.accProof}>{whiskey.proof} PRF</AppText>
        ) : null}
      </View>
      <AppText style={styles.accStat}>
        {rows.length
          ? `${whiskey.average_score.toFixed(1)} AVG · ${rows.length} TASTER${
              rows.length === 1 ? '' : 'S'
            }`
          : 'NO SCORES'}
      </AppText>
    </View>
  );

  return (
    <Accordion header={header}>
      {rows.length === 0 ? (
        <AppText variant="bodyMuted" style={styles.noScores}>
          No tasters scored this pour.
        </AppText>
      ) : (
        <View>
          <View style={[styles.row, styles.headerRow]}>
            <View style={styles.colTaster}>
              <AppText variant="fieldLabel" numberOfLines={1}>TASTER</AppText>
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
          {rows.map((r) => (
            <View key={r.user_name} style={styles.row}>
              <View style={styles.colTaster}>
                <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>
                  {r.user_name}
                </AppText>
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
        </View>
      )}
    </Accordion>
  );
}

const styles = StyleSheet.create({
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  themeCard: { marginBottom: spacing.lg },
  notes: { marginBottom: spacing.md },
  accHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  accName: { flexShrink: 1, marginRight: spacing.sm },
  accNameText: { color: colors.cream },
  accProof: {
    fontFamily: fonts.monoRegular,
    fontSize: 11,
    color: colors.muted,
  },
  accStat: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    color: colors.amber,
  },
  noScores: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerRow: { borderBottomColor: colors.amber },
  colTaster: { flex: 1, marginRight: spacing.xs },
  colScore: { width: 28, marginRight: spacing.xs },
  colAvg: { width: 34, marginRight: spacing.xs },
  colRank: { width: 24 },
  right: { textAlign: 'right' },
  avgValue: { color: colors.amber },
});
