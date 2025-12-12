import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import Register from '../register';
import { I18nProvider } from '../../i18n/i18n-provider';
import { LOCALE_STORAGE_KEY } from '../../i18n/config';
import { AuthProvider } from '../../stores/auth-context';
vi.mock('../../theme/theme-switcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}));

vi.mock('../../i18n/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher" />,
}));
import { ApiError } from '../../lib';
import {
  register as registerRequest,
  login as loginRequest,
  type AuthSession,
} from '../../lib/sdk/clients/auth';
import { setTokens } from '../../lib/token';

vi.mock('../../lib/sdk/clients/auth', () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock('../../lib/token', async () => {
  const actual = await vi.importActual<typeof import('../../lib/token')>('../../lib/token');
  return {
    ...actual,
    setTokens: vi.fn(),
    readTokensFromCookies: vi.fn(),
    subscribeToTokens: vi.fn(() => () => undefined),
  };
});

const mockNavigate = vi.fn();
const mockUseLoaderData = vi.fn();

const mockUser = {
  id: 'user-1',
  email: 'maria@exemplo.com',
  username: 'maria_silva',
  status: 'ACTIVE' as const,
  createdAt: '2025-01-01T00:00:00.000Z',
  firstName: 'Maria',
  lastName: 'Silva',
};

const createSession = (overrides: Partial<AuthSession> = {}): AuthSession => {
  const { user: userOverride, ...rest } = overrides;
  return {
    accessToken: 'token',
    refreshToken: 'refresh',
    user: { ...mockUser, ...(userOverride ?? {}) },
    ...rest,
  };
};

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLoaderData: () => mockUseLoaderData(),
  };
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <AuthProvider initialState={false}>
        <I18nProvider initialLocale="pt-BR">
          <Register />
        </I18nProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Nome'), ' Maria ');
  await userEvent.type(screen.getByLabelText('Sobrenome'), ' Silva ');
  await userEvent.type(screen.getByLabelText('Usuário'), 'maria_silva');
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await userEvent.type(screen.getByLabelText('Senha'), 'supersegura');
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockUseLoaderData.mockReturnValue({ redirectTo: '/perfil' });
  vi.mocked(registerRequest).mockReset();
  vi.mocked(loginRequest).mockReset();
  vi.mocked(setTokens).mockReset();
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-BR');
});

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(LOCALE_STORAGE_KEY);
});

describe('Register route', () => {
  it('submits registration and navigates after auto-login success', async () => {
    vi.mocked(registerRequest).mockResolvedValue(createSession());
    vi.mocked(loginRequest).mockResolvedValue(createSession());

    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(
      () => {
        expect(registerRequest).toHaveBeenCalledWith({
          firstName: 'Maria',
          lastName: 'Silva',
          username: 'maria_silva',
          email: 'maria@exemplo.com',
          password: 'supersegura',
        });
      },
      { timeout: 10000 }
    );

    await waitFor(
      () => {
        expect(loginRequest).toHaveBeenCalledWith(
          { email: 'maria@exemplo.com', password: 'supersegura' },
          { suppressErrorHandler: true }
        );
      },
      { timeout: 10000 }
    );

    await waitFor(
      () => {
        expect(setTokens).toHaveBeenCalledWith({ accessToken: 'token', refreshToken: 'refresh' });
      },
      { timeout: 10000 }
    );
    expect(mockNavigate).toHaveBeenCalledWith('/perfil');
  }, 15000);

  it('shows success feedback when auto-login fails', async () => {
    vi.mocked(registerRequest).mockResolvedValue(createSession());
    vi.mocked(loginRequest).mockRejectedValue(new Error('login failed'));

    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => {
      expect(registerRequest).toHaveBeenCalled();
    });

    expect(setTokens).not.toHaveBeenCalled();
    expect(loginRequest).toHaveBeenCalledWith(
      { email: 'maria@exemplo.com', password: 'supersegura' },
      { suppressErrorHandler: true }
    );
    expect(
      await screen.findByText('Conta criada! Se necessário, finalize o login com suas credenciais.')
    ).toBeInTheDocument();
  });

  it('skips auto-login when backend marks account as pending', async () => {
    vi.mocked(registerRequest).mockResolvedValue(
      createSession({ user: { ...mockUser, status: 'PENDING_VERIFICATION' } })
    );

    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(
      await screen.findByText(
        'Conta criada! Estamos ativando seu acesso e avisaremos assim que puder entrar.'
      )
    ).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
    expect(setTokens).not.toHaveBeenCalled();
  });

  it('surface conflict errors from API', async () => {
    vi.mocked(registerRequest).mockRejectedValue(new ApiError('conflict', 409));

    renderRegister();
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Já existe uma conta com esses dados.')).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
    expect(setTokens).not.toHaveBeenCalled();
  });
});
