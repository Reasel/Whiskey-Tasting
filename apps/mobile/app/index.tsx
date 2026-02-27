import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { fetchActiveTheme, fetchSystemStatus, type Theme, type SystemStatus } from '../lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [themeData, statusData] = await Promise.all([
        fetchActiveTheme(),
        fetchSystemStatus(),
      ]);
      setActiveTheme(themeData);
      setStatus(statusData);
    } catch (e) {
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
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={styles.hero}>
          <Text style={styles.title}>WHISKEY{'\n'}TASTING</Text>
          <Text style={styles.subtitle}>// Have a drink!</Text>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Open Settings"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          </Card>
        )}

        {activeTheme && (
          <Card style={styles.themeCard}>
            <Text style={styles.activeLabel}>ACTIVE THEME</Text>
            <Text style={styles.themeName}>{activeTheme.name}</Text>
            {activeTheme.notes ? (
              <Text style={styles.themeNotes}>{activeTheme.notes}</Text>
            ) : null}
          </Card>
        )}

        {status && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_themes}
              </Text>
              <Text style={styles.statLabel}>Themes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_whiskeys}
              </Text>
              <Text style={styles.statLabel}>Whiskeys</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_tastings}
              </Text>
              <Text style={styles.statLabel}>Tastings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.database_stats.total_users}
              </Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Start Tasting"
            size="lg"
            onPress={() => router.push('/tasting/')}
            style={styles.actionButton}
          />
          <Button
            title="View Results"
            variant="secondary"
            size="lg"
            onPress={() => router.push('/dashboard')}
            style={styles.actionButton}
          />
        </View>
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
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: fontSize.hero * 1.1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  themeCard: {
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  activeLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  themeNotes: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});
