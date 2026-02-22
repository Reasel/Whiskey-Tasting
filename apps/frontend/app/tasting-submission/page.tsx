'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export default function TastingSubmission() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
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

  const loadInitialData = useCallback(async () => {
    console.log('loadInitialData called');
    try {
      const [usersData, themesData, activeThemeData] = await Promise.all([
        fetchUsers(),
        fetchThemes(),
        fetchActiveTheme(),
      ]);
      console.log('Fetched data:', {
        users: usersData.users.length,
        themes: themesData.themes.length,
        activeTheme: activeThemeData,
      });
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
    const initialScores: Record<
      number,
      {
        aroma_score: number | '';
        flavor_score: number | '';
        finish_score: number | '';
        personal_rank: number | '';
      }
    > = {};
    whiskeys.forEach((whiskey, index) => {
      initialScores[whiskey.id!] = {
        aroma_score: '',
        flavor_score: '',
        finish_score: '',
        personal_rank: '',
      };
    });
    setScores(initialScores);
  }, [whiskeys]);

  const loadWhiskeys = useCallback(
    async (themeId: number) => {
      console.log('loadWhiskeys called with themeId:', themeId);
      try {
        const whiskeysData = await fetchWhiskeysByTheme(themeId);
        console.log('Fetched whiskeys:', whiskeysData.length);
        setWhiskeys(whiskeysData);
        resetScores();
      } catch (error) {
        console.error('Failed to load whiskeys:', error);
      }
    },
    [resetScores]
  );

  const loadExistingTastings = useCallback(async () => {
    if (!selectedUser || !selectedThemeId || selectedUser === 'new') return;

    try {
      const tastingsData = await fetchUserTastingsForTheme(selectedUser, selectedThemeId);
      const initialScores: Record<
        number,
        {
          aroma_score: number | '';
          flavor_score: number | '';
          finish_score: number | '';
          personal_rank: number | '';
        }
      > = {};
      whiskeys.forEach((whiskey, index) => {
        const existing = tastingsData.tastings[whiskey.id!];
        initialScores[whiskey.id!] = existing
          ? {
              aroma_score: existing.aroma_score,
              flavor_score: existing.flavor_score,
              finish_score: existing.finish_score,
              personal_rank: existing.personal_rank,
            }
          : {
              aroma_score: '',
              flavor_score: '',
              finish_score: '',
              personal_rank: '',
            };
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Failed to load existing tastings:', error);
      resetScores();
    }
  }, [whiskeys, selectedUser, selectedThemeId, resetScores]);

  const handleUserChange = useCallback((value: string) => {
    setSelectedUser(value);
    if (value !== 'new') {
      setNewUserName('');
    }
  }, []);

  const handleSubmitTasting = useCallback(
    async (e: React.FormEvent, silent = false) => {
      if (!silent) e.preventDefault();
      const userName = selectedUser === 'new' ? newUserName.trim() : selectedUser;
      if (!userName || !selectedThemeId) return;

      if (!silent) setSubmitting(true);
      try {
        // Convert scores to the format expected by the API, filtering out incomplete entries
        const validScores: Record<
          number,
          {
            aroma_score: number;
            flavor_score: number;
            finish_score: number;
            personal_rank: number;
          }
        > = {};

        let hasIncompleteScores = false;

        Object.entries(scores).forEach(([whiskeyId, score]) => {
          if (
            score.aroma_score !== '' &&
            score.flavor_score !== '' &&
            score.finish_score !== '' &&
            score.personal_rank !== ''
          ) {
            validScores[parseInt(whiskeyId)] = {
              aroma_score: score.aroma_score as number,
              flavor_score: score.flavor_score as number,
              finish_score: score.finish_score as number,
              personal_rank: score.personal_rank as number,
            };
          } else {
            hasIncompleteScores = true;
          }
        });

        // Require all whiskeys to have complete scores
        if (hasIncompleteScores || Object.keys(validScores).length === 0) {
          if (!silent) {
            showToast('Please complete all whiskey ratings before submitting.', 'error');
          }
          return;
        }

        const request: SubmitTastingRequest = {
          user_name: userName,
          whiskey_scores: validScores,
        };
        await submitTasting(request);
        if (!silent) {
          showToast('Tasting submitted successfully!', 'success');
          // Reset form but keep user selected
          setNewUserName('');
          resetScores();
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
    [selectedUser, newUserName, selectedThemeId, scores, showToast, resetScores]
  );

  const updateScore = useCallback((whiskeyId: number, field: string, value: number | '') => {
    setScores((prev) => ({
      ...prev,
      [whiskeyId]: {
        ...prev[whiskeyId],
        [field]: value,
      },
    }));
  }, []);

  useEffect(() => {
    console.log('useEffect loadInitialData');
    loadInitialData();
  }, []); // loadInitialData is stable

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting({} as React.FormEvent, false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, selectedThemeId, scores]); // handleSubmitTasting is stable

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting({} as React.FormEvent, false);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedUser, selectedThemeId, scores]); // handleSubmitTasting is stable

  useEffect(() => {
    console.log('useEffect selectedThemeId:', selectedThemeId);
    if (selectedThemeId) {
      loadWhiskeys(selectedThemeId);
    }
  }, [selectedThemeId]); // loadWhiskeys is stable

  useEffect(() => {
    if (selectedUser && selectedThemeId && selectedUser !== 'new') {
      loadExistingTastings();
    } else {
      // Reset scores for new user or no selection
      resetScores();
    }
  }, [selectedUser, selectedThemeId]); // loadExistingTastings and resetScores are stable

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-7xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8 text-center">
          <span className="font-mono text-sm uppercase tracking-wider">{'// LOADING...'}</span>
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
                TASTING SUBMISSION
              </h1>
              <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
                {'// SUBMIT OR EDIT TASTING SCORES'}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="font-mono text-sm uppercase tracking-wider">
                ← HOME
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmitTasting} className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userSelect">Select User</Label>
              <select
                id="userSelect"
                value={selectedUser}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full p-2 border border-black bg-white"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}
                <option value="new">+ Add New User</option>
              </select>
            </div>

            {/* New User Input */}
            {selectedUser === 'new' && (
              <div className="space-y-2">
                <Label htmlFor="newUserName">New User Name</Label>
                <Input
                  id="newUserName"
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter new user name..."
                  required
                />
              </div>
            )}

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label htmlFor="themeSelect">Select Theme</Label>
              <select
                id="themeSelect"
                value={selectedThemeId?.toString() || ''}
                onChange={(e) => setSelectedThemeId(parseInt(e.target.value))}
                className="w-full p-2 border border-black bg-white"
              >
                <option value="">Choose a theme...</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id!.toString()}>
                    {theme.name} {theme.id === activeTheme?.id ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Scores Form */}
            {selectedThemeId && whiskeys.length > 0 && (
              <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
                <div className="flex items-center gap-2 border-b border-black pb-4 mb-6">
                  <div className="w-3 h-3 bg-[#1D4ED8]"></div>
                  <h2 className="font-mono text-lg font-bold uppercase tracking-wider text-black">
                    SCORES
                  </h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Rate each whiskey on a scale of 1-5 (1 being worst, 5 being best) for Aroma,
                  Flavor, and Finish. Then rank them from 1 to N (1 being your favorite of the
                  night, N being the least favorite).
                </p>

                <div className="space-y-4">
                  {whiskeys.map((whiskey, index) => (
                    <div
                      key={whiskey.id}
                      className="border border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]"
                    >
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
                            step="0.1"
                            value={scores[whiskey.id!]?.aroma_score ?? ''}
                            onChange={(e) =>
                              updateScore(
                                whiskey.id!,
                                'aroma_score',
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`flavor-${whiskey.id}`}>Flavor (1-5)</Label>
                          <Input
                            id={`flavor-${whiskey.id}`}
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={scores[whiskey.id!]?.flavor_score ?? ''}
                            onChange={(e) =>
                              updateScore(
                                whiskey.id!,
                                'flavor_score',
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`finish-${whiskey.id}`}>Finish (1-5)</Label>
                          <Input
                            id={`finish-${whiskey.id}`}
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={scores[whiskey.id!]?.finish_score ?? ''}
                            onChange={(e) =>
                              updateScore(
                                whiskey.id!,
                                'finish_score',
                                e.target.value === '' ? '' : parseFloat(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`rank-${whiskey.id}`}>Rank (1-{whiskeys.length})</Label>
                          <Input
                            id={`rank-${whiskey.id}`}
                            type="number"
                            min="1"
                            max={whiskeys.length}
                            value={scores[whiskey.id!]?.personal_rank ?? ''}
                            onChange={(e) =>
                              updateScore(
                                whiskey.id!,
                                'personal_rank',
                                e.target.value === '' ? '' : parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              disabled={submitting || !selectedUser || !selectedThemeId}
              className="w-full md:w-auto"
            >
              {submitting ? 'SUBMITTING...' : 'SUBMIT TASTING'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
