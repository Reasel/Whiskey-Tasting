import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { Card } from '../../components/ui/Card';
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Data</Text>
          <Text style={styles.emptyText}>
            No tasting data available yet.
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
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {data.map((themeData) => (
          <Card key={themeData.theme.id} style={styles.themeCard}>
            <Text style={styles.themeName}>{themeData.theme.name}</Text>

            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.cellWide]}>
                Whiskey
              </Text>
              <Text style={styles.headerCell}>User</Text>
              <Text style={styles.headerCell}>Aroma</Text>
              <Text style={styles.headerCell}>Flavor</Text>
              <Text style={styles.headerCell}>Finish</Text>
              <Text style={styles.headerCell}>Avg</Text>
              <Text style={styles.headerCell}>Rank</Text>
            </View>

            {/* Table rows */}
            {themeData.whiskeys.map((whiskey) =>
              whiskey.scores.map((score, idx) => (
                <View
                  key={`${whiskey.whiskey_id}-${score.user_name}`}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 && styles.tableRowAlt,
                  ]}
                >
                  <Text
                    style={[styles.cell, styles.cellWide]}
                    numberOfLines={1}
                  >
                    {whiskey.whiskey_name}
                  </Text>
                  <Text style={styles.cell} numberOfLines={1}>
                    {score.user_name}
                  </Text>
                  <Text style={styles.cell}>
                    {score.aroma_score.toFixed(1)}
                  </Text>
                  <Text style={styles.cell}>
                    {score.flavor_score.toFixed(1)}
                  </Text>
                  <Text style={styles.cell}>
                    {score.finish_score.toFixed(1)}
                  </Text>
                  <Text style={[styles.cell, styles.cellHighlight]}>
                    {score.average_score.toFixed(1)}
                  </Text>
                  <Text style={styles.cell}>{score.personal_rank}</Text>
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
    backgroundColor: colors.background,
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
  themeCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerCell: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
  },
  cell: {
    color: colors.text,
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
  cellWide: {
    flex: 2,
    textAlign: 'left',
  },
  cellHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
