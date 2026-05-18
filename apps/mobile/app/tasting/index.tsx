import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { WhiskeyCard } from '../../components/tasting/WhiskeyCard';
import { Toast } from '../../components/ui/Toast';
import { AppText } from '../../components/ui/AppText';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { Panel } from '../../components/ui/Panel';
import {
  fetchThemes,
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
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<number, WhiskeyScores>>({});
  const [loading, setLoading] = useState(true);
  const [loadingWhiskeys, setLoadingWhiskeys] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userSelected, setUserSelected] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({ message: '', type: 'info', visible: false });

  const selectedTheme =
    themes.find((t) => t.id === selectedThemeId) ?? null;

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

  const loadWhiskeys = useCallback(
    async (themeId: number) => {
      setLoadingWhiskeys(true);
      try {
        const whiskeysData = await fetchWhiskeysByTheme(themeId);
        setWhiskeys(whiskeysData);
        initScores(whiskeysData);
      } catch {
        setWhiskeys([]);
        setToast({
          message: 'Could not load whiskeys for this theme.',
          type: 'error',
          visible: true,
        });
      } finally {
        setLoadingWhiskeys(false);
      }
    },
    [initScores],
  );

  const loadData = useCallback(async () => {
    try {
      const [themesResp, usersData, savedName] = await Promise.all([
        fetchThemes(),
        fetchUsers(),
        getLastUsername(),
      ]);
      setThemes(themesResp.themes);
      setUsers(usersData.users);
      if (savedName) setUserName(savedName);

      const firstTheme = themesResp.themes[0];
      if (firstTheme) {
        setSelectedThemeId(firstTheme.id);
        await loadWhiskeys(firstTheme.id);
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
  }, [loadWhiskeys]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track the current selection so the focus effect can react to a deleted
  // theme without re-subscribing on every selection change.
  const selectedThemeIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedThemeIdRef.current = selectedThemeId;
  }, [selectedThemeId]);

  // Refresh the theme/user lists whenever the tab regains focus so themes
  // created in Admin show up here. The first focus is the initial mount,
  // already covered by loadData() above, so skip it. The in-progress user
  // and entered scores are left untouched while the selected theme still
  // exists; if it was deleted, fall back to the first theme.
  const didInitialLoad = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didInitialLoad.current) {
        didInitialLoad.current = true;
        return;
      }
      let active = true;
      (async () => {
        try {
          const [themesResp, usersData] = await Promise.all([
            fetchThemes(),
            fetchUsers(),
          ]);
          if (!active) return;
          setThemes(themesResp.themes);
          setUsers(usersData.users);

          const cur = selectedThemeIdRef.current;
          if (cur != null && !themesResp.themes.some((t) => t.id === cur)) {
            // The selected theme was deleted elsewhere — fall back to the
            // first theme and return to the selection screen.
            const first = themesResp.themes[0] ?? null;
            setSelectedThemeId(first ? first.id : null);
            setUserSelected(false);
            if (first) loadWhiskeys(first.id);
          }
        } catch {
          // keep current state on a transient failure
        }
      })();
      return () => {
        active = false;
      };
    }, [loadWhiskeys]),
  );

  const handleThemeChange = useCallback(
    (value: number | string) => {
      const themeId = Number(value);
      setSelectedThemeId(themeId);
      setUserSelected(false);
      loadWhiskeys(themeId);
    },
    [loadWhiskeys],
  );

  const loadExistingScores = useCallback(
    async (name: string, themeId: number) => {
      try {
        const data = await fetchUserTastingsForTheme(name, themeId);
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
    },
    [whiskeys, initScores],
  );

  const handleSelectUser = useCallback(
    async (name: string) => {
      if (loadingWhiskeys) return;
      setUserName(name);
      setUserSelected(true);
      await setLastUsername(name);
      if (selectedThemeId != null) {
        await loadExistingScores(name, selectedThemeId);
      }
    },
    [selectedThemeId, loadExistingScores, loadingWhiskeys],
  );

  const handleContinueAsNew = useCallback(async () => {
    if (!userName.trim() || loadingWhiskeys) return;
    setUserSelected(true);
    await setLastUsername(userName.trim());
    initScores(whiskeys);
  }, [userName, whiskeys, initScores, loadingWhiskeys]);

  const handleSubmit = useCallback(async () => {
    if (!userName.trim() || selectedThemeId == null) return;

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: userName.trim(),
        whiskey_scores: scores,
      };
      await submitTasting(request);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        message: 'Tasting submitted. Pick the next person.',
        type: 'success',
        visible: true,
      });
      // Proxy flow: return to a fresh person picker, keep the theme.
      setUserSelected(false);
      setUserName('');
      initScores(whiskeys);
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
  }, [userName, selectedThemeId, scores, whiskeys, initScores]);

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
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        </View>
      </SafeAreaView>
    );
  }

  if (themes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <AppText variant="sectionTitle" style={styles.emptyTitle}>
            No Themes
          </AppText>
          <AppText variant="body" style={styles.emptyText}>
            Create a theme in the admin panel to start tasting.
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const themeOptions = themes.map((t) => ({ label: t.name, value: t.id }));

  // Selection phase: choose theme + person.
  if (!userSelected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <AppText variant="pageTitle" style={styles.pageTitle}>
            TASTING SUBMISSION
          </AppText>
          <Eyebrow style={styles.eyebrow}>SUBMIT OR EDIT TASTING SCORES</Eyebrow>

          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />

          <View style={styles.sectionHeader}>
            <AppText variant="fieldLabel">WHO ARE YOU?</AppText>
          </View>
          <AppText variant="body" style={styles.sectionSubtitle}>
            Select your name or enter a new one. You can submit for others too.
          </AppText>

          {users.map((u) => (
            <Card
              key={u.id}
              onPress={loadingWhiskeys ? undefined : () => handleSelectUser(u.name)}
              style={[
                styles.userCard,
                userName === u.name && styles.userCardActive,
              ]}
            >
              <AppText
                variant="body"
                style={[
                  styles.userName,
                  userName === u.name && styles.userNameActive,
                ]}
              >
                {u.name}
              </AppText>
            </Card>
          ))}

          <View style={styles.divider} />
          <AppText variant="fieldLabel" style={styles.orLabel}>
            OR ENTER A NEW NAME
          </AppText>
          <Input
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name..."
            autoCapitalize="words"
          />
          <Button
            title="CONTINUE"
            onPress={handleContinueAsNew}
            disabled={!userName.trim() || loadingWhiskeys}
            style={{ marginTop: spacing.md }}
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

  // Tasting form.
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
            tintColor={colors.whiskeyAmber}
          />
        }
      >
        <View style={styles.themeHeader}>
          <AppText variant="sectionTitle">{selectedTheme?.name ?? ''}</AppText>
          <AppText variant="tableCell" style={styles.userLabel}>
            Tasting as: {userName}
          </AppText>
          <View style={styles.changeUserWrap}>
            <Button
              title="CHANGE USER"
              variant="outline"
              size="sm"
              onPress={() => setUserSelected(false)}
            />
          </View>
        </View>

        {loadingWhiskeys ? (
          <ActivityIndicator size="large" color={colors.whiskeyAmber} />
        ) : (
          <Panel title="Scores">
            <View style={styles.scoreList}>
              {whiskeys.map((whiskey, index) =>
                whiskey.id != null ? (
                  <WhiskeyCard
                    key={whiskey.id}
                    index={index}
                    name={whiskey.name}
                    proof={whiskey.proof}
                    scores={
                      scores[whiskey.id] || {
                        aroma_score: 3,
                        flavor_score: 3,
                        finish_score: 3,
                        personal_rank: index + 1,
                      }
                    }
                    totalWhiskeys={whiskeys.length}
                    onScoreChange={(field, value) =>
                      updateScore(whiskey.id!, field, value)
                    }
                  />
                ) : null,
              )}
            </View>
          </Panel>
        )}

        <Button
          title="SUBMIT TASTING"
          size="lg"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || loadingWhiskeys}
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
    backgroundColor: colors.canvasCream,
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.steelGrey,
    textAlign: 'center',
  },
  pageTitle: {
    marginBottom: spacing.xs,
  },
  eyebrow: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.steelGrey,
    marginBottom: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.whiskeyAmber,
    borderWidth: 2,
  },
  userName: {
    color: colors.inkBlack,
  },
  userNameActive: {
    color: colors.whiskeyAmber,
  },
  divider: {
    height: 1,
    backgroundColor: colors.inkBlack,
    marginVertical: spacing.lg,
  },
  orLabel: {
    marginBottom: spacing.md,
  },
  themeHeader: {
    marginBottom: spacing.lg,
  },
  userLabel: {
    color: colors.steelGrey,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  changeUserWrap: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
  scoreList: {
    gap: spacing.md,
  },
});
