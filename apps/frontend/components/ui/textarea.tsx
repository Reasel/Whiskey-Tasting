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
