'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAllThemesScores,
  fetchActiveTheme,
  type ThemeScoresResponse,
  type Theme,
} from '@/lib/api';
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
      fetchAllThemesScores()
        .then(setThemesScores)
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: ViewType; label: string }[] = [
    { id: 'results', label: 'The Results' },
    { id: 'all', label: 'All Whiskeys' },
    { id: 'theme', label: 'By Theme' },
    { id: 'person', label: 'By Person' },
  ];

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
            <p
              className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
              style={{ color: 'var(--amber)' }}
            >
              {'// VIEW ALL SUBMISSIONS'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/')} className="whitespace-nowrap">
            ← HOME
          </Button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-[10px] flex-wrap px-11 pt-7"
          style={{ borderBottom: '1px solid var(--line)', paddingBottom: '0' }}
        >
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
          {viewType === 'all' && <AllWhiskeysView themesScores={themesScores} />}
          {viewType === 'theme' && <ThemeView themesScores={themesScores} />}
          {viewType === 'person' && <PersonView themesScores={themesScores} />}
        </div>
      </div>
    </div>
  );
}

// ── Count-up hook (module level) ─────────────────────────────────────────────
function useCountUp(target: number, delay: number, revealed: boolean): number {
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [display, setDisplay] = useState(prefersReduced ? target : 0);
  useEffect(() => {
    if (prefersReduced) {
      setDisplay(target);
      return;
    }
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
  }, [target, delay, revealed, prefersReduced]);
  return display;
}

