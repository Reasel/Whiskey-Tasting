import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { CustomTasterToggle } from '../../components/ui/CustomTasterToggle';
import { CelebrateOverlay } from '../../components/ui/CelebrateOverlay';
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
import {
  getLastUsername,
  setLastUsername,
  getDefaultUsername,
} from '../../lib/storage';

// `created_at` is a UTC ISO 8601 string from the backend; lexicographic
// compare matches chronological order, so no Date parsing is needed.
function sortThemesByRecent(themes: Theme[]): Theme[] {
  return [...themes].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

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
  const [defaultUserName, setDefaultUserName] = useState<string | null>(null);
  const router = useRouter();
  const [customTaster, setCustomTaster] = useState(false);
  const [celebrate, setCelebrate] = useState<{
    visible: boolean;
    userName: string;
    themeName: string;
  }>({ visible: false, userName: '', themeName: '' });
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

  const loadWhiskeys = useCallback(
    async (themeId: number): Promise<Whiskey[]> => {
      setLoadingWhiskeys(true);
      try {
        const whiskeysData = await fetchWhiskeysByTheme(themeId);
        setWhiskeys(whiskeysData);
        initScores(whiskeysData);
        return whiskeysData;
      } catch {
        setWhiskeys([]);
        setToast({
          message: 'Could not load whiskeys for this theme.',
          type: 'error',
          visible: true,
        });
        return [];
      } finally {
        setLoadingWhiskeys(false);
      }
    },
    [initScores],
  );

  // Takes the whiskey list as a parameter rather than closing over `whiskeys`
  // state. Closing would make this callback's identity churn on every refetch,
  // which cascades into loadData and the focus effect re-running and
  // re-triggering loadWhiskeys — an infinite loop.
  const loadExistingScores = useCallback(
    async (name: string, themeId: number, whiskeysList: Whiskey[]) => {
      try {
        const data = await fetchUserTastingsForTheme(name, themeId);
        const loaded: Record<number, WhiskeyScores> = {};
        whiskeysList.forEach((w, i) => {
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
        initScores(whiskeysList);
      }
    },
    [initScores],
  );

  const loadData = useCallback(async () => {
    try {
      const [themesResp, usersData, defaultName, savedName] = await Promise.all([
        fetchThemes(),
        fetchUsers(),
        getDefaultUsername(),
        getLastUsername(),
      ]);
      const sortedThemes = sortThemesByRecent(themesResp.themes);
      setThemes(sortedThemes);
      setUsers(usersData.users);
      setDefaultUserName(defaultName ?? null);

      const firstTheme = sortedThemes[0];
      let freshWhiskeys: Whiskey[] = [];
      if (firstTheme) {
        setSelectedThemeId(firstTheme.id);
        freshWhiskeys = await loadWhiskeys(firstTheme.id);
      }

      // Resolve initial submitter: explicit default wins; otherwise last
      // picker selection. Skip the picker only if the resolved name still
      // exists in the fetched users list — otherwise fall back silently.
      const resolved = (defaultName || savedName || '').trim();
      if (resolved) {
        setUserName(resolved);
        const stillExists = usersData.users.some((u) => u.name === resolved);
        if (stillExists && firstTheme) {
          setUserSelected(true);
          await loadExistingScores(resolved, firstTheme.id, freshWhiskeys);
        }
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
  }, [loadWhiskeys, loadExistingScores]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track the current selection so the focus effect can react to a deleted
  // theme without re-subscribing on every selection change.
  const selectedThemeIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedThemeIdRef.current = selectedThemeId;
  }, [selectedThemeId]);

  const userSelectedRef = useRef(false);
  useEffect(() => {
    userSelectedRef.current = userSelected;
  }, [userSelected]);

  // Held in a ref so callbacks reading the current whiskeys (focus effect,
  // handleSelectUser) don't have to subscribe to whiskeys via dep arrays.
  const whiskeysRef = useRef<Whiskey[]>([]);
  useEffect(() => {
    whiskeysRef.current = whiskeys;
  }, [whiskeys]);

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
          const [themesResp, usersData, defaultName] = await Promise.all([
            fetchThemes(),
            fetchUsers(),
            getDefaultUsername(),
          ]);
          if (!active) return;
          const sortedThemes = sortThemesByRecent(themesResp.themes);
          setThemes(sortedThemes);
          setUsers(usersData.users);
          setDefaultUserName(defaultName ?? null);

          const cur = selectedThemeIdRef.current;
          if (cur != null && !sortedThemes.some((t) => t.id === cur)) {
            // The selected theme was deleted elsewhere — fall back to the
            // most recent remaining theme and return to the selection screen.
            const first = sortedThemes[0] ?? null;
            setSelectedThemeId(first ? first.id : null);
            setUserSelected(false);
            if (first) loadWhiskeys(first.id);
            return;
          }

          // If the picker is currently visible (no user selected), re-apply
          // a newly-configured default. Never yank a user already in scoring.
          if (!userSelectedRef.current && defaultName) {
            const stillExists = usersData.users.some((u) => u.name === defaultName);
            if (stillExists && cur != null) {
              setUserName(defaultName);
              setUserSelected(true);
              await loadExistingScores(defaultName, cur, whiskeysRef.current);
            }
          }
        } catch {
          // keep current state on a transient failure
        }
      })();
      return () => {
        active = false;
      };
    }, [loadWhiskeys, loadExistingScores]),
  );

  const handleThemeChange = useCallback(
    async (value: number | string) => {
      const themeId = Number(value);
      setSelectedThemeId(themeId);
      const freshWhiskeys = await loadWhiskeys(themeId);
      if (userSelectedRef.current && userName.trim()) {
        // Preserve the current submitter across theme switches; refresh
        // their existing scores for the new theme.
        await loadExistingScores(userName.trim(), themeId, freshWhiskeys);
      }
    },
    [loadWhiskeys, loadExistingScores, userName],
  );

  const handleSelectUser = useCallback(
    async (name: string) => {
      if (loadingWhiskeys) return;
      setUserName(name);
      setUserSelected(true);
      await setLastUsername(name);
      if (selectedThemeId != null) {
        await loadExistingScores(name, selectedThemeId, whiskeysRef.current);
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

  const clampRating = (n: number) => Math.min(5, Math.max(1, n));

  const handleSubmit = useCallback(async () => {
    if (!userName.trim() || selectedThemeId == null) return;

    // Clamp aroma/flavor/finish to 1–5 before POST (backend doesn't validate).
    // personal_rank is left as-is (RankPills already constrains it to 1..N).
    const clamped: SubmitTastingRequest['whiskey_scores'] = {};
    Object.entries(scores).forEach(([id, s]) => {
      clamped[Number(id)] = {
        aroma_score: clampRating(s.aroma_score),
        flavor_score: clampRating(s.flavor_score),
        finish_score: clampRating(s.finish_score),
        personal_rank: s.personal_rank,
      };
    });

    const submittedName = userName.trim();
    const submittedTheme =
      themes.find((t) => t.id === selectedThemeId)?.name ?? '';

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: submittedName,
        whiskey_scores: clamped,
      };
      await submitTasting(request);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrate({ visible: true, userName: submittedName, themeName: submittedTheme });
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
  }, [userName, selectedThemeId, scores, themes]);

  // Dismiss the overlay and return to a fresh person picker (proxy flow),
  // keeping the theme — mirrors the previous post-submit reset.
  const resetAfterSubmit = useCallback(() => {
    setCelebrate((c) => ({ ...c, visible: false }));
    setUserSelected(false);
    setUserName('');
    setCustomTaster(false);
    initScores(whiskeys);
  }, [whiskeys, initScores]);

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

  const scoreList = whiskeys
    .map((w) => (w.id != null ? scores[w.id] : undefined))
    .filter((s): s is WhiskeyScores => s != null);
  const totalFields = scoreList.length * 4;
  const filledFields = scoreList.reduce(
    (acc, s) =>
      acc +
      (s.aroma_score > 0 ? 1 : 0) +
      (s.flavor_score > 0 ? 1 : 0) +
      (s.finish_score > 0 ? 1 : 0) +
      (s.personal_rank > 0 ? 1 : 0),
    0,
  );
  const progress = totalFields > 0 ? filledFields / totalFields : 0;
  const canSubmit =
    userName.trim().length > 0 &&
    totalFields > 0 &&
    filledFields === totalFields;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.amber} />
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
            <CustomTasterToggle
              custom={customTaster}
              onToggle={() => {
                setCustomTaster((c) => !c);
                setUserName('');
              }}
            />
          </View>

          {customTaster ? (
            <>
              <AppText variant="bodyMuted" style={styles.sectionSubtitle}>
                Type a name to submit as someone new.
              </AppText>
              <Input
                value={userName}
                onChangeText={setUserName}
                placeholder="Type a name…"
                autoCapitalize="words"
              />
              <Button
                title="CONTINUE"
                onPress={handleContinueAsNew}
                disabled={!userName.trim() || loadingWhiskeys}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : (
            <>
              <AppText variant="bodyMuted" style={styles.sectionSubtitle}>
                Tap your name. You can submit for others too.
              </AppText>
              {users.map((u) => {
                const isDefault = defaultUserName != null && u.name === defaultUserName;
                return (
                  <Card
                    key={u.id}
                    onPress={loadingWhiskeys ? undefined : () => handleSelectUser(u.name)}
                    style={[
                      styles.userCard,
                      userName === u.name && styles.userCardActive,
                      isDefault && styles.userCardDefault,
                    ]}
                  >
                    <View style={styles.userCardRow}>
                      <AppText
                        variant="body"
                        style={[
                          styles.userName,
                          userName === u.name && styles.userNameActive,
                        ]}
                      >
                        {u.name}
                      </AppText>
                      {isDefault && (
                        <AppText variant="fieldLabel" style={styles.defaultBadge}>
                          DEFAULT
                        </AppText>
                      )}
                    </View>
                  </Card>
                );
              })}
            </>
          )}
        </ScrollView>

        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={() => setToast((t) => ({ ...t, visible: false }))}
        />

        <CelebrateOverlay
          visible={celebrate.visible}
          userName={celebrate.userName}
          themeName={celebrate.themeName}
          onSeeResults={() => {
            resetAfterSubmit();
            router.push('/dashboard');
          }}
          onHome={() => {
            resetAfterSubmit();
            router.push('/');
          }}
        />
      </SafeAreaView>
    );
  }

  // Tasting form.
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
            tintColor={colors.amber}
          />
        }
      >
        <View style={styles.themeHeader}>
          <Dropdown
            label="THEME"
            value={selectedThemeId}
            options={themeOptions}
            onChange={handleThemeChange}
          />
          <View style={styles.tastingAsRow}>
            <AppText variant="tableCell" style={styles.userLabel}>
              Tasting as: {userName}
            </AppText>
            <Button
              title="CHANGE USER"
              variant="outline"
              size="sm"
              onPress={() => setUserSelected(false)}
            />
          </View>
        </View>

        {loadingWhiskeys ? (
          <ActivityIndicator size="large" color={colors.amber} />
        ) : (
          <View>
            <View style={styles.scoresHeader}>
              <Eyebrow>Scores</Eyebrow>
              <AppText variant="bodyMuted" style={styles.scoresInstruction}>
                Rate each pour 1–5 for aroma, flavor and finish, then set your
                personal rank.
              </AppText>
            </View>
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
          </View>
        )}

        <View style={styles.submitBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <AppText variant="fieldLabel" style={styles.progressLabel}>
            {filledFields} / {totalFields} FIELDS
          </AppText>
          <Button
            title="SUBMIT"
            size="lg"
            block
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || loadingWhiskeys || !canSubmit}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <CelebrateOverlay
        visible={celebrate.visible}
        userName={celebrate.userName}
        themeName={celebrate.themeName}
        onSeeResults={() => {
          resetAfterSubmit();
          router.push('/dashboard');
        }}
        onHome={() => {
          resetAfterSubmit();
          router.push('/');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
    color: colors.muted,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    marginBottom: spacing.lg,
  },
  userCard: {
    marginBottom: spacing.sm,
  },
  userCardActive: {
    borderColor: colors.amber,
    borderWidth: 2,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardDefault: {
    borderColor: colors.amber,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  defaultBadge: {
    color: colors.amber,
    marginLeft: spacing.sm,
  },
  userName: {
    color: colors.cream,
  },
  userNameActive: {
    color: colors.amber,
  },
  themeHeader: {
    marginBottom: spacing.lg,
  },
  tastingAsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  userLabel: {
    color: colors.dim,
  },
  scoresHeader: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  scoresInstruction: {
    color: colors.muted,
  },
  scoreList: {
    gap: spacing.md,
  },
  submitBar: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.amber,
  },
  progressLabel: {
    color: colors.dim,
    textAlign: 'right',
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
