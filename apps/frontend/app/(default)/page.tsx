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
