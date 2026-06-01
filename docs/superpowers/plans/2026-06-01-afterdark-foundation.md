# After Dark — Foundation & Components Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the After Dark design system — CSS tokens, keyframes, shared CSS classes, updated UI components, and three new interactive components (PipRater, RankPills, CelebrateOverlay) — so that the page-rewrite plan can consume them.

**Architecture:** All tokens live in `:root` CSS custom properties in `globals.css`. Shared structural classes (`.ad-panel`, `.ad-tile`, `.ad-screen`, etc.) also go in `globals.css` to avoid Tailwind arbitrary-value repetition. Existing UI components (Button, Input, Label, Textarea) are restyled in-place. Three new components are TDD'd before use.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest + @testing-library/react, next/font/google (Fraunces)

---

## File Map

**New files:**
- `apps/frontend/components/ui/pip-rater.tsx`
- `apps/frontend/components/ui/pip-rater.test.tsx`
- `apps/frontend/components/ui/rank-pills.tsx`
- `apps/frontend/components/ui/rank-pills.test.tsx`
- `apps/frontend/components/ui/celebrate-overlay.tsx`
- `apps/frontend/public/logo.svg`

**Modified files:**
- `apps/frontend/app/(default)/css/globals.css`
- `apps/frontend/app/layout.tsx`
- `apps/frontend/tailwind.config.js`
- `apps/frontend/components/ui/button.tsx`
- `apps/frontend/components/ui/input.tsx`
- `apps/frontend/components/ui/label.tsx`
- `apps/frontend/components/ui/textarea.tsx`

---

## Task 1: CSS Foundation

**Files:**
- Modify: `apps/frontend/app/(default)/css/globals.css`
- Modify: `apps/frontend/app/layout.tsx`
- Modify: `apps/frontend/tailwind.config.js`

- [ ] **Step 1: Replace globals.css**

Replace the full content of `apps/frontend/app/(default)/css/globals.css`:

