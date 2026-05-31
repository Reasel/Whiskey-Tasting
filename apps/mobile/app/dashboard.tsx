import React, { useState, useCallback } from 'react';
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
import { Tabs } from '../components/ui/Tabs';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
import { ResultsReveal } from '../components/dashboard/ResultsReveal';
import {
  fetchActiveTheme,
  fetchThemeScores,
  fetchAllThemesScores,
  type Theme,
  type ThemeScoresResponse,
} from '../lib/api';

type TabKey = 'results' | 'all' | 'theme' | 'person';

const TAB_OPTIONS: { label: string; value: TabKey }[] = [
  { label: 'THE RESULTS', value: 'results' },
  { label: 'ALL WHISKEYS', value: 'all' },
  { label: 'BY THEME', value: 'theme' },
  { label: 'BY PERSON', value: 'person' },
];

export default function DashboardScreen() {
  const [tab, setTab] = useState<TabKey>('results');
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [activeScores, setActiveScores] =
    useState<ThemeScoresResponse | null>(null);
  const [allScores, setAllScores] = useState<ThemeScoresResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Bumped on every successful load so child reveals re-animate on refresh.
  const [revealKey, setRevealKey] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [active, all] = await Promise.all([
        fetchActiveTheme(),
        fetchAllThemesScores(),
      ]);
      setActiveTheme(active);
      setAllScores(all);
      if (active) {
        try {
          setActiveScores(await fetchThemeScores(active.id));
        } catch {
          setActiveScores(null);
        }
      } else {
        setActiveScores(null);
      }
      setRevealKey((k) => k + 1);
    } catch {
      // Silent — pull to refresh retries.
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

  return (
    <View style={styles.root}>
      <AfterDarkBackground />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.amber}
            />
          }
        >
          <AppText variant="pageTitle" style={styles.pageTitle}>
            DATA VIEW
          </AppText>
          <Eyebrow style={styles.eyebrow}>THE TASTING, REVEALED</Eyebrow>

          <Tabs
            options={TAB_OPTIONS}
            value={tab}
            onChange={(v) => setTab(v as TabKey)}
            style={styles.tabs}
          />

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.amber} />
            </View>
          ) : (
            <View style={styles.tabBody}>
              {tab === 'results' && (
                <ResultsReveal
                  revealKey={revealKey}
                  activeTheme={activeTheme}
                  scores={activeScores}
                />
              )}
              {tab === 'all' && (
                <View>{/* 4c: All Whiskeys table */}</View>
              )}
              {tab === 'theme' && (
                <View>{/* 4d: By Theme accordion */}</View>
              )}
              {tab === 'person' && (
                <View>{/* 4e: By Person cards */}</View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pageTitle: { marginBottom: spacing.xs },
  eyebrow: { marginBottom: spacing.lg },
  tabs: { marginBottom: spacing.lg },
  tabBody: { marginTop: spacing.sm },
  centered: {
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
