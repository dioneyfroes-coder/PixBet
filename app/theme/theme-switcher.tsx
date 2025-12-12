import type { ReactElement } from 'react';
import { availableThemes, useTheme } from './theme-provider';
type Theme = (typeof availableThemes)[number];

const themeLabels: Record<Theme, string> = {
  light: 'Claro',
  dark: 'Escuro',
  'high-contrast': 'Alto contraste',
};

const themeOrder: Theme[] = [...availableThemes];

const themeIcons: Record<Theme, ReactElement> = {
  light: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-13.728L7.05 7.05m10.607 9.9 1.414 1.414" />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden focusable="false" fill="currentColor">
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 6.5 6.5 0 1 0 21 14.5Z" />
    </svg>
  ),
  'high-contrast': (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="6" />
      <path d="M12 6v12" />
    </svg>
  ),
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition hover:border-[color:var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]"
      title={`Mudar para ${themeLabels[nextTheme]}`}
    >
      <span className="sr-only">{themeLabels[theme]}</span>
      {themeIcons[theme]}
    </button>
  );
}
