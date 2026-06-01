'use client';

export interface RankPillsProps {
  count: number;
  value: number; // 0 = unset
  onChange: (value: number) => void;
}

export function RankPills({ count, value, onChange }: RankPillsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Personal rank">
      {Array.from({ length: count }, (_, i) => i + 1).map((rank) => {
        const isOn = value === rank;
        return (
          <button
            key={rank}
            type="button"
            aria-label={`rank ${rank}`}
            onClick={() => onChange(rank)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-none font-mono text-sm font-bold transition-all duration-[140ms] ease-in-out active:translate-y-px"
            style={{
              border: `1px solid ${isOn ? 'var(--amber)' : 'var(--line)'}`,
              background: isOn ? 'var(--amber)' : 'rgba(0,0,0,0.3)',
              color: isOn ? 'var(--bg)' : 'var(--dim)',
              boxShadow: isOn ? '0 0 18px var(--glow)' : 'none',
            }}
          >
            {rank}
          </button>
        );
      })}
    </div>
  );
}
