import { cn } from '../../lib';
import type { ToggleProps } from '../../types/ui';

export function Toggle({
  checked,
  onChange,
  label,
  description,
  className,
  ...props
}: ToggleProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 rounded-full border px-1 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]',
          checked
            ? 'border-[color:var(--color-primary)] bg-[var(--color-primary)]'
            : 'border-[color:var(--color-border)] bg-[var(--color-surface)]'
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-[var(--color-bg)] shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
        <span className="sr-only">{label}</span>
      </button>
      {(label || description) && (
        <div className="text-sm">
          {label && <p className="font-medium text-[var(--color-text)]">{label}</p>}
          {description && <p className="text-[var(--color-muted)]">{description}</p>}
        </div>
      )}
    </div>
  );
}
