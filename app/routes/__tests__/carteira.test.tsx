import { beforeAll, afterAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nProvider } from '../../i18n/i18n-provider';
import { LOCALE_STORAGE_KEY } from '../../i18n/config';
import { CarteiraContent } from '../carteira';
import type { PixRequest } from '../../types/wallet';
import { useAccountStore } from '../../stores/useAccountStore';
import type { AccountHydrationPayload } from '../../stores/useAccountStore';
import { clearTokens, setTokens } from '../../lib/token';
const walletMocks = vi.hoisted(() => ({
  getMyWallet: vi.fn(),
}));

const transactionsMocks = vi.hoisted(() => ({
  getTransactions: vi.fn(),
}));

const paymentsMocks = vi.hoisted(() => ({
  getPixCapabilities: vi.fn(),
  createPixDeposit: vi.fn(),
  requestPixWithdrawal: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
}));

vi.mock('../../lib/sdk/clients/wallet', () => walletMocks);
vi.mock('../../lib/sdk/clients/transactions', () => transactionsMocks);
vi.mock('../../lib/sdk/clients/payments', () => paymentsMocks);
vi.mock('../../lib/sdk/clients/auth', () => authMocks);

type PageShellProps = {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
};

vi.mock('../../components/page-shell', () => ({
  PageShell: ({ children }: PageShellProps) => <div data-testid="page-shell">{children}</div>,
}));

const mockGetMyWallet = walletMocks.getMyWallet;
const mockGetTransactions = transactionsMocks.getTransactions;
const mockGetPixCapabilities = paymentsMocks.getPixCapabilities;
const mockCreatePixDeposit = paymentsMocks.createPixDeposit;
const mockRequestPixWithdrawal = paymentsMocks.requestPixWithdrawal;
const mockMe = authMocks.me;

const defaultPixDeposit: PixRequest = {
  id: 'pix_dep_1',
  code: 'PIX-123',
  copyPasteCode:
    '00020101021226840014BR.GOV.BCB.PIX2558pix+chave@frontbet.com3704ABCD5204000053039865406250.005802BR5913FrontBet Tech6009Sao Paulo',
  amountCents: 25000,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  qrCode: null,
  status: 'pending',
};

const buildInitialSnapshot = (): AccountHydrationPayload => ({
  wallet: {
    id: 'wallet-test',
    userId: 'user-test',
    balance: { amount: 750000, currency: 'BRL' },
    lockedBalance: { amount: 0, currency: 'BRL' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as AccountHydrationPayload['wallet'],
  user: {
    id: 'user-test',
    email: 'user@test.com',
    username: 'frontbet-user',
    pixKey: 'teste@pix',
  } as AccountHydrationPayload['user'],
  syncedAt: new Date().toISOString(),
});

function resetAccountStore() {
  useAccountStore.setState({
    wallet: undefined,
    user: undefined,
    lastSyncedAt: null,
    loading: { wallet: false, user: false },
    errors: { wallet: null, user: null },
  });
}

class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {
    // noop
  }
  unobserve() {
    // noop
  }
  disconnect() {
    // noop
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeAll(() => {
  // jsdom does not provide IntersectionObserver; components using framer-motion depend on it.
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  resetAccountStore();
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'pt-BR');
  setTokens({ accessToken: 'test-access-token' });
  mockGetMyWallet.mockResolvedValue({
    balance: { amount: 750000 },
  });
  mockGetTransactions.mockResolvedValue({ transactions: [], total: 0 });
  mockGetPixCapabilities.mockResolvedValue({
    deposit: { enabled: true, minAmount: 1000, maxAmount: 1500000 },
    withdraw: { enabled: true, minAmount: 2000, maxAmount: 1000000 },
  });
  mockCreatePixDeposit.mockResolvedValue(defaultPixDeposit);
  mockRequestPixWithdrawal.mockResolvedValue(true);
  mockMe.mockResolvedValue({ user: { id: 'user-test', pixKey: 'teste@pix' } });
});

afterEach(() => {
  resetAccountStore();
  window.localStorage.clear();
  clearTokens();
  cleanup();
  vi.clearAllMocks();
});

async function renderCarteira(snapshot?: AccountHydrationPayload) {
  const user = userEvent.setup();
  render(
    <I18nProvider initialLocale="pt-BR">
      <CarteiraContent initialAccountSnapshot={snapshot ?? buildInitialSnapshot()} />
    </I18nProvider>
  );
  await waitFor(() => expect(mockGetMyWallet).toHaveBeenCalled());
  return user;
}

describe('Carteira PIX flow', () => {
  it('sends BRL amount to Pix deposit endpoint and opens the modal', async () => {
    const user = await renderCarteira();

    const submitButton = await screen.findByRole('button', { name: 'Gerar QR Code' });
    await user.click(submitButton);

    await waitFor(() => expect(mockCreatePixDeposit).toHaveBeenCalledTimes(1));
    expect(mockCreatePixDeposit).toHaveBeenCalledWith({ amount: 250, currency: 'BRL' });

    await waitFor(() => expect(screen.getByText('Finalize o depósito')).toBeInTheDocument());
    expect(screen.getByText('Finalize o depósito')).toBeVisible();
    expect(screen.getByText('Função em testes')).toBeVisible();
    expect(
      screen.getByText(
        'Pagamento enviado ao provedor, aguardando confirmação; o saldo será atualizado assim que o Pix for compensado.'
      )
    ).toBeVisible();
    const confirmModalButton = screen.getByRole('button', { name: 'Confirmar depósito' });
    expect(confirmModalButton).toBeEnabled();
  });

  it('closes the Pix deposit modal once the balance refresh detects the credit', async () => {
    const user = await renderCarteira();
    const submitButton = await screen.findByRole('button', { name: 'Gerar QR Code' });
    await user.click(submitButton);

    await waitFor(() => expect(screen.getByText('Finalize o depósito')).toBeVisible());

    const refreshButton = screen.getByRole('button', { name: 'Confirmar depósito' });

    mockGetMyWallet.mockResolvedValue({
      balance: { amount: 775000 },
    });

    await user.click(refreshButton);

    await waitFor(() => expect(screen.queryByText('Finalize o depósito')).not.toBeInTheDocument());
  });

  it('sends BRL amount and sanitized docs to Pix withdrawal endpoint', async () => {
    const user = await renderCarteira();

    const withdrawValue = await screen.findByLabelText('Valor do saque');
    await user.clear(withdrawValue);
    await user.type(withdrawValue, '100,00');

    const withdrawButton = screen.getByRole('button', { name: 'Solicitar saque' });
    await user.click(withdrawButton);

    // New flow: opening the confirmation modal, then confirming triggers the API call
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Confirmar saque' })).toBeVisible()
    );
    const confirmButton = screen.getByRole('button', { name: 'Confirmar saque' });
    await user.click(confirmButton);

    await waitFor(() => expect(mockRequestPixWithdrawal).toHaveBeenCalledTimes(1));
    expect(mockRequestPixWithdrawal).toHaveBeenCalledWith({
      amount: 100,
      currency: 'BRL',
      pixKey: 'teste@pix',
    });
  });
});
