import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, spacing } from '../lib/theme';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Card } from '../components/ui/Card';
import { Dropdown } from '../components/ui/Dropdown';
import {
  fetchAllThemesScores,
  type ThemeScoresResponse,
} from '../lib/api';

type SortKey = 'rank' | 'avg' | 'aroma' | 'flavor' | 'finish';

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Rank', value: 'rank' },
  { label: 'Average', value: 'avg' },
  { label: 'Aroma', value: 'aroma' },
  { label: 'Flavor', value: 'flavor' },
  { label: 'Finish', value: 'finish' },
];

type Row = {
  whiskeyId: number;
  name: string;
  proof: number | null;
  aroma: number;
  flavor: number;
  finish: number;
  avg: number;
  rank: number;
  tasterCount: number;
};

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

function buildRows(
  theme: ThemeScoresResponse,
  person: string | 'all',
): Row[] {
  const rows: Row[] = [];
  for (const w of theme.whiskeys) {
    if (person === 'all') {
      const ss = w.scores;
      if (ss.length === 0) continue;
      rows.push({
        whiskeyId: w.whiskey_id,
        name: w.whiskey_name,
        proof: w.proof,
        aroma: mean(ss.map((s) => s.aroma_score)),
        flavor: mean(ss.map((s) => s.flavor_score)),
        finish: mean(ss.map((s) => s.finish_score)),
        avg: mean(ss.map((s) => s.average_score)),
        rank: 0,
        tasterCount: ss.length,
      });
    } else {
      const s = w.scores.find((x) => x.user_name === person);
      if (!s) continue;
      rows.push({
        whiskeyId: w.whiskey_id,
        name: w.whiskey_name,
        proof: w.proof,
        aroma: s.aroma_score,
        flavor: s.flavor_score,
        finish: s.finish_score,
        avg: s.average_score,
        rank: s.personal_rank,
        tasterCount: 1,
      });
    }
  }
  if (person === 'all') {
    // The all-themes endpoint returns rank_by_average = 0, so rank by the
    // computed average within this theme (highest average = #1).
    [...rows]
      .sort((a, b) => b.avg - a.avg)
      .forEach((r, i) => {
        r.rank = i + 1;
      });
  }
  return rows;
}

function sortRows(rows: Row[], sortBy: SortKey): Row[] {
  const out = [...rows];
  if (sortBy === 'rank') {
    out.sort((a, b) => a.rank - b.rank);
  } else {
    out.sort((a, b) => b[sortBy] - a[sortBy]);
  }
  return out;
}