```css
@import 'tailwindcss';
@import 'tw-animate-css';

/* ============ AFTER DARK — DESIGN TOKENS ============ */
:root {
  --bg: #15120c;
  --bg2: #1d1810;
  --panel: #221c13;
  --raise: #2a2317;
  --cream: #efe7d4;
  --dim: #b8ad94;
  --muted: #8a8068;
  --line: #3a3120;
  --amber: #f4a937;
  --amber-soft: #f6c069;
  --ember: #c9742a;
  --deep: #8a4a16;
  --glow: rgba(244, 169, 55, 0.3);
  --glow-soft: rgba(244, 169, 55, 0.14);
  --red: #e0563f;
  --green: #8fbf6a;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-fraunces: 'Fraunces', Georgia, serif;
}

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  body {
    background: var(--bg);
    color: var(--cream);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
  }
  button {
    cursor: pointer;
    font: inherit;
    color: inherit;
    border: none;
    background: none;
  }
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }
}

/* ============ KEYFRAMES ============ */
@keyframes screen-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pip-pop {
  0%   { transform: scaleY(0.6); }
  60%  { transform: scaleY(1.12); }
  100% { transform: scaleY(1); }
}
@keyframes ad-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--amber); }
  50%       { opacity: 0.4; box-shadow: 0 0 4px var(--amber); }
}
@keyframes gradient {
  to { background-position: 200% center; }
}

/* ============ ANIMATION UTILITIES ============ */
.screen-enter {
  animation: screen-in 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.stagger-enter > *:nth-child(1) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.02s both; }
.stagger-enter > *:nth-child(2) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both; }
.stagger-enter > *:nth-child(3) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.14s both; }
.stagger-enter > *:nth-child(4) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.20s both; }
.stagger-enter > *:nth-child(5) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.26s both; }
.stagger-enter > *:nth-child(6) { animation: stagger-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.32s both; }

@media (prefers-reduced-motion: reduce) {
  .screen-enter,
  .stagger-enter > * {
    animation: none !important;
  }
}

/* ============ PAGE SHELL ============ */
/* Full-screen page wrapper with ambient candlelight radial glows */
.ad-screen {
  min-height: 100vh;
  padding: 40px 24px 80px;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(244, 169, 55, 0.16), transparent 60%),
    radial-gradient(80% 60% at 80% 110%, rgba(201, 116, 42, 0.12), transparent 60%),
    var(--bg);
}

/* Main panel card */
.ad-panel {
  max-width: 1180px;
  margin: 0 auto;
  background: linear-gradient(180deg, var(--panel), var(--bg2));
  border: 1px solid var(--line);
  box-shadow:
    0 30px 80px -20px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(244, 169, 55, 0.04);
}

/* Panel header (44px padding, bottom border) */
.ad-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 44px;
  border-bottom: 1px solid var(--line);
}

/* Panel body */
.ad-panel-body {
  padding: 34px 44px 48px;
}

/* ============ HOME TILES ============ */
.ad-tile {
  text-align: left;
  background: var(--raise);
  border: 1px solid var(--line);
  color: var(--cream);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 168px;
  padding: 28px 24px 22px;
}
.ad-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 80% at 50% 120%, var(--glow-soft), transparent 60%);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}
.ad-tile:hover {
  border-color: var(--amber);
  transform: translateY(-3px);
  box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8), 0 0 30px -8px var(--glow);
}
.ad-tile:hover::after {
  opacity: 1;
}
.ad-tile:hover .ad-tile-arrow {
  transform: translateX(5px);
}
.ad-tile-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--amber);
  position: relative;
  z-index: 1;
}
.ad-tile-label {
  font-family: var(--font-fraunces);
  font-weight: 600;
  font-size: 27px;
  line-height: 1.05;
  margin-top: auto;
  position: relative;
  z-index: 1;
}
.ad-tile-arrow {
  font-family: var(--font-mono);
  font-size: 22px;
  align-self: flex-end;
  color: var(--amber);
  transition: transform 0.2s ease;
  position: relative;
  z-index: 1;
}

/* ============ ADMIN TILES ============ */
.ad-admin-tile {
  text-align: left;
  border: 1px solid var(--line);
  padding: 30px 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  background: var(--raise);
  color: var(--cream);
  transition: all 0.25s ease;
}
.ad-admin-tile:hover {
  border-color: var(--amber);
  transform: translateY(-2px);
  box-shadow: 0 0 30px -10px var(--glow);
}
.ad-admin-tile.danger:hover {
  border-color: var(--red);
  box-shadow: 0 0 30px -10px rgba(224, 86, 63, 0.5);
}
.ad-admin-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--amber);
  text-transform: uppercase;
}
.ad-admin-tile.danger .ad-admin-sub {
  color: var(--red);
}
.ad-admin-label {
  font-family: var(--font-fraunces);
  font-weight: 600;
  font-size: 23px;
}

/* ============ POUR CARD ============ */
.ad-pour-card {
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.22);
  transition: all 0.25s ease;
}
.ad-pour-card:hover {
  border-color: rgba(244, 169, 55, 0.4);
  box-shadow: 0 0 30px -10px var(--glow);
}

/* ============ TAB BAR ============ */
.ad-tab {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 11px 18px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--dim);
  transition: all 0.2s ease;
  cursor: pointer;
}
.ad-tab:hover {
  color: var(--cream);
  border-color: var(--muted);
}
.ad-tab.active {
  background: var(--amber);
  color: var(--bg);
  border-color: var(--amber);
  box-shadow: 0 0 20px var(--glow-soft);
}

/* ============ DATA TABLES ============ */
.ad-table {
  width: 100%;
  border-collapse: collapse;
}
.ad-table th {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: left;
  color: var(--amber);
  padding: 0 14px 14px;
  border-bottom: 1px solid var(--line);
}
.ad-table td {
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 15px 14px;
  border-bottom: 1px solid rgba(58, 49, 32, 0.5);
  color: var(--cream);
}
.ad-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ad-table tbody tr {
  transition: background 0.15s ease;
}
.ad-table tbody tr:hover {
  background: rgba(244, 169, 55, 0.05);
}

/* ============ ACCORDION (By Theme) ============ */
.ad-acc-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
.ad-acc-body.open {
  grid-template-rows: 1fr;
}
.ad-acc-body-inner {
  overflow: hidden;
  min-height: 0;
}

/* ============ FORM CONTROLS ============ */
.ad-select {
  font-family: var(--font-sans);
  font-size: 16px;
  padding: 14px 15px;
  border: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.3);
  color: var(--cream);
  border-radius: 0;
  width: 100%;
}
.ad-select:focus {
  outline: none;
  border-color: var(--amber);
  box-shadow: 0 0 18px var(--glow-soft);
}
.ad-select option {
  background: var(--panel);
  color: var(--cream);
}

/* ============ LIVE DOT ============ */
.ad-dot-live {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: var(--amber);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--amber);
  animation: ad-pulse 1.8s infinite;
  flex-shrink: 0;
}

/* ============ PROGRESS BAR ============ */
.ad-progress {
  flex: 1;
  min-width: 160px;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--line);
  overflow: hidden;
}
.ad-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ember), var(--amber));
  box-shadow: 0 0 14px var(--glow);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ RESULTS: PODIUM ============ */
.ad-podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.ad-podium-col.rise {
  opacity: 1;
  transform: translateY(0);
}
.ad-glass-pour {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0;
  background: linear-gradient(180deg, var(--amber-soft), var(--ember));
  box-shadow: 0 0 40px var(--glow);
  transition: height 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ RESULTS: BARS ============ */
.ad-bar-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--ember), var(--amber));
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ RESULTS: CONSENSUS ============ */
.ad-cons-fill {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--ember), var(--amber));
  transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 520px) {
  .ad-screen {
    padding: 24px 16px 48px;
  }
  .ad-panel-head {
    padding: 24px 20px;
    flex-direction: column;
    gap: 16px;
  }
  .ad-panel-body {
    padding: 20px 20px 32px;
  }
}
```

