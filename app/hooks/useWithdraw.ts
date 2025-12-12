import { useCallback } from 'react';
import type { PixChannelState } from '../services/wallet-service';

type PaymentsClient = {
  requestPixWithdrawal?: (payload: { amount: number; currency: string; pixKey: string }) => Promise<boolean>;
};

type ValidateResult = { ok: true } | { ok: false; reason: 'min' | 'max' | 'balance' };

type RequestWithdrawalResult = { ok: true } | { ok: false; reason: 'unavailable' | 'request_failed' };

export function useWithdraw(ensurePaymentsClient: () => Promise<PaymentsClient | null>) {
  const validateAmount = useCallback(
    (amount: number, withdrawChannel: PixChannelState, walletBalance: number, cfgMax = Infinity): ValidateResult => {
      const minWithdrawal = withdrawChannel.minAmount / 100;
      const maxWithdrawal = withdrawChannel.maxAmount > 0 ? withdrawChannel.maxAmount / 100 : cfgMax;
      if (Number.isNaN(amount) || amount < minWithdrawal) {
        return { ok: false, reason: 'min' };
      }
      if (Number.isFinite(maxWithdrawal) && amount > maxWithdrawal) {
        return { ok: false, reason: 'max' };
      }
      if (amount > walletBalance - 50) {
        return { ok: false, reason: 'balance' };
      }
      return { ok: true };
    },
    []
  );

  const requestWithdrawal = useCallback(
    async (amount: number, pixKey: string): Promise<RequestWithdrawalResult> => {
      const paymentsClient = await ensurePaymentsClient();
      if (!paymentsClient?.requestPixWithdrawal) return { ok: false, reason: 'unavailable' };
      try {
        const ok = await paymentsClient.requestPixWithdrawal({ amount, currency: 'BRL', pixKey: String(pixKey ?? '').trim() });
        return { ok: Boolean(ok) };
      } catch {
        return { ok: false, reason: 'request_failed' };
      }
    },
    [ensurePaymentsClient]
  );

  return { validateAmount, requestWithdrawal } as const;
}

export default useWithdraw;
