# After Dark — Page Rewrites Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** `2026-06-01-afterdark-foundation.md` must be complete. All CSS tokens, keyframes, `.ad-*` shared classes, PipRater, RankPills, CelebrateOverlay, and the logo SVG must already exist.

**Goal:** Rewrite every page to use the After Dark panel layout, dark form controls, amber typography, and the new interactive components. Add "The Results" reveal tab to Data View. No API or routing changes.

**Architecture:** Each page follows the same structural pattern: a `.ad-screen` wrapper → a single `.ad-panel` child → `.ad-panel-head` header (title + eyebrow + optional back button) → `.ad-panel-body` content. Logic (state, API calls, callbacks) is carried forward unchanged from the current files; only the JSX return is replaced.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4. All new CSS utility classes come from `globals.css` (see foundation plan). Tailwind arbitrary values `bg-[var(--token)]` used where no utility class exists.

---

## File Map

**Modified files (all are complete rewrites of the JSX only; logic is preserved):**
- `apps/frontend/app/(default)/page.tsx`
- `apps/frontend/app/tasting-submission/page.tsx`
- `apps/frontend/app/data-view/page.tsx`
- `apps/frontend/app/administration/page.tsx`
- `apps/frontend/app/new-theme/page.tsx`
- `apps/frontend/app/add-user/page.tsx`
- `apps/frontend/app/delete-user/page.tsx`
- `apps/frontend/app/edit-themes/page.tsx`

---

## Task 7: Home Page

**Files:**
- Modify: `apps/frontend/app/(default)/page.tsx`

The home page gains data fetching (active theme + whiskey count + taster count) to populate the "tonight" status strip. The three navigation tiles replace the three `<Button>` elements.

- [ ] **Step 1: Replace home page**

Replace all content of `apps/frontend/app/(default)/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchActiveTheme,
  fetchWhiskeysByTheme,
  fetchAllThemesScores,
  type Theme,
} from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [whiskeyCount, setWhiskeyCount] = useState(0);
  const [tasterCount, setTasterCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [themeData, scoresData] = await Promise.all([
          fetchActiveTheme(),
          fetchAllThemesScores(),
        ]);
        setActiveTheme(themeData);
        if (themeData?.id) {
          const whiskeys = await fetchWhiskeysByTheme(themeData.id);
          setWhiskeyCount(whiskeys.length);
          const themeScore = scoresData.find((t) => t.theme.id === themeData.id);
          if (themeScore) {
            const tasters = new Set<string>();
            themeScore.whiskeys.forEach((w) =>
              w.scores.forEach((s) => tasters.add(s.user_name))
            );
            setTasterCount(tasters.size);
          }
        }
      } catch {
        // show whatever we have
      }
    }
    load();
  }, []);

  const tiles = [
    { sub: '// RATE THE POURS', label: 'Tasting Submission', href: '/tasting-submission' },
    { sub: '// SEE THE RESULTS', label: 'Data View',          href: '/data-view' },
    { sub: '// RUN THE NIGHT',   label: 'Administration',     href: '/administration' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center screen-enter"
      style={{
        background: `
          radial-gradient(120% 80% at 50% -10%, rgba(244,169,55,.16), transparent 60%),
          radial-gradient(80% 60% at 80% 110%, rgba(201,116,42,.12), transparent 60%),
          var(--bg)
        `,
      }}
    >
      <div className="w-full max-w-[920px] px-6 py-14 stagger-enter">
        {/* Hero */}
        <div className="text-center mb-11">
          <div className="flex justify-center mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt=""
              width={70}
              height={70}
              style={{ filter: 'drop-shadow(0 0 22px var(--glow))' }}
            />
          </div>
          <h1
            className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0 text-balance"
            style={{
              fontSize: 'clamp(52px, 9vw, 110px)',
              color: 'var(--cream)',
              textShadow: '0 0 60px rgba(244,169,55,.2)',
            }}
          >
            WHISKEY TASTING
          </h1>
          <p
            className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
            style={{ color: 'var(--amber)' }}
          >
            {'// HAVE A DRINK!'}
          </p>
        </div>

        {/* Tonight strip */}
        {activeTheme && (
          <div
            className="flex items-center gap-5 flex-wrap mb-7 px-[26px] py-[18px] font-mono text-[13px] uppercase tracking-[.14em]"
            style={{ background: 'rgba(0,0,0,.3)', border: '1px solid var(--line)' }}
          >
            <div
              className="flex items-center gap-[9px] font-medium whitespace-nowrap"
              style={{ color: 'var(--amber)' }}
            >
              <span className="ad-dot-live" />
              TONIGHT
            </div>
            <div
              className="font-fraunces font-semibold text-[22px] normal-case tracking-normal whitespace-nowrap"
              style={{ color: 'var(--cream)' }}
            >
              {activeTheme.name}
            </div>
            <div className="ml-auto flex items-center gap-4" style={{ color: 'var(--dim)' }}>
              <span>
                <b style={{ color: 'var(--amber)' }}>{whiskeyCount}</b> POURS
              </span>
              <span
                className="inline-block w-px h-4"
                style={{ background: 'var(--line)' }}
              />
              <span>
                <b style={{ color: 'var(--amber)' }}>{tasterCount}</b> TASTERS IN
              </span>
            </div>
          </div>
        )}

        {/* Tile grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.href}
              onClick={() => router.push(tile.href)}
              className="ad-tile"
            >
              <span className="ad-tile-sub">{tile.sub}</span>
              <span className="ad-tile-label">{tile.label}</span>
              <span className="ad-tile-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/\(default\)/page.tsx
git commit -m "feat: rewrite home page to After Dark design"
```

---

## Task 8: Tasting Submission Page

**Files:**
- Modify: `apps/frontend/app/tasting-submission/page.tsx`

Key changes vs current:
- All state management and API calls are preserved exactly.
- Add `isCustomUser: boolean` state alongside existing `selectedUser`/`newUserName`.
- Replace number inputs with `<PipRater>` and `<RankPills>`.
- Add submit progress bar.
- Add `showCelebrate: boolean` state; show `<CelebrateOverlay>` after successful submission.
- Remove the `+ Add New User` dropdown option; add a `Custom` toggle button beside the taster label.