- [ ] **Step 2: Update layout.tsx to add Fraunces**

Replace `apps/frontend/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './(default)/css/globals.css';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const fraunces = Fraunces({
  weight: ['600', '900'],
  subsets: ['latin'],
  variable: '--font-fraunces',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Whiskey Tasting',
  description: 'Log Whiskey Tasting entries for the night',
  applicationName: 'Whiskey Tasting',
  keywords: ['whiskey', 'tasting'],
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full">
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable} antialiased min-h-full`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update tailwind.config.js to add fraunces font family**

Replace `apps/frontend/tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      animation: {
        gradient: 'gradient 8s linear infinite',
      },
      keyframes: {
        gradient: {
          to: { 'background-position': '200% center' },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Commit foundation**

```bash
git add apps/frontend/app/\(default\)/css/globals.css apps/frontend/app/layout.tsx apps/frontend/tailwind.config.js
git commit -m "feat: add After Dark CSS tokens, keyframes, shared classes, and Fraunces font"
```

---

## Task 2: Shared UI Components

**Files:**
- Modify: `apps/frontend/components/ui/button.tsx`
- Modify: `apps/frontend/components/ui/input.tsx`
- Modify: `apps/frontend/components/ui/label.tsx`
- Modify: `apps/frontend/components/ui/textarea.tsx`

- [ ] **Step 1: Run existing component tests to establish baseline**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | head -60
```

Note any currently failing tests before making changes.

- [ ] **Step 2: Replace button.tsx**

Replace `apps/frontend/components/ui/button.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const base = cn(
      'inline-flex items-center justify-center gap-2',
      'whitespace-nowrap text-sm font-medium font-mono uppercase tracking-wide',
      'transition-all duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
      'disabled:pointer-events-none disabled:opacity-40',
      "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
      'rounded-none'
    );

    const variants: Record<string, string> = {
      default: cn(
        'bg-[var(--amber)] text-[var(--bg)] border border-[var(--amber)]',
        'shadow-[0_0_20px_var(--glow-soft)]',
        'hover:bg-[var(--amber-soft)] hover:shadow-[0_0_34px_var(--glow)]',
        'active:translate-y-px'
      ),
      destructive: cn(
        'bg-[var(--red)] text-[var(--cream)] border border-[var(--red)]',
        'hover:shadow-[0_0_24px_rgba(224,86,63,0.5)]',
        'active:translate-y-px'
      ),
      success: cn(
        'bg-[var(--green)] text-[var(--bg)] border border-[var(--green)]',
        'hover:shadow-[0_0_20px_rgba(143,191,106,0.4)]',
        'active:translate-y-px'
      ),
      warning: cn(
        'bg-orange-500 text-white border border-orange-500',
        'hover:bg-orange-600',
        'active:translate-y-px'
      ),
      outline: cn(
        'bg-transparent text-[var(--dim)] border border-[var(--line)]',
        'hover:border-[var(--cream)] hover:text-[var(--cream)]',
        'active:translate-y-px'
      ),
      secondary: cn(
        'bg-[var(--raise)] text-[var(--cream)] border border-[var(--line)]',
        'hover:border-[var(--amber)] hover:text-[var(--amber)]',
        'active:translate-y-px'
      ),
      ghost: cn(
        'bg-transparent text-[var(--dim)] border-none shadow-none',
        'hover:text-[var(--cream)]'
      ),
      link: cn(
        'bg-transparent text-[var(--amber)] border-none shadow-none',
        'underline-offset-4 hover:underline p-0 h-auto'
      ),
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-6 py-2',
      sm: 'h-8 px-4 py-1 text-xs',
      lg: 'h-12 px-8 py-3 text-base',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
```

