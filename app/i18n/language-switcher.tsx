import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from './i18n-provider';

export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLocale = useMemo(() => {
    return availableLocales.find((entry) => entry.code === locale) ?? availableLocales[0];
  }, [availableLocales, locale]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const srLabel = useMemo(
    () => `${t('common.language')}: ${currentLocale.label}`,
    [currentLocale.label, t]
  );

  const handleSelect = (code: typeof currentLocale.code) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-lg shadow-sm transition hover:border-[color:var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
        aria-label={srLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden>{currentLocale.flag ?? '🌐'}</span>
        <span className="sr-only">{srLabel}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-lg"
        >
          {availableLocales.map((entry) => (
            <button
              key={entry.code}
              type="button"
              role="menuitemradio"
              aria-checked={entry.code === locale}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-[color:var(--color-surface-muted)] ${
                entry.code === locale ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}
              onClick={() => handleSelect(entry.code)}
            >
              <span className="text-lg" aria-hidden>
                {entry.flag ?? '🌐'}
              </span>
              <span>{entry.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
