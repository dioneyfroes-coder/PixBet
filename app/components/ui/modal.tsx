import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib';
import type { ModalProps } from '../../types/ui';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-3xl border border-[color:var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg',
          className
        )}
      >
        {title && (
          <header className="space-y-2">
            <h2 id={titleId} className="text-2xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-[var(--color-muted)]">
                {description}
              </p>
            )}
          </header>
        )}

        <div className="mt-6 space-y-4 text-[var(--color-text)]">{children}</div>

        {footer && <footer className="mt-8 flex flex-wrap gap-3">{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}
