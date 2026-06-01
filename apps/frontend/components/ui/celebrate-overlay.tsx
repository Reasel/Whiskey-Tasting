'use client';

import { useEffect, useState } from 'react';
import { Button } from './button';

export interface CelebrateOverlayProps {
  open: boolean;
  userName: string;
  themeName: string;
  onSeeResults: () => void;
  onHome: () => void;
}

export function CelebrateOverlay({
  open,
  userName,
  themeName,
  onSeeResults,
  onHome,
}: CelebrateOverlayProps) {
  const [cardVisible, setCardVisible] = useState(false);
  const [glassFilled, setGlassFilled] = useState(false);

  useEffect(() => {
    if (open) {
      // Stagger: card first, then glass fill
      const cardTimer = setTimeout(() => setCardVisible(true), 50);
      const glassTimer = setTimeout(() => setGlassFilled(true), 200);
      return () => {
        clearTimeout(cardTimer);
        clearTimeout(glassTimer);
      };
    } else {
      setCardVisible(false);
      setGlassFilled(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(10,8,5,0.75)' }}
    >
      <div
        className="flex flex-col items-center text-center w-full max-w-[460px]"
        style={{
          padding: '50px 46px',
          background: 'linear-gradient(180deg, var(--panel), var(--bg2))',
          border: '1px solid rgba(244,169,55,0.3)',
          boxShadow: '0 40px 100px -20px #000, 0 0 60px -10px var(--glow)',
          transform: cardVisible ? 'translateY(0)' : 'translateY(16px)',
          opacity: cardVisible ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
        }}
      >
        {/* Animated whiskey glass */}
        <div
          className="relative overflow-hidden mx-auto mb-5"
          style={{
            width: 74,
            height: 100,
            border: '1px solid rgba(244,169,55,0.4)',
            clipPath: 'polygon(16% 0, 84% 0, 74% 100%, 26% 100%)',
          }}
        >
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: glassFilled ? '72%' : '0%',
              background: 'linear-gradient(180deg, var(--amber-soft), var(--ember))',
              boxShadow: '0 0 40px var(--glow)',
              transition: 'height 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>

        <p
          className="font-mono text-[13px] tracking-[0.22em] uppercase mt-0 mb-0"
          style={{ color: 'var(--amber)' }}
        >
          {'// LOGGED'}
        </p>

        <h2
          className="font-fraunces font-semibold text-[32px] mt-3 mb-[6px]"
          style={{ color: 'var(--cream)' }}
        >
          Cheers, {userName}.
        </h2>

        <p className="font-sans text-base mb-7" style={{ color: 'var(--muted)' }}>
          Your scores for {themeName} are in.
        </p>

        <div className="flex flex-col gap-[10px] w-full">
          <Button variant="default" className="w-full" onClick={onSeeResults}>
            SEE THE RESULTS
          </Button>
          <Button variant="outline" className="w-full" onClick={onHome}>
            ← HOME
          </Button>
        </div>
      </div>
    </div>
  );
}
