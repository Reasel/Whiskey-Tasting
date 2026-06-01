'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchUsers,
  fetchThemes,
  fetchActiveTheme,
  fetchWhiskeysByTheme,
  submitTasting,
  fetchUserTastingsForTheme,
  type Theme,
  type Whiskey,
  type SubmitTastingRequest,
  type User,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { PipRater } from '@/components/ui/pip-rater';
import { RankPills } from '@/components/ui/rank-pills';
import { CelebrateOverlay } from '@/components/ui/celebrate-overlay';

export default function TastingSubmission() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [isCustomUser, setIsCustomUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [scores, setScores] = useState<
    Record<
      number,
      {
        aroma_score: number | '';
        flavor_score: number | '';
        finish_score: number | '';
        personal_rank: number | '';
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);

  // ── data loading ──────────────────────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      const [usersData, themesData, activeThemeData] = await Promise.all([
        fetchUsers(),
        fetchThemes(),
        fetchActiveTheme(),
      ]);
      setUsers(usersData.users);
      setThemes(themesData.themes);
      setActiveTheme(activeThemeData);
      setSelectedThemeId(activeThemeData?.id || null);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetScores = useCallback(() => {
    const initial: typeof scores = {};
    whiskeys.forEach((w) => {
      initial[w.id!] = { aroma_score: '', flavor_score: '', finish_score: '', personal_rank: '' };
    });
    setScores(initial);
  }, [whiskeys]);

  const loadWhiskeys = useCallback(async (themeId: number) => {
    try {
      const data = await fetchWhiskeysByTheme(themeId);
      setWhiskeys(data);
    } catch (error) {
      console.error('Failed to load whiskeys:', error);
    }
  }, []);

  const loadExistingTastings = useCallback(async () => {
    if (!selectedUser || !selectedThemeId || isCustomUser) return;
    try {
      const data = await fetchUserTastingsForTheme(selectedUser, selectedThemeId);
      const initial: typeof scores = {};
      whiskeys.forEach((w) => {
        const ex = data.tastings[w.id!];
        initial[w.id!] = ex
          ? {
              aroma_score: ex.aroma_score,
              flavor_score: ex.flavor_score,
              finish_score: ex.finish_score,
              personal_rank: ex.personal_rank,
            }
          : { aroma_score: '', flavor_score: '', finish_score: '', personal_rank: '' };
      });
      setScores(initial);
    } catch {
      resetScores();
    }
  }, [whiskeys, selectedUser, selectedThemeId, isCustomUser, resetScores]);

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmitTasting = useCallback(
    async (e: React.FormEvent, silent = false) => {
      if (!silent) e.preventDefault();
      const userName = isCustomUser ? newUserName.trim() : selectedUser;
      if (!userName || !selectedThemeId) return;

      if (!silent) setSubmitting(true);
      try {
        const validScores: Record<
          number,
          { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }
        > = {};
        let hasIncomplete = false;
        Object.entries(scores).forEach(([id, s]) => {
          if (
            s.aroma_score !== '' &&
            s.flavor_score !== '' &&
            s.finish_score !== '' &&
            s.personal_rank !== ''
          ) {
            validScores[parseInt(id)] = {
              aroma_score: s.aroma_score as number,
              flavor_score: s.flavor_score as number,
              finish_score: s.finish_score as number,
              personal_rank: s.personal_rank as number,
            };
          } else {
            hasIncomplete = true;
          }
        });

        if (hasIncomplete || Object.keys(validScores).length === 0) {
          if (!silent) showToast('Please complete all whiskey ratings before submitting.', 'error');
          return;
        }

        const req: SubmitTastingRequest = { user_name: userName, whiskey_scores: validScores };
        await submitTasting(req);
        if (!silent) {
          setShowCelebrate(true);
        }
      } catch (error) {
        if (!silent) {
          console.error('Failed to submit tasting:', error);
          showToast('Failed to submit tasting. Please try again.', 'error');
        }
      } finally {
        if (!silent) setSubmitting(false);
      }
    },
    [selectedUser, isCustomUser, newUserName, selectedThemeId, scores, showToast]
  );

  const updateScore = useCallback((whiskeyId: number, field: string, value: number | '') => {
    setScores((prev) => ({ ...prev, [whiskeyId]: { ...prev[whiskeyId], [field]: value } }));
  }, []);

  // ── effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting({} as React.FormEvent, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, selectedThemeId, scores]);

  useEffect(() => {
    const handler = () => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting({} as React.FormEvent, true);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [selectedUser, selectedThemeId, scores]);

  useEffect(() => {
    if (selectedThemeId) loadWhiskeys(selectedThemeId);
  }, [selectedThemeId]);

  useEffect(() => {
    if (selectedUser && selectedThemeId && !isCustomUser) {
      loadExistingTastings();
    } else {
      resetScores();
    }
  }, [selectedUser, selectedThemeId, isCustomUser]);

  // Rebuild score keys when whiskeys load
  useEffect(() => {
    resetScores();
  }, [whiskeys]);

  // ── derived progress ──────────────────────────────────────────────────────
  const totalFields = whiskeys.length * 4;
  const filledFields = Object.values(scores).reduce((acc, s) => {
    if (s.aroma_score !== '') acc++;
    if (s.flavor_score !== '') acc++;
    if (s.finish_score !== '') acc++;
    if (s.personal_rank !== '') acc++;
    return acc;
  }, 0);
  const progress = totalFields > 0 ? filledFields / totalFields : 0;
  const allFilled = progress === 1;
  const userResolved = isCustomUser ? newUserName.trim().length > 0 : selectedUser.length > 0;

  const currentThemeName = themes.find((t) => t.id === selectedThemeId)?.name ?? '';
  const currentUserName = isCustomUser ? newUserName.trim() : selectedUser;

  // ── loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ad-screen flex items-center justify-center">
        <p
          className="font-mono text-[13px] uppercase tracking-[.22em]"
          style={{ color: 'var(--amber)' }}
        >
          {'// LOADING...'}
        </p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="ad-screen screen-enter">
        <div className="ad-panel">
          {/* Header */}
          <div className="ad-panel-head">
            <div>
              <h1
                className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0"
                style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}
              >
                TASTING SUBMISSION
              </h1>
              <p
                className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
                style={{ color: 'var(--amber)' }}
              >
                {'// SUBMIT OR EDIT TASTING SCORES'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="whitespace-nowrap"
            >
              ← HOME
            </Button>
          </div>

          {/* Body */}
          <div className="ad-panel-body">
            <form onSubmit={handleSubmitTasting}>
              {/* Taster + Theme selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px] mb-[38px]">
                {/* Taster */}
                <div className="flex flex-col gap-[9px]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-[11px] font-medium uppercase tracking-[.18em]"
                      style={{ color: 'var(--dim)' }}
                    >
                      TASTER
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomUser(!isCustomUser);
                        setNewUserName('');
                        setSelectedUser('');
                      }}
                      className="font-mono text-[10px] uppercase tracking-[.14em] px-[10px] py-1 transition-all duration-[180ms]"
                      style={{
                        border: `1px solid ${isCustomUser ? 'var(--amber)' : 'var(--line)'}`,
                        background: isCustomUser ? 'var(--amber)' : 'rgba(0,0,0,0.3)',
                        color: isCustomUser ? 'var(--bg)' : 'var(--amber)',
                      }}
                    >
                      {isCustomUser ? 'List' : 'Custom'}
                    </button>
                  </div>
                  {isCustomUser ? (
                    <input
                      type="text"
                      placeholder="Type a name…"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="ad-select"
                    />
                  ) : (
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="ad-select"
                    >
                      <option value="">Choose a taster…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Theme */}
                <div className="flex flex-col gap-[9px]">
                  <span
                    className="font-mono text-[11px] font-medium uppercase tracking-[.18em]"
                    style={{ color: 'var(--dim)' }}
                  >
                    THEME
                  </span>
                  <select
                    value={selectedThemeId?.toString() ?? ''}
                    onChange={(e) => setSelectedThemeId(parseInt(e.target.value))}
                    className="ad-select"
                  >
                    <option value="">Choose a theme…</option>
                    {themes.map((t) => (
                      <option key={t.id} value={t.id!.toString()}>
                        {t.name}
                        {t.id === activeTheme?.id ? ' (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Score section */}
              {selectedThemeId && whiskeys.length > 0 && (
                <>
                  <div
                    className="flex items-center gap-3 flex-wrap border-t pt-[30px] mb-[10px]"
                    style={{ borderColor: 'var(--line)' }}
                  >
                    <span
                      className="w-3 h-3 inline-block"
                      style={{ background: 'var(--amber)', boxShadow: '0 0 14px var(--glow)' }}
                    />
                    <h2
                      className="font-fraunces font-semibold text-[24px] m-0"
                      style={{ color: 'var(--cream)' }}
                    >
                      // Scores
                    </h2>
                  </div>
                  <p className="font-sans text-sm mb-7" style={{ color: 'var(--muted)' }}>
                    Rate 1–5 for Aroma, Flavor, and Finish. Rank 1 = your favourite of the night.
                  </p>

                  <div className="flex flex-col gap-[18px] mb-[34px]">
                    {whiskeys.map((whiskey, idx) => (
                      <div key={whiskey.id} className="ad-pour-card">
                        {/* Card header */}
                        <div
                          className="flex items-baseline gap-[14px] px-[26px] py-[20px]"
                          style={{ borderBottom: '1px solid var(--line)' }}
                        >
                          <span
                            className="font-mono font-medium text-[14px]"
                            style={{ color: 'var(--amber)' }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span
                            className="font-fraunces font-semibold text-[23px]"
                            style={{ color: 'var(--cream)' }}
                          >
                            {whiskey.name}
                          </span>
                          {whiskey.proof && (
                            <span
                              className="ml-auto font-mono text-[11px] uppercase tracking-[.12em]"
                              style={{ color: 'var(--muted)' }}
                            >
                              {whiskey.proof} PROOF
                            </span>
                          )}
                        </div>

                        {/* Score grid: 4 cols → 2 cols → 1 col */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-[26px] py-[24px] pb-[28px]">
                          <div className="flex flex-col gap-[13px]">
                            <span
                              className="font-mono text-[11px] uppercase tracking-[.18em]"
                              style={{ color: 'var(--dim)' }}
                            >
                              AROMA
                            </span>
                            <PipRater
                              value={
                                typeof scores[whiskey.id!]?.aroma_score === 'number'
                                  ? (scores[whiskey.id!].aroma_score as number)
                                  : 0
                              }
                              onChange={(v) =>
                                updateScore(whiskey.id!, 'aroma_score', v === 0 ? '' : v)
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span
                              className="font-mono text-[11px] uppercase tracking-[.18em]"
                              style={{ color: 'var(--dim)' }}
                            >
                              FLAVOR
                            </span>
                            <PipRater
                              value={
                                typeof scores[whiskey.id!]?.flavor_score === 'number'
                                  ? (scores[whiskey.id!].flavor_score as number)
                                  : 0
                              }
                              onChange={(v) =>
                                updateScore(whiskey.id!, 'flavor_score', v === 0 ? '' : v)
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span
                              className="font-mono text-[11px] uppercase tracking-[.18em]"
                              style={{ color: 'var(--dim)' }}
                            >
                              FINISH
                            </span>
                            <PipRater
                              value={
                                typeof scores[whiskey.id!]?.finish_score === 'number'
                                  ? (scores[whiskey.id!].finish_score as number)
                                  : 0
                              }
                              onChange={(v) =>
                                updateScore(whiskey.id!, 'finish_score', v === 0 ? '' : v)
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span
                              className="font-mono text-[11px] uppercase tracking-[.18em]"
                              style={{ color: 'var(--dim)' }}
                            >
                              RANK
                            </span>
                            <RankPills
                              count={whiskeys.length}
                              value={
                                typeof scores[whiskey.id!]?.personal_rank === 'number'
                                  ? (scores[whiskey.id!].personal_rank as number)
                                  : 0
                              }
                              onChange={(v) => updateScore(whiskey.id!, 'personal_rank', v)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Submit bar */}
              <div
                className="flex items-center gap-6 flex-wrap border-t pt-7"
                style={{ borderColor: 'var(--line)' }}
              >
                <div className="ad-progress flex-1">
                  <div className="ad-progress-fill" style={{ width: `${progress * 100}%` }} />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  disabled={submitting || !userResolved || !selectedThemeId || !allFilled}
                  className="text-[15px] px-8 py-[17px] h-auto"
                >
                  {submitting ? 'SUBMITTING…' : 'SUBMIT TASTING'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <CelebrateOverlay
        open={showCelebrate}
        userName={currentUserName}
        themeName={currentThemeName}
        onSeeResults={() => {
          setShowCelebrate(false);
          router.push('/data-view');
        }}
        onHome={() => {
          setShowCelebrate(false);
          router.push('/');
        }}
      />
    </>
  );
}
