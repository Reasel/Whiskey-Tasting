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
      await createTheme({
        name: themeName.trim(),
        notes: themeNotes.trim(),
        num_whiskeys: numWhiskeys,
      } as CreateThemeRequest);
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
            <h1
              className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0"
              style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}
            >
              NEW THEME
            </h1>
            <p
              className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
              style={{ color: 'var(--amber)' }}
            >
              {'// CREATE A NEW TASTING THEME'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/administration')}
            className="whitespace-nowrap"
          >
            ← ADMIN
          </Button>
        </div>
        <div className="ad-panel-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[26px]">
            {/* Theme name */}
            <div className="flex flex-col gap-[9px]">
              <label
                className="font-mono text-[11px] uppercase tracking-[.18em]"
                style={{ color: 'var(--dim)' }}
              >
                Theme Name
              </label>
              <input
                id="themeName"
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
              <label
                className="font-mono text-[11px] uppercase tracking-[.18em]"
                style={{ color: 'var(--dim)' }}
              >
                Description / Notes
              </label>
              <textarea
                id="themeNotes"
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
              <label
                className="font-mono text-[11px] uppercase tracking-[.18em]"
                style={{ color: 'var(--dim)' }}
              >
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
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--amber)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--bg)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)';
                  }}
                >
                  –
                </button>
                <span
                  className="w-[58px] text-center font-mono font-bold text-[18px] leading-[48px]"
                  style={{
                    borderLeft: '1px solid var(--line)',
                    borderRight: '1px solid var(--line)',
                    color: 'var(--cream)',
                  }}
                >
                  {numWhiskeys}
                </span>
                <button
                  type="button"
                  onClick={() => stepWhiskeys(1)}
                  className="w-12 h-12 flex items-center justify-center font-mono text-[22px] transition-colors duration-150"
                  style={{ color: 'var(--amber)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--amber)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--bg)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)';
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={submitting}
              className="self-start text-[15px] px-8 py-[17px] h-auto"
            >
              {submitting ? 'CREATING…' : 'CREATE THEME'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
