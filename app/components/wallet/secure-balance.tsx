import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/i18n-provider';
import { formatMoney } from '../../lib/config';
import { selectWalletBalance, useAccountStore } from '../../stores/useAccountStore';

interface SecureBalanceProps {
  label?: string;
  initialAmountCents?: number | null;
  autoRefresh?: boolean;
  className?: string;
  refreshIntervalMs?: number;
  onChange?: (amountCents: number | null) => void;
}

const hiddenFallback = '***';

export function SecureBalance({
  label,
  initialAmountCents = null,
  autoRefresh = true,
  className,
  refreshIntervalMs = 30000,
  onChange,
}: SecureBalanceProps) {
  const { messages, locale } = useI18n();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletCopy = (messages.wallet as Record<string, any>) ?? {};
  const summaryCopy = walletCopy.summaryCard ?? {};
  const walletBalanceCents = useAccountStore(selectWalletBalance);
  const fetchWalletSnapshot = useAccountStore((state) => state.fetchWalletSnapshot);
  const walletError = useAccountStore((state) => state.errors.wallet);
  const [visible, setVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (walletBalanceCents === undefined && initialAmountCents != null) {
      onChange?.(initialAmountCents);
      return;
    }
    if (walletBalanceCents !== undefined) {
      onChange?.(walletBalanceCents ?? null);
    }
  }, [initialAmountCents, onChange, walletBalanceCents]);

  const fetchBalance = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!autoRefresh) {
        return;
      }
      if (!options?.silent) {
        setIsRefreshing(true);
      }
      try {
        await fetchWalletSnapshot();
      } catch (err) {
        try {
          const dev = (process?.env?.NODE_ENV ?? 'development') !== 'production';
          if (dev) console.error('[secure-balance] fetchWalletSnapshot threw', err);
        } catch (e) {
          void e;
        }
      } finally {
        if (mountedRef.current && !options?.silent) {
          setIsRefreshing(false);
        }
      }
    },
    [autoRefresh, fetchWalletSnapshot]
  );

  useEffect(() => {
    try {
      const dev = (process?.env?.NODE_ENV ?? 'development') !== 'production';
      if (dev) {
        console.info('[secure-balance] init', {
          walletBalanceCents,
          initialAmountCents,
          autoRefresh,
          refreshIntervalMs,
        });
      }
    } catch (e) {
      void e;
    }
    if (!autoRefresh) {
      return;
    }
    void fetchBalance();
  }, [autoRefresh, fetchBalance, walletBalanceCents, initialAmountCents, refreshIntervalMs]);

  useEffect(() => {
    if (!autoRefresh || !refreshIntervalMs) {
      return;
    }
    const id = window.setInterval(() => {
      void fetchBalance({ silent: true });
    }, refreshIntervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [autoRefresh, fetchBalance, refreshIntervalMs]);

  const effectiveBalanceCents = walletBalanceCents ?? initialAmountCents ?? null;
  const isLoading =
    isRefreshing || (autoRefresh && walletBalanceCents === undefined && initialAmountCents == null);
  const error = walletError;

  const toggleLabel = visible
    ? (summaryCopy.hideBalance ?? 'Ocultar saldo')
    : (summaryCopy.showBalance ?? 'Mostrar saldo');

  const displayValue = useMemo(() => {
    if (isLoading) {
      return summaryCopy.loadingBalance ?? 'Carregando...';
    }
    if (!visible) {
      return summaryCopy.hiddenBalancePlaceholder ?? hiddenFallback;
    }
    if (effectiveBalanceCents == null) {
      return '—';
    }
    return formatMoney(effectiveBalanceCents, locale);
  }, [
    effectiveBalanceCents,
    isLoading,
    locale,
    summaryCopy.hiddenBalancePlaceholder,
    summaryCopy.loadingBalance,
    visible,
  ]);

  return (
    <div className={className}>
      <p className="text-sm text-[var(--color-muted)]">{label ?? summaryCopy.liquidLabel}</p>
      <div className="flex items-center gap-3">
        <p className="text-4xl font-bold tracking-tight">{displayValue}</p>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          aria-pressed={visible}
          aria-label={toggleLabel}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
          <span className="sr-only">{toggleLabel}</span>
        </button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.76 20.76 0 0 1 5.06-5.94" />
      <path d="M1 1l22 22" />
      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
    </svg>
  );
}