- [ ] **Step 3: Replace input.tsx**

Replace `apps/frontend/components/ui/input.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-none border border-[var(--line)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-sm',
          'text-[var(--cream)] placeholder:text-[var(--muted)]',
          'focus-visible:outline-none focus-visible:border-[var(--amber)] focus-visible:shadow-[0_0_18px_var(--glow-soft)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 4: Replace label.tsx**

Replace `apps/frontend/components/ui/label.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--dim)]',
        'leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
```

- [ ] **Step 5: Replace textarea.tsx**

Replace `apps/frontend/components/ui/textarea.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-none border border-[var(--line)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-sm',
          'text-[var(--cream)] placeholder:text-[var(--muted)]',
          'focus-visible:outline-none focus-visible:border-[var(--amber)] focus-visible:shadow-[0_0_18px_var(--glow-soft)]',
          'disabled:cursor-not-allowed disabled:opacity-50 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
```

- [ ] **Step 6: Run component tests and fix any failures**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -40
```

If button tests fail because they assert specific CSS classes (e.g. `bg-amber-500`), update the assertions to match the new class names. Open the test file, find failing assertions, and update them to reference the new class values (e.g. `bg-[var(--amber)]`). Do not change the behavior assertions — only update class-name string assertions that reference the old light-theme values.

- [ ] **Step 7: Commit shared UI components**

```bash
git add apps/frontend/components/ui/button.tsx apps/frontend/components/ui/input.tsx apps/frontend/components/ui/label.tsx apps/frontend/components/ui/textarea.tsx
git commit -m "feat: restyle UI components to After Dark dark theme"
```

---

## Task 3: PipRater Component (TDD)

**Files:**
- Create: `apps/frontend/components/ui/pip-rater.test.tsx`
- Create: `apps/frontend/components/ui/pip-rater.tsx`

The PipRater is the most important new component. It replaces the number inputs for Aroma, Flavor, and Finish. Five vertically-filled "pip" buttons plus an exact decimal text input stay in sync.

Behaviour contract:
- Clicking pip N sets value to N; clicking already-active pip N sets value to N−1 (toggle-down).
- Typing in the input (digits + one dot only) updates pips fractionally in real time.
- On blur the input clamps to 0–5 and reformats to ≤2 decimals.
- When `value` changes from outside (theme reset), the input display updates if not focused.
- `value === 0` means unset.

- [ ] **Step 1: Write the failing tests**

Create `apps/frontend/components/ui/pip-rater.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PipRater } from './pip-rater';

describe('PipRater', () => {
  it('renders 5 pip buttons', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders a text input', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange with pip number when pip clicked', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]); // pip 3 (0-indexed)
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('decrements by 1 when clicking the currently active pip (toggle-down)', () => {
    const onChange = vi.fn();
    render(<PipRater value={3} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]); // pip 3, currently value=3
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('strips non-numeric/non-dot characters from input', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc4.2x' } });
    expect(input.value).toBe('4.2');
  });

  it('calls onChange with parsed decimal value on input change', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '4.17' } });
    expect(onChange).toHaveBeenCalledWith(4.17);
  });

  it('clamps to max 5 on blur', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('calls onChange(0) on blank blur', () => {
    const onChange = vi.fn();
    render(<PipRater value={3} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('shows current value in the input when value prop is non-zero', () => {
    render(<PipRater value={4} onChange={vi.fn()} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('4');
  });
});
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
cd apps/frontend && npx vitest run components/ui/pip-rater.test.tsx --reporter=verbose 2>&1
```

Expected: `Error: Cannot find module './pip-rater'`

- [ ] **Step 3: Implement pip-rater.tsx**

Create `apps/frontend/components/ui/pip-rater.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd apps/frontend && npx vitest run components/ui/pip-rater.test.tsx --reporter=verbose 2>&1
```

Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/ui/pip-rater.tsx apps/frontend/components/ui/pip-rater.test.tsx
git commit -m "feat: add PipRater component — tactile 5-pip rater with decimal input"
```

---

## Task 4: RankPills Component (TDD)

**Files:**
- Create: `apps/frontend/components/ui/rank-pills.test.tsx`
- Create: `apps/frontend/components/ui/rank-pills.tsx`

N square pills, single-select. `value === 0` means unset. 1 = favorite of the night.

- [ ] **Step 1: Write failing tests**

Create `apps/frontend/components/ui/rank-pills.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RankPills } from './rank-pills';

