import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { Card } from '../components/ui/Card';
import { ScoreDisplay } from '../components/tasting/ScoreDisplay';
import {
  fetchAllThemesScores,
  type ThemeScoresResponse,
} from '../lib/api';

export default function DashboardScreen() {
  const [themesScores, setThemesScores] = useState<ThemeScoresResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTheme, setExpandedTheme] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllThemesScores();
      setThemesScores(data);
      if (data.length > 0 && expandedTheme === null) {
        setExpandedTheme(data[0].theme.id);
      }
    } catch {
      // silently fail, user can pull to refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [expandedTheme]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

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
        {themesScores.map((themeScore) => (
          <View key={themeScore.theme.id} style={styles.themeSection}>
            <TouchableOpacity
              onPress={() =>
                setExpandedTheme(
                  expandedTheme === themeScore.theme.id
                    ? null
                    : themeScore.theme.id,
                )
              }
              activeOpacity={0.7}
            >
              <Card style={styles.themeHeader}>
                <View style={styles.themeHeaderRow}>
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>
                      {themeScore.theme.name}
                    </Text>
                    {themeScore.theme.notes ? (
                      <Text style={styles.themeNotes}>
                        {themeScore.theme.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.chevron}>
                    {expandedTheme === themeScore.theme.id ? '\u25B2' : '\u25BC'}
                  </Text>
                </View>
                <Text style={styles.whiskeyCount}>
                  {themeScore.whiskeys.length} whiskeys
                </Text>
              </Card>
            </TouchableOpacity>

            {expandedTheme === themeScore.theme.id && (
              <View style={styles.scoresList}>
                {themeScore.whiskeys
                  .sort((a, b) => a.rank_by_average - b.rank_by_average)
                  .map((whiskey) => (
                    <ScoreDisplay
                      key={whiskey.whiskey_id}
                      whiskeyName={whiskey.whiskey_name}
                      proof={whiskey.proof}
                      averageScore={whiskey.average_score}
                      rank={whiskey.rank_by_average}
                      tasterCount={whiskey.scores.length}
                    />
                  ))}

                {/* Detailed scores table */}
                {themeScore.whiskeys.some((w) => w.scores.length > 0) && (
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
            )}
          </View>
        ))}
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
  themeSection: {
    marginBottom: spacing.lg,
  },
  themeHeader: {
    marginBottom: 0,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  themeNotes: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginLeft: spacing.md,
  },
  whiskeyCount: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoresList: {
    marginTop: spacing.sm,
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
