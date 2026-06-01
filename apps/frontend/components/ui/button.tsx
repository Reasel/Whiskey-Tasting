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
