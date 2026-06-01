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
