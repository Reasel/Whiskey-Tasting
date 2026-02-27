import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontSize, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { WhiskeyCard } from '../../components/tasting/WhiskeyCard';
import { Toast } from '../../components/ui/Toast';
import {
  fetchActiveTheme,
  fetchWhiskeysByTheme,
  fetchUsers,
  fetchUserTastingsForTheme,
  submitTasting,
  type Theme,
  type Whiskey,
  type User,
  type SubmitTastingRequest,
} from '../../lib/api';
import { getLastUsername, setLastUsername } from '../../lib/storage';

type WhiskeyScores = {
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  personal_rank: number;
};

export default function TastingScreen() {
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<number, WhiskeyScores>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userSelected, setUserSelected] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const initScores = useCallback((whiskeysData: Whiskey[]) => {
    const initial: Record<number, WhiskeyScores> = {};
    whiskeysData.forEach((w, i) => {
      if (w.id != null) {
        initial[w.id] = {
          aroma_score: 3,
          flavor_score: 3,
          finish_score: 3,
          personal_rank: i + 1,
        };
      }
    });
    setScores(initial);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [themeData, usersData, savedName] = await Promise.all([
        fetchActiveTheme(),
        fetchUsers(),
        getLastUsername(),
      ]);
      setActiveTheme(themeData);
      setUsers(usersData.users);
      if (savedName) setUserName(savedName);

      if (themeData) {
        const whiskeysData = await fetchWhiskeysByTheme(themeData.id);
        setWhiskeys(whiskeysData);
        initScores(whiskeysData);
      }
    } catch {
      setToast({
        message: 'Could not connect to server.',
        type: 'error',
        visible: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initScores]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadExistingTastings = useCallback(async () => {
    if (!userName.trim() || !activeTheme) return;
    try {
      const data = await fetchUserTastingsForTheme(
        userName.trim(),
        activeTheme.id,
      );
      const loaded: Record<number, WhiskeyScores> = {};
      whiskeys.forEach((w, i) => {
        if (w.id == null) return;
        const existing = data.tastings[w.id];
        loaded[w.id] = existing
          ? {
              aroma_score: existing.aroma_score,
              flavor_score: existing.flavor_score,
              finish_score: existing.finish_score,
              personal_rank: existing.personal_rank,
            }
          : {
              aroma_score: 3,
              flavor_score: 3,
              finish_score: 3,
              personal_rank: i + 1,
            };
      });
      setScores(loaded);
    } catch {
      initScores(whiskeys);
    }
  }, [userName, activeTheme, whiskeys, initScores]);

  const handleSelectUser = useCallback(
    async (name: string) => {
      setUserName(name);
      setUserSelected(true);
      await setLastUsername(name);
      // Try loading existing tastings
      if (activeTheme) {
        try {
          const data = await fetchUserTastingsForTheme(name, activeTheme.id);
          const loaded: Record<number, WhiskeyScores> = {};
          whiskeys.forEach((w, i) => {
            if (w.id == null) return;
            const existing = data.tastings[w.id];
            loaded[w.id] = existing
              ? {
                  aroma_score: existing.aroma_score,
                  flavor_score: existing.flavor_score,
                  finish_score: existing.finish_score,
                  personal_rank: existing.personal_rank,
                }
              : {
                  aroma_score: 3,
                  flavor_score: 3,
                  finish_score: 3,
                  personal_rank: i + 1,
                };
          });
          setScores(loaded);
        } catch {
          initScores(whiskeys);
        }
      }
    },
    [activeTheme, whiskeys, initScores],
  );

  const handleContinueAsNew = useCallback(async () => {
    if (!userName.trim()) return;
    setUserSelected(true);
    await setLastUsername(userName.trim());
    initScores(whiskeys);
  }, [userName, whiskeys, initScores]);

  const handleSubmit = useCallback(async () => {
    if (!userName.trim() || !activeTheme) return;

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: userName.trim(),
        whiskey_scores: scores,
      };
      await submitTasting(request);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        message: 'Tasting submitted!',
        type: 'success',
        visible: true,
      });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setToast({
        message: 'Failed to submit. Try again.',
        type: 'error',
        visible: true,
      });
    } finally {
      setSubmitting(false);
    }
  }, [userName, activeTheme, scores]);

  const updateScore = useCallback(
    (whiskeyId: number, field: keyof WhiskeyScores, value: number) => {
      setScores((prev) => ({
        ...prev,
        [whiskeyId]: {
          ...prev[whiskeyId],
          [field]: value,
        },
      }));
    },
    [],
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

  if (!activeTheme) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Active Theme</Text>
          <Text style={styles.emptyText}>
            Create a theme in the admin panel to start tasting.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // User selection phase
  if (!userSelected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Who are you?</Text>
          <Text style={styles.sectionSubtitle}>
            Select your name or enter a new one
          </Text>

          {users.map((u) => (
            <Card
              key={u.id}
              onPress={() => handleSelectUser(u.name)}
              style={[
                styles.userCard,
                userName === u.name && styles.userCardActive,
              ]}
            >
              <Text
                style={[
                  styles.userName,
                  userName === u.name && styles.userNameActive,
                ]}
              >
                {u.name}
              </Text>
            </Card>
          ))}

          <View style={styles.divider} />
          <Text style={styles.orText}>Or enter a new name:</Text>
          <Input
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name..."
            autoCapitalize="words"
          />
          <Button
            title="Continue"
            onPress={handleContinueAsNew}
            disabled={!userName.trim()}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Tasting form
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
        <View style={styles.themeHeader}>
          <Text style={styles.themeName}>{activeTheme.name}</Text>
          <Text style={styles.userLabel}>Tasting as: {userName}</Text>
          <Button
            title="Change User"
            variant="ghost"
            size="sm"
            onPress={() => setUserSelected(false)}
          />
        </View>

        {whiskeys.map((whiskey, index) =>
          whiskey.id != null ? (
            <WhiskeyCard
              key={whiskey.id}
              index={index}
              name={whiskey.name}
              proof={whiskey.proof}
              scores={scores[whiskey.id] || {
                aroma_score: 3,
                flavor_score: 3,
                finish_score: 3,
                personal_rank: index + 1,
              }}
              totalWhiskeys={whiskeys.length}
              onScoreChange={(field, value) =>
                updateScore(whiskey.id!, field, value)
              }
            />
          ) : null,
        )}

        <Button
          title={submitting ? 'Submitting...' : 'Submit Tasting'}
          size="lg"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
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
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  userName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  userNameActive: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  orText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  themeHeader: {
    marginBottom: spacing.lg,
  },
  themeName: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  userLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
});
