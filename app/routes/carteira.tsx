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
import type { PixChannelState } from '../services/wallet-service';
import type { Route } from './+types/carteira';
import { useLoaderData } from 'react-router';
import { PageShell } from '../components/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Modal } from '../components/ui/modal';
import { FadeIn } from '../components/animation';
import Withdraw from '../components/wallet/Withdraw';
import Deposit from '../components/wallet/Deposit';
import { useWithdraw } from '../hooks/useWithdraw';
import { useDeposit } from '../hooks/useDeposit';
import type { PaymentsClient as WithdrawPaymentsClient } from '../hooks/useWithdraw';
import type { PaymentsClient as DepositPaymentsClient } from '../hooks/useDeposit';
import { requireAuth } from '../utils/auth.server';
import type { Transaction, TransactionType } from '../types/wallet';
import { useI18n } from '../i18n/i18n-provider';
import type {
  WalletCopy,
  SummaryCardCopy,
  MonitoringCardCopy,
  WithdrawCardCopy,
} from '../types/i18n';
import { cfg, formatMoney, formatMessage } from '../lib/config';
import { getPageMeta } from '../i18n/page-copy';
import { useAccountHydration } from '../hooks/useAccountHydration';
import { selectWalletBalance, selectUser, useAccountStore } from '../stores/useAccountStore';
import type { AccountHydrationPayload } from '../stores/useAccountStore';
import {
  defaultPixCapabilities,
  refreshWalletAggregates,
  type PixCapabilitiesState,
} from '../services/wallet-service';

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
  return null;
}

