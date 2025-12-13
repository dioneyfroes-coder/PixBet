import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { GameComponentProps } from '../types/games';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/cn';
import { selectWalletBalance, useAccountStore } from '../stores/useAccountStore';
import {
  getCoinFlipConfig,
  getCoinFlipHistory,
  getCoinFlipFeed,
  playCoinFlip,
  type CoinFlipConfig,
  type CoinFlipRound,
} from '../lib/sdk/clients/games';

const CHOICES = [
  { value: 'HEADS' as const, label: 'Cara' },
  { value: 'TAILS' as const, label: 'Coroa' },
];

function formatCurrencyUnits(value: number, currency = 'BRL') {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

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

export function CoinFlipGame({ descriptor, stats }: GameComponentProps) {
  const walletBalanceCents = useAccountStore(selectWalletBalance);
  const walletLoading = useAccountStore((state) => state.loading.wallet);
  const refreshAccount = useAccountStore((state) => state.refreshAll);
  const [config, setConfig] = useState<CoinFlipConfig | null>(null);
  const [history, setHistory] = useState<CoinFlipRound[]>([]);
  const [feed, setFeed] = useState<CoinFlipRound[]>([]);
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
          setWager(String(cfg.minBet));
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
    const pullFeed = async () => {
      try {
        const next = await getCoinFlipFeed();
        if (!active) return;
        setFeed(next.rounds ?? []);
      } catch {
        // ignore background feed errors
      }
    };
    pullFeed();
    if (typeof window !== 'undefined') {
      timer = window.setInterval(pullFeed, 10000);
    }
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const walletBalance = (walletBalanceCents ?? 0) / 100;
  const currency = config?.currency ?? 'BRL';

  const validateWager = useCallback(
    (value: number) => {
      if (value <= 0 || Number.isNaN(value)) {
        return 'Informe um valor válido para jogar.';
      }
      if (config) {
        if (value < config.minBet) {
          return `O mínimo permitido é ${formatCurrencyUnits(config.minBet, currency)}.`;
        }
        if (value > config.maxBet) {
          return `O máximo permitido é ${formatCurrencyUnits(config.maxBet, currency)}.`;
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
        const response = await playCoinFlip({ choice, wager: numericWager });
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
          try {
            await refreshAccount();
          } catch {
            // ignore
          }
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
          setIsPlaying(false);
        }, 1200);
      } catch (err) {
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
    return [
      { label: 'Aposta mínima', value: formatCurrencyUnits(config.minBet, currency) },
      { label: 'Aposta máxima', value: formatCurrencyUnits(config.maxBet, currency) },
      {
        label: 'Pagamento',
        value:
          config.fixedWinAmount != null
            ? formatCurrencyUnits(config.fixedWinAmount, currency)
            : `${config.payoutMultiplier ?? 2}x`,
      },
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
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
              {loading ? 'Carregando...' : formatCurrencyUnits(walletBalance, currency)}
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
          <div className="min-w-[180px] rounded-xl border border-[color:var(--color-border)] p-4 text-sm">
            <p className="text-[var(--color-muted)]">Telemetria</p>
            <p>Taxa de vitória: {stats.winRate.toFixed(1)}%</p>
            <p>Jogadores ativos: {stats.activePlayers.toLocaleString('pt-BR')}</p>
            <p>
              Tendência:{' '}
              {stats.trend === 'up' ? 'Alta' : stats.trend === 'down' ? 'Baixa' : 'Estável'}
            </p>
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
                <span className="coin-face coin-face--heads" aria-hidden={flipState !== 'revealed'}>
                  <span className="coin-face__label">CARA</span>
                </span>
                <span className="coin-face coin-face--tails" aria-hidden={flipState !== 'revealed'}>
                  <span className="coin-face__label">COROA</span>
                </span>
              </div>
              <span className="sr-only" aria-live="polite">
                {flipState === 'revealed' && flipWinner
                  ? `Moeda: ${flipWinner === 'HEADS' ? 'Cara' : 'Coroa'}`
                  : ''}
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
                      'flex-1 rounded-xl border px-4 py-3 text-center text-lg font-semibold transition-colors',
                      choice === option.value
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : 'border-[color:var(--color-border)]'
                    )}
                    onClick={() => setChoice(option.value)}
                    disabled={isPlaying}
                  >
                    {option.label}
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

      <div className="grid gap-6 lg:grid-cols-2">
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
                      <span>{round.result ?? 'PENDENTE'}</span>
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {round.choice === 'HEADS' ? 'Cara' : 'Coroa'} ·{' '}
                      {formatCurrencyUnits(round.wager, round.currency ?? currency)}
                    </div>
                    {round.payoutAmount != null && (
                      <p className="text-sm text-[var(--color-muted)]">
                        Pagamento:{' '}
                        {formatCurrencyUnits(round.payoutAmount, round.currency ?? currency)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feed público</CardTitle>
          </CardHeader>
          <CardContent>
            {feed.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Aguardando novas rodadas...</p>
            ) : (
              <ul className="space-y-3">
                {feed.map((round) => (
                  <li
                    key={`${round.createdAt}-${round.choice}`}
                    className="rounded-xl bg-[var(--color-border)]/20 p-4"
                  >
                    <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                      <span>{formatTimestamp(round.createdAt)}</span>
                      <span>
                        {round.outcome
                          ? `Resultado: ${round.outcome === 'HEADS' ? 'Cara' : 'Coroa'}`
                          : 'Em andamento'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">
                      Usuário · aposta de{' '}
                      {formatCurrencyUnits(round.wager, round.currency ?? currency)} em{' '}
                      {round.choice === 'HEADS' ? 'Cara' : 'Coroa'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CoinFlipGame;
