'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

const PASSWORD = 'admin';

export default function Administration() {
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
    } else {
      showToast('Incorrect password', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-center p-4 md:p-8">
        <div className="w-full max-w-md border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] p-8">
          <h1 className="font-serif text-3xl text-black tracking-tight leading-[0.95] mb-6 text-center">
            ADMINISTRATION
          </h1>
          <p className="text-sm font-mono text-steel-grey uppercase tracking-wide mb-6 text-center">
            {'// ENTER PASSWORD'}
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
              />
            </div>
            <Button type="submit" variant="default" className="w-full">
              ENTER
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-start py-12 px-4 md:px-8">
      <div className="w-full max-w-4xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="border-b border-black p-8 md:p-12">
          <h1 className="font-serif text-5xl md:text-7xl text-black tracking-tight leading-[0.95]">
            ADMINISTRATION
          </h1>
          <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
            {'// MANAGE THEMES, USERS, AND SETTINGS'}
          </p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/new-theme">
              <Button variant="default" className="w-full h-24 text-lg font-mono uppercase">
                CREATE NEW THEME
              </Button>
            </Link>
            <Link href="/edit-themes">
              <Button variant="default" className="w-full h-24 text-lg font-mono uppercase">
                EDIT THEMES
              </Button>
            </Link>
            <Link href="/add-user">
              <Button variant="default" className="w-full h-24 text-lg font-mono uppercase">
                ADD USER
              </Button>
            </Link>
            <Link href="/delete-user">
              <Button variant="destructive" className="w-full h-24 text-lg font-mono uppercase">
                DELETE USER
              </Button>
            </Link>
            <Link href="/data-view">
              <Button variant="default" className="w-full h-24 text-lg font-mono uppercase">
                VIEW RESULTS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}