const _hourFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
});
const _formatHour = (value: string) => _hourFormatter.format(new Date(value));

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
  const walletCopy = messages.wallet as WalletCopy;
  // narrow types for deposit/withdraw copy with safe fallbacks
  const depositCopy = (walletCopy.depositCard ?? {}) as WalletCopy['depositCard'];
  const withdrawCopy = (walletCopy.withdrawCard ?? {}) as WithdrawCardCopy;
  const _historyCopy = walletCopy.history;
  const summaryCard = (walletCopy.summaryCard ?? {}) as SummaryCardCopy;
  const _monitoringCopy = (walletCopy.monitoringCard ?? {}) as MonitoringCardCopy;
  const _statusCopy = walletCopy.statuses ?? ({} as Record<string, string>);
  const connectionCopy = walletCopy.connectionStates ?? {
    online: 'Online',
    sincronizando: 'Sincronizando',
  };
  const _channelLabels = walletCopy.channels ?? ({} as Record<string, string>);
  const errorsCopy = walletCopy.errors ?? ({} as Record<string, string>);

  const walletBalanceCents = useAccountStore(selectWalletBalance);
  const walletBalance = useMemo(() => (walletBalanceCents ?? 0) / 100, [walletBalanceCents]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<'online' | 'sincronizando'>('online');
  const [nowTick, setNowTick] = useState(0);
  const [pixCaps, setPixCaps] = useState<PixCapabilitiesState>(defaultPixCapabilities);
  const paymentsClientRef = useRef<DepositPaymentsClient | WithdrawPaymentsClient | null>(null);
  const mountedRef = useRef(true);
  const [_depositError, _setDepositError] = useState<string | null>(null);
  const [, _startPixTransition] = useTransition();

  const [withdrawAmount, setWithdrawAmount] = useState('100,00');
  const [withdrawNote, setWithdrawNote] = useState<{
    status: 'success' | 'error';
    message: string;
    details?: Record<string, unknown> | null;
  } | null>(null);
  const [isProcessingWithdraw, startWithdrawTransition] = useTransition();
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [depositConfirmedByUser, setDepositConfirmedByUser] = useState(false);
  const [pixKeyModalOpen, setPixKeyModalOpen] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState('');
  const [isSavingPixKey, setIsSavingPixKey] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState<'todos' | TransactionType>('todos');
  const deferredHistorySearch = useDeferredValue(historySearch);
  const [_isFilteringHistory, startHistoryTransition] = useTransition();
  const depositChannel = pixCaps.deposit;
  const withdrawChannel = pixCaps.withdraw;
  const _depositDisabled = !depositChannel.enabled;
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
  const _depositModalCopy = depositCopy.modal ?? {};

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

  // Withdraw helpers (hook)
  const { validateAmount: validateWithdrawAmount, requestWithdrawal } = useWithdraw(
    ensurePaymentsClient as () => Promise<WithdrawPaymentsClient | null>
  );

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

  // Deposit helpers (hook) — declared after refreshWalletData to avoid temporal dead zone
  const {
    isGenerating: isGeneratingPix,
    depositError: depositErrorFromHook,
    depositErrorDetails,
    activeDeposit,
    depositModalOpen,
    depositBaselineCents,
    isSyncing,
    createDeposit,
    closeDepositModal,
    syncDepositStatus,
  } = useDeposit(
    ensurePaymentsClient as () => Promise<DepositPaymentsClient | null>,
    refreshWalletData,
    walletBalanceCents
  );

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

  // deposit submission handled by <Deposit /> component via createDeposit

  // polling handled by useDeposit

  useEffect(() => {
    if (!activeDeposit || depositBaselineCents == null) {
      return;
    }
    if (!depositConfirmedByUser) return;
    const expectedCents = depositBaselineCents + (activeDeposit.amountCents ?? 0);
    if (expectedCents > 0 && (walletBalanceCents ?? 0) >= expectedCents) {
      closeDepositModal();
      setDepositConfirmedByUser(false);
    }
  }, [activeDeposit, walletBalanceCents, depositBaselineCents, closeDepositModal, depositConfirmedByUser]);

  const handleConfirmDeposit = useCallback(() => {
    setDepositConfirmedByUser(true);
    void syncDepositStatus();
  }, [syncDepositStatus]);

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
          <Deposit
            depositCopy={depositCopy}
            depositChannel={depositChannel}
            depositLimitLabel={depositLimitLabel}
            depositStatusLabel={depositStatusLabel}
            depositPausedMessage={depositPausedMessage}
            createDeposit={createDeposit}
            isGenerating={isGeneratingPix}
            depositErrorFromHook={depositErrorFromHook}
            depositErrorDetails={depositErrorDetails}
            activeDeposit={activeDeposit}
            depositModalOpen={depositModalOpen}
            depositBaselineCents={depositBaselineCents}
            isSyncing={isSyncing}
            closeDepositModal={closeDepositModal}
            syncDepositStatus={handleConfirmDeposit}
          />
        </FadeIn>
        <FadeIn>
          <Withdraw
            withdrawCopy={withdrawCopy}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            displayedPixKey={displayedPixKey}
            withdrawDisabled={withdrawDisabled}
            isProcessingWithdraw={isProcessingWithdraw}
            withdrawLimitLabel={withdrawLimitLabel}
            withdrawNote={withdrawNote}
            onOpenPixKeyModal={() => {
              setPixKeyInput('');
              setPixKeyModalOpen(true);
            }}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const amount = parseAmount(withdrawAmount);
              const validation = validateWithdrawAmount(
                amount,
                withdrawChannel,
                walletBalance,
                cfg.MAX_WITHDRAWAL
              );
              if (!validation.ok) {
                if (validation.reason === 'min') {
                  setWithdrawNote({
                    status: 'error',
                    message: formatMessage(errorsCopy.withdrawMin, {
                      minWithdrawal: formatMoney(withdrawChannel.minAmount),
                    }),
                  });
                  return;
                }
                if (validation.reason === 'max') {
                  setWithdrawNote({
                    status: 'error',
                    message: formatMessage(errorsCopy.withdrawMax, {
                      maxWithdrawal: formatMoney(withdrawChannel.maxAmount || cfg.MAX_WITHDRAWAL),
                    }),
                  });
                  return;
                }
                if (validation.reason === 'balance') {
                  setWithdrawNote({ status: 'error', message: errorsCopy.withdrawBalance });
                  return;
                }
              }

              if (!displayedPixKey) {
                setPixKeyInput('');
                setPixKeyModalOpen(true);
                setPendingWithdrawAmount(amount);
                return;
              }

              setPendingWithdrawAmount(amount);
              setWithdrawConfirmOpen(true);
            }}
            withdrawStatusLabel={withdrawStatusLabel}
            withdrawPausedMessage={withdrawPausedMessage}
          />
        </FadeIn>
      </div>

      {/* Transaction history removed from wallet page to avoid duplication with Atividades */}
      {/* Deposit modal moved into `Deposit` component */}

      {/* Pix key registration modal (inline quick flow) */}
      <Modal
        open={pixKeyModalOpen}
        onClose={() => {
          setPixKeyModalOpen(false);
          setPendingWithdrawAmount(null);
        }}
        title={withdrawCopy.registerTitle ?? 'Cadastrar chave PIX'}
        description={
          withdrawCopy.registerDescription ?? 'Informe sua chave PIX para receber saques.'
        }
        footer={
          <>
            <Button
              type="button"
              onClick={async () => {
                // reuse centralized validation used by profile
                const { validatePixKey, normalizePixKey } = await import('../utils/pix');
                const normalized = normalizePixKey(pixKeyInput ?? '');
                const messagesForValidation = (withdrawCopy as unknown as Record<string, string>);
                const validation = validatePixKey(normalized, messagesForValidation);
                if (!validation.ok) {
                  setWithdrawNote({ status: 'error', message: validation.message ?? (withdrawCopy.registerInvalid ?? 'Chave inválida') });
                  return;
                }
                setIsSavingPixKey(true);
                try {
                  const [{ usersApi }, { resolveAuthOptions }] = await Promise.all([
                    import('../lib/sdk/modules/users'),
                    import('../lib/sdk/clients/_internal'),
                  ]);
                  const authOptions = await resolveAuthOptions();
                  await usersApi.updatePixKey({ pixKey: normalized }, authOptions);
                  // refresh local store
                  await refreshWalletData();
                  setPixKeyModalOpen(false);
                  // if we had a pending withdraw amount, open confirmation modal
                  if (pendingWithdrawAmount != null) {
                    setWithdrawConfirmOpen(true);
                  }
                } catch {
                  setWithdrawNote({
                    status: 'error',
                    message: withdrawCopy.registerFailed ?? 'Falha ao salvar chave PIX',
                  });
                } finally {
                  setIsSavingPixKey(false);
                }
              }}
              disabled={isSavingPixKey}
            >
              {isSavingPixKey
                ? (withdrawCopy.registering ?? 'Salvando...')
                : (withdrawCopy.registerConfirm ?? 'Salvar chave')}
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
          {withdrawCopy.registerHint ? (
            <p className="text-xs text-[var(--color-muted)]">{withdrawCopy.registerHint}</p>
          ) : null}
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
        description={
          withdrawCopy.confirmDescription ?? 'Confirme os dados antes de solicitar o saque.'
        }
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
                    const res = await requestWithdrawal(
                      pendingWithdrawAmount,
                      String(displayedPixKey ?? '').trim(),
                      withdrawPassword || undefined
                    );
                    if (!res.ok) {
                      setWithdrawNote({
                        status: 'error',
                        message:
                          res.message ?? withdrawCopy.requestFail ?? 'Falha ao solicitar saque',
                        details:
                          (res as unknown as { details?: Record<string, unknown> | null })
                            .details ?? null,
                      });
                      return;
                    }
                    setWithdrawNote({
                      status: 'success',
                      message: withdrawCopy.successNote ?? 'Saque solicitado',
                    });
                    setWithdrawAmount('');
                    setWithdrawPassword('');
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
          <p className="text-sm text-[var(--color-muted)]">
            {withdrawCopy.confirmHint ?? 'Você está prestes a solicitar um saque.'}
          </p>
          <div className="space-y-2">
            <label htmlFor="withdraw-password" className="text-sm font-medium">
              Senha (opcional)
            </label>
            <Input
              id="withdraw-password"
              type="password"
              value={withdrawPassword}
              onChange={(e) => setWithdrawPassword(e.target.value)}
              placeholder="Senha da conta"
            />
          </div>
          <div className="rounded-2xl bg-[var(--color-muted-foreground)]/5 p-4">
            <p className="text-sm text-[var(--color-muted)]">{withdrawCopy.amountLabel}</p>
            <p className="text-2xl font-semibold">
              {pendingWithdrawAmount != null ? `${pendingWithdrawAmount.toFixed(2)}` : '—'}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {displayedPixKey ? `Destino: ${String(displayedPixKey)}` : ''}
            </p>
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
