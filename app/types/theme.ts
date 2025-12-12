export const SUPPORTED_THEMES = ['light', 'dark', 'high-contrast'] as const;

export type Theme = (typeof SUPPORTED_THEMES)[number];

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (next: Theme) => void;
}
