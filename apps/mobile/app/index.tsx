import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fonts } from '../lib/theme';
import { AppText } from '../components/ui/AppText';
import { PulsingDot } from '../components/ui/PulsingDot';
import { AfterDarkBackground } from '../components/ui/AfterDarkBackground';
import {
  fetchActiveTheme,
  fetchThemeScores,
  type Theme,
} from '../lib/api';

type Tonight = { theme: Theme; pours: number; tasters: number };

const TILES = [
  {
    sub: 'RATE THE POURS',
    label: 'Tasting\nSubmission',
    route: '/tasting' as const,
  },
  {
    sub: 'SEE THE RESULTS',
    label: 'Data View',
    route: '/dashboard' as const,
  },
  {
    sub: 'RUN THE NIGHT',
    label: 'Administration',
    route: '/admin' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [tonight, setTonight] = useState<Tonight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const active = await fetchActiveTheme();
      if (!active) { setTonight(null); return; }
      const scores = await fetchThemeScores(active.id);
      const tasterNames = new Set<string>();
      scores.whiskeys.forEach((w) => w.scores.forEach((s) => tasterNames.add(s.user_name)));
      setTonight({ theme: active, pours: scores.whiskeys.length, tasters: tasterNames.size });
    } catch {
      setTonight(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AfterDarkBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <AppText variant="pageTitle" style={styles.heroTitle}>WHISKEY{'\n'}TASTING</AppText>
          <AppText style={styles.heroEyebrow}>// HAVE A DRINK!</AppText>
        </View>

        {/* Tonight strip */}
        {loading ? (
          <View style={styles.tonightStrip}>
            <ActivityIndicator size="small" color={colors.amber} />
          </View>
        ) : tonight ? (
          <View style={styles.tonightStrip}>
            <View style={styles.tonightLeft}>
              <PulsingDot size={8} color={colors.amber} />
              <AppText style={styles.tonightLabel}>TONIGHT</AppText>
            </View>
            <AppText style={styles.tonightName} numberOfLines={1}>{tonight.theme.name}</AppText>
            <View style={styles.tonightStats}>
              <AppText style={styles.tonightStat}>
                <AppText style={styles.tonightStatBold}>{tonight.pours}</AppText> POURS
              </AppText>
              <View style={styles.sep} />
              <AppText style={styles.tonightStat}>
                <AppText style={styles.tonightStatBold}>{tonight.tasters}</AppText> IN
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.tonightStrip}>
            <AppText style={styles.tonightLabel}>NO ACTIVE THEME</AppText>
          </View>
        )}

        {/* Navigation tiles */}
        <View style={styles.tiles}>
          {TILES.map((t) => (
            <Pressable
              key={t.route}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
              onPress={() => router.push(t.route)}
            >
              <AppText style={styles.tileSub}>// {t.sub}</AppText>
              <AppText style={styles.tileLabel}>{t.label}</AppText>
              <AppText style={styles.tileArrow}>→</AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  hero: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  heroTitle: { textAlign: 'center', lineHeight: 48 },
  heroEyebrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 1.8,
    color: colors.amber,
    marginTop: spacing.sm,
  },

  tonightStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  tonightLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tonightLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.amber,
  },
  tonightName: {
    fontFamily: fonts.serifSemi,
    fontSize: 20,
    color: colors.cream,
    flex: 1,
  },
  tonightStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 'auto' },
  tonightStat: { fontFamily: fonts.monoRegular, fontSize: 12, letterSpacing: 1.4, color: colors.dim },
  tonightStatBold: { fontFamily: fonts.monoBold, color: colors.amber },
  sep: { width: 1, height: 14, backgroundColor: colors.line },

  tiles: { gap: spacing.md },
  tile: {
    backgroundColor: colors.raise,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    minHeight: 140,
    gap: spacing.xs,
  },
  tilePressed: {
    borderColor: colors.amber,
    shadowColor: colors.amber,
    shadowRadius: 20,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
  },
  tileSub: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.amber,
  },
  tileLabel: {
    fontFamily: fonts.serifSemi,
    fontSize: 26,
    lineHeight: 30,
    color: colors.cream,
    marginTop: 'auto',
  },
  tileArrow: {
    fontFamily: fonts.monoMedium,
    fontSize: 22,
    color: colors.amber,
    alignSelf: 'flex-end',
  },
});
