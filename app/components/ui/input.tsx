import { useId } from 'react';
import { cn } from '../../lib';
import type { InputProps } from '../../types/ui';

export function Input({
  label,
  description,
  error,
  startIcon,
  endIcon,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <label className="flex flex-col gap-1 text-sm text-[var(--color-muted)]" htmlFor={inputId}>
      {label}
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-transparent px-3 py-2 text-[var(--color-text)] focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]',
          error ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-border)]',
          className
        )}
      >
        {startIcon && <span className="text-[var(--color-muted)]">{startIcon}</span>}
        <input
          id={inputId}
          className="flex-1 border-none bg-transparent text-base text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none"
          aria-describedby={error ? errorId : description ? descriptionId : undefined}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {endIcon && <span className="text-[var(--color-muted)]">{endIcon}</span>}
      </div>
      {description && !error && (
        <span id={descriptionId} className="text-xs text-[var(--color-muted)]">
          {description}
        </span>
      )}
      {error && (
        <span id={errorId} className="text-xs text-[var(--color-danger)]">
          {error}
        </span>
      )}
    </label>
  );
}
