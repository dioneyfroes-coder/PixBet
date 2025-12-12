import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';
import { useLoaderData } from 'react-router';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { FadeIn } from '../components/animation';
import { requireAuth } from '../utils/auth.server';
import type { PixRequest, Transaction, TransactionType } from '../types/wallet';
import { useI18n } from '../i18n/i18n-provider';
import { cfg, formatMoney, formatMessage } from '../lib/config';
import { getPageMeta } from '../i18n/page-copy';
import { useAccountHydration } from '../hooks/useAccountHydration';
import { selectWalletBalance, selectUser, useAccountStore } from '../stores/useAccountStore';
import type { AccountHydrationPayload } from '../stores/useAccountStore';
import {
  defaultPixCapabilities,
  refreshWalletAggregates,
  type PixCapabilitiesState,
  type PixChannelState,
} from '../services/wallet-service';
import type { Route } from './+types/carteira';

const _currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const hourFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});

// use `formatMoney` which expects cents for consistency across the app
const formatHour = (value: string) => hourFormatter.format(new Date(value));

// initial transactions removed — data comes from backend

// known channels (kept for labels)
const _historyFilters: Array<'todos' | TransactionType> = ['todos', 'deposit', 'withdraw', 'bonus'];
const _channelOrder = ['PIX', 'Web', 'Automação'] as const;

type LimitHelperCopy = {
  range?: string;
  minOnly?: string;
  maxOnly?: string;
};

function buildLimitLabel(channel: PixChannelState, helper?: LimitHelperCopy) {
  if (!helper) return null;
  const hasMin = channel.minAmount > 0;
  const hasMax = channel.maxAmount > 0;
  const min = hasMin ? formatMoney(channel.minAmount) : null;
  const max = hasMax ? formatMoney(channel.maxAmount) : null;

  if (hasMin && hasMax && helper.range) {
    return formatMessage(helper.range, { min: min ?? '', max: max ?? '' });
  }
  if (hasMin && helper.minOnly) {
    return formatMessage(helper.minOnly, { min: min ?? '' });
  }
  if (hasMax && helper.maxOnly) {
    return formatMessage(helper.maxOnly, { max: max ?? '' });
  }
}

type PaymentsClient = typeof import('../lib/sdk/clients/payments');

export function meta({}: Route.MetaArgs) {
  const { title, description } = getPageMeta('wallet');
  return [{ title }, { name: 'description', content: description }];
}

export default function Carteira() {
  const { initialAccountSnapshot } = useLoaderData<{
    initialAccountSnapshot: AccountHydrationPayload | null;
  }>();
  return <CarteiraContent initialAccountSnapshot={initialAccountSnapshot} />;
}

type CarteiraContentProps = {
  initialAccountSnapshot?: AccountHydrationPayload | null;
};

