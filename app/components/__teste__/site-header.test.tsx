import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { SiteHeader } from '../site-header';
import { I18nProvider } from '../../i18n/i18n-provider';
import { LOCALE_STORAGE_KEY } from '../../i18n/config';
import { handleLogout } from '../../lib/auth';
import { logout as logoutRequest } from '../../lib/sdk/clients/auth';

vi.mock('../../lib/auth', () => ({
  handleLogout: vi.fn().mockResolvedValue(undefined),
  setLogoutHandler: vi.fn(),
}));

vi.mock('../../lib/sdk/clients/auth', () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

const mockNavigate = vi.fn();
const mockUseAuthState = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../stores/auth-context', () => ({
  useAuthState: () => mockUseAuthState(),
}));

vi.mock('../../theme/theme-switcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}));

vi.mock('../../i18n/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockUseAuthState.mockReturnValue({ isAuthenticated: false });
  vi.mocked(logoutRequest).mockClear();
  vi.mocked(handleLogout).mockClear();
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-BR');
});

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(LOCALE_STORAGE_KEY);
});

describe('SiteHeader', () => {
  it('shows brand, search and action buttons', () => {
    render(
      <MemoryRouter>
        <I18nProvider initialLocale="pt-BR">
          <SiteHeader />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'FrontBet' })).toHaveAttribute('href', '/');
    expect(screen.getByPlaceholderText(/Buscar jogos/)).toBeInTheDocument();
    expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Painel' })).not.toBeInTheDocument();
  });

  it('renders dashboard and logout when authenticated', async () => {
    mockUseAuthState.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter>
        <I18nProvider initialLocale="pt-BR">
          <SiteHeader />
        </I18nProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Painel' })).toBeInTheDocument();
    const logoutButton = screen.getByRole('button', { name: 'Sair' });
    await userEvent.click(logoutButton);
    expect(logoutRequest).toHaveBeenCalled();
    expect(handleLogout).toHaveBeenCalled();
  });
});
