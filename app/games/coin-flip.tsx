import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { GameComponentProps } from '../types/games';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/cn';
import { selectWalletBalance, useAccountStore } from '../stores/useAccountStore';
import type { WalletSnapshot } from '../stores/useAccountStore';
import {
  getCoinFlipConfig,
  getCoinFlipHistory,
  playCoinFlip,
  type CoinFlipConfig,
  type CoinFlipRound,
} from '../lib/sdk/clients/games';
import { formatMoney, centsToDecimal, normalizeMoneyAmount } from '../utils/money';

const CHOICES = [
  { value: 'HEADS' as const, label: 'Cara' },
  { value: 'TAILS' as const, label: 'Coroa' },
];
const FACE_LABELS: Record<'HEADS' | 'TAILS', string> = {
  HEADS: 'Cara',
  TAILS: 'Coroa',
};

const ROUND_RESULT_LABELS: Record<'WIN' | 'LOSE' | 'PENDING', string> = {
  WIN: 'Ganhou',
  LOSE: 'Perdeu',
  PENDING: 'Pendente',
};

const VALUE_SHIFT_THRESHOLD = 10_000;

function decodeDecimalValue(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) > VALUE_SHIFT_THRESHOLD) {
    return value / 100;
  }
  return value;
}

function formatMultiplierValue(value?: number | null) {
  const decimal = decodeDecimalValue(value);
  if (decimal == null) {
    return null;
  }
  const formatted = Number.isInteger(decimal)
    ? String(decimal)
    : decimal.toFixed(2).replace(/\.00$/, '');
  return `${formatted}x`;
}

const CHOICE_THEMES: Record<
  'HEADS' | 'TAILS',
  { selected: string; indicator: string }
