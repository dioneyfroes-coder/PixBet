import { gamesApi } from '../modules';
import type {
  CoinFlipConfigSnapshot,
  CoinFlipFeedSnapshot,
  CoinFlipHistorySnapshot,
  CoinFlipPlayPayload,
  CoinFlipPlaySnapshot,
  GamesListSnapshot,
} from '../schemas';
import { resolveAuthOptions, resolveOptionalAuthOptions } from './_internal';

export type RemoteGameDescriptor = GamesListSnapshot[number];

export type CoinFlipConfig = {
  id?: string;
  name?: string;
  enabled: boolean;
  minBet: number;
  maxBet: number;
  payoutMultiplier?: number;
  fixedWinAmount?: number;
  currency?: string;
};

export type CoinFlipRound = {
  id?: string;
  choice: 'HEADS' | 'TAILS';
  wager: number;
  currency?: string;
  result?: 'WIN' | 'LOSE' | 'PENDING';
  outcome?: 'HEADS' | 'TAILS';
  payoutAmount?: number | null;
  createdAt: string;
};

export type CoinFlipHistory = {
  rounds: CoinFlipRound[];
  total?: number;
};

export type CoinFlipFeed = {
  rounds: CoinFlipRound[];
};

export type CoinFlipPlayResponse = {
  round: CoinFlipRound;
  wallet?: Record<string, unknown>;
};

const normalizeChoice = (value?: unknown): 'HEADS' | 'TAILS' =>
  value === 'TAILS' ? 'TAILS' : 'HEADS';

const normalizeResult = (value?: unknown): CoinFlipRound['result'] => {
  if (value === 'WIN' || value === 'LOSE' || value === 'PENDING') {
    return value;
  }
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper.includes('WIN')) return 'WIN';
    if (upper.includes('LOSE')) return 'LOSE';
  }
  return 'PENDING';
};

const normalizeCurrency = (value?: unknown) => (typeof value === 'string' ? value : 'BRL');

const normalizeNumber = (value: unknown, fallback = 0) => {
  const numeric = typeof value === 'number' ? value : Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeDate = (value?: unknown) => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
};

const mapRound = (entry: Record<string, unknown>): CoinFlipRound => ({
  id: typeof entry.id === 'string' ? entry.id : undefined,
  choice: normalizeChoice(entry.choice),
  wager: normalizeNumber(entry.amount ?? entry.wager, 0),
  currency: normalizeCurrency(entry.currency),
  result: normalizeResult(entry.result),
  outcome: entry.outcome === 'HEADS' || entry.outcome === 'TAILS' ? entry.outcome : undefined,
  payoutAmount:
    entry.payoutAmount != null
      ? Number(entry.payoutAmount)
      : entry.payout != null
        ? Number(entry.payout)
        : null,
  createdAt: normalizeDate(entry.createdAt),
});

const mapConfig = (snapshot?: CoinFlipConfigSnapshot | null): CoinFlipConfig | null => {
  if (!snapshot) return null;
  const extras = snapshot as Record<string, unknown>;
  const payoutMultiplierSource =
    typeof extras.payoutMultiplier === 'number'
      ? extras.payoutMultiplier
      : typeof snapshot.houseEdge === 'number'
        ? snapshot.houseEdge
        : typeof extras.houseEdge === 'number'
          ? extras.houseEdge
          : undefined;
  const fixedWinAmount =
    typeof extras.fixedWinAmount === 'number' ? extras.fixedWinAmount : undefined;
  return {
    id: typeof extras.id === 'string' ? extras.id : undefined,
    name: typeof extras.name === 'string' ? extras.name : undefined,
    enabled: typeof extras.enabled === 'boolean' ? extras.enabled : true,
    minBet: normalizeNumber(snapshot.minBet, 1),
    maxBet: normalizeNumber(snapshot.maxBet, snapshot.minBet ?? 10),
    payoutMultiplier:
      payoutMultiplierSource != null ? normalizeNumber(payoutMultiplierSource, 1) : undefined,
    fixedWinAmount: fixedWinAmount != null ? normalizeNumber(fixedWinAmount, 0) : undefined,
    currency: normalizeCurrency(snapshot.currency),
  };
};

const mapHistory = (snapshot?: CoinFlipHistorySnapshot | null): CoinFlipHistory => {
  if (!snapshot) {
    return { rounds: [], total: 0 };
  }
  const extras = snapshot as Record<string, unknown>;
  const roundsSource = Array.isArray(snapshot.games)
    ? snapshot.games
    : Array.isArray(extras.rounds)
      ? (extras.rounds as Array<Record<string, unknown>>)
      : [];
  return {
    rounds: roundsSource.map((entry) => mapRound(entry as Record<string, unknown>)),
    total:
      snapshot.pagination?.total ??
      (typeof extras.total === 'number' ? extras.total : roundsSource.length),
  };
};

const mapFeed = (snapshot?: CoinFlipFeedSnapshot | null): CoinFlipFeed => ({
  rounds: Array.isArray(snapshot)
    ? snapshot.map((entry) => mapRound(entry as Record<string, unknown>))
    : [],
});

const mapPlayResponse = (payload?: CoinFlipPlaySnapshot | null): CoinFlipPlayResponse | null => {
  if (!payload) return null;
  const round = mapRound({
    id: payload.roundId ?? payload.id,
    choice: payload.choice,
    result: payload.result,
    outcome: payload.outcome,
    amount: payload.wager,
    currency: payload.currency,
    payoutAmount: payload.payoutAmount,
    createdAt: payload.createdAt,
  });
  return {
    round,
    wallet: payload.wallet ?? undefined,
  };
};

export async function getGames(): Promise<RemoteGameDescriptor[]> {
  const { data } = await gamesApi.listGames();
  return data ?? [];
}

export async function getCoinFlipConfig(): Promise<CoinFlipConfig | null> {
  const { data } = await gamesApi.getCoinFlipConfig();
  return mapConfig(data);
}

export async function getCoinFlipHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<CoinFlipHistory> {
  const authOptions = await resolveOptionalAuthOptions();
  if (!authOptions?.token) {
    throw new Error('Sessão expirada. Faça login novamente para ver o histórico.');
  }
  const { data } = await gamesApi.getCoinFlipHistory(params ?? {}, authOptions);
  return mapHistory(data);
}

export async function getCoinFlipFeed(): Promise<CoinFlipFeed> {
  const { data } = await gamesApi.getCoinFlipFeed();
  return mapFeed(data);
}

export async function playCoinFlip(
  payload: CoinFlipPlayPayload
): Promise<CoinFlipPlayResponse | null> {
  const authOptions = await resolveAuthOptions();
  const { data } = await gamesApi.playCoinFlip(payload, authOptions);
  return mapPlayResponse(data);
}

export default {
  getGames,
  getCoinFlipConfig,
  getCoinFlipHistory,
  getCoinFlipFeed,
  playCoinFlip,
};
