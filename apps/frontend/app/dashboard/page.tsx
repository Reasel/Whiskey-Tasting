'use client';

import { useEffect, useState } from 'react';
import { fetchAllThemesScores, fetchActiveTheme, fetchWhiskeysByTheme, submitTasting, type ThemeScoresResponse, type Whiskey, type ThemeResponse, type SubmitTastingRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const [themesScores, setThemesScores] = useState<ThemeScoresResponse[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeResponse | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [userName, setUserName] = useState('');
  const [scores, setScores] = useState<Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'submit' | 'past'>('submit');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [themesData, activeThemeData] = await Promise.all([
        fetchAllThemesScores(),
        fetchActiveTheme(),
      ]);
      setThemesScores(themesData);
      setActiveTheme(activeThemeData);

      if (activeThemeData) {
        const whiskeysData = await fetchWhiskeysByTheme(activeThemeData.id);
        setWhiskeys(whiskeysData);
        // Initialize scores
        const initialScores: Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }> = {};
        whiskeysData.forEach((whiskey, index) => {
          initialScores[whiskey.id!] = {
            aroma_score: 3,
            flavor_score: 3,
            finish_score: 3,
            personal_rank: index + 1,
          };
        });
        setScores(initialScores);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTasting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !activeTheme) return;

    setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: userName.trim(),
        whiskey_scores: scores,
      };
      await submitTasting(request);
      alert('Tasting submitted successfully!');
      setUserName('');
      // Reload data to show updated scores
      await loadData();
    } catch (error) {
      console.error('Failed to submit tasting:', error);
      alert('Failed to submit tasting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateScore = (whiskeyId: number, field: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [whiskeyId]: {
        ...prev[whiskeyId],
        [field]: value,
      },
    }));
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
          <h1 className="font-serif text-5xl md:text-7xl text-black tracking-tight leading-[0.95]">
            WHISKEY TASTING
          </h1>
          <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
            {'// DASHBOARD'}
          </p>
          <div className="mt-8 flex gap-4">
            <Button
              onClick={() => setActiveView('submit')}
              variant={activeView === 'submit' ? 'default' : 'outline'}
              className="font-mono text-sm uppercase tracking-wider"
            >
              Submit Tasting
            </Button>
            <Button
              onClick={() => setActiveView('past')}
              variant={activeView === 'past' ? 'default' : 'outline'}
              className="font-mono text-sm uppercase tracking-wider"
            >
              Past Tastings
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {activeView === 'submit' && (
            /* Submit Tasting Section */
            <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
              <div className="flex items-center gap-2 border-b border-black pb-4 mb-6">
                <div className="w-3 h-3 bg-[#1D4ED8]"></div>
                <h2 className="font-mono text-lg font-bold uppercase tracking-wider text-black">
                  SUBMIT TASTING CARD
                </h2>
              </div>

              {activeTheme ? (
                <form onSubmit={handleSubmitTasting} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="userName">Your Name</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name..."
                      required
                    />
                  </div>

                  <div className="border border-black bg-[#E5E5E0] p-4">
                    <h3 className="font-serif text-xl font-bold text-black mb-2">
                      Theme: {activeTheme.name}
                    </h3>
                    <p className="font-sans text-sm text-[#6B7280]">{activeTheme.notes}</p>
                  </div>

                  <div className="space-y-4">
                    {whiskeys.map((whiskey, index) => (
                      <div key={whiskey.id} className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                        <h4 className="font-mono text-sm font-bold uppercase tracking-wider text-black mb-4">
                          {index + 1}. {whiskey.name} {whiskey.proof ? `(${whiskey.proof}%)` : ''}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`aroma-${whiskey.id}`}>Aroma (1-5)</Label>
                            <Input
                              id={`aroma-${whiskey.id}`}
                              type="number"
                              min="1"
                              max="5"
                              value={scores[whiskey.id!]?.aroma_score || 3}
                              onChange={(e) => updateScore(whiskey.id!, 'aroma_score', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`flavor-${whiskey.id}`}>Flavor (1-5)</Label>
                            <Input
                              id={`flavor-${whiskey.id}`}
                              type="number"
                              min="1"
                              max="5"
                              value={scores[whiskey.id!]?.flavor_score || 3}
                              onChange={(e) => updateScore(whiskey.id!, 'flavor_score', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`finish-${whiskey.id}`}>Finish (1-5)</Label>
                            <Input
                              id={`finish-${whiskey.id}`}
                              type="number"
                              min="1"
                              max="5"
                              value={scores[whiskey.id!]?.finish_score || 3}
                              onChange={(e) => updateScore(whiskey.id!, 'finish_score', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`rank-${whiskey.id}`}>Personal Rank (1-{whiskeys.length})</Label>
                            <Input
                              id={`rank-${whiskey.id}`}
                              type="number"
                              min="1"
                              max={whiskeys.length}
                              value={scores[whiskey.id!]?.personal_rank || index + 1}
                              onChange={(e) => updateScore(whiskey.id!, 'personal_rank', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" variant="default" disabled={submitting} className="w-full md:w-auto">
                    {submitting ? 'SUBMITTING...' : 'SUBMIT TASTING'}
                  </Button>
                </form>
              ) : (
                <p className="font-mono text-sm text-muted-text uppercase tracking-wider">
                  // NO ACTIVE TASTING THEME - PLEASE CREATE AND SET AN ACTIVE THEME
                </p>
              )}
            </div>
          )}

          {activeView === 'past' && (
            /* Past Tastings Section */
            <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
              <div className="flex items-center gap-2 border-b border-black pb-4 mb-6">
                <div className="w-3 h-3 bg-[#15803D]"></div>
                <h2 className="font-mono text-lg font-bold uppercase tracking-wider text-black">
                  PAST TASTINGS
                </h2>
              </div>

              {themesScores.length === 0 ? (
                <p className="font-mono text-sm text-muted-text uppercase tracking-wider">
                  // NO PAST TASTINGS FOUND
                </p>
              ) : (
                <div className="space-y-8">
                  {themesScores.map((themeScore) => (
                    <div key={themeScore.theme.id} className="border border-black bg-[#E5E5E0] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <h3 className="font-serif text-2xl font-bold text-black mb-2">
                        {themeScore.theme.name}
                      </h3>
                      <p className="font-sans text-sm text-[#6B7280] mb-6">{themeScore.theme.notes}</p>

                      <div className="overflow-x-auto">
                        <table className="w-full font-mono text-sm border-collapse">
                          <thead>
                            <tr className="border-b-2 border-black">
                              <th className="text-left py-3 px-2 font-bold uppercase tracking-wider">Whiskey</th>
                              <th className="text-center py-3 px-2 font-bold uppercase tracking-wider">Avg Score</th>
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
                                <td className="text-center py-3 px-2 font-bold">{whiskey.scores.length}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}