describe('RankPills', () => {
  it('renders count pill buttons', () => {
    render(<RankPills count={4} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('labels each button with its rank number', () => {
    render(<RankPills count={3} value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'rank 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'rank 3' })).toBeInTheDocument();
  });

  it('calls onChange with rank number when pill clicked', () => {
    const onChange = vi.fn();
    render(<RankPills count={3} value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'rank 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange when clicking already-selected pill (allows re-select)', () => {
    const onChange = vi.fn();
    render(<RankPills count={3} value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'rank 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('renders correct number of pills when count changes', () => {
    const { rerender } = render(<RankPills count={3} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    rerender(<RankPills count={5} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
cd apps/frontend && npx vitest run components/ui/rank-pills.test.tsx --reporter=verbose 2>&1
```

Expected: `Error: Cannot find module './rank-pills'`

- [ ] **Step 3: Implement rank-pills.tsx**

Create `apps/frontend/components/ui/rank-pills.tsx`:

```tsx
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
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
cd apps/frontend && npx vitest run components/ui/rank-pills.test.tsx --reporter=verbose 2>&1
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/components/ui/rank-pills.tsx apps/frontend/components/ui/rank-pills.test.tsx
git commit -m "feat: add RankPills component — single-select rank pill row"
```

---

## Task 5: CelebrateOverlay Component

**Files:**
- Create: `apps/frontend/components/ui/celebrate-overlay.tsx`

Modal that appears after a successful tasting submission. Animated filling glass, "Cheers, \<name\>." message, two navigation buttons. No new logic — pure presentation.

- [ ] **Step 1: Create celebrate-overlay.tsx**

Create `apps/frontend/components/ui/celebrate-overlay.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/components/ui/celebrate-overlay.tsx
git commit -m "feat: add CelebrateOverlay component — post-submit modal with animated glass fill"
```

---

## Task 6: Logo Asset

**Files:**
- Create: `apps/frontend/public/logo.svg`

- [ ] **Step 1: Copy logo from design bundle**

```bash
cp ~/Downloads/whiskey-afterdark/design_handoff_after_dark_redesign/assets/logo.svg \
   apps/frontend/public/logo.svg
```

- [ ] **Step 2: Verify the file exists and is valid SVG**

```bash
head -3 apps/frontend/public/logo.svg
```

Expected: first line starts with `<svg` or `<?xml`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/public/logo.svg
git commit -m "feat: add After Dark logo SVG asset"
```

---

## Verification

- [ ] **Run all tests one final time**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -30
```

All tests should pass. If any existing test is still failing due to class-name assertions referencing old light-theme values, fix the assertion (not the component).

- [ ] **Spot-check the fonts load in the browser**

```bash
cd apps/frontend && npm run dev -- --port 3010 &
```

Open `http://localhost:3010`. Body background should be near-black (`#15120c`). If it's still beige, hard-refresh to clear Next.js cache. If still wrong, check that `globals.css` is actually imported (it is via `layout.tsx`).

Stop the dev server: `kill %1`

---

**Next:** Proceed to `docs/superpowers/plans/2026-06-01-afterdark-pages.md` to rewrite all pages using these foundations.
