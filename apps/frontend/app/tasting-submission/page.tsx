'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchUsers, fetchThemes, fetchActiveTheme, fetchWhiskeysByTheme, submitTasting, fetchUserTastingsForTheme, type Theme, type Whiskey, type SubmitTastingRequest, type User } from '@/lib/api';
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
  const [scores, setScores] = useState<Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-save every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting(new Event('submit') as any, false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedUser, selectedThemeId, scores]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedUser && selectedThemeId && Object.keys(scores).length > 0) {
        handleSubmitTasting(new Event('submit') as any, false);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedUser, selectedThemeId, scores]);

  useEffect(() => {
    if (selectedThemeId) {
      loadWhiskeys(selectedThemeId);
    }
  }, [selectedThemeId]);

  useEffect(() => {
    if (selectedUser && selectedThemeId && selectedUser !== 'new') {
      loadExistingTastings();
    } else {
      // Reset scores for new user or no selection
      resetScores();
    }
  }, [selectedUser, selectedThemeId]);

  const loadInitialData = async () => {
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
  };

  const loadWhiskeys = async (themeId: number) => {
    try {
      const whiskeysData = await fetchWhiskeysByTheme(themeId);
      setWhiskeys(whiskeysData);
      resetScores();
    } catch (error) {
      console.error('Failed to load whiskeys:', error);
    }
  };

  const loadExistingTastings = async () => {
    if (!selectedUser || !selectedThemeId || selectedUser === 'new') return;

    try {
      const tastingsData = await fetchUserTastingsForTheme(selectedUser, selectedThemeId);
      const initialScores: Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }> = {};
      whiskeys.forEach((whiskey, index) => {
        const existing = tastingsData.tastings[whiskey.id!];
        initialScores[whiskey.id!] = existing ? {
          aroma_score: existing.aroma_score,
          flavor_score: existing.flavor_score,
          finish_score: existing.finish_score,
          personal_rank: existing.personal_rank,
        } : {
          aroma_score: 3,
          flavor_score: 3,
          finish_score: 3,
          personal_rank: index + 1,
        };
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Failed to load existing tastings:', error);
      resetScores();
    }
  };

  const resetScores = () => {
    const initialScores: Record<number, { aroma_score: number; flavor_score: number; finish_score: number; personal_rank: number }> = {};
    whiskeys.forEach((whiskey, index) => {
      initialScores[whiskey.id!] = {
        aroma_score: 3,
        flavor_score: 3,
        finish_score: 3,
        personal_rank: index + 1,
      };
    });
    setScores(initialScores);
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    if (value !== 'new') {
      setNewUserName('');
    }
  };

  const handleSubmitTasting = async (e: React.FormEvent, silent = false) => {
    if (!silent) e.preventDefault();
    const userName = selectedUser === 'new' ? newUserName.trim() : selectedUser;
    if (!userName || !selectedThemeId) return;

    if (!silent) setSubmitting(true);
    try {
      const request: SubmitTastingRequest = {
        user_name: userName,
        whiskey_scores: scores,
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
                  Rate each whiskey on a scale of 1-5 (1 being worst, 5 being best) for Aroma, Flavor, and Finish.
                  Then rank them from 1 to N (1 being your favorite of the night, N being the least favorite).
                </p>

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
              </div>
            )}

            <Button type="submit" variant="default" disabled={submitting || !selectedUser || !selectedThemeId} className="w-full md:w-auto">
              {submitting ? 'SUBMITTING...' : 'SUBMIT TASTING'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}