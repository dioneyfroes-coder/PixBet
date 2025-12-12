import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeSwitcher } from '../theme-switcher';

const setTheme = vi.fn();
const themeState = { value: 'light' as 'light' | 'dark' | 'high-contrast' };

vi.mock('../theme-provider', () => ({
  availableThemes: ['light', 'dark', 'high-contrast'],
  useTheme: () => ({
    theme: themeState.value,
    setTheme,
  }),
}));

beforeEach(() => {
  setTheme.mockClear();
  themeState.value = 'light';
});

afterEach(() => {
  cleanup();
});

describe('ThemeSwitcher', () => {
  it('cycles to the next theme when activated', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('exposes accessible label for current theme', () => {
    themeState.value = 'high-contrast';
    render(<ThemeSwitcher />);

    const button = screen.getByRole('button', { name: 'Alto contraste' });
    expect(button).toBeInTheDocument();
  });
});
