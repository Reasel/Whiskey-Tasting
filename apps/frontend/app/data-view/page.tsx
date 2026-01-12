'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAllThemesScores, type ThemeScoresResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type ViewType = 'all' | 'theme' | 'person';

export default function DataView() {
  const [themesScores, setThemesScores] = useState<ThemeScoresResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('all');

  useEffect(() => {
    loadData();

    // Polling every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const themesData = await fetchAllThemesScores();
      setThemesScores(themesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-7xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8 text-center">
          <span className="font-mono text-sm uppercase tracking-wider">// LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-start py-12 px-4 md:px-8">
      <div className="w-full max-w-7xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="border-b border-black p-8 md:p-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-serif text-5xl md:text-7xl text-black tracking-tight leading-[0.95]">
                DATA VIEW
              </h1>
              <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
                {'// VIEW ALL SUBMISSIONS'}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="font-mono text-sm uppercase tracking-wider">
                ← HOME
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => setViewType('all')}
              variant={viewType === 'all' ? 'default' : 'outline'}
              className="font-mono text-sm uppercase tracking-wider"
            >
              All Whiskeys
            </Button>
            <Button
              onClick={() => setViewType('theme')}
              variant={viewType === 'theme' ? 'default' : 'outline'}
              className="font-mono text-sm uppercase tracking-wider"
            >
              By Theme
            </Button>
            <Button
              onClick={() => setViewType('person')}
              variant={viewType === 'person' ? 'default' : 'outline'}
              className="font-mono text-sm uppercase tracking-wider"
            >
              By Person
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {viewType === 'all' && (
            <AllWhiskeysView themesScores={themesScores} />
          )}
          {viewType === 'theme' && (
            <ThemeView themesScores={themesScores} />
          )}
          {viewType === 'person' && (
            <PersonView themesScores={themesScores} />
          )}
        </div>
      </div>
    </div>
  );
}

function AllWhiskeysView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  // Collect all whiskeys with their scores
  const allWhiskeys: { whiskey: any; theme: string; scores: any[] }[] = [];

  themesScores.forEach((themeScore) => {
    themeScore.whiskeys.forEach((whiskey) => {
      allWhiskeys.push({
        whiskey,
        theme: themeScore.theme.name,
        scores: whiskey.scores,
      });
    });
  });

  if (allWhiskeys.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-text uppercase tracking-wider">
        // NO DATA FOUND
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-3 px-2 font-bold uppercase tracking-wider">Whiskey</th>
              <th className="text-left py-3 px-2 font-bold uppercase tracking-wider">Theme</th>
              <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Avg Score</th>
              <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Tasters</th>
            </tr>
          </thead>
          <tbody>
            {allWhiskeys.map((item, index) => (
              <tr key={index} className="border-b border-black">
                <td className="py-3 px-2">
                  <div className="font-bold text-black">{item.whiskey.whiskey_name}</div>
                  {item.whiskey.proof && <div className="text-xs text-muted-text uppercase tracking-wider">{item.whiskey.proof}% ABV</div>}
                </td>
                <td className="py-3 px-2">{item.theme}</td>
                <td className="text-center py-3 px-2 font-bold">{item.whiskey.average_score.toFixed(1)}</td>
                <td className="text-center py-3 px-2 font-bold">{item.scores.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ThemeView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  if (themesScores.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-text uppercase tracking-wider">
        // NO DATA FOUND
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {themesScores.map((themeScore) => (
        <div key={themeScore.theme.id} className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
          <h2 className="font-serif text-3xl font-bold text-black mb-2">
            {themeScore.theme.name}
          </h2>
          <p className="font-sans text-sm text-[#6B7280] mb-6">{themeScore.theme.notes}</p>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider">Whiskey</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Avg Score</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Rank</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Tasters</th>
                </tr>
              </thead>
              <tbody>
                {themeScore.whiskeys.map((whiskey) => (
                  <tr key={whiskey.whiskey_id} className="border-b border-black">
                    <td className="py-3 px-2">
                      <div className="font-bold text-black">{whiskey.whiskey_name}</div>
                      {whiskey.proof && <div className="text-xs text-muted-text uppercase tracking-wider">{whiskey.proof}% ABV</div>}
                    </td>
                    <td className="text-center py-3 px-2 font-bold">{whiskey.average_score.toFixed(1)}</td>
                    <td className="text-center py-3 px-2 font-bold">{whiskey.rank_by_average}</td>
                    <td className="text-center py-3 px-2 font-bold">{whiskey.scores.length}</td>
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

function PersonView({ themesScores }: { themesScores: ThemeScoresResponse[] }) {
  // Group scores by user
  const userScores: Record<string, { theme: string; whiskeys: Record<string, { scores: any[]; average: number }> }> = {};

  themesScores.forEach((themeScore) => {
    themeScore.whiskeys.forEach((whiskey) => {
      whiskey.scores.forEach((score) => {
        const userName = score.user_name;
        if (!userScores[userName]) {
          userScores[userName] = { theme: themeScore.theme.name, whiskeys: {} };
        }
        if (!userScores[userName].whiskeys[whiskey.whiskey_name]) {
          userScores[userName].whiskeys[whiskey.whiskey_name] = { scores: [], average: 0 };
        }
        userScores[userName].whiskeys[whiskey.whiskey_name].scores.push(score);
        userScores[userName].whiskeys[whiskey.whiskey_name].average = score.average_score;
      });
    });
  });

  if (Object.keys(userScores).length === 0) {
    return (
      <p className="font-mono text-sm text-muted-text uppercase tracking-wider">
        // NO DATA FOUND
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(userScores).map(([userName, data]) => (
        <div key={userName} className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
          <h2 className="font-serif text-3xl font-bold text-black mb-2">
            {userName}
          </h2>
          <p className="font-sans text-sm text-[#6B7280] mb-6">Theme: {data.theme}</p>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-2 font-bold uppercase tracking-wider">Whiskey</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Aroma</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Flavor</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Finish</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Average</th>
                  <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Rank</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.whiskeys).map(([whiskeyName, whiskeyData]) => (
                  <tr key={whiskeyName} className="border-b border-black">
                    <td className="py-3 px-2 font-bold text-black">{whiskeyName}</td>
                    <td className="text-center py-3 px-2">{whiskeyData.scores[0]?.aroma_score || '-'}</td>
                    <td className="text-center py-3 px-2">{whiskeyData.scores[0]?.flavor_score || '-'}</td>
                    <td className="text-center py-3 px-2">{whiskeyData.scores[0]?.finish_score || '-'}</td>
                    <td className="text-center py-3 px-2 font-bold">{whiskeyData.average.toFixed(1)}</td>
                    <td className="text-center py-3 px-2">{whiskeyData.scores[0]?.personal_rank || '-'}</td>
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