- [ ] **Step 1: Replace tasting-submission/page.tsx**

Replace all content of `apps/frontend/app/tasting-submission/page.tsx`:

```tsx
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
    Record<number, { aroma_score: number | ''; flavor_score: number | ''; finish_score: number | ''; personal_rank: number | '' }>
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
          ? { aroma_score: ex.aroma_score, flavor_score: ex.flavor_score, finish_score: ex.finish_score, personal_rank: ex.personal_rank }
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
        const validScores: Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }> = {};
        let hasIncomplete = false;
        Object.entries(scores).forEach(([id, s]) => {
          if (s.aroma_score !== '' && s.flavor_score !== '' && s.finish_score !== '' && s.personal_rank !== '') {
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
  useEffect(() => { loadInitialData(); }, []);

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

  useEffect(() => { if (selectedThemeId) loadWhiskeys(selectedThemeId); }, [selectedThemeId]);

  useEffect(() => {
    if (selectedUser && selectedThemeId && !isCustomUser) {
      loadExistingTastings();
    } else {
      resetScores();
    }
  }, [selectedUser, selectedThemeId, isCustomUser]);

  // Rebuild score keys when whiskeys load
  useEffect(() => { resetScores(); }, [whiskeys]);

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
        <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--amber)' }}>
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
              <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
                {'// SUBMIT OR EDIT TASTING SCORES'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')} className="whitespace-nowrap">
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
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
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
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Theme */}
                <div className="flex flex-col gap-[9px]">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
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
                        {t.name}{t.id === activeTheme?.id ? ' (Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Score section */}
              {selectedThemeId && whiskeys.length > 0 && (
                <>
                  <div className="flex items-center gap-3 flex-wrap border-t pt-[30px] mb-[10px]" style={{ borderColor: 'var(--line)' }}>
                    <span className="w-3 h-3 inline-block" style={{ background: 'var(--amber)', boxShadow: '0 0 14px var(--glow)' }} />
                    <h2 className="font-fraunces font-semibold text-[24px] m-0" style={{ color: 'var(--cream)' }}>
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
                          <span className="font-mono font-medium text-[14px]" style={{ color: 'var(--amber)' }}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-fraunces font-semibold text-[23px]" style={{ color: 'var(--cream)' }}>
                            {whiskey.name}
                          </span>
                          {whiskey.proof && (
                            <span className="ml-auto font-mono text-[11px] uppercase tracking-[.12em]" style={{ color: 'var(--muted)' }}>
                              {whiskey.proof} PROOF
                            </span>
                          )}
                        </div>

                        {/* Score grid: 4 cols → 2 cols → 1 col */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-[26px] py-[24px] pb-[28px]">
                          <div className="flex flex-col gap-[13px]">
                            <span className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>AROMA</span>
                            <PipRater
                              value={typeof scores[whiskey.id!]?.aroma_score === 'number' ? scores[whiskey.id!].aroma_score as number : 0}
                              onChange={(v) => updateScore(whiskey.id!, 'aroma_score', v === 0 ? '' : v)}
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>FLAVOR</span>
                            <PipRater
                              value={typeof scores[whiskey.id!]?.flavor_score === 'number' ? scores[whiskey.id!].flavor_score as number : 0}
                              onChange={(v) => updateScore(whiskey.id!, 'flavor_score', v === 0 ? '' : v)}
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>FINISH</span>
                            <PipRater
                              value={typeof scores[whiskey.id!]?.finish_score === 'number' ? scores[whiskey.id!].finish_score as number : 0}
                              onChange={(v) => updateScore(whiskey.id!, 'finish_score', v === 0 ? '' : v)}
                            />
                          </div>
                          <div className="flex flex-col gap-[13px]">
                            <span className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>RANK</span>
                            <RankPills
                              count={whiskeys.length}
                              value={typeof scores[whiskey.id!]?.personal_rank === 'number' ? scores[whiskey.id!].personal_rank as number : 0}
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
              <div className="flex items-center gap-6 flex-wrap border-t pt-7" style={{ borderColor: 'var(--line)' }}>
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
        onSeeResults={() => { setShowCelebrate(false); router.push('/data-view'); }}
        onHome={() => { setShowCelebrate(false); router.push('/'); }}
      />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/tasting-submission/page.tsx
git commit -m "feat: rewrite tasting submission to After Dark — pip rater, rank pills, progress bar, celebrate overlay"
```

---

## Task 9: Data View Page

**Files:**
- Modify: `apps/frontend/app/data-view/page.tsx`

Key changes:
- Add a **"The Results"** tab as the first/default tab.
- Add `computeConsensus()` helper for the consensus stat.
- Reskin All Whiskeys, By Theme (accordion rows), and By Person tabs to use `.ad-table` and dark cards.
- Results tab has animated podium, ranked bars, and consensus section with CSS-transition reveals.

- [ ] **Step 1: Replace data-view/page.tsx**

Replace all content of `apps/frontend/app/data-view/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllThemesScores, fetchActiveTheme, type ThemeScoresResponse, type Theme } from '@/lib/api';
import { Button } from '@/components/ui/button';

type ViewType = 'results' | 'all' | 'theme' | 'person';

type Score = {
  user_name: string;
  aroma_score: number;
  flavor_score: number;
  finish_score: number;
  average_score: number;
  personal_rank: number;
};

type WhiskeyWithScores = {
  whiskey_id: number;
  whiskey_name: string;
  proof: number | null;
  scores: Score[];
  average_score: number;
  rank_by_average: number;
};

// Mean absolute deviation of a taster's scores from group averages, across all whiskey × {aroma,flavor,finish}
function computeConsensus(
  whiskeys: WhiskeyWithScores[]
): Array<{ person: string; deviation: number }> {
  const gAvg: Record<string, { aroma: number; flavor: number; finish: number }> = {};
  whiskeys.forEach((w) => {
    if (!w.scores.length) return;
    gAvg[w.whiskey_name] = {
      aroma: w.scores.reduce((s, r) => s + r.aroma_score, 0) / w.scores.length,
      flavor: w.scores.reduce((s, r) => s + r.flavor_score, 0) / w.scores.length,
      finish: w.scores.reduce((s, r) => s + r.finish_score, 0) / w.scores.length,
    };
  });

  const tasterMap: Record<string, { total: number; n: number }> = {};
  whiskeys.forEach((w) => {
    const ga = gAvg[w.whiskey_name];
    if (!ga) return;
    w.scores.forEach((s) => {
      if (!tasterMap[s.user_name]) tasterMap[s.user_name] = { total: 0, n: 0 };
      tasterMap[s.user_name].total +=
        Math.abs(s.aroma_score - ga.aroma) +
        Math.abs(s.flavor_score - ga.flavor) +
        Math.abs(s.finish_score - ga.finish);
      tasterMap[s.user_name].n += 3;
    });
  });

  return Object.entries(tasterMap)
    .map(([person, { total, n }]) => ({ person, deviation: n ? total / n : 0 }))
    .sort((a, b) => a.deviation - b.deviation);
}

export default function DataView() {
  const router = useRouter();
  const [themesScores, setThemesScores] = useState<ThemeScoresResponse[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('results');

  useEffect(() => {
    async function load() {
      try {
        const [scores, theme] = await Promise.all([fetchAllThemesScores(), fetchActiveTheme()]);
        setThemesScores(scores);
        setActiveTheme(theme);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(() => {
      fetchAllThemesScores().then(setThemesScores).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'results', label: 'The Results' },
    { id: 'all',     label: 'All Whiskeys' },
    { id: 'theme',   label: 'By Theme' },
    { id: 'person',  label: 'By Person' },
  ];

  if (loading) {
    return (
      <div className="ad-screen flex items-center justify-center">
        <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--amber)' }}>
          {'// LOADING...'}
        </p>
      </div>
    );
  }

  return (
    <div className="ad-screen screen-enter">
      <div className="ad-panel">
        {/* Header */}
        <div className="ad-panel-head">
          <div>
            <h1
              className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0"
              style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}
            >
              DATA VIEW
            </h1>
            <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
              {'// VIEW ALL SUBMISSIONS'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')} className="whitespace-nowrap">
            ← HOME
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-[10px] flex-wrap px-11 pt-7" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewType(tab.id)}
              className={`ad-tab${viewType === tab.id ? ' active' : ''}`}
              style={{ marginBottom: '-1px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="ad-panel-body">
          {viewType === 'results' && (
            <ResultsView themesScores={themesScores} activeTheme={activeTheme} />
          )}
          {viewType === 'all'     && <AllWhiskeysView themesScores={themesScores} />}
          {viewType === 'theme'   && <ThemeView themesScores={themesScores} />}
          {viewType === 'person'  && <PersonView themesScores={themesScores} />}
        </div>
      </div>
    </div>
  );
}

// ── Results tab ───────────────────────────────────────────────────────────────
function ResultsView({
  themesScores,
  activeTheme,
}: {
  themesScores: ThemeScoresResponse[];
  activeTheme: Theme | null;
}) {
  const [revealed, setRevealed] = useState(false);
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Find the active theme's data
  const themeData = activeTheme
    ? themesScores.find((t) => t.theme.id === activeTheme.id)
    : themesScores[0];

  const whiskeys: WhiskeyWithScores[] = themeData
    ? [...themeData.whiskeys].sort((a, b) => a.rank_by_average - b.rank_by_average)
    : [];

  const hasData = whiskeys.some((w) => w.scores.length > 0);
  const maxScore = whiskeys.length ? Math.max(...whiskeys.map((w) => w.average_score)) : 5;
  const consensus = hasData ? computeConsensus(whiskeys) : [];
  const maxDev = consensus.length ? Math.max(...consensus.map((c) => c.deviation), 0.01) : 1;

  // Trigger reveal animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Count-up hook
  function useCountUp(target: number, delay: number): number {
    const [display, setDisplay] = useState(prefersReduced ? target : 0);
    useEffect(() => {
      if (prefersReduced) { setDisplay(target); return; }
      if (!revealed) return;
      const t = setTimeout(() => {
        const dur = 850;
        const t0 = performance.now();
        function tick(now: number) {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          setDisplay(target * eased);
          if (k < 1) requestAnimationFrame(tick);
          else setDisplay(target);
        }
        requestAnimationFrame(tick);
      }, delay);
      return () => clearTimeout(t);
    }, [target, delay, revealed]);
    return display;
  }

  if (!hasData) {
    return (
      <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--muted)' }}>
        {'// NO RESULTS YET — SUBMIT SOME TASTINGS FIRST'}
      </p>
    );
  }

  const top3 = whiskeys.slice(0, 3);
  // Podium visual order: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumPositions = [2, 1, 3]; // visual position labels
  const glassFills = { 1: '82%', 2: '64%', 3: '50%' } as Record<number, string>;
  const glassHeights = { 1: 210, 2: 156, 3: 120 } as Record<number, number>;

  return (
    <div>
      {/* Podium */}
      <div className="grid grid-cols-3 gap-[18px] items-end max-w-[640px] mx-auto mb-12">
        {podiumOrder.map((w, i) => {
          const pos = podiumPositions[i];
          const score = useCountUp(w?.average_score ?? 0, 250 + i * 120);
          return (
            <div
              key={w?.whiskey_id ?? i}
              className={`ad-podium-col${revealed ? ' rise' : ''}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span
                className="font-mono font-medium text-[12px] uppercase tracking-[.16em] px-3 py-[5px]"
                style={{
                  border: `1px solid ${pos === 1 ? 'var(--amber)' : 'var(--line)'}`,
                  color: pos === 1 ? 'var(--amber)' : 'var(--dim)',
                  boxShadow: pos === 1 ? '0 0 18px var(--glow-soft)' : 'none',
                }}
              >
                {pos === 1 ? '1ST' : pos === 2 ? '2ND' : '3RD'}
              </span>
              {/* Glass */}
              <div
                className="w-full relative overflow-hidden"
                style={{
                  maxWidth: 124,
                  height: glassHeights[pos] ?? 120,
                  border: `1px solid ${pos === 1 ? 'rgba(244,169,55,.4)' : 'var(--line)'}`,
                  background: 'rgba(0,0,0,.3)',
                  clipPath: 'polygon(14% 0, 86% 0, 78% 100%, 22% 100%)',
                }}
              >
                <div
                  className="ad-glass-pour"
                  style={{ height: revealed ? glassFills[pos] : '0%' }}
                />
              </div>
              <span className="font-fraunces font-semibold text-[18px] text-center" style={{ color: 'var(--cream)' }}>
                {w?.whiskey_name}
              </span>
              <span
                className="font-mono font-bold text-[22px]"
                style={{
                  color: pos === 1 ? 'var(--amber)' : 'var(--dim)',
                  textShadow: pos === 1 ? '0 0 18px var(--glow)' : 'none',
                }}
              >
                {score.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Ranked bars */}
      <div className="flex flex-col" style={{ borderTop: '1px solid var(--line)' }}>
        {whiskeys.map((w, i) => {
          const score = useCountUp(w.average_score, 200 + i * 90);
          return (
            <div
              key={w.whiskey_id}
              className="grid items-center gap-[18px] py-[18px]"
              style={{
                gridTemplateColumns: '40px minmax(120px,1fr) 3fr auto',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <span className="font-mono text-[13px]" style={{ color: 'var(--muted)' }}>
                {String(w.rank_by_average).padStart(2, '0')}
              </span>
              <div className="flex flex-col" style={{ color: 'var(--cream)' }}>
                <span className="font-fraunces font-semibold text-[19px]">{w.whiskey_name}</span>
                {w.proof && (
                  <span className="font-mono text-[10px] uppercase tracking-[.12em]" style={{ color: 'var(--muted)' }}>
                    {w.proof} PROOF
                  </span>
                )}
              </div>
              <div
                className="h-5"
                style={{ background: 'rgba(0,0,0,.35)', border: '1px solid var(--line)' }}
              >
                <div
                  className="ad-bar-fill"
                  style={{
                    width: revealed ? `${(w.average_score / maxScore) * 100}%` : '0%',
                    transitionDelay: `${200 + i * 90}ms`,
                    boxShadow: i === 0 ? '0 0 20px var(--glow)' : 'none',
                  }}
                />
              </div>
              <span className="font-mono font-bold text-[18px] min-w-[44px] text-right" style={{ color: 'var(--cream)' }}>
                {score.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Consensus */}
      {consensus.length > 1 && (
        <div className="mt-[46px] pt-[34px]" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--amber)' }}>
              {'// CLOSEST TO THE GROUP'}
            </span>
          </div>
          <h3 className="font-fraunces font-semibold text-[24px] mb-1 mt-0" style={{ color: 'var(--cream)' }}>
            Consensus Palate
          </h3>
          <p className="font-sans text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {consensus[0].person} had the most agreeable palate.
          </p>
          <div className="flex flex-col">
            {consensus.map((c, i) => (
              <div
                key={c.person}
                className="grid items-center gap-4 py-[13px]"
                style={{
                  gridTemplateColumns: '34px minmax(80px,1fr) 3fr auto',
                  borderBottom: '1px solid rgba(58,49,32,.5)',
                  background: i === 0 ? 'rgba(244,169,55,.04)' : 'transparent',
                }}
              >
                <span
                  className="font-mono text-[13px] text-center"
                  style={{ color: i === 0 ? 'var(--amber)' : 'var(--muted)', fontSize: i === 0 ? 17 : 13 }}
                >
                  {i === 0 ? '★' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-fraunces font-semibold text-[18px]" style={{ color: 'var(--cream)' }}>
                  {c.person}
                </span>
                <div className="h-[14px]" style={{ background: 'rgba(0,0,0,.35)', border: '1px solid var(--line)' }}>
                  <div
                    className="ad-cons-fill"
                    style={{
                      width: revealed ? `${(1 - c.deviation / maxDev) * 100}%` : '0%',
                      transitionDelay: `${500 + i * 90}ms`,
                      boxShadow: i === 0 ? '0 0 18px var(--glow)' : 'none',
                    }}
                  />
                </div>
                <div className="font-mono text-[13px] text-right min-w-[96px]" style={{ color: 'var(--cream)' }}>
                  <span>±{c.deviation.toFixed(2)}</span>
                  <br />
                  <span className="text-[10px] tracking-[.06em]" style={{ color: 'var(--muted)' }}>avg off</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── All Whiskeys tab ──────────────────────────────────────────────────────────
function AllWhiskeysView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  const [sortBy, setSortBy] = useState('whiskey');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function calcAvgs(scores: Score[]) {
    if (!scores.length) return { avgAroma: 0, avgFlavor: 0, avgFinish: 0 };
    return {
      avgAroma:  scores.reduce((s, r) => s + r.aroma_score,  0) / scores.length,
      avgFlavor: scores.reduce((s, r) => s + r.flavor_score, 0) / scores.length,
      avgFinish: scores.reduce((s, r) => s + r.finish_score, 0) / scores.length,
    };
  }

  const allWhiskeys = themesScores
    .filter((t) => t.whiskeys.some((w) => w.scores.length > 0))
    .flatMap((t) =>
      t.whiskeys
        .filter((w) => !/^Whiskey \d+$/.test(w.whiskey_name))
        .map((w) => ({ whiskey: w, theme: t.theme.name, averages: calcAvgs(w.scores) }))
    );

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }

  const sorted = [...allWhiskeys].sort((a, b) => {
    const aV = sortBy === 'whiskey' ? a.whiskey.whiskey_name.toLowerCase()
             : sortBy === 'theme'   ? a.theme.toLowerCase()
             : sortBy === 'proof'   ? (a.whiskey.proof ?? 0)
             : sortBy === 'aroma'   ? a.averages.avgAroma
             : sortBy === 'flavor'  ? a.averages.avgFlavor
             : sortBy === 'finish'  ? a.averages.avgFinish
             : sortBy === 'avgScore'? a.whiskey.average_score
             : a.whiskey.scores.length;
    const bV = sortBy === 'whiskey' ? b.whiskey.whiskey_name.toLowerCase()
             : sortBy === 'theme'   ? b.theme.toLowerCase()
             : sortBy === 'proof'   ? (b.whiskey.proof ?? 0)
             : sortBy === 'aroma'   ? b.averages.avgAroma
             : sortBy === 'flavor'  ? b.averages.avgFlavor
             : sortBy === 'finish'  ? b.averages.avgFinish
             : sortBy === 'avgScore'? b.whiskey.average_score
             : b.whiskey.scores.length;
    if (aV < bV) return sortDir === 'asc' ? -1 : 1;
    if (aV > bV) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  if (!allWhiskeys.length) return <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--muted)' }}>{'// NO DATA FOUND'}</p>;

  const arrow = (col: string) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ad-table">
        <thead>
          <tr>
            {[['whiskey','Whiskey'],['theme','Theme'],['proof','Proof'],['aroma','Aroma'],['flavor','Flavor'],['finish','Finish'],['avgScore','Avg Score'],['tasters','Tasters']].map(([k,l]) => (
              <th key={k} onClick={() => handleSort(k)} style={{ cursor: 'pointer', textAlign: k === 'proof' || k === 'aroma' || k === 'flavor' || k === 'finish' || k === 'avgScore' || k === 'tasters' ? 'right' : 'left' }}>
                {l}{arrow(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr key={i}>
              <td><strong>{item.whiskey.whiskey_name}</strong></td>
              <td>{item.theme}</td>
              <td className="num">{item.whiskey.proof ?? '—'}</td>
              <td className="num">{item.averages.avgAroma.toFixed(1)}</td>
              <td className="num">{item.averages.avgFlavor.toFixed(1)}</td>
              <td className="num">{item.averages.avgFinish.toFixed(1)}</td>
              <td className="num">{item.whiskey.average_score.toFixed(1)}</td>
              <td className="num">{item.whiskey.scores.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── By Theme tab (accordion) ──────────────────────────────────────────────────
function ThemeView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  const [openWhiskeys, setOpenWhiskeys] = useState<Record<number, boolean>>({});

  function toggleWhiskey(id: number) {
    setOpenWhiskeys((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!themesScores.length) return <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--muted)' }}>{'// NO DATA FOUND'}</p>;

  return (
    <div className="flex flex-col gap-[22px]">
      {themesScores.map((themeScore) => (
        <div key={themeScore.theme.id} className="border p-8" style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}>
          <h2 className="font-fraunces font-semibold text-[24px] mb-1 mt-0" style={{ color: 'var(--cream)' }}>
            {themeScore.theme.name}
          </h2>
          {themeScore.theme.notes && (
            <p className="font-sans text-sm mb-5 whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>
              {themeScore.theme.notes}
            </p>
          )}

          {/* Accordion whiskey list */}
          <div className="flex flex-col" style={{ borderTop: '1px solid var(--line)', marginTop: 4 }}>
            {themeScore.whiskeys.map((w) => {
              const isOpen = !!openWhiskeys[w.whiskey_id];
              const avgScore = w.average_score;
              return (
                <div key={w.whiskey_id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => toggleWhiskey(w.whiskey_id)}
                    className="flex items-center gap-[14px] w-full text-left py-[17px] px-1 transition-colors duration-200"
                    style={{ color: isOpen ? 'var(--amber)' : 'var(--cream)' }}
                  >
                    <span
                      className="font-mono text-[15px] w-[14px] flex-shrink-0 transition-transform duration-[250ms]"
                      style={{ color: 'var(--amber)', transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    >
                      ›
                    </span>
                    <span className="font-fraunces font-semibold text-[19px]">{w.whiskey_name}</span>
                    {w.proof && (
                      <span className="font-mono text-[10px] uppercase tracking-[.12em]" style={{ color: 'var(--muted)' }}>
                        {w.proof} PROOF
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="font-mono text-[12px] tracking-[.08em] whitespace-nowrap" style={{ color: 'var(--dim)' }}>
                      <b style={{ color: 'var(--amber)', fontSize: 15 }}>{avgScore.toFixed(1)}</b> AVG
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[.1em] ml-4 whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {w.scores.length} TASTERS
                    </span>
                  </button>

                  <div className={`ad-acc-body${isOpen ? ' open' : ''}`}>
                    <div className="ad-acc-body-inner">
                      <div className="pb-[22px] pt-1">
                        <table className="ad-table">
                          <thead>
                            <tr>
                              <th>Taster</th>
                              <th style={{ textAlign: 'right' }}>Aroma</th>
                              <th style={{ textAlign: 'right' }}>Flavor</th>
                              <th style={{ textAlign: 'right' }}>Finish</th>
                              <th style={{ textAlign: 'right' }}>Avg</th>
                              <th style={{ textAlign: 'right' }}>Rank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {w.scores.map((s) => (
                              <tr key={s.user_name}>
                                <td>{s.user_name}</td>
                                <td className="num">{s.aroma_score.toFixed(1)}</td>
                                <td className="num">{s.flavor_score.toFixed(1)}</td>
                                <td className="num">{s.finish_score.toFixed(1)}</td>
                                <td className="num">{s.average_score.toFixed(1)}</td>
                                <td className="num">{s.personal_rank}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── By Person tab ─────────────────────────────────────────────────────────────
function PersonView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  const userScores: Record<string, { theme: string; whiskeys: Record<string, { scores: Score[]; average: number; proof: number | null }> }> = {};

  themesScores.forEach((t) =>
    t.whiskeys.forEach((w) =>
      w.scores.forEach((s) => {
        if (!userScores[s.user_name]) userScores[s.user_name] = { theme: t.theme.name, whiskeys: {} };
        if (!userScores[s.user_name].whiskeys[w.whiskey_name])
          userScores[s.user_name].whiskeys[w.whiskey_name] = { scores: [], average: 0, proof: w.proof };
        userScores[s.user_name].whiskeys[w.whiskey_name].scores.push(s);
        userScores[s.user_name].whiskeys[w.whiskey_name].average = s.average_score;
      })
    )
  );

  if (!Object.keys(userScores).length)
    return <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--muted)' }}>{'// NO DATA FOUND'}</p>;

  return (
    <div className="flex flex-col gap-[22px]">
      {Object.entries(userScores).map(([name, data]) => (
        <div key={name} className="border p-8" style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}>
          <h2 className="font-fraunces font-semibold text-[24px] mb-1 mt-0" style={{ color: 'var(--cream)' }}>
            {name}
          </h2>
          <p className="font-sans text-sm mb-5" style={{ color: 'var(--muted)' }}>Theme: {data.theme}</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Whiskey</th>
                  <th style={{ textAlign: 'right' }}>Proof</th>
                  <th style={{ textAlign: 'right' }}>Aroma</th>
                  <th style={{ textAlign: 'right' }}>Flavor</th>
                  <th style={{ textAlign: 'right' }}>Finish</th>
                  <th style={{ textAlign: 'right' }}>Average</th>
                  <th style={{ textAlign: 'right' }}>Rank</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.whiskeys).map(([wName, wData]) => (
                  <tr key={wName}>
                    <td><strong>{wName}</strong></td>
                    <td className="num">{wData.proof ?? '—'}</td>
                    <td className="num">{wData.scores[0]?.aroma_score ?? '—'}</td>
                    <td className="num">{wData.scores[0]?.flavor_score ?? '—'}</td>
                    <td className="num">{wData.scores[0]?.finish_score ?? '—'}</td>
                    <td className="num">{wData.average.toFixed(1)}</td>
                    <td className="num">{wData.scores[0]?.personal_rank ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/data-view/page.tsx
git commit -m "feat: rewrite data view — add Results reveal tab with podium/bars/consensus, dark accordion"
```

---

## Task 10: Administration Page

**Files:**
- Modify: `apps/frontend/app/administration/page.tsx`

- [ ] **Step 1: Replace administration/page.tsx**

Replace all content of `apps/frontend/app/administration/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin';

export default function Administration() {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') === 'true') setIsAuthenticated(true);
  }, []);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
    } else {
      showToast('Incorrect password', 'error');
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="ad-screen flex items-center justify-center screen-enter">
        <div className="w-full max-w-[420px] ad-panel">
          <div className="ad-panel-head">
            <div>
              <h1 className="font-fraunces font-black text-[36px] leading-[.94] tracking-[-0.02em] m-0" style={{ color: 'var(--cream)' }}>
                ADMINISTRATION
              </h1>
              <p className="font-mono text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
                {'// ENTER PASSWORD'}
              </p>
            </div>
          </div>
          <div className="ad-panel-body">
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-[9px]">
                <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password…"
                  className="ad-select"
                  required
                />
              </div>
              <Button type="submit" variant="default" className="w-full">ENTER</Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    { sub: '// SET UP A NIGHT',   label: 'Create New Theme', href: '/new-theme',   danger: false },
    { sub: '// TWEAK THE LINEUP', label: 'Edit Themes',      href: '/edit-themes', danger: false },
    { sub: '// ONBOARD A TASTER', label: 'Add User',         href: '/add-user',    danger: false },
    { sub: '// REMOVE A TASTER',  label: 'Delete User',      href: '/delete-user', danger: true  },
    { sub: '// SEE THE RESULTS',  label: 'View Results',     href: '/data-view',   danger: false },
  ];

  return (
    <div className="ad-screen screen-enter">
      <div className="ad-panel">
        <div className="ad-panel-head">
          <div>
            <h1 className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0" style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}>
              ADMINISTRATION
            </h1>
            <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
              {'// MANAGE THEMES, USERS, AND SETTINGS'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')} className="whitespace-nowrap">
            ← HOME
          </Button>
        </div>
        <div className="ad-panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiles.map((tile) => (
              <button
                key={tile.href}
                onClick={() => router.push(tile.href)}
                className={`ad-admin-tile${tile.danger ? ' danger' : ''}`}
              >
                <span className="ad-admin-sub">{tile.sub}</span>
                <span className="ad-admin-label">{tile.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/administration/page.tsx
git commit -m "feat: rewrite administration page to After Dark dark tile grid"
```

---

## Task 11: New Theme Page

**Files:**
- Modify: `apps/frontend/app/new-theme/page.tsx`

Key change: replace the number input for whiskey count with a `– N +` stepper (clamp 1–8).

- [ ] **Step 1: Replace new-theme/page.tsx**

Replace all content of `apps/frontend/app/new-theme/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTheme, type CreateThemeRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function NewTheme() {
  const router = useRouter();
  const { showToast } = useToast();
  const [themeName, setThemeName] = useState('');
  const [themeNotes, setThemeNotes] = useState('');
  const [numWhiskeys, setNumWhiskeys] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') router.push('/administration');
  }, [router]);

  function stepWhiskeys(delta: number) {
    setNumWhiskeys((n) => Math.max(1, Math.min(8, n + delta)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!themeName.trim()) return;
    setSubmitting(true);
    try {
      await createTheme({ name: themeName.trim(), notes: themeNotes.trim(), num_whiskeys: numWhiskeys } as CreateThemeRequest);
      router.push('/');
    } catch (error) {
      console.error('Failed to create theme:', error);
      showToast('Failed to create theme. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-screen screen-enter">
      <div className="ad-panel" style={{ maxWidth: 720 }}>
        <div className="ad-panel-head">
          <div>
            <h1 className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0" style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}>
              NEW THEME
            </h1>
            <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
              {'// CREATE A NEW TASTING THEME'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/administration')} className="whitespace-nowrap">
            ← ADMIN
          </Button>
        </div>
        <div className="ad-panel-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[26px]">
            {/* Theme name */}
            <div className="flex flex-col gap-[9px]">
              <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                Theme Name
              </label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name…"
                className="ad-select"
                required
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-[9px]">
              <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                Description / Notes
              </label>
              <textarea
                value={themeNotes}
                onChange={(e) => setThemeNotes(e.target.value)}
                placeholder="Enter theme description…"
                rows={4}
                className="ad-select resize-y"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Stepper */}
            <div className="flex flex-col gap-[9px]">
              <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                Number of Whiskeys
              </label>
              <div
                className="inline-flex items-center w-max"
                style={{ border: '1px solid var(--line)', background: 'rgba(0,0,0,0.3)' }}
              >
                <button
                  type="button"
                  onClick={() => stepWhiskeys(-1)}
                  className="w-12 h-12 flex items-center justify-center font-mono text-[22px] transition-colors duration-150"
                  style={{ color: 'var(--amber)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--amber)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--bg)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)'; }}
                >
                  –
                </button>
                <span
                  className="w-[58px] text-center font-mono font-bold text-[18px] leading-[48px]"
                  style={{ borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)', color: 'var(--cream)' }}
                >
                  {numWhiskeys}
                </span>
                <button
                  type="button"
                  onClick={() => stepWhiskeys(1)}
                  className="w-12 h-12 flex items-center justify-center font-mono text-[22px] transition-colors duration-150"
                  style={{ color: 'var(--amber)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--amber)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--bg)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)'; }}
                >
                  +
                </button>
              </div>
            </div>

            <Button type="submit" variant="default" disabled={submitting} className="self-start text-[15px] px-8 py-[17px] h-auto">
              {submitting ? 'CREATING…' : 'CREATE THEME'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/new-theme/page.tsx
git commit -m "feat: rewrite new theme page — dark form with stepper"
```

---

## Task 12: Secondary Admin Pages

**Files:**
- Modify: `apps/frontend/app/add-user/page.tsx`
- Modify: `apps/frontend/app/delete-user/page.tsx`
- Modify: `apps/frontend/app/edit-themes/page.tsx`

These three pages follow the same panel pattern. Only JSX changes; all state and API logic is preserved.

- [ ] **Step 1: Replace add-user/page.tsx**

Replace all content of `apps/frontend/app/add-user/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function AddUser() {
  const router = useRouter();
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') router.push('/administration');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) return;
    setSubmitting(true);
    try {
      await createUser(userName.trim());
      router.push('/administration');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to add user', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ad-screen screen-enter">
      <div className="ad-panel" style={{ maxWidth: 720 }}>
        <div className="ad-panel-head">
          <div>
            <h1 className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0" style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}>
              ADD USER
            </h1>
            <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
              {'// ADD A NEW TASTER'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/administration')} className="whitespace-nowrap">
            ← ADMIN
          </Button>
        </div>
        <div className="ad-panel-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">
            <div className="flex flex-col gap-[9px]">
              <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                User Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter user name…"
                className="ad-select"
                required
              />
            </div>
            <Button type="submit" variant="default" disabled={submitting} className="self-start">
              {submitting ? 'ADDING…' : 'ADD USER'}
            </Button>
          </form>
          <p className="font-sans text-sm mt-6" style={{ color: 'var(--muted)' }}>
            Users appear in the tasting submission dropdown after being added here.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace delete-user/page.tsx**

Replace all content of `apps/frontend/app/delete-user/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUsers, deleteUser, User } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function DeleteUser() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetchUsers();
      setUsers(res.users);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') { router.push('/administration'); return; }
    loadUsers();
  }, [router, loadUsers]);

  async function handleDelete() {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await deleteUser(selectedUser.id!);
      showToast('User deleted successfully', 'success');
      loadUsers();
      setSelectedUser(null);
    } catch {
      showToast('Failed to delete user', 'error');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="ad-screen flex items-center justify-center">
        <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--amber)' }}>{'// LOADING...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="ad-screen screen-enter">
        <div className="ad-panel" style={{ maxWidth: 720 }}>
          <div className="ad-panel-head">
            <div>
              <h1 className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0" style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}>
                DELETE USER
              </h1>
              <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
                {'// REMOVE A TASTER FROM THE SYSTEM'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/administration')} className="whitespace-nowrap">
              ← ADMIN
            </Button>
          </div>
          <div className="ad-panel-body">
            {users.length === 0 ? (
              <p className="font-sans text-sm" style={{ color: 'var(--muted)' }}>No users found to delete.</p>
            ) : (
              <div className="flex flex-col gap-6 max-w-md">
                <div className="flex flex-col gap-[9px]">
                  <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>
                    Select User to Delete
                  </label>
                  <select
                    value={selectedUser?.id ?? ''}
                    onChange={(e) => setSelectedUser(users.find((u) => u.id === parseInt(e.target.value)) ?? null)}
                    className="ad-select"
                    required
                  >
                    <option value="">Choose a user…</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <Button
                  variant="destructive"
                  disabled={!selectedUser || deleting}
                  onClick={() => setShowConfirm(true)}
                  className="self-start"
                >
                  {deleting ? 'DELETING…' : 'DELETE USER'}
                </Button>
                <p className="font-mono text-[11px] uppercase tracking-[.14em]" style={{ color: 'var(--red)' }}>
                  WARNING — permanently removes the user and all their tasting data.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm User Deletion"
        description={`Delete "${selectedUser?.name}"? This permanently removes the user and all their tasting records.`}
        confirmLabel="DELETE USER"
        cancelLabel="CANCEL"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        variant="danger"
      />
    </>
  );
}
```

- [ ] **Step 3: Replace edit-themes/page.tsx**

Replace all content of `apps/frontend/app/edit-themes/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchThemes,
  fetchWhiskeysByTheme,
  updateTheme,
  updateWhiskeys,
  type Theme,
  type Whiskey,
} from '@/lib/api';
import { deleteTheme } from '@/lib/api/themes';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function EditThemes() {
  const router = useRouter();
  const { showToast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') router.push('/administration');
  }, [router]);

  useEffect(() => { loadThemes(); }, []);

  useEffect(() => {
    if (selectedTheme) loadWhiskeys(selectedTheme.id!);
  }, [selectedTheme]);

  async function loadThemes() {
    try { const r = await fetchThemes(); setThemes(r.themes); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadWhiskeys(id: number) {
    try { setWhiskeys(await fetchWhiskeysByTheme(id)); }
    catch (e) { console.error(e); }
  }

  async function handleSaveTheme() {
    if (!selectedTheme) return;
    try {
      await updateTheme(selectedTheme.id!, { name: selectedTheme.name, notes: selectedTheme.notes });
      showToast('Theme updated successfully!', 'success');
    } catch { showToast('Failed to update theme.', 'error'); }
  }

  function handleWhiskeyChange(index: number, field: 'name' | 'proof', value: string | number | null) {
    const updated = [...whiskeys];
    updated[index] = { ...updated[index], [field]: value };
    setWhiskeys(updated);
  }

  async function handleSaveWhiskeys() {
    if (!selectedTheme) return;
    try {
      await updateWhiskeys(selectedTheme.id!, whiskeys.map((w) => ({ name: w.name, proof: w.proof })));
      showToast('Whiskeys updated successfully!', 'success');
    } catch { showToast('Failed to update whiskeys.', 'error'); }
  }

  async function handleDeleteTheme() {
    if (!selectedTheme) return;
    try {
      await deleteTheme(selectedTheme.id!);
      showToast('Theme deleted successfully!', 'success');
      setSelectedTheme(null);
      loadThemes();
    } catch { showToast('Failed to delete theme.', 'error'); }
  }

  if (loading) {
    return (
      <div className="ad-screen flex items-center justify-center">
        <p className="font-mono text-[13px] uppercase tracking-[.22em]" style={{ color: 'var(--amber)' }}>{'// LOADING...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="ad-screen screen-enter">
        <div className="ad-panel">
          <div className="ad-panel-head">
            <div>
              <h1 className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0" style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}>
                EDIT THEMES
              </h1>
              <p className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0" style={{ color: 'var(--amber)' }}>
                {'// SELECT A THEME TO EDIT'}
              </p>
            </div>
            <Button variant="outline" onClick={() => selectedTheme ? setSelectedTheme(null) : router.push('/administration')} className="whitespace-nowrap">
              {selectedTheme ? '← THEMES' : '← ADMIN'}
            </Button>
          </div>
          <div className="ad-panel-body">
            {!selectedTheme ? (
              /* Theme picker grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className="ad-tile text-left"
                    style={{ minHeight: 120 }}
                  >
                    <span className="ad-tile-sub">// {new Date(theme.created_at).toLocaleDateString()}</span>
                    <span className="ad-tile-label" style={{ fontSize: 20 }}>{theme.name}</span>
                    {theme.notes && (
                      <span className="font-sans text-sm mt-1 relative z-10" style={{ color: 'var(--dim)' }}>
                        {theme.notes.slice(0, 60)}{theme.notes.length > 60 ? '…' : ''}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* Edit form */
              <div className="flex flex-col gap-[22px]">
                {/* Theme details card */}
                <div className="border p-8" style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}>
                  <h2 className="font-fraunces font-semibold text-[24px] mb-6 mt-0" style={{ color: 'var(--cream)' }}>
                    {selectedTheme.name}
                  </h2>
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-[9px]">
                      <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>Theme Name</label>
                      <input type="text" value={selectedTheme.name} onChange={(e) => setSelectedTheme({ ...selectedTheme, name: e.target.value })} className="ad-select" />
                    </div>
                    <div className="flex flex-col gap-[9px]">
                      <label className="font-mono text-[11px] uppercase tracking-[.18em]" style={{ color: 'var(--dim)' }}>Notes</label>
                      <textarea value={selectedTheme.notes} onChange={(e) => setSelectedTheme({ ...selectedTheme, notes: e.target.value })} rows={4} className="ad-select resize-y" style={{ height: 'auto' }} />
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <Button variant="default" onClick={handleSaveTheme}>Save Changes</Button>
                      <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Theme</Button>
                    </div>
                  </div>
                </div>

                {/* Whiskeys card */}
                <div className="border p-8" style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}>
                  <h2 className="font-fraunces font-semibold text-[24px] mb-6 mt-0" style={{ color: 'var(--cream)' }}>
                    Whiskeys
                  </h2>
                  <div className="flex flex-col gap-[10px]">
                    {whiskeys.map((w, i) => (
                      <div key={w.id} className="grid items-center gap-3" style={{ gridTemplateColumns: '36px 1fr 110px' }}>
                        <span className="font-mono text-[12px] font-medium" style={{ color: 'var(--amber)' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <input type="text" value={w.name} onChange={(e) => handleWhiskeyChange(i, 'name', e.target.value)} placeholder="Whiskey name…" className="ad-select" style={{ padding: '10px 12px', fontSize: 14 }} />
                        <input type="number" value={w.proof ?? ''} onChange={(e) => handleWhiskeyChange(i, 'proof', parseFloat(e.target.value) || null)} placeholder="Proof" className="ad-select" style={{ padding: '10px 12px', fontSize: 14 }} />
                      </div>
                    ))}
                  </div>
                  <Button variant="default" onClick={handleSaveWhiskeys} className="mt-6">
                    Save Whiskey Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Theme"
        description={`Delete "${selectedTheme?.name}"? This removes all associated data and cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteTheme}
      />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/add-user/page.tsx apps/frontend/app/delete-user/page.tsx apps/frontend/app/edit-themes/page.tsx
git commit -m "feat: rewrite add-user, delete-user, edit-themes pages to After Dark"
```

---

## Final Verification

- [ ] **Run all tests**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -40
```

All tests should pass. If any e2e test fails due to changed selectors (e.g. the old `<Button>` component emitted different class strings), update the selector in the test to match the new HTML structure.

- [ ] **Smoke-test the full app in the browser**

```bash
cd apps/frontend && npm run dev -- --port 3010 &
```

Check each page:

1. `http://localhost:3010` — dark background, logo, WHISKEY TASTING in Fraunces, tonight strip, 3 tiles with hover glow
2. `http://localhost:3010/tasting-submission` — pip raters (5 amber pips + decimal input), rank pills, submit progress bar
3. `http://localhost:3010/data-view` — "The Results" tab loads by default, podium + bars animate in, amber tab bar
4. `http://localhost:3010/administration` — login form dark, after auth shows dark tile grid
5. `http://localhost:3010/new-theme` — stepper (– N +), dark form

Stop dev server: `kill %1`
