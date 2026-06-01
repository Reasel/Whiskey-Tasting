'use client';

import { useEffect, useRef, useState } from 'react';

export interface PipRaterProps {
  value: number; // 0 = unset; 1–5 integer or decimal like 4.17
  onChange: (value: number) => void;
}

export function PipRater({ value, onChange }: PipRaterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputStr, setInputStr] = useState('');

  // Sync display when value changes externally (e.g. theme/user reset)
  useEffect(() => {
    if (!inputFocused) {
      setInputStr(value > 0 ? String(Math.round(value * 100) / 100) : '');
    }
  }, [value, inputFocused]);

  function handlePipClick(pipNum: number) {
    const next = value === pipNum ? pipNum - 1 : pipNum;
    onChange(next);
    setInputStr(next > 0 ? String(next) : '');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setInputStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(Math.max(0, Math.min(5, parsed)));
    } else {
      onChange(0);
    }
  }

  function handleInputBlur() {
    setInputFocused(false);
    const parsed = parseFloat(inputStr);
    const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(5, parsed));
    onChange(clamped);
    setInputStr(clamped > 0 ? String(Math.round(clamped * 100) / 100) : '');
  }

  // How full pip i (1-based) should be: 0..1
  function pipFill(pip: number): number {
    return Math.max(0, Math.min(1, value - (pip - 1)));
  }

  return (
    <div className="flex flex-col gap-[9px] items-start">
      <div className="flex gap-2" role="group">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = pipFill(i);
          const isOn = fill > 0;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${i} of 5`}
              onClick={() => handlePipClick(i)}
              className="relative inline-flex items-center justify-center w-9 h-10 rounded-none transition-all duration-[140ms] ease-in-out active:translate-y-px select-none"
              style={{
                border: `1px solid ${isOn ? 'rgba(244,169,55,0.5)' : 'var(--line)'}`,
                background: 'rgba(0,0,0,0.3)',
                boxShadow: isOn ? '0 0 16px -2px var(--glow)' : 'none',
              }}
            >
              {/* Amber fill — scaleY from bottom */}
              <span
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, var(--amber-soft), var(--ember))',
                  transformOrigin: 'bottom',
                  transform: `scaleY(${fill})`,
                  transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1)',
                }}
              />
              {/* Number label */}
              <span
                className="relative font-mono text-xs font-medium z-10"
                style={{ color: isOn && fill >= 1 ? 'var(--bg)' : 'var(--muted)' }}
              >
                {i}
              </span>
            </button>
          );
        })}
      </div>

      {/* Exact decimal input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        aria-label="exact score 0 to 5"
        placeholder="·"
        value={inputStr}
        onChange={handleInputChange}
        onFocus={() => setInputFocused(true)}
        onBlur={handleInputBlur}
        className="w-[74px] rounded-none font-mono text-sm font-medium text-center tracking-[0.04em] placeholder:text-[var(--muted)] focus:outline-none"
        style={{
          padding: '7px 10px',
          border: `1px solid ${inputFocused ? 'var(--amber)' : 'var(--line)'}`,
          background: 'rgba(0,0,0,0.34)',
          color: inputFocused ? 'var(--amber-soft)' : 'var(--cream)',
          boxShadow: inputFocused ? '0 0 16px var(--glow-soft)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s, color 0.15s',
        }}
      />
    </div>
  );
}