// ── Podium item (own component so useCountUp is called at top level) ──────────
function PodiumItem({
  w,
  pos,
  index,
  revealed,
  glassFill,
  glassHeight,
}: {
  w: WhiskeyWithScores;
  pos: number;
  index: number;
  revealed: boolean;
  glassFill: string;
  glassHeight: number;
}) {
  const score = useCountUp(w.average_score, 250 + index * 120, revealed);
  return (
    <div
      className={`ad-podium-col${revealed ? ' rise' : ''}`}
      style={{ transitionDelay: `${index * 120}ms` }}
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
      <div
        className="w-full relative overflow-hidden"
        style={{
          maxWidth: 124,
          height: glassHeight,
          border: `1px solid ${pos === 1 ? 'rgba(244,169,55,.4)' : 'var(--line)'}`,
          background: 'rgba(0,0,0,.3)',
          clipPath: 'polygon(14% 0, 86% 0, 78% 100%, 22% 100%)',
        }}
      >
        <div className="ad-glass-pour" style={{ height: revealed ? glassFill : '0%' }} />
      </div>
      <span
        className="font-fraunces font-semibold text-[18px] text-center"
        style={{ color: 'var(--cream)' }}
      >
        {w.whiskey_name}
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
}

// ── Score row (own component so useCountUp is called at top level) ────────────
function ScoreRow({
  w,
  index,
  revealed,
  maxScore,
}: {
  w: WhiskeyWithScores;
  index: number;
  revealed: boolean;
  maxScore: number;
}) {
  const score = useCountUp(w.average_score, 200 + index * 90, revealed);
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
          <span
            className="font-mono text-[10px] uppercase tracking-[.12em]"
            style={{ color: 'var(--muted)' }}
          >
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
            transitionDelay: `${200 + index * 90}ms`,
            boxShadow: index === 0 ? '0 0 20px var(--glow)' : 'none',
          }}
        />
      </div>
      <span
        className="font-mono font-bold text-[18px] min-w-[44px] text-right"
        style={{ color: 'var(--cream)' }}
      >
        {score.toFixed(1)}
      </span>
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

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(timer);
  }, []);

  if (!hasData) {
    return (
      <p
        className="font-mono text-[13px] uppercase tracking-[.22em]"
        style={{ color: 'var(--muted)' }}
      >
        {'// NO RESULTS YET — SUBMIT SOME TASTINGS FIRST'}
      </p>
    );
  }

  const top3 = whiskeys.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumPositions = [2, 1, 3];
  const glassFills = { 1: '82%', 2: '64%', 3: '50%' } as Record<number, string>;
  const glassHeights = { 1: 210, 2: 156, 3: 120 } as Record<number, number>;

  return (
    <div>
      {/* Podium */}
      <div className="grid grid-cols-3 gap-[18px] items-end max-w-[640px] mx-auto mb-12">
        {podiumOrder.map((w, i) => {
          const pos = podiumPositions[i];
          return (
            <PodiumItem
              key={w.whiskey_id}
              w={w}
              pos={pos}
              index={i}
              revealed={revealed}
              glassFill={glassFills[pos] ?? '50%'}
              glassHeight={glassHeights[pos] ?? 120}
            />
          );
        })}
      </div>

      {/* Ranked bars */}
      <div className="flex flex-col" style={{ borderTop: '1px solid var(--line)' }}>
        {whiskeys.map((w, i) => (
          <ScoreRow key={w.whiskey_id} w={w} index={i} revealed={revealed} maxScore={maxScore} />
        ))}
      </div>

      {/* Consensus */}
      {consensus.length > 1 && (
        <div className="mt-[46px] pt-[34px]" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span
              className="font-mono text-[13px] uppercase tracking-[.22em]"
              style={{ color: 'var(--amber)' }}
            >
              {'// CLOSEST TO THE GROUP'}
            </span>
          </div>
          <h3
            className="font-fraunces font-semibold text-[24px] mb-1 mt-0"
            style={{ color: 'var(--cream)' }}
          >
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
                  style={{
                    color: i === 0 ? 'var(--amber)' : 'var(--muted)',
                    fontSize: i === 0 ? 17 : 13,
                  }}
                >
                  {i === 0 ? '★' : String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="font-fraunces font-semibold text-[18px]"
                  style={{ color: 'var(--cream)' }}
                >
                  {c.person}
                </span>
                <div
                  className="h-[14px]"
                  style={{ background: 'rgba(0,0,0,.35)', border: '1px solid var(--line)' }}
                >
                  <div
                    className="ad-cons-fill"
                    style={{
                      width: revealed ? `${(1 - c.deviation / maxDev) * 100}%` : '0%',
                      transitionDelay: `${500 + i * 90}ms`,
                      boxShadow: i === 0 ? '0 0 18px var(--glow)' : 'none',
                    }}
                  />
                </div>
                <div
                  className="font-mono text-[13px] text-right min-w-[96px]"
                  style={{ color: 'var(--cream)' }}
                >
                  <span>±{c.deviation.toFixed(2)}</span>
                  <br />
                  <span className="text-[10px] tracking-[.06em]" style={{ color: 'var(--muted)' }}>
                    avg off
                  </span>
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
      avgAroma: scores.reduce((s, r) => s + r.aroma_score, 0) / scores.length,
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
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  }

  const sorted = [...allWhiskeys].sort((a, b) => {
    const aV =
      sortBy === 'whiskey'
        ? a.whiskey.whiskey_name.toLowerCase()
        : sortBy === 'theme'
          ? a.theme.toLowerCase()
          : sortBy === 'proof'
            ? (a.whiskey.proof ?? 0)
            : sortBy === 'aroma'
              ? a.averages.avgAroma
              : sortBy === 'flavor'
                ? a.averages.avgFlavor
                : sortBy === 'finish'
                  ? a.averages.avgFinish
                  : sortBy === 'avgScore'
                    ? a.whiskey.average_score
                    : a.whiskey.scores.length;
    const bV =
      sortBy === 'whiskey'
        ? b.whiskey.whiskey_name.toLowerCase()
        : sortBy === 'theme'
          ? b.theme.toLowerCase()
          : sortBy === 'proof'
            ? (b.whiskey.proof ?? 0)
            : sortBy === 'aroma'
              ? b.averages.avgAroma
              : sortBy === 'flavor'
                ? b.averages.avgFlavor
                : sortBy === 'finish'
                  ? b.averages.avgFinish
                  : sortBy === 'avgScore'
                    ? b.whiskey.average_score
                    : b.whiskey.scores.length;
    if (aV < bV) return sortDir === 'asc' ? -1 : 1;
    if (aV > bV) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  if (!allWhiskeys.length)
    return (
      <p
        className="font-mono text-[13px] uppercase tracking-[.22em]"
        style={{ color: 'var(--muted)' }}
      >
        {'// NO DATA FOUND'}
      </p>
    );

  const arrow = (col: string) => (sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ad-table">
        <thead>
          <tr>
            {[
              ['whiskey', 'Whiskey'],
              ['theme', 'Theme'],
              ['proof', 'Proof'],
              ['aroma', 'Aroma'],
              ['flavor', 'Flavor'],
              ['finish', 'Finish'],
              ['avgScore', 'Avg Score'],
              ['tasters', 'Tasters'],
            ].map(([k, l]) => (
              <th
                key={k}
                onClick={() => handleSort(k)}
                style={{
                  cursor: 'pointer',
                  textAlign:
                    k === 'proof' ||
                    k === 'aroma' ||
                    k === 'flavor' ||
                    k === 'finish' ||
                    k === 'avgScore' ||
                    k === 'tasters'
                      ? 'right'
                      : 'left',
                }}
              >
                {l}
                {arrow(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr key={i}>
              <td>
                <strong>{item.whiskey.whiskey_name}</strong>
              </td>
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

  if (!themesScores.length)
    return (
      <p
        className="font-mono text-[13px] uppercase tracking-[.22em]"
        style={{ color: 'var(--muted)' }}
      >
        {'// NO DATA FOUND'}
      </p>
    );

  return (
    <div className="flex flex-col gap-[22px]">
      {themesScores.map((themeScore) => (
        <div
          key={themeScore.theme.id}
          className="border p-8"
          style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}
        >
          <h2
            className="font-fraunces font-semibold text-[24px] mb-1 mt-0"
            style={{ color: 'var(--cream)' }}
          >
            {themeScore.theme.name}
          </h2>
          {themeScore.theme.notes && (
            <p
              className="font-sans text-sm mb-5 whitespace-pre-wrap"
              style={{ color: 'var(--muted)' }}
            >
              {themeScore.theme.notes}
            </p>
          )}

          {/* Accordion whiskey list */}
          <div
            className="flex flex-col"
            style={{ borderTop: '1px solid var(--line)', marginTop: 4 }}
          >
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
                      style={{
                        color: 'var(--amber)',
                        transform: isOpen ? 'rotate(90deg)' : 'none',
                      }}
                    >
                      ›
                    </span>
                    <span className="font-fraunces font-semibold text-[19px]">
                      {w.whiskey_name}
                    </span>
                    {w.proof && (
                      <span
                        className="font-mono text-[10px] uppercase tracking-[.12em]"
                        style={{ color: 'var(--muted)' }}
                      >
                        {w.proof} PROOF
                      </span>
                    )}
                    <span className="flex-1" />
                    <span
                      className="font-mono text-[12px] tracking-[.08em] whitespace-nowrap"
                      style={{ color: 'var(--dim)' }}
                    >
                      <b style={{ color: 'var(--amber)', fontSize: 15 }}>{avgScore.toFixed(1)}</b>{' '}
                      AVG
                    </span>
                    <span
                      className="font-mono text-[10px] uppercase tracking-[.1em] ml-4 whitespace-nowrap"
                      style={{ color: 'var(--muted)' }}
                    >
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
  const userScores: Record<
    string,
    {
      theme: string;
      whiskeys: Record<string, { scores: Score[]; average: number; proof: number | null }>;
    }
  > = {};

  themesScores.forEach((t) =>
    t.whiskeys.forEach((w) =>
      w.scores.forEach((s) => {
        if (!userScores[s.user_name])
          userScores[s.user_name] = { theme: t.theme.name, whiskeys: {} };
        if (!userScores[s.user_name].whiskeys[w.whiskey_name])
          userScores[s.user_name].whiskeys[w.whiskey_name] = {
            scores: [],
            average: 0,
            proof: w.proof,
          };
        userScores[s.user_name].whiskeys[w.whiskey_name].scores.push(s);
        userScores[s.user_name].whiskeys[w.whiskey_name].average = s.average_score;
      })
    )
  );

  if (!Object.keys(userScores).length)
    return (
      <p
        className="font-mono text-[13px] uppercase tracking-[.22em]"
        style={{ color: 'var(--muted)' }}
      >
        {'// NO DATA FOUND'}
      </p>
    );

  return (
    <div className="flex flex-col gap-[22px]">
      {Object.entries(userScores).map(([name, data]) => (
        <div
          key={name}
          className="border p-8"
          style={{ background: 'rgba(0,0,0,.22)', borderColor: 'var(--line)' }}
        >
          <h2
            className="font-fraunces font-semibold text-[24px] mb-1 mt-0"
            style={{ color: 'var(--cream)' }}
          >
            {name}
          </h2>
          <p className="font-sans text-sm mb-5" style={{ color: 'var(--muted)' }}>
            Theme: {data.theme}
          </p>
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
                    <td>
                      <strong>{wName}</strong>
                    </td>
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
