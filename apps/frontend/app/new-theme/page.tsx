'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createTheme, type CreateThemeRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewTheme() {
  const router = useRouter();
  const [themeName, setThemeName] = useState('');
  const [themeNotes, setThemeNotes] = useState('');
  const [numWhiskeys, setNumWhiskeys] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuthenticated');
    if (auth !== 'true') {
      router.push('/administration');
    }
  }, [router]);

  const handleThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeName.trim()) return;

    setSubmitting(true);
    try {
      const request: CreateThemeRequest = {
        name: themeName.trim(),
        notes: themeNotes.trim(),
        num_whiskeys: numWhiskeys,
      };
      await createTheme(request);
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Failed to create theme:', error);
      alert('Failed to create theme. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F0F0E8] flex justify-center items-start py-12 px-4 md:px-8">
      <div className="w-full max-w-4xl border border-black bg-[#F0F0E8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="border-b border-black p-8 md:p-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-serif text-5xl md:text-7xl text-black tracking-tight leading-[0.95]">
                NEW THEME
              </h1>
              <p className="mt-6 text-sm font-mono text-steel-grey uppercase tracking-wide max-w-md font-bold">
                {'// CREATE A NEW TASTING THEME'}
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
          <form onSubmit={handleThemeSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="themeName">Theme Name</Label>
              <Input
                id="themeName"
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="themeNotes">Description/Notes</Label>
              <Textarea
                id="themeNotes"
                value={themeNotes}
                onChange={(e) => setThemeNotes(e.target.value)}
                placeholder="Enter theme description..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numWhiskeys">Number of Whiskeys</Label>
              <Input
                id="numWhiskeys"
                type="number"
                min="1"
                max="20"
                value={numWhiskeys}
                onChange={(e) => setNumWhiskeys(parseInt(e.target.value) || 1)}
                placeholder="Enter number of whiskeys..."
                required
              />
            </div>

            <Button type="submit" variant="default" disabled={submitting} className="w-full md:w-auto">
              {submitting ? 'CREATING...' : 'CREATE THEME'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}