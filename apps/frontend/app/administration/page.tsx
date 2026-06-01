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
              <h1
                className="font-fraunces font-black text-[36px] leading-[.94] tracking-[-0.02em] m-0"
                style={{ color: 'var(--cream)' }}
              >
                ADMINISTRATION
              </h1>
              <p
                className="font-mono text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
                style={{ color: 'var(--amber)' }}
              >
                {'// ENTER PASSWORD'}
              </p>
            </div>
          </div>
          <div className="ad-panel-body">
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-[9px]">
                <label
                  className="font-mono text-[11px] uppercase tracking-[.18em]"
                  style={{ color: 'var(--dim)' }}
                >
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
              <Button type="submit" variant="default" className="w-full">
                ENTER
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    { sub: '// SET UP A NIGHT', label: 'Create New Theme', href: '/new-theme', danger: false },
    { sub: '// TWEAK THE LINEUP', label: 'Edit Themes', href: '/edit-themes', danger: false },
    { sub: '// ONBOARD A TASTER', label: 'Add User', href: '/add-user', danger: false },
    { sub: '// REMOVE A TASTER', label: 'Delete User', href: '/delete-user', danger: true },
    { sub: '// SEE THE RESULTS', label: 'View Results', href: '/data-view', danger: false },
  ];

  return (
    <div className="ad-screen screen-enter">
      <div className="ad-panel">
        <div className="ad-panel-head">
          <div>
            <h1
              className="font-fraunces font-black leading-[.94] tracking-[-0.02em] m-0"
              style={{ fontSize: 'clamp(40px, 6vw, 78px)', color: 'var(--cream)' }}
            >
              ADMINISTRATION
            </h1>
            <p
              className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
              style={{ color: 'var(--amber)' }}
            >
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
