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
import { colors, spacing } from '../lib/theme';
import { AppText } from '../components/ui/AppText';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { GridBackground } from '../components/ui/GridBackground';
import { fetchSystemStatus, type SystemStatus } from '../lib/api';

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const statusData = await fetchSystemStatus();
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
        <GridBackground />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <GridBackground />
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
        <View style={styles.hero}>
          <AppText variant="pageTitle">WHISKEY TASTING</AppText>
          <Eyebrow style={styles.eyebrow}>HAVE A DRINK!</Eyebrow>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <AppText variant="body" style={styles.errorText}>{error}</AppText>
            <Button
              title="Open Settings"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/settings')}
            />
          </Card>
        )}

        {status && (
          <View style={styles.stats}>
            <View style={styles.statCell}>
              <Card style={styles.statCard}>
                <AppText variant="sectionTitle" style={styles.statValue}>
                  {status.database_stats.total_themes}
                </AppText>
                <AppText variant="fieldLabel" style={styles.statLabel}>Themes</AppText>
              </Card>
            </View>
            <View style={styles.statCell}>
              <Card style={styles.statCard}>
                <AppText variant="sectionTitle" style={styles.statValue}>
                  {status.database_stats.total_whiskeys}
                </AppText>
                <AppText variant="fieldLabel" style={styles.statLabel}>Whiskeys</AppText>
              </Card>
            </View>
            <View style={styles.statCell}>
              <Card style={styles.statCard}>
                <AppText variant="sectionTitle" style={styles.statValue}>
                  {status.database_stats.total_tastings}
                </AppText>
                <AppText variant="fieldLabel" style={styles.statLabel}>Tastings</AppText>
              </Card>
            </View>
            <View style={styles.statCell}>
              <Card style={styles.statCard}>
                <AppText variant="sectionTitle" style={styles.statValue}>
                  {status.database_stats.total_users}
                </AppText>
                <AppText variant="fieldLabel" style={styles.statLabel}>Users</AppText>
              </Card>
            </View>
          </View>
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
    backgroundColor: colors.canvasCream,
    position: 'relative',
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
  eyebrow: {
    marginTop: spacing.sm,
  },
  errorCard: {
    marginBottom: spacing.lg,
    borderColor: colors.alertRed,
  },
  errorText: {
    color: colors.alertRed,
    marginBottom: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  statCell: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statValue: {
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
    marginTop: spacing.xs,
    color: colors.mutedText,
  },
  actions: {
    gap: spacing.md,
  },
});
