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
