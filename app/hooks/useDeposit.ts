import { useCallback, useEffect, useRef, useState } from 'react';
import type { PixRequest } from '../types/wallet';
import type { PixChannelState } from '../services/wallet-service';
import { summarizeClientError, ApiClientError } from '../lib/sdk/core/errors';

export type PaymentsClient = {
  createPixDeposit?: (payload: { amount: number; currency: string }) => Promise<PixRequest | null>;
};

export function useDeposit(
  ensurePaymentsClient: () => Promise<PaymentsClient | null>,
  refreshWalletData: (() => Promise<void>) | null,
  walletBalanceCents: number | null
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositErrorDetails, setDepositErrorDetails] = useState<Record<string, unknown> | null>(
    null
  );
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
      const maxAttempts = 5;
      let attempt = 0;
      let delay = 1000; // start with 1s
      while (attempt < maxAttempts && mountedRef.current) {
        try {
          await refreshWalletData();
          break; // success — stop retrying
        } catch {
          attempt += 1;
          if (attempt >= maxAttempts) {
            // give up after max attempts
            break;
          }
          // exponential backoff with jitter
          const jitter = Math.floor(Math.random() * 250);
          await new Promise((res) => setTimeout(res, delay + jitter));
          delay = Math.min(delay * 2, 30000);
        }
      }
      if (mountedRef.current) setIsSyncing(false);
    })();
  }, [activeDeposit, refreshWalletData]);

  const createDeposit = useCallback(
    async (
      amount: number,
      depositChannel: PixChannelState,
      options?: { pausedMessage?: string }
    ) => {
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
          const msg = 'Serviço de pagamentos indisponível';
          setDepositError(msg);
          return { ok: false, reason: 'unavailable', message: msg } as const;
        }
        const payload = await paymentsClient.createPixDeposit({ amount, currency: 'BRL' });
        if (!payload) {
          const msg = 'Falha ao criar depósito';
          setDepositError(msg);
          return { ok: false, reason: 'create_failed', message: msg } as const;
        }
        setDepositError(null);
        setDepositErrorDetails(null);
        setActiveDeposit(payload);
        setDepositModalOpen(true);
        setDepositBaselineCents(walletBalanceCents ?? null);
        return { ok: true, payload, baselineCents: walletBalanceCents ?? null } as const;
      } catch (err) {
        const msg = summarizeClientError(err);
        let details: Record<string, unknown> | null = null;
        if (err instanceof ApiClientError) details = err.details ?? null;
        setDepositError(msg);
        setDepositErrorDetails(details);
        return { ok: false, reason: 'create_failed', message: msg } as const;
      } finally {
        if (mountedRef.current) setIsGenerating(false);
      }
    },
    [ensurePaymentsClient, walletBalanceCents]
  );

  return {
    isGenerating,
    depositError,
    depositErrorDetails,
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
