import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../lib/theme';
import { Card } from '../../components/ui/Card';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import {
  fetchAllThemesScores,
  type ThemeScoresResponse,
} from '../../lib/api';

export default function DataScreen() {
  const [data, setData] = useState<ThemeScoresResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchAllThemesScores();
      setData(result);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        </View>
      </SafeAreaView>
    );
  }

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AppText variant="sectionTitle" style={styles.emptyTitle}>No Data</AppText>
          <AppText variant="body" style={styles.emptyText}>
            No tasting data available yet.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.whiskeyAmber}
          />
        }
      >
        <AppText variant="pageTitle" style={styles.title}>DATA</AppText>
        <Eyebrow style={styles.eyebrow}>SUBMITTED TASTING DATA</Eyebrow>

        {data.map((themeData) => (
          <Card key={themeData.theme.id} style={styles.themeCard}>
            <AppText variant="sectionTitle" style={styles.themeName} numberOfLines={1} adjustsFontSizeToFit>{themeData.theme.name}</AppText>

            {/* Table header */}
            <View style={styles.tableHeader}>
              <AppText variant="tableCell" style={[styles.headerCell, styles.cellWide]} numberOfLines={1} adjustsFontSizeToFit>
                Whiskey
              </AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>User</AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>Aroma</AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>Flavor</AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>Finish</AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>Avg</AppText>
              <AppText variant="tableCell" style={styles.headerCell} numberOfLines={1} adjustsFontSizeToFit>Rank</AppText>
            </View>

            {/* Table rows */}
            {themeData.whiskeys.map((whiskey) =>
              whiskey.scores.map((score, idx) => (
                <View
                  key={`${whiskey.whiskey_id}-${score.user_name}`}
                  style={styles.tableRow}
                >
                  <AppText
                    variant="tableCell"
                    style={[styles.cell, styles.cellWide]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {whiskey.whiskey_name}
                  </AppText>
                  <AppText variant="tableCell" style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>
                    {score.user_name}
                  </AppText>
                  <AppText variant="tableCell" style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>
                    {score.aroma_score.toFixed(1)}
                  </AppText>
                  <AppText variant="tableCell" style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>
                    {score.flavor_score.toFixed(1)}
                  </AppText>
                  <AppText variant="tableCell" style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>
                    {score.finish_score.toFixed(1)}
                  </AppText>
                  <AppText variant="tableCell" style={[styles.cell, styles.cellHighlight]} numberOfLines={1} adjustsFontSizeToFit>
                    {score.average_score.toFixed(1)}
                  </AppText>
                  <AppText variant="tableCell" style={styles.cell} numberOfLines={1} adjustsFontSizeToFit>{score.personal_rank}</AppText>
                </View>
              )),
            )}
          </Card>
        ))}
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.mutedText,
    textAlign: 'center',
  },
  themeCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  themeName: {
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.inkBlack,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerCell: {
    color: colors.whiskeyAmber,
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
  },
  cellWide: {
    flex: 2,
    textAlign: 'left',
  },
  cellHighlight: {
    color: colors.whiskeyAmber,
  },
});
