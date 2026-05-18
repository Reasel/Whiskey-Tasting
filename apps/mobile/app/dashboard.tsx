import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (themesScores.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Results Yet</Text>
          <Text style={styles.emptyText}>
            Submit some tastings to see results here.
          </Text>
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
            tintColor={colors.primary}
          />
        }
      >
        <Dropdown
          label="Theme"
          value={themeFilter}
          options={themeOptions}
          onChange={(v) =>
            setThemeFilter(v === 'all' ? 'all' : Number(v))
          }
        />
        <Dropdown
          label="Person"
          value={personFilter}
          options={personOptions}
          onChange={(v) => setPersonFilter(String(v))}
        />
        <Dropdown
          label="Sort by"
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
              <Text style={styles.themeName}>{themeScore.theme.name}</Text>

              {rows.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    {personFilter === 'all'
                      ? 'No tastings yet for this theme.'
                      : `No scores from ${personFilter} for this theme.`}
                  </Text>
                </Card>
              ) : (
                rows.map((r) => (
                  <View key={r.whiskeyId} style={styles.row}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{r.rank}</Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.whiskeyName}>{r.name}</Text>
                      {r.proof != null && (
                        <Text style={styles.proof}>{r.proof}% ABV</Text>
                      )}
                      <Text style={styles.metrics}>
                        A {r.aroma.toFixed(1)} · F {r.flavor.toFixed(1)} · Fi{' '}
                        {r.finish.toFixed(1)}
                        {personFilter === 'all'
                          ? ` · ${r.tasterCount} taster${
                              r.tasterCount === 1 ? '' : 's'
                            }`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.avgBox}>
                      <Text style={styles.avgValue}>
                        {r.avg.toFixed(1)}
                      </Text>
                      <Text style={styles.avgLabel}>avg</Text>
                    </View>
                  </View>
                ))
              )}

              {personFilter === 'all' &&
                themeScore.whiskeys.some((w) => w.scores.length > 0) && (
                  <Card style={styles.detailCard}>
                    <Text style={styles.detailTitle}>Individual Scores</Text>
                    {themeScore.whiskeys.map((whiskey) =>
                      whiskey.scores.map((score) => (
                        <View
                          key={`${whiskey.whiskey_id}-${score.user_name}`}
                          style={styles.detailRow}
                        >
                          <View style={styles.detailLeft}>
                            <Text style={styles.detailUser}>
                              {score.user_name}
                            </Text>
                            <Text style={styles.detailWhiskey}>
                              {whiskey.whiskey_name}
                            </Text>
                          </View>
                          <View style={styles.detailScores}>
                            <Text style={styles.detailScore}>
                              A:{score.aroma_score.toFixed(1)}
                            </Text>
                            <Text style={styles.detailScore}>
                              F:{score.flavor_score.toFixed(1)}
                            </Text>
                            <Text style={styles.detailScore}>
                              Fi:{score.finish_score.toFixed(1)}
                            </Text>
                            <Text style={styles.detailAvg}>
                              {score.average_score.toFixed(1)}
                            </Text>
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
    backgroundColor: colors.background,
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
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  emptyCard: {
    marginBottom: spacing.md,
  },
  themeSection: {
    marginBottom: spacing.lg,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  row: {
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
  rowInfo: {
    flex: 1,
  },
  whiskeyName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  proof: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  metrics: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  avgBox: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  avgValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  avgLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  detailCard: {
    marginTop: spacing.sm,
  },
  detailTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLeft: {
    flex: 1,
  },
  detailUser: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  detailWhiskey: {
    color: colors.textMuted,
    fontSize: 12,
  },
  detailScores: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  detailScore: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  detailAvg: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
});
