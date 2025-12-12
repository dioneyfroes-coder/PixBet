import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixRequest } from '../types/wallet';
import type { PixChannelState } from '../services/wallet-service';

type PaymentsClient = {
  createPixDeposit?: (payload: { amount: number; currency: string }) => Promise<PixRequest | null>;
};

type CreateDepositResult =
  | { ok: true; payload: PixRequest; baselineCents: number | null }
  | { ok: false; reason: 'disabled' | 'min' | 'max' | 'unavailable' | 'create_failed' };

export function useDeposit(
  ensurePaymentsClient: () => Promise<PaymentsClient | null>,
  refreshWalletData: (() => Promise<void>) | null,
  walletBalanceCents: number | null
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [activeDeposit, setActiveDeposit] = useState<PixRequest | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositBaselineCents, setDepositBaselineCents] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!activeDeposit || !refreshWalletData) return;
    const id = window.setInterval(() => {
      void refreshWalletData();
    }, 5000);
    return () => window.clearInterval(id);
  }, [activeDeposit, refreshWalletData]);

  const closeDepositModal = useCallback(() => {
    setDepositModalOpen(false);
    setActiveDeposit(null);
    setDepositBaselineCents(null);
    setDepositError(null);
  }, []);

  const syncDepositStatus = useCallback(() => {
    if (!activeDeposit || !refreshWalletData) return;
    setIsSyncing(true);
    void (async () => {
      try {
        await refreshWalletData();
      } finally {
        if (mountedRef.current) setIsSyncing(false);
      }
    })();
  }, [activeDeposit, refreshWalletData]);

  const createDeposit = useCallback(
    async (amount: number, depositChannel: PixChannelState, options?: { pausedMessage?: string }) => {
      setIsGenerating(true);
      try {
        if (!depositChannel.enabled) {
          setDepositError(options?.pausedMessage ?? 'Canal indisponível');
          return { ok: false, reason: 'disabled' } as const;
        }
        const minAmount = depositChannel.minAmount / 100;
        const maxAmount = depositChannel.maxAmount > 0 ? depositChannel.maxAmount / 100 : Infinity;
        if (Number.isNaN(amount) || amount < minAmount) {
          setDepositError('min');
          return { ok: false, reason: 'min' } as const;
        }
        if (Number.isFinite(maxAmount) && amount > maxAmount) {
          setDepositError('max');
          return { ok: false, reason: 'max' } as const;
        }

        const paymentsClient = await ensurePaymentsClient();
        if (!paymentsClient?.createPixDeposit) {
          setDepositError('unavailable');
          return { ok: false, reason: 'unavailable' } as const;
        }
        const payload = await paymentsClient.createPixDeposit({ amount, currency: 'BRL' });
        if (!payload) {
          setDepositError('create_failed');
          return { ok: false, reason: 'create_failed' } as const;
        }
        setDepositError(null);
        setActiveDeposit(payload);
        setDepositModalOpen(true);
        setDepositBaselineCents(walletBalanceCents ?? null);
        return { ok: true, payload, baselineCents: walletBalanceCents ?? null } as const;
      } catch (err) {
        setDepositError('create_failed');
        return { ok: false, reason: 'create_failed' } as const;
      } finally {
        if (mountedRef.current) setIsGenerating(false);
      }
    },
    [ensurePaymentsClient, walletBalanceCents]
  );

  return {
    isGenerating,
    depositError,
    activeDeposit,
    depositModalOpen,
    depositBaselineCents,
    isSyncing,
    createDeposit,
    closeDepositModal,
    syncDepositStatus,
    setActiveDeposit,
  } as const;
}

export default useDeposit;
