import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeposit } from '../useDeposit';
import type { PixRequest } from '../../types/wallet';

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
  let ensurePaymentsClient: () => Promise<unknown | null>;
  let refreshWalletData: () => Promise<void>;

  beforeEach(() => {
    createPixDepositMock = vi.fn().mockResolvedValue(defaultPixDeposit);
    ensurePaymentsClient = async () => ({ createPixDeposit: createPixDepositMock });
    refreshWalletData = vi.fn().mockResolvedValue(undefined);
  });

  it('creates a deposit and exposes activeDeposit/modal state', async () => {
    const { result } = renderHook(() => useDeposit(ensurePaymentsClient, refreshWalletData, 100000));

    type CreateDepositResult =
      | { ok: true; payload: PixRequest; baselineCents: number | null }
      | { ok: false; reason: string };
    let res: CreateDepositResult | undefined;
    await act(async () => {
      res = await result.current.createDeposit(250, { enabled: true, minAmount: 1000, maxAmount: 1500000 }, {});
    });

    expect(res.ok).toBe(true);
    expect(res.payload).toEqual(defaultPixDeposit);
    expect(result.current.activeDeposit).toEqual(defaultPixDeposit);
    expect(result.current.depositModalOpen).toBe(true);
  });

  it('rejects when channel disabled', async () => {
    const { result } = renderHook(() => useDeposit(ensurePaymentsClient, refreshWalletData, 100000));
    type CreateDepositResult =
      | { ok: true; payload: PixRequest; baselineCents: number | null }
      | { ok: false; reason: string };
    let res: CreateDepositResult | undefined;
    await act(async () => {
      res = await result.current.createDeposit(250, { enabled: false, minAmount: 1000, maxAmount: 1500000 });
    });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('disabled');
    expect(result.current.depositError).toBeDefined();
  });
});
