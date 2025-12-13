import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeposit } from '../useDeposit';
import type { PixRequest } from '../../types/wallet';
import type { PaymentsClient as DepositPaymentsClient } from '../useDeposit';

describe('useDeposit', () => {
  const defaultPixDeposit: PixRequest = {
    id: 'pix_dep_1',
    code: 'PIX-123',
    copyPasteCode: '000201...',
    amountCents: 25000,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    qrCode: null,
    status: 'pending',
  };

  let createPixDepositMock: ReturnType<typeof vi.fn>;
  let ensurePaymentsClient: () => Promise<DepositPaymentsClient | null>;
  let refreshWalletData: () => Promise<void>;

  beforeEach(() => {
    createPixDepositMock = vi.fn().mockResolvedValue(defaultPixDeposit);
    ensurePaymentsClient = async () => ({ createPixDeposit: createPixDepositMock as unknown as DepositPaymentsClient['createPixDeposit'] });
    refreshWalletData = vi.fn().mockResolvedValue(undefined);
  });

  it('creates a deposit and exposes activeDeposit/modal state', async () => {
    const { result } = renderHook(() =>
      useDeposit(ensurePaymentsClient, refreshWalletData, 100000)
    );

    type CreateDepositResult =
      | { ok: true; payload: PixRequest; baselineCents: number | null }
      | { ok: false; reason: string };
    let res: CreateDepositResult | undefined;
    await act(async () => {
      res = await result.current.createDeposit(
        250,
        { enabled: true, minAmount: 1000, maxAmount: 1500000 },
        {}
      );
    });

    expect(res).toBeDefined();
    if (res && 'payload' in res) {
      expect(res.ok).toBe(true);
      expect(res.payload).toEqual(defaultPixDeposit);
      expect(result.current.activeDeposit).toEqual(defaultPixDeposit);
      expect(result.current.depositModalOpen).toBe(true);
    }
  });

  it('rejects when channel disabled', async () => {
    const { result } = renderHook(() =>
      useDeposit(ensurePaymentsClient, refreshWalletData, 100000)
    );
    type CreateDepositResult =
      | { ok: true; payload: PixRequest; baselineCents: number | null }
      | { ok: false; reason: string };
    let res: CreateDepositResult | undefined;
    await act(async () => {
      res = await result.current.createDeposit(250, {
        enabled: false,
        minAmount: 1000,
        maxAmount: 1500000,
      });
    });
    expect(res).toBeDefined();
    if (res && 'reason' in res) {
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('disabled');
    }
    expect(result.current.depositError).toBeDefined();
  });

  it('surfaces formatted backend message when createPixDeposit throws ApiClientError', async () => {
    const { ApiClientError } = await import('../../lib/sdk/core/errors');
    const backendErr = new ApiClientError('Validation failed', {
      status: 400,
      details: { formatted: 'Campo valor: deve ser maior que 10' },
    });

    createPixDepositMock = vi.fn().mockRejectedValue(backendErr);
    ensurePaymentsClient = async () => ({ createPixDeposit: createPixDepositMock as DepositPaymentsClient['createPixDeposit'] });
    const { result } = renderHook(() =>
      useDeposit(ensurePaymentsClient, refreshWalletData, 100000)
    );

    let res: { ok: boolean; reason?: string; message?: string } | undefined;
    await act(async () => {
      res = await result.current.createDeposit(
        250,
        { enabled: true, minAmount: 1000, maxAmount: 1500000 },
        {}
      );
    });

    expect(res).toBeDefined();
    if (res) {
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('create_failed');
      expect(res.message).toContain('Campo valor');
    }
    expect(result.current.depositError).toContain('Campo valor');
  });

  it('retries syncDepositStatus with exponential backoff and stops on success', async () => {
    vi.useFakeTimers();

    // prepare refreshWalletData to fail twice then succeed
    let calls = 0;
    const refreshWalletData = vi.fn(async () => {
      calls += 1;
      if (calls < 3) throw new Error('transient');
      return Promise.resolve();
    });

    // replace mounted hook with one that uses our refresh mock
    const { result: r2 } = renderHook(() =>
      useDeposit(ensurePaymentsClient, refreshWalletData, 100000)
    );

    // ensure deterministic jitter
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0);

    // set an active deposit so syncDepositStatus runs
    act(() => r2.current.setActiveDeposit(defaultPixDeposit));

    // call syncDepositStatus (it runs an async loop)
    act(() => {
      r2.current.syncDepositStatus();
    });

    // initially isSyncing should be true
    expect(r2.current.isSyncing).toBe(true);

    // first attempt fails immediately, advance time for first backoff (1s)
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.resolve();

    // second attempt fails, advance time for second backoff (2s)
    await vi.advanceTimersByTimeAsync(2000);
    await Promise.resolve();

    // third attempt should succeed; allow microtasks to run
    await Promise.resolve();

    expect(refreshWalletData).toHaveBeenCalledTimes(3);

    rnd.mockRestore();
    vi.useRealTimers();
  });
});
