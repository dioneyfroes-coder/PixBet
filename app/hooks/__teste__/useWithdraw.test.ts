import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useWithdraw from '../useWithdraw';
import type { PixChannelState } from '../../services/wallet-service';
import type { PaymentsClient as WithdrawPaymentsClient } from '../useWithdraw';

describe('useWithdraw', () => {
  let ensurePaymentsClient: () => Promise<WithdrawPaymentsClient | null>;

  beforeEach(() => {
    ensurePaymentsClient = async () => null;
  });

  it('validateAmount returns min error when below min', () => {
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    const withdrawChannel: PixChannelState = { enabled: true, minAmount: 1000, maxAmount: 100000 };
    const res = result.current.validateAmount(4, withdrawChannel, 1000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('min');
  });

  it('validateAmount returns max error when above max', () => {
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    const withdrawChannel: PixChannelState = { enabled: true, minAmount: 1000, maxAmount: 1000 };
    const res = result.current.validateAmount(20, withdrawChannel, 1000);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('max');
  });

  it('validateAmount returns balance error when not enough balance after reserve', () => {
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    const withdrawChannel: PixChannelState = { enabled: true, minAmount: 1000, maxAmount: 100000 };
    const res = result.current.validateAmount(60, withdrawChannel, 100); // reserve 50 -> 100-50 = 50 -> 60 > 50
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('balance');
  });

  it('validateAmount ok for valid amount', () => {
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    const withdrawChannel: PixChannelState = { enabled: true, minAmount: 1000, maxAmount: 100000 };
    const res = result.current.validateAmount(20, withdrawChannel, 1000);
    expect(res.ok).toBe(true);
  });

  it('requestWithdrawal returns unavailable when client missing', async () => {
    ensurePaymentsClient = async () => null;
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    let out: { ok: boolean; reason?: string } | undefined;
    await act(async () => {
      out = await result.current.requestWithdrawal(100, 'pix-key');
    });
    expect(out).toBeDefined();
    if (out) {
      expect(out.ok).toBe(false);
      expect(out.reason).toBe('unavailable');
    }
  });

  it('requestWithdrawal returns ok when client resolves', async () => {
    const requestPixWithdrawal = vi.fn().mockResolvedValue(true);
    ensurePaymentsClient = async () => ({ requestPixWithdrawal: requestPixWithdrawal as WithdrawPaymentsClient['requestPixWithdrawal'] });
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    let out: { ok: boolean; reason?: string } | undefined;
    await act(async () => {
      out = await result.current.requestWithdrawal(100, 'pix-key');
    });
    expect(requestPixWithdrawal).toHaveBeenCalled();
    if (out) expect(out.ok).toBe(true);
  });

  it('requestWithdrawal returns request_failed when client throws', async () => {
    const requestPixWithdrawal = vi.fn().mockRejectedValue(new Error('boom'));
    ensurePaymentsClient = async () => ({ requestPixWithdrawal: requestPixWithdrawal as WithdrawPaymentsClient['requestPixWithdrawal'] });
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    let out: { ok: boolean; reason?: string } | undefined;
    await act(async () => {
      out = await result.current.requestWithdrawal(100, 'pix-key');
    });
    expect(out).toBeDefined();
    if (out) {
      expect(out.ok).toBe(false);
      expect(out.reason).toBe('request_failed');
    }
  });

  it('returns formatted message when payments client throws ApiClientError', async () => {
    const { ApiClientError } = await import('../../lib/sdk/core/errors');
    const backendErr = new ApiClientError('Withdraw failed', {
      status: 422,
      details: { formatted: 'Conta inválida: CPF ausente' },
    });

    const requestPixWithdrawal = vi.fn().mockRejectedValue(backendErr);
    ensurePaymentsClient = async () => ({ requestPixWithdrawal: requestPixWithdrawal as WithdrawPaymentsClient['requestPixWithdrawal'] });
    const { result } = renderHook(() => useWithdraw(ensurePaymentsClient));
    let out: { ok: boolean; reason?: string; message?: string } | undefined;
    await act(async () => {
      out = await result.current.requestWithdrawal(100, 'pix-key');
    });
    expect(out).toBeDefined();
    if (out) {
      expect(out.ok).toBe(false);
      expect(out.reason).toBe('request_failed');
      expect(out.message).toContain('Conta inválida');
    }
  });
});
