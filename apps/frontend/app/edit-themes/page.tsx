'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchThemes, fetchWhiskeysByTheme, updateTheme, updateWhiskeys, type Theme, type Whiskey } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

export default function EditThemes() {
  const router = useRouter();
  const { showToast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [whiskeys, setWhiskeys] = useState<Whiskey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth !== 'true') {
      router.push('/administration');
    }
  }, [router]);

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      loadWhiskeys(selectedTheme.id!);
    }
  }, [selectedTheme]);

  const loadThemes = async () => {
    try {
      const response = await fetchThemes();
      setThemes(response.themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhiskeys = async (themeId: number) => {
    try {
      const whiskeysData = await fetchWhiskeysByTheme(themeId);
      setWhiskeys(whiskeysData);
    } catch (error) {
      console.error('Failed to load whiskeys:', error);
    }
  };

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
  };

  const handleSaveTheme = async () => {
    if (!selectedTheme) return;
    try {
      await updateTheme(selectedTheme.id!, { name: selectedTheme.name, notes: selectedTheme.notes });
      showToast('Theme updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update theme:', error);
      showToast('Failed to update theme.', 'error');
    }
  };

  const handleWhiskeyChange = (index: number, field: 'name' | 'proof', value: string | number | null) => {
    const updatedWhiskeys = [...whiskeys];
    updatedWhiskeys[index] = { ...updatedWhiskeys[index], [field]: value };
    setWhiskeys(updatedWhiskeys);
  };

  const handleSaveWhiskeys = async () => {
    if (!selectedTheme) return;
    try {
      const whiskeysData = whiskeys.map(w => ({ name: w.name, proof: w.proof }));
      await updateWhiskeys(selectedTheme.id!, whiskeysData);
      showToast('Whiskeys updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update whiskeys:', error);
      showToast('Failed to update whiskeys.', 'error');
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
                EDIT THEMES
              </h1>
              <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
                {'// SELECT A THEME TO EDIT'}
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
          {!selectedTheme ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="border border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] transition-shadow"
                  onClick={() => handleThemeSelect(theme)}
                >
                  <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-black mb-2">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{theme.notes}</p>
                  <p className="text-xs text-gray-400">{new Date(theme.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <Button onClick={() => setSelectedTheme(null)} variant="outline">
                ← Back to Themes
              </Button>

              <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
                <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-black mb-6">
                  EDIT THEME: {selectedTheme.name}
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="themeName">Theme Name</Label>
                    <Input
                      id="themeName"
                      value={selectedTheme.name}
                      onChange={(e) => setSelectedTheme({ ...selectedTheme, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="themeNotes">Notes</Label>
                    <Textarea
                      id="themeNotes"
                      value={selectedTheme.notes}
                      onChange={(e) => setSelectedTheme({ ...selectedTheme, notes: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleSaveTheme}>Save Changes</Button>
                </div>
              </div>

              <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
                <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-black mb-6">
                  WHISKEYS
                </h2>

                <div className="space-y-4">
                  {whiskeys.map((whiskey, index) => (
                    <div key={whiskey.id} className="border border-gray-300 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={whiskey.name}
                            onChange={(e) => handleWhiskeyChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Proof (%)</Label>
                          <Input
                            type="number"
                            value={whiskey.proof || ''}
                            onChange={(e) => handleWhiskeyChange(index, 'proof', parseFloat(e.target.value) || null)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="mt-4" onClick={handleSaveWhiskeys}>Save Whiskey Changes</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}