import { cn } from '../../lib';
import type { ButtonProps, ButtonSize, ButtonVariant } from '../../types/ui';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-bg)] hover:brightness-110',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]',
  outline:
    'bg-transparent text-[var(--color-text)] border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)]',
  ghost: 'bg-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]',
  destructive: 'bg-[var(--color-danger)] text-[var(--color-bg)] hover:brightness-110',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-full px-4 text-sm',
  md: 'h-11 rounded-full px-5 text-base',
  lg: 'h-12 rounded-full px-6 text-base',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)] disabled:opacity-60 disabled:pointer-events-none',
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--color-bg)] border-t-transparent"
          aria-hidden
        />
      )}
      {icon}
      {children}
    </button>
  );
}