export default function DashboardScreen() {
  const [themesScores, setThemesScores] = useState<ThemeScoresResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [themeFilter, setThemeFilter] = useState<number | 'all'>('all');
  const [personFilter, setPersonFilter] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('rank');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllThemesScores();
      setThemesScores(data);
      // If the selected theme was deleted elsewhere, fall back to All
      // Themes so the screen doesn't render a silent blank.
      setThemeFilter((prev) =>
        prev === 'all' || data.some((t) => t.theme.id === prev)
          ? prev
          : 'all',
      );
    } catch {
      // silently fail, user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const people = useMemo(() => {
    const set = new Set<string>();
    themesScores.forEach((t) =>
      t.whiskeys.forEach((w) =>
        w.scores.forEach((s) => set.add(s.user_name)),
      ),
    );
    return Array.from(set).sort();
  }, [themesScores]);

  const themeOptions = useMemo(
    () => [
      { label: 'All Themes', value: 'all' as const },
      ...themesScores.map((t) => ({
        label: t.theme.name,
        value: t.theme.id,
      })),
    ],
    [themesScores],
  );

  const personOptions = useMemo(
    () => [
      { label: 'All People', value: 'all' as const },
      ...people.map((p) => ({ label: p, value: p })),
    ],
    [people],
  );

  const shownThemes = useMemo(
    () =>
      themeFilter === 'all'
        ? themesScores
        : themesScores.filter((t) => t.theme.id === themeFilter),
    [themesScores, themeFilter],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        </View>
      </SafeAreaView>
    );
  }

  if (themesScores.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AppText variant="body">No tastings yet.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.whiskeyAmber}
          />
        }
      >
        <AppText variant="pageTitle" style={styles.pageTitle}>
          DATA VIEW
        </AppText>
        <Eyebrow style={styles.eyebrow}>VIEW SUBMITTED TASTINGS</Eyebrow>

        <Dropdown
          label="THEME"
          value={themeFilter}
          options={themeOptions}
          onChange={(v) =>
            setThemeFilter(v === 'all' ? 'all' : Number(v))
          }
        />
        <Dropdown
          label="PERSON"
          value={personFilter}
          options={personOptions}
          onChange={(v) => setPersonFilter(String(v))}
        />
        <Dropdown
          label="SORT BY"
          value={sortBy}
          options={SORT_OPTIONS}
          onChange={(v) => setSortBy(v as SortKey)}
        />

        {shownThemes.map((themeScore) => {
          const rows = sortRows(
            buildRows(themeScore, personFilter),
            sortBy,
          );
          return (
            <View key={themeScore.theme.id} style={styles.themeSection}>
              <Card title={themeScore.theme.name}>
                {rows.length === 0 ? (
                  <AppText variant="body">
                    {personFilter === 'all'
                      ? 'No tastings yet for this theme.'
                      : `No scores from ${personFilter} for this theme.`}
                  </AppText>
                ) : (
                  <>
                    {/* Column header row */}
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      <View style={styles.colRank}>
                        <AppText variant="fieldLabel" numberOfLines={1} adjustsFontSizeToFit>#</AppText>
                      </View>
                      <View style={styles.colName}>
                        <AppText variant="fieldLabel" numberOfLines={1} adjustsFontSizeToFit>WHISKEY</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>A</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>F</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>Fi</AppText>
                      </View>
                      <View style={styles.colAvg}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>AVG</AppText>
                      </View>
                    </View>

                    {rows.map((r) => (
                      <View key={r.whiskeyId} style={styles.tableRow}>
                        <View style={styles.colRank}>
                          <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>{r.rank}</AppText>
                        </View>
                        <View style={styles.colName}>
                          <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>{r.name}</AppText>
                          {r.proof != null && (
                            <AppText variant="tableCell" style={styles.proofText} numberOfLines={1} adjustsFontSizeToFit>
                              {r.proof}% ABV
                            </AppText>
                          )}
                          {personFilter === 'all' && (
                            <AppText variant="tableCell" style={styles.tasterText} numberOfLines={1} adjustsFontSizeToFit>
                              {r.tasterCount} taster{r.tasterCount === 1 ? '' : 's'}
                            </AppText>
                          )}
                        </View>
                        <View style={styles.colScore}>
                          <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                            {r.aroma.toFixed(1)}
                          </AppText>
                        </View>
                        <View style={styles.colScore}>
                          <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                            {r.flavor.toFixed(1)}
                          </AppText>
                        </View>
                        <View style={styles.colScore}>
                          <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                            {r.finish.toFixed(1)}
                          </AppText>
                        </View>
                        <View style={styles.colAvg}>
                          <AppText variant="tableCell" style={[styles.right, styles.avgValue]} numberOfLines={1} adjustsFontSizeToFit>
                            {r.avg.toFixed(1)}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </Card>

              {personFilter === 'all' &&
                themeScore.whiskeys.some((w) => w.scores.length > 0) && (
                  <Card title="Individual Scores" style={styles.detailCard}>
                    {/* Column header row */}
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      <View style={styles.detailColPerson}>
                        <AppText variant="fieldLabel" numberOfLines={1} adjustsFontSizeToFit>PERSON</AppText>
                      </View>
                      <View style={styles.detailColWhiskey}>
                        <AppText variant="fieldLabel" numberOfLines={1} adjustsFontSizeToFit>WHISKEY</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>A</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>F</AppText>
                      </View>
                      <View style={styles.colScore}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>Fi</AppText>
                      </View>
                      <View style={styles.colAvg}>
                        <AppText variant="fieldLabel" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>AVG</AppText>
                      </View>
                    </View>

                    {themeScore.whiskeys.map((whiskey) =>
                      whiskey.scores.map((score) => (
                        <View
                          key={`${whiskey.whiskey_id}-${score.user_name}`}
                          style={styles.tableRow}
                        >
                          <View style={styles.detailColPerson}>
                            <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>{score.user_name}</AppText>
                          </View>
                          <View style={styles.detailColWhiskey}>
                            <AppText variant="tableCell" numberOfLines={1} adjustsFontSizeToFit>{whiskey.whiskey_name}</AppText>
                          </View>
                          <View style={styles.colScore}>
                            <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                              {score.aroma_score.toFixed(1)}
                            </AppText>
                          </View>
                          <View style={styles.colScore}>
                            <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                              {score.flavor_score.toFixed(1)}
                            </AppText>
                          </View>
                          <View style={styles.colScore}>
                            <AppText variant="tableCell" style={styles.right} numberOfLines={1} adjustsFontSizeToFit>
                              {score.finish_score.toFixed(1)}
                            </AppText>
                          </View>
                          <View style={styles.colAvg}>
                            <AppText variant="tableCell" style={[styles.right, styles.avgValue]} numberOfLines={1} adjustsFontSizeToFit>
                              {score.average_score.toFixed(1)}
                            </AppText>
                          </View>
                        </View>
                      )),
                    )}
                  </Card>
                )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvasCream,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  themeSection: {
    marginBottom: spacing.lg,
  },
  detailCard: {
    marginTop: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  tableHeaderRow: {
    borderBottomColor: colors.inkBlack,
  },
  colRank: {
    width: 24,
    marginRight: spacing.sm,
  },
  colName: {
    flex: 1,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  colScore: {
    width: 28,
    marginRight: spacing.xs,
  },
  colAvg: {
    width: 32,
  },
  detailColPerson: {
    flex: 1,
    marginRight: spacing.sm,
  },
  detailColWhiskey: {
    flex: 1,
    marginRight: spacing.sm,
  },
  right: {
    textAlign: 'right',
  },
  avgValue: {
    color: colors.whiskeyAmber,
  },
  proofText: {
    color: colors.mutedText,
  },
  tasterText: {
    color: colors.mutedText,
  },
});