> = {
  HEADS: {
    selected: 'border-amber-400 bg-amber-400/10 text-amber-500',
    indicator: 'bg-amber-400',
  },
  TAILS: {
    selected: 'border-sky-500 bg-sky-500/10 text-sky-500',
    indicator: 'bg-sky-500',
  },
};

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CoinFlipGame({ descriptor }: GameComponentProps) {
  const walletBalanceCents = useAccountStore(selectWalletBalance);
  const walletLoading = useAccountStore((state) => state.loading.wallet);
  const refreshAccount = useAccountStore((state) => state.refreshAll);
  const [config, setConfig] = useState<CoinFlipConfig | null>(null);
  const [history, setHistory] = useState<CoinFlipRound[]>([]);
  const [choice, setChoice] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [wager, setWager] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [flipState, setFlipState] = useState<'idle' | 'animating' | 'revealed'>('idle');
  const [flipWinner, setFlipWinner] = useState<'HEADS' | 'TAILS' | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  // import CSS for animation (kept local to the module)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('./coin-flip.css').catch(() => {
      // ignore missing CSS in some test environments
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingConfig(true);
      try {
        const [cfg, hist] = await Promise.all([
          getCoinFlipConfig(),
          getCoinFlipHistory({ limit: 10 }),
        ]);
        if (!mounted) return;
        setConfig(cfg);
        setHistory(hist.rounds ?? []);
        if (cfg?.minBet) {
          const normalizedMin = decodeDecimalValue(cfg.minBet) ?? 0;
          setWager(String(normalizedMin));
        }
        setError(null);
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar Coin Flip.';
        setError(message);
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;
    const pullHistory = async () => {
      try {
        const next = await getCoinFlipHistory({ limit: 10 });
        if (!active) return;
        setHistory(next.rounds ?? []);
      } catch {
        // ignore background history errors
      }
    };
    pullHistory();
    if (typeof window !== 'undefined') {
      timer = window.setInterval(pullHistory, 15_000);
    }
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const walletBalance = centsToDecimal(walletBalanceCents);
  const currency = config?.currency ?? 'BRL';
  const displayedBalance = Math.max(0, walletBalance);

  const formatRoundAmount = (value: number | undefined | null, currencyCode: string) => {
    const decimalValue = decodeDecimalValue(value ?? 0) ?? 0;
    return formatMoney(normalizeMoneyAmount(decimalValue), currencyCode);
  };

  const getRoundResultLabel = (result?: CoinFlipRound['result']) =>
    result ? ROUND_RESULT_LABELS[result] : ROUND_RESULT_LABELS.PENDING;

  const validateWager = useCallback(
    (value: number) => {
      if (value <= 0 || Number.isNaN(value)) {
        return 'Informe um valor válido para jogar.';
      }
      if (config) {
        const minBet = decodeDecimalValue(config.minBet ?? null);
        const maxBet = decodeDecimalValue(config.maxBet ?? null);
        if (minBet != null && value < minBet) {
          return `O mínimo permitido é ${formatMoney(minBet, currency)}.`;
        }
        if (maxBet != null && value > maxBet) {
          return `O máximo permitido é ${formatMoney(maxBet, currency)}.`;
        }
      }
      if (walletBalance && value > walletBalance) {
        return 'Saldo insuficiente para essa aposta.';
      }
      return null;
    },
    [config, currency, walletBalance]
  );

  const handlePlay = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const numericWager = Number(wager);
      const validationMessage = validateWager(numericWager);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
      setIsPlaying(true);
      setError(null);
      setSuccess(null);
      setFlipState('animating');
      setFlipWinner(null);
      try {
        const normalizedWager = normalizeMoneyAmount(numericWager);
        const response = await playCoinFlip({ choice, wager: normalizedWager });
        if (!response?.round) {
          throw new Error('Resposta inválida do servidor.');
        }
        if (response?.round) {
          // push to history immediately (backend snapshot)
          setHistory((prev) => [response.round, ...prev].slice(0, 10));
          // determine which side landed; prefer explicit outcome, fallback to result + choice
          const outcome =
            response.round.outcome ??
            (response.round.result === 'WIN' ? choice : choice === 'HEADS' ? 'TAILS' : 'HEADS');
          setFlipWinner(outcome ?? null);
        }
        // wait for the animation to finish then reveal text
        if (animationTimeoutRef.current) {
          window.clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = window.setTimeout(async () => {
          animationTimeoutRef.current = null;
          setFlipState('revealed');
          if (response?.round) {
            const result = response.round.result;
            if (result === 'WIN') {
              setSuccess('Parabéns! Você venceu essa rodada.');
            } else if (result === 'LOSE') {
              setSuccess('Que pena — você perdeu essa rodada.');
            } else {
              setSuccess('Aposta registrada — aguardando resultado...');
            }
          }
          try {
            if (response?.wallet) {
              const snapshot = response.wallet as WalletSnapshot;
              useAccountStore.setState((state) => ({
                wallet: {
                  ...(state.wallet ?? {}),
                  ...snapshot,
                },
              }));
            }
            await refreshAccount();
            const latest = await getCoinFlipHistory({ limit: 10 });
            setHistory(latest.rounds ?? []);
          } catch {
            // ignore refresh errors; UI already shows optimistic result
          }
          setIsPlaying(false);
        }, 1200);
      } catch (err) {
        if (animationTimeoutRef.current) {
          window.clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }
        const message = err instanceof Error ? err.message : 'Não foi possível jogar agora.';
        setFlipState('idle');
        setIsPlaying(false);
        setError(message);
      }
    },
    [choice, refreshAccount, validateWager, wager]
  );

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);

  const loading = loadingConfig || walletLoading;
  const statusLabel = useMemo(() => {
    if (!config) return 'Carregando';
    return config.enabled ? 'Disponível' : 'Pausado';
  }, [config]);

  const summaryStats = useMemo(() => {
    if (!config) return [] as Array<{ label: string; value: string }>;
    const minBetValue = decodeDecimalValue(config.minBet ?? null);
    const maxBetValue = decodeDecimalValue(config.maxBet ?? null);
    const payoutAmountValue =
      config.fixedWinAmount != null ? decodeDecimalValue(config.fixedWinAmount) : null;
    const formattedPayout =
      payoutAmountValue != null
        ? formatMoney(payoutAmountValue, currency)
        : formatMultiplierValue(config.payoutMultiplier) ?? '—';
    return [
      { label: 'Aposta mínima', value: minBetValue != null ? formatMoney(minBetValue, currency) : '—' },
      { label: 'Aposta máxima', value: maxBetValue != null ? formatMoney(maxBetValue, currency) : '—' },
      { label: 'Multiplicador do prêmio', value: formattedPayout },
    ];
  }, [config, currency]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-1 text-2xl">
            {descriptor.icon} {descriptor.name}
            <span className="text-base font-normal text-[var(--color-muted)]">
              {descriptor.overview}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">Status</p>
            <p
              className={cn(
                'text-lg font-semibold',
                config?.enabled ? 'text-emerald-400' : 'text-amber-300'
              )}
            >
              {statusLabel}
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
              Saldo disponível
            </p>
            <p className="text-2xl font-semibold">
              {loading ? 'Carregando...' : formatMoney(displayedBalance, currency)}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-[var(--color-muted)]">
            {summaryStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span>{item.label}</span>
                <span className="font-semibold text-[var(--color-foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faça sua aposta</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          {success && <p className="mb-4 text-sm text-emerald-400">{success}</p>}
          <div className="mb-4 flex items-center justify-center">
            <div className="coin-flip-root">
              <div
                role="img"
                aria-label={
                  flipWinner
                    ? `Moeda: ${flipWinner === 'HEADS' ? 'Cara' : 'Coroa'}`
                    : 'Moeda em espera'
                }
                className={cn(
                  'coin',
                  flipState === 'animating' &&
                    (flipWinner === 'HEADS' ? 'flip-heads' : 'flip-tails'),
                  flipState === 'revealed' && 'revealed',
                  flipWinner === 'HEADS' ? 'heads' : flipWinner === 'TAILS' ? 'tails' : ''
                )}
              >
                {/* rim ridges element for visual edge detail */}
                <span className="coin-ridges" aria-hidden="true" />
                <span className="coin-face coin-face--heads" aria-hidden={flipState !== 'revealed'} />
                <span className="coin-face coin-face--tails" aria-hidden={flipState !== 'revealed'} />
              </div>
              <span className="sr-only" aria-live="polite">
                {flipState === 'revealed' && flipWinner ? `Moeda: ${FACE_LABELS[flipWinner]}` : ''}
              </span>
            </div>
          </div>
          <form className="grid gap-4 md:grid-cols-[1fr,1fr,auto]" onSubmit={handlePlay}>
            <div className="space-y-2">
              <p className="text-sm text-[var(--color-muted)]">Escolha</p>
              <div className="flex gap-2">
                {CHOICES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'flex-1 rounded-xl border px-4 py-3 text-center text-lg font-semibold transition-colors focus-visible:ring focus-visible:ring-[color:var(--color-primary)]/40',
                      choice === option.value
                        ? CHOICE_THEMES[option.value].selected
                        : 'border-[color:var(--color-border)] text-[var(--color-muted)] hover:border-[color:var(--color-primary)]/30'
                    )}
                    onClick={() => setChoice(option.value)}
                    disabled={isPlaying}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          CHOICE_THEMES[option.value].indicator
                        )}
                        aria-hidden
                      />
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--color-muted)]" htmlFor="coin-flip-wager">
                Valor da aposta
              </label>
              <Input
                id="coin-flip-wager"
                type="number"
                step="0.01"
                min="0"
                value={wager}
                onChange={(event) => setWager(event.target.value)}
                disabled={isPlaying || loading}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isPlaying || loading || !config || !config.enabled}>
                {isPlaying ? 'Jogando...' : 'Jogar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Suas últimas rodadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--color-muted)]">Sincronizando histórico...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Nenhuma rodada registrada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((round) => (
                <li
                  key={round.id ?? `${round.createdAt}-${round.choice}`}
                  className="rounded-xl border border-[color:var(--color-border)] p-4"
                >
                  <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                    <span>{formatTimestamp(round.createdAt)}</span>
                    <span>{getRoundResultLabel(round.result)}</span>
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {FACE_LABELS[(round.choice ?? 'HEADS') as 'HEADS' | 'TAILS']} ·{' '}
                    {formatRoundAmount(round.wager ?? 0, round.currency ?? currency)}
                  </div>
                  {round.payoutAmount != null && (
                    <p className="text-sm text-[var(--color-muted)]">
                      Pagamento:{' '}
                      {formatRoundAmount(round.payoutAmount ?? 0, round.currency ?? currency)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoinFlipGame;
