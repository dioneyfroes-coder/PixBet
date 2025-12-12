import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAccountStore } from '../useAccountStore';
import type { AccountHydrationPayload } from '../useAccountStore';

const walletMocks = vi.hoisted(() => ({
  getMyWallet: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  me: vi.fn(),
}));

const tokenMocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
}));

vi.mock('../../lib/sdk/clients/wallet', () => walletMocks);
vi.mock('../../lib/sdk/clients/auth', () => authMocks);
vi.mock('../../lib/token', () => tokenMocks);

const mockGetMyWallet = walletMocks.getMyWallet;
const mockMe = authMocks.me;
const mockGetAccessToken = tokenMocks.getAccessToken;

function resetStore() {
  useAccountStore.setState({
    wallet: undefined,
    user: undefined,
    lastSyncedAt: null,
    loading: { wallet: false, user: false },
    errors: { wallet: null, user: null },
  });
}

describe('useAccountStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('token-123');
  });

  it('hydrates state from loader payload', () => {
    const payload: AccountHydrationPayload = {
      wallet: {
        id: 'wallet-1',
        userId: 'user-1',
        balance: { amount: 123000, currency: 'BRL' },
        lockedBalance: { amount: 0, currency: 'BRL' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      user: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user-1',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      syncedAt: '2025-01-01T00:00:00.000Z',
    };

    act(() => {
      useAccountStore.getState().hydrateFromLoader(payload);
    });

    const state = useAccountStore.getState();
    expect(state.wallet?.balance?.amount).toBe(123000);
    expect(state.user?.email).toBe('user@example.com');
    expect(state.lastSyncedAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('fetches wallet snapshot and updates state', async () => {
    mockGetMyWallet.mockResolvedValue({
      balance: { amount: 99000, currency: 'BRL' },
    });

    await act(async () => {
      await useAccountStore.getState().fetchWalletSnapshot();
    });

    const state = useAccountStore.getState();
    expect(mockGetMyWallet).toHaveBeenCalledTimes(1);
    expect(mockGetMyWallet).toHaveBeenCalledWith({ accessToken: 'token-123' });
    expect(state.wallet?.balance?.amount).toBe(99000);
    expect(state.loading.wallet).toBe(false);
    expect(state.errors.wallet).toBeNull();
    expect(state.lastSyncedAt).not.toBeNull();
  });

  it('records wallet errors when fetch fails', async () => {
    mockGetMyWallet.mockRejectedValue(new Error('boom'));

    await act(async () => {
      await useAccountStore.getState().fetchWalletSnapshot();
    });

    const state = useAccountStore.getState();
    expect(state.errors.wallet).toBe('boom');
    expect(state.loading.wallet).toBe(false);
  });

  it('skips remote wallet sync when no access token is available', async () => {
    mockGetAccessToken.mockResolvedValueOnce(null);

    await act(async () => {
      await useAccountStore.getState().fetchWalletSnapshot();
    });

    const state = useAccountStore.getState();
    expect(mockGetMyWallet).not.toHaveBeenCalled();
    expect(state.errors.wallet).toBe(
      'Sessão expirada. Faça login novamente para sincronizar a carteira.'
    );
  });

  it('refreshAll synchronizes wallet and user in parallel', async () => {
    mockGetMyWallet.mockResolvedValue({
      balance: { amount: 10100, currency: 'BRL' },
    });
    mockMe.mockResolvedValue({
      id: 'user-42',
      email: 'sync@example.com',
    });

    await act(async () => {
      const result = await useAccountStore.getState().refreshAll();
      expect(result.wallet?.balance?.amount).toBe(10100);
      expect(result.user?.email).toBe('sync@example.com');
    });

    const state = useAccountStore.getState();
    expect(state.wallet?.balance?.amount).toBe(10100);
    expect(state.user?.email).toBe('sync@example.com');
    expect(mockGetMyWallet).toHaveBeenCalledWith({ accessToken: 'token-123' });
    expect(mockMe).toHaveBeenCalledWith({ accessToken: 'token-123' });
  });
});
