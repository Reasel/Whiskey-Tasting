'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function AddUser() {
  const router = useRouter();
  const { showToast } = useToast();
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('adminAuthenticated') !== 'true') router.push('/administration');
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) return;
    setSubmitting(true);
    try {
      await createUser(userName.trim());
      router.push('/administration');
    } catch (error) {
      console.error('Error:', error);
      showToast('Failed to add user', 'error');
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
              ADD USER
            </h1>
            <p
              className="font-mono font-medium text-[13px] uppercase tracking-[.22em] mt-4 mb-0"
              style={{ color: 'var(--amber)' }}
            >
              {'// ADD A NEW TASTER'}
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">
            <div className="flex flex-col gap-[9px]">
              <label
                className="font-mono text-[11px] uppercase tracking-[.18em]"
                style={{ color: 'var(--dim)' }}
              >
                User Name
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter user name…"
                className="ad-select"
                required
              />
            </div>
            <Button type="submit" variant="default" disabled={submitting} className="self-start">
              {submitting ? 'ADDING…' : 'ADD USER'}
            </Button>
          </form>
          <p className="font-sans text-sm mt-6" style={{ color: 'var(--muted)' }}>
            Users appear in the tasting submission dropdown after being added here.
          </p>
        </div>
      </div>
    </div>
  );
}
