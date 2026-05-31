import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../lib/theme';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { GlowBox } from '../components/ui/GlowBox';
import { PulsingDot } from '../components/ui/PulsingDot';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
import {
  fetchActiveTheme,
  fetchThemeScores,
  type Theme,
} from '../lib/api';

type Tonight = { theme: Theme; pours: number; tasters: number };

export default function HomeScreen() {
  const router = useRouter();
  const [tonight, setTonight] = useState<Tonight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const active = await fetchActiveTheme();
      if (!active) {
        setTonight(null);
        return;
      }
      const scores = await fetchThemeScores(active.id);
      const tasterNames = new Set<string>();
      scores.whiskeys.forEach((w) =>
        w.scores.forEach((s) => tasterNames.add(s.user_name)),
      );
      setTonight({
        theme: active,
        pours: scores.whiskeys.length,
        tasters: tasterNames.size,
      });
    } catch {
      setError('Could not connect to server. Check your settings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
        <AfterDarkBackground />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.amber}
          />
        }
      >
        <View style={styles.hero}>
          <GlowBox intensity="strong" style={styles.heroGlow}>
            <AppText variant="pageTitle">WHISKEY TASTING</AppText>
          </GlowBox>
          <Eyebrow style={styles.eyebrow}>HAVE A DRINK!</Eyebrow>
        </View>

        {error && (
          <Panel style={styles.errorPanel}>
            <AppText variant="body" style={styles.errorText}>{error}</AppText>
            <Button
              title="OPEN SETTINGS"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          </Panel>
        )}

        {tonight ? (
          <View style={styles.tonight}>
            <View style={styles.tonightTop}>
              <PulsingDot size={10} color={colors.amber} />
              <AppText variant="eyebrow" style={styles.tonightEyebrow}>TONIGHT</AppText>
            </View>
            <AppText variant="cardTitle" numberOfLines={2} adjustsFontSizeToFit>
              {tonight.theme.name}
            </AppText>
            <AppText variant="fieldLabel" style={styles.tonightMeta}>
              {tonight.pours} POURS · {tonight.tasters} TASTERS IN
            </AppText>
          </View>
        ) : (
          !error && (
            <View style={styles.tonight}>
              <AppText variant="bodyMuted">No active theme. Create one in Admin.</AppText>
            </View>
          )
        )}

        <View style={styles.actions}>
          <Button
            title="START TASTING"
            size="xl"
            block
            onPress={() => router.push('/tasting/')}
          />
          <Button
            title="VIEW RESULTS"
            size="xl"
            variant="outline"
            block
            onPress={() => router.push('/dashboard')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  hero: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  heroGlow: {
    alignSelf: 'flex-start',
  },
  eyebrow: {
    marginTop: spacing.smd,
  },
  errorPanel: {
    marginBottom: spacing.lg,
    borderColor: colors.red,
  },
  errorText: {
    color: colors.red,
    marginBottom: spacing.sm,
  },
  tonight: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  tonightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tonightEyebrow: {
    color: colors.amber,
  },
  tonightMeta: {
    color: colors.dim,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginTop: 'auto',
  },
});
