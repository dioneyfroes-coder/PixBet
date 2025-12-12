import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Theme, ThemeContextValue } from '../types/theme';
import { SUPPORTED_THEMES } from '../types/theme';

const THEME_STORAGE_KEY = 'frontbet:theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && SUPPORTED_THEMES.includes(value as Theme);
}

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  const prefersDark = mediaQuery?.matches ?? false;
  return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(getPreferredTheme());
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

export const availableThemes = [...SUPPORTED_THEMES];