export function CarteiraContent({ initialAccountSnapshot }: CarteiraContentProps) {
  useAccountHydration(initialAccountSnapshot);
  const { messages } = useI18n();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walletCopy = messages.wallet as Record<string, any>;
  const _historyCopy = walletCopy.history;
  const summaryCard = walletCopy.summaryCard;
  const _monitoringCopy = walletCopy.monitoringCard;
  const depositCopy = walletCopy.depositCard;
  const withdrawCopy = walletCopy.withdrawCard;
  const _statusCopy = walletCopy.statuses;
  const connectionCopy = walletCopy.connectionStates;
  const _channelLabels = walletCopy.channels;
  const errorsCopy = walletCopy.errors;

  const walletBalanceCents = useAccountStore(selectWalletBalance);
  const walletBalance = useMemo(() => (walletBalanceCents ?? 0) / 100, [walletBalanceCents]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<'online' | 'sincronizando'>('online');
  const [nowTick, setNowTick] = useState(0);
  const [pixCaps, setPixCaps] = useState<PixCapabilitiesState>(defaultPixCapabilities);
  const paymentsClientRef = useRef<PaymentsClient | null>(null);
  const mountedRef = useRef(true);
  const [depositAmount, setDepositAmount] = useState('250,00');

  const [depositError, setDepositError] = useState<string | null>(null);
  const [activeDeposit, setActiveDeposit] = useState<PixRequest | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositBaselineCents, setDepositBaselineCents] = useState<number | null>(null);
  const [isGeneratingPix, startPixTransition] = useTransition();
  const [isSyncingDepositStatus, startSyncDepositStatus] = useTransition();

  const [withdrawAmount, setWithdrawAmount] = useState('100,00');
  const [withdrawNote, setWithdrawNote] = useState<{
    status: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isProcessingWithdraw, startWithdrawTransition] = useTransition();
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);
  const [pixKeyModalOpen, setPixKeyModalOpen] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [isSavingPixKey, setIsSavingPixKey] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState<'todos' | TransactionType>('todos');
  const deferredHistorySearch = useDeferredValue(historySearch);
  const [_isFilteringHistory, startHistoryTransition] = useTransition();
  const depositChannel = pixCaps.deposit;
  const withdrawChannel = pixCaps.withdraw;
  const depositDisabled = !depositChannel.enabled;
  const withdrawDisabled = !withdrawChannel.enabled;
  const depositLimitLabel = buildLimitLabel(depositChannel, depositCopy.limitsHelper);
  const withdrawLimitLabel = buildLimitLabel(withdrawChannel, withdrawCopy.limitsHelper);
  const depositStatusLabel = depositChannel.enabled
    ? depositCopy.status?.active
    : depositCopy.status?.paused;
  const withdrawStatusLabel = withdrawChannel.enabled
    ? withdrawCopy.status?.active
    : withdrawCopy.status?.paused;
  const depositPausedMessage =
    depositCopy.pausedHelper ?? walletCopy.pixUnavailableFallback ?? depositCopy.submit;
  const withdrawPausedMessage =
    withdrawCopy.pausedHelper ?? walletCopy.pixUnavailableFallback ?? withdrawCopy.submit;
  const depositModalCopy = depositCopy.modal ?? {};

  // navigation: prefer direct location change here to avoid requiring router in tests

  const accountUser = useAccountStore(selectUser);
  const resolvedProfile = useMemo(() => {
    if (!accountUser || typeof accountUser !== 'object') return null;
    const maybe = (accountUser as { user?: unknown }).user;
    if (maybe && typeof maybe === 'object') return maybe as Record<string, unknown>;
    return accountUser as Record<string, unknown>;
  }, [accountUser]);

  const userPixKey =
    resolvedProfile && typeof resolvedProfile === 'object'
      ? String(resolvedProfile.pixKey ?? resolvedProfile.pix ?? '').trim() || null
      : null;

  // Fallback to loader-provided snapshot in case store is not yet hydrated
  const initialUserPixKey =
    initialAccountSnapshot &&
    initialAccountSnapshot.user &&
    typeof initialAccountSnapshot.user === 'object'
      ? String(
          (initialAccountSnapshot.user as Record<string, unknown>).pixKey ??
            (initialAccountSnapshot.user as Record<string, unknown>).pix ??
            ''
        ).trim() || null
      : null;

  // The pix key we will display/use for withdrawals (prefers live store, falls back to initial snapshot)
  const displayedPixKey = userPixKey ?? initialUserPixKey;

  const ensurePaymentsClient = useCallback(async () => {
    if (paymentsClientRef.current) {
      return paymentsClientRef.current;
    }
    try {
      const module = await import('../lib/sdk/clients/payments');
      paymentsClientRef.current = module;
      return module;
    } catch {
      paymentsClientRef.current = null;
      return null;
    }
  }, []);

  const refreshWalletData = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setConnectionState('sincronizando');
      const { transactions: mappedTransactions, pixCapabilities } = await refreshWalletAggregates({
        transactionsLimit: 15,
      });
      if (!mountedRef.current) return;
      setTransactions(mappedTransactions.slice(0, 15));
      setPixCaps(pixCapabilities);
      setLastUpdate(new Date());
      setConnectionState('online');
    } catch {
      if (!mountedRef.current) return;
      setConnectionState('online');
    }
  }, []);

  useEffect(() => {
    void refreshWalletData();
  }, [refreshWalletData]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setNowTick(Date.now());
    const timer = window.setInterval(() => setNowTick(Date.now()), 4000);
    return () => clearInterval(timer);
  }, []);

  const parseAmount = useCallback((value: string) => {
    const normalized = value.replace(/\./g, '').replace(',', '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : NaN;
  }, []);

  const timeSinceUpdate = useMemo(() => {
    if (!lastUpdate || !nowTick) {
      return '—';
    }
    const diff = Math.max(0, Math.floor((nowTick - lastUpdate.getTime()) / 1000));
    if (diff < 5) {
      return walletCopy.timeSince.updatedNow;
    }
    if (diff < 60) {
      return formatMessage(walletCopy.timeSince.secondsAgo, { count: String(diff) });
    }
    const minutes = Math.floor(diff / 60);
    return formatMessage(walletCopy.timeSince.minutesAgo, { count: String(minutes) });
  }, [lastUpdate, nowTick, walletCopy.timeSince]);

  const _pendingTransactions = useMemo(
    () => transactions.filter((tx) => tx.status !== 'confirmado').length,
    [transactions]
  );

  const _lastDeposit = useMemo(
    () => transactions.find((tx) => tx.type === 'deposit'),
    [transactions]
  );

  const _filteredTransactions = useMemo(() => {
    const term = deferredHistorySearch.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesType = historyType === 'todos' || tx.type === historyType;
      if (!matchesType) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${tx.reference} ${tx.channel} ${tx.status}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [transactions, historyType, deferredHistorySearch]);

  const handleHistoryTypeChange = useCallback(
    (type: 'todos' | TransactionType) => {
      startHistoryTransition(() => {
        setHistoryType(type);
      });
    },
    [startHistoryTransition]
  );

  const _handleHistorySearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setHistorySearch(event.target.value);
  }, []);

  const _handleHistoryFilterClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const filter = event.currentTarget.dataset.filter as 'todos' | TransactionType | undefined;
      if (!filter) return;
      handleHistoryTypeChange(filter);
    },
    [handleHistoryTypeChange]
  );

  const handleGeneratePix = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      startPixTransition(() => {
        void (async () => {
          if (depositDisabled) {
            setDepositError(depositPausedMessage);
            return;
          }
          const amount = parseAmount(depositAmount);
          const minAmount = depositChannel.minAmount / 100;
          const maxAmount =
            depositChannel.maxAmount > 0 ? depositChannel.maxAmount / 100 : Infinity;
          if (Number.isNaN(amount) || amount < minAmount) {
            setDepositError(
              formatMessage(errorsCopy.depositMin, {
                minDeposit: formatMoney(depositChannel.minAmount),
              })
            );
            return;
          }
          if (Number.isFinite(maxAmount) && amount > maxAmount) {
            setDepositError(
              formatMessage(errorsCopy.depositMax, {
                maxDeposit: formatMoney(depositChannel.maxAmount || cfg.MAX_DEPOSIT),
              })
            );
            return;
          }
          const paymentsClient = await ensurePaymentsClient();
          if (!paymentsClient?.createPixDeposit) {
            setDepositError(
              errorsCopy.depositCreate ?? walletCopy.pixUnavailableFallback ?? depositCopy.submit
            );
            return;
          }
          // amount is BRL decimal (e.g. 250.00). Pass it through; client will convert to cents when sending to API.
          const payload = await paymentsClient.createPixDeposit({
            amount,
            currency: 'BRL',
          });
          if (!payload) {
            setDepositError(
              errorsCopy.depositCreate ?? walletCopy.pixUnavailableFallback ?? depositCopy.submit
            );
            return;
          }
          setDepositError(null);
          setActiveDeposit(payload);
          setDepositModalOpen(true);
          setDepositBaselineCents(walletBalanceCents ?? null);
        })();
      });
    },
    [
      walletBalanceCents,
      depositAmount,
      depositChannel,
      depositDisabled,
      depositPausedMessage,
      depositCopy.submit,
      ensurePaymentsClient,
      errorsCopy.depositCreate,
      errorsCopy.depositMax,
      errorsCopy.depositMin,
      parseAmount,
      startPixTransition,
      walletCopy.pixUnavailableFallback,
    ]
  );

  const handleCloseDepositModal = useCallback(() => {
    setDepositModalOpen(false);
    setActiveDeposit(null);
    setDepositBaselineCents(null);
  }, []);

  const handleSyncDepositStatus = useCallback(() => {
    if (!activeDeposit) return;
    startSyncDepositStatus(() => {
      void refreshWalletData();
    });
  }, [activeDeposit, refreshWalletData, startSyncDepositStatus]);

  useEffect(() => {
    if (!activeDeposit) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void refreshWalletData();
    }, 5000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeDeposit, refreshWalletData]);

  useEffect(() => {
    if (!activeDeposit || depositBaselineCents == null) {
      return;
    }
    const expectedCents = depositBaselineCents + (activeDeposit.amountCents ?? 0);
    if (expectedCents > 0 && (walletBalanceCents ?? 0) >= expectedCents) {
      handleCloseDepositModal();
    }
  }, [activeDeposit, walletBalanceCents, depositBaselineCents, handleCloseDepositModal]);

  

  return (
    <PageShell title={walletCopy.title} description={walletCopy.description}>
      <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
        <FadeIn>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{summaryCard.title}</CardTitle>
                <CardDescription>{summaryCard.description}</CardDescription>
              </div>
              <div className="flex flex-col items-end text-sm text-[var(--color-muted)]">
                <span
                  className={connectionState === 'online' ? 'text-emerald-400' : 'text-amber-300'}
                >
                  {connectionCopy[connectionState]}
                </span>
                <span>{timeSinceUpdate}</span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-1">
              <div>
                <p className="text-sm text-[var(--color-muted)]">{summaryCard.liquidLabel}</p>
                <p className="text-2xl font-semibold">
                  {walletBalanceCents == null ? '—' : formatMoney(walletBalanceCents)}
                </p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        {/* Monitoring/mocks removed: placeholders and operational metrics were mock data. */}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <Card aria-labelledby="deposito-pix">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle id="deposito-pix">{depositCopy.title}</CardTitle>
                <CardDescription>{depositCopy.description}</CardDescription>
              </div>
              {depositStatusLabel ? (
                <span
                  className={`inline-flex min-w-[10rem] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                    depositDisabled
                      ? 'bg-amber-500/10 text-amber-200'
                      : 'bg-emerald-500/10 text-emerald-200'
                  }`}
                >
                  {depositStatusLabel}
                </span>
              ) : null}
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleGeneratePix}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="deposit-value">
                    {depositCopy.amountLabel}
                  </label>
                  <Input
                    id="deposit-value"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    inputMode="decimal"
                    disabled={depositDisabled}
                  />
                  {depositLimitLabel ? (
                    <p className="text-xs text-[var(--color-muted)]">{depositLimitLabel}</p>
                  ) : null}
                  {depositError && <p className="text-sm text-red-400">{depositError}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={depositDisabled || isGeneratingPix}
                  className="w-full"
                >
                  {isGeneratingPix ? depositCopy.submitting : depositCopy.submit}
                </Button>
              </form>
              {depositDisabled ? (
                <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <p>{depositPausedMessage}</p>
                  {depositChannel.reason ? (
                    <p className="text-xs text-amber-200">{depositChannel.reason}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-muted-foreground)]/5 p-3 text-sm text-[var(--color-foreground)]">
                {depositCopy.pendingHint ??
                  'O saldo só é atualizado quando o backend confirma o pagamento do PIX.'}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn>
          <Card aria-labelledby="saque-pix">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle id="saque-pix">{withdrawCopy.title}</CardTitle>
                <CardDescription>{withdrawCopy.description}</CardDescription>
              </div>
              {withdrawStatusLabel ? (
                <span
                  className={`inline-flex min-w-[10rem] justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                    withdrawDisabled
                      ? 'bg-amber-500/10 text-amber-200'
                      : 'bg-emerald-500/10 text-emerald-200'
                  }`}
                >
                  {withdrawStatusLabel}
                </span>
              ) : null}
            </CardHeader>
            <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // prepare withdrawal: validate amounts and then either open pix-key modal or confirmation modal
                    const amount = parseAmount(withdrawAmount);
                    const minWithdrawal = withdrawChannel.minAmount / 100;
                    const maxWithdrawal = withdrawChannel.maxAmount > 0 ? withdrawChannel.maxAmount / 100 : Infinity;
                    if (Number.isNaN(amount) || amount < minWithdrawal) {
                      setWithdrawNote({
                        status: 'error',
                        message: formatMessage(errorsCopy.withdrawMin, {
                          minWithdrawal: formatMoney(withdrawChannel.minAmount),
                        }),
                      });
                      return;
                    }
                    if (Number.isFinite(maxWithdrawal) && amount > maxWithdrawal) {
                      setWithdrawNote({
                        status: 'error',
                        message: formatMessage(errorsCopy.withdrawMax, {
                          maxWithdrawal: formatMoney(withdrawChannel.maxAmount || cfg.MAX_WITHDRAWAL),
                        }),
                      });
                      return;
                    }
                    if (amount > walletBalance - 50) {
                      setWithdrawNote({ status: 'error', message: errorsCopy.withdrawBalance });
                      return;
                    }

                    // If user has no pix key, open pix key modal to collect it first
                    if (!displayedPixKey) {
                      setPixKeyInput('');
                      setPixKeyModalOpen(true);
                      // store pending amount so we can continue after pix key saved
                      setPendingWithdrawAmount(amount);
                      return;
                    }

                    // otherwise open confirmation modal
                    setPendingWithdrawAmount(amount);
                    setWithdrawConfirmOpen(true);
                  }}
                >
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="withdraw-value">
                    {withdrawCopy.amountLabel}
                  </label>
                  <Input
                    id="withdraw-value"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    inputMode="decimal"
                    disabled={withdrawDisabled}
                  />
                  {withdrawLimitLabel ? (
                    <p className="text-xs text-[var(--color-muted)]">{withdrawLimitLabel}</p>
                  ) : null}
                </div>
                {displayedPixKey ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {withdrawCopy.pixRegisteredLabel ?? 'Chave PIX'}
                      </label>
                      <Input id="pix-key-registered" value={String(displayedPixKey)} disabled />
                    </div>
                    <Button
                      type="submit"
                      disabled={withdrawDisabled || isProcessingWithdraw}
                      className="w-full"
                    >
                      {isProcessingWithdraw ? withdrawCopy.submitting : withdrawCopy.submit}
                    </Button>
                    <div className="mt-2 flex justify-between">
                      <p className="text-xs text-[var(--color-muted)]">
                        Usando chave: <span className="font-mono">{String(displayedPixKey)}</span>
                      </p>
                      <Button size="sm" onClick={() => (window.location.href = '/perfil')}>
                        Alterar chave
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--color-muted)]">
                      {withdrawCopy.missingPixNote ??
                        'Você não cadastrou uma chave PIX. Cadastre em Perfil para poder sacar.'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // open pix key modal directly so user can input without leaving page
                          setPixKeyInput('');
                          setPixKeyModalOpen(true);
                        }}
                      >
                        {withdrawCopy.ctaRegisterPix ?? 'Ir para Perfil'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
              {withdrawDisabled ? (
                <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <p>{withdrawPausedMessage}</p>
                  {withdrawChannel.reason ? (
                    <p className="text-xs text-amber-200">{withdrawChannel.reason}</p>
                  ) : null}
                </div>
              ) : null}
              {withdrawNote && (
                <p
                  className={`mt-4 text-sm ${
                    withdrawNote.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {withdrawNote.message}
                </p>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Transaction history removed from wallet page to avoid duplication with Atividades */}
      <Modal
        open={Boolean(depositModalOpen && activeDeposit)}
        onClose={handleCloseDepositModal}
        title={depositModalCopy.title}
        description={depositModalCopy.description}
        footer={
          <>
            <Button
              type="button"
              onClick={handleSyncDepositStatus}
              disabled={!activeDeposit || isSyncingDepositStatus}
            >
              {isSyncingDepositStatus
                ? (depositModalCopy.confirming ?? 'Confirmando...')
                : (depositModalCopy.confirm ?? 'Confirmar depósito')}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCloseDepositModal}>
              {depositModalCopy.close ?? 'Fechar'}
            </Button>
          </>
        }
      >
        {activeDeposit ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--color-muted-foreground)]/5 p-4">
              <p className="text-sm text-[var(--color-muted)]">
                {depositModalCopy.amountLabel ?? depositCopy.summaryLabel}
              </p>
              <p className="text-2xl font-semibold text-[var(--color-foreground)]">
                {formatMoney(activeDeposit.amountCents)}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {formatMessage(depositModalCopy.expiresHelper ?? depositCopy.expiresLabel, {
                  time: formatHour(activeDeposit.expiresAt),
                })}
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-dashed border-[color:var(--color-border)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]">
                {depositModalCopy.testingTitle ?? 'Função em testes'}
              </p>
              <p className="text-sm text-[var(--color-foreground)]">
                {depositModalCopy.testingDescription ??
                  'Estamos preparando um fluxo definitivo. Por enquanto, use o botão para confirmar o depósito manualmente.'}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {depositModalCopy.processingHint ??
                  'O crédito só aparece quando o provedor PIX confirma o pagamento no backend.'}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-50">
              {depositModalCopy.awaitingConfirmation ??
                'Pagamento enviado ao provedor, aguardando confirmação. O saldo será atualizado assim que o PIX for compensado.'}
            </div>
            {depositModalCopy.devHelper ? (
              <p className="text-xs text-[var(--color-muted)]">{depositModalCopy.devHelper}</p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Pix key registration modal (inline quick flow) */}
      <Modal
        open={pixKeyModalOpen}
        onClose={() => {
          setPixKeyModalOpen(false);
          setPendingWithdrawAmount(null);
        }}
        title={withdrawCopy.registerTitle ?? 'Cadastrar chave PIX'}
        description={withdrawCopy.registerDescription ?? 'Informe sua chave PIX para receber saques.'}
        footer={
          <>
            <Button
              type="button"
              onClick={async () => {
                if (!pixKeyInput || pixKeyInput.trim().length < 3) {
                  setWithdrawNote({ status: 'error', message: withdrawCopy.registerInvalid ?? 'Chave inválida' });
                  return;
                }
                setIsSavingPixKey(true);
                try {
                  const [{ usersApi }, { resolveAuthOptions }] = await Promise.all([
                    import('../lib/sdk/modules/users'),
                    import('../lib/sdk/clients/_internal'),
                  ]);
                  const authOptions = await resolveAuthOptions();
                  await usersApi.updatePixKey({ pixKey: pixKeyInput.trim() }, authOptions);
                  // refresh local store
                  await refreshWalletData();
                  setPixKeyModalOpen(false);
                  // if we had a pending withdraw amount, open confirmation modal
                  if (pendingWithdrawAmount != null) {
                    setWithdrawConfirmOpen(true);
                  }
                } catch {
                  setWithdrawNote({ status: 'error', message: withdrawCopy.registerFailed ?? 'Falha ao salvar chave PIX' });
                } finally {
                  setIsSavingPixKey(false);
                }
              }}
              disabled={isSavingPixKey}
            >
              {isSavingPixKey ? withdrawCopy.registering ?? 'Salvando...' : withdrawCopy.registerConfirm ?? 'Salvar chave'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPixKeyModalOpen(false)}>
              {withdrawCopy.registerCancel ?? 'Cancelar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="text-sm font-medium">{withdrawCopy.registerLabel ?? 'Chave PIX'}</label>
          <Input value={pixKeyInput} onChange={(e) => setPixKeyInput(e.target.value)} />
          {withdrawCopy.registerHint ? <p className="text-xs text-[var(--color-muted)]">{withdrawCopy.registerHint}</p> : null}
        </div>
      </Modal>

      {/* Withdraw confirmation modal */}
      <Modal
        open={withdrawConfirmOpen}
        onClose={() => {
          setWithdrawConfirmOpen(false);
          setPendingWithdrawAmount(null);
        }}
        title={withdrawCopy.confirmTitle ?? 'Confirmar saque'}
        description={withdrawCopy.confirmDescription ?? 'Confirme os dados antes de solicitar o saque.'}
        footer={
          <>
            <Button
              type="button"
              onClick={async () => {
                setWithdrawNote(null);
                setWithdrawConfirmOpen(false);
                if (pendingWithdrawAmount == null) return;
                startWithdrawTransition(() => {
                  void (async () => {
                    const paymentsClient = await ensurePaymentsClient();
                    if (!paymentsClient?.requestPixWithdrawal) {
                      setWithdrawNote({ status: 'error', message: withdrawCopy.requestFail ?? 'Serviço indisponível' });
                      return;
                    }
                    const ok = await paymentsClient.requestPixWithdrawal({
                      amount: pendingWithdrawAmount,
                      currency: 'BRL',
                      pixKey: String(displayedPixKey ?? '').trim(),
                    });
                    if (!ok) {
                      setWithdrawNote({ status: 'error', message: withdrawCopy.requestFail ?? 'Falha ao solicitar saque' });
                      return;
                    }
                    setWithdrawNote({ status: 'success', message: withdrawCopy.successNote });
                    setWithdrawAmount('');
                    await refreshWalletData();
                    setPendingWithdrawAmount(null);
                  })();
                });
              }}
            >
              {withdrawCopy.confirm ?? 'Confirmar saque'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setWithdrawConfirmOpen(false)}>
              {withdrawCopy.cancel ?? 'Cancelar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)]">{withdrawCopy.confirmHint ?? 'Você está prestes a solicitar um saque.'}</p>
          <div className="rounded-2xl bg-[var(--color-muted-foreground)]/5 p-4">
            <p className="text-sm text-[var(--color-muted)]">{withdrawCopy.amountLabel}</p>
            <p className="text-2xl font-semibold">{pendingWithdrawAmount != null ? `${pendingWithdrawAmount.toFixed(2)}` : '—'}</p>
            <p className="text-xs text-[var(--color-muted)]">{displayedPixKey ? `Destino: ${String(displayedPixKey)}` : ''}</p>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}

export async function loader(args: Route.LoaderArgs) {
  const { accessToken } = await requireAuth(args);
  try {
    const [{ getMyWallet }, { me }] = await Promise.all([
      import('../lib/sdk/clients/wallet'),
      import('../lib/sdk/clients/auth'),
    ]);
    const [wallet, user] = await Promise.all([getMyWallet({ accessToken }), me({ accessToken })]);
    return {
      initialAccountSnapshot: {
        wallet,
        user,
        syncedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { initialAccountSnapshot: null };
  }
}
