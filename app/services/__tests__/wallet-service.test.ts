import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as transactionsClient from '../../lib/sdk/clients/transactions';
import * as paymentsClient from '../../lib/sdk/clients/payments';
import { useAccountStore } from '../../stores/useAccountStore';
import {
  mergeCapabilities,
  refreshWalletAggregates,
  refreshWalletSnapshot,
} from '../wallet-service';

vi.mock('../../lib/sdk/clients/transactions');
vi.mock('../../lib/sdk/clients/payments');

const mockGetTransactions = transactionsClient.getTransactions as unknown as Mock;
const mockGetPixCapabilities = paymentsClient.getPixCapabilities as unknown as Mock;

function resetStore() {
  useAccountStore.setState({
    wallet: undefined,
    user: undefined,
    lastSyncedAt: null,
    loading: { wallet: false, user: false },
    errors: { wallet: null, user: null },
  });
}

describe('wallet-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetStore();
  });

  it('merges PIX capabilities with fallbacks', () => {
    const merged = mergeCapabilities({
      deposit: { enabled: false, minAmount: 5000, maxAmount: 90000 },
      withdraw: { enabled: true, minAmount: 1000, maxAmount: 100000 },
    });
    expect(merged.deposit.enabled).toBe(false);
    expect(merged.deposit.minAmount).toBe(5000);
    expect(merged.deposit.maxAmount).toBe(90000);
    expect(merged.withdraw.maxAmount).toBe(100000);
  });

  it('refreshWalletAggregates fetches wallet, transactions and caps', async () => {
    const mockWallet = { balance: { amount: 100000, currency: 'BRL' } };
    const fetchWalletSpy = vi
      .spyOn(useAccountStore.getState(), 'fetchWalletSnapshot')
      .mockResolvedValue(mockWallet as never);
    mockGetTransactions.mockResolvedValue({
      transactions: [
        {
          id: 'tx-1',
          type: 'deposit',
          amount: 10000,
          status: 'confirmado',
          channel: 'PIX',
        },
      ],
    });
    mockGetPixCapabilities.mockResolvedValue({
      deposit: { enabled: true, minAmount: 1000, maxAmount: 120000 },
      withdraw: { enabled: false, minAmount: 5000, maxAmount: 80000, reason: 'maintenance' },
    });
    const result = await refreshWalletAggregates({ transactionsLimit: 10 });
    expect(result.wallet).toEqual(mockWallet);
    expect(result.transactions).toHaveLength(1);
    expect(result.pixCapabilities.deposit.minAmount).toBe(1000);
    expect(result.pixCapabilities.withdraw.enabled).toBe(false);
    fetchWalletSpy.mockRestore();
  });

  it('refreshWalletSnapshot delegates to store action', async () => {
    const fetchSpy = vi
      .spyOn(useAccountStore.getState(), 'fetchWalletSnapshot')
      .mockResolvedValue(null);
    await refreshWalletSnapshot();
    expect(fetchSpy).toHaveBeenCalled();
  });
});
