import { cfg } from '../lib/config';
import type { Transaction, LiveChannel } from '../types/wallet';
import { getTransactions } from '../lib/sdk/clients/transactions';
import {
  getPixCapabilities,
  type PixCapabilities as RemotePixCapabilities,
} from '../lib/sdk/clients/payments';
import { useAccountStore, type WalletSnapshot } from '../stores/useAccountStore';

export type PixChannelState = {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  reason?: string | null;
};

export type PixCapabilitiesState = {
  deposit: PixChannelState;
  withdraw: PixChannelState;
};

export const defaultPixCapabilities: PixCapabilitiesState = {
  deposit: {
    enabled: true,
    minAmount: cfg.MIN_DEPOSIT,
    maxAmount: cfg.MAX_DEPOSIT,
    reason: null,
  },
  withdraw: {
    enabled: true,
    minAmount: cfg.MIN_WITHDRAWAL,
    maxAmount: cfg.MAX_WITHDRAWAL,
    reason: null,
  },
};

const channelFallback: LiveChannel = 'Web';

type RefreshWalletAggregatesOptions = {
  transactionsLimit?: number;
};

type RefreshWalletAggregatesResult = {
  wallet: WalletSnapshot | null;
  transactions: Transaction[];
  pixCapabilities: PixCapabilitiesState;
};

export function mergeCapabilities(next?: RemotePixCapabilities | null): PixCapabilitiesState {
  if (!next) {
    return {
      deposit: { ...defaultPixCapabilities.deposit },
      withdraw: { ...defaultPixCapabilities.withdraw },
    };
  }
  return {
    deposit: sanitizeChannel(next.deposit, defaultPixCapabilities.deposit),
    withdraw: sanitizeChannel(next.withdraw, defaultPixCapabilities.withdraw),
  };
}

function sanitizeChannel(
  incoming: RemotePixCapabilities['deposit'],
  fallback: PixChannelState
): PixChannelState {
  const min =
    typeof incoming?.minAmount === 'number' && Number.isFinite(incoming.minAmount)
      ? Math.max(0, incoming.minAmount)
      : fallback.minAmount;
  const hasMax = typeof incoming?.maxAmount === 'number' && incoming.maxAmount > 0;
  const normalizedMax = hasMax ? Math.max(min, incoming!.maxAmount as number) : fallback.maxAmount;
  return {
    enabled: typeof incoming?.enabled === 'boolean' ? incoming.enabled : fallback.enabled,
    minAmount: min,
    maxAmount: normalizedMax,
    reason: incoming?.reason ?? fallback.reason ?? null,
  };
}

function mapTransaction(record: unknown): Transaction {
  const rec = (record as Record<string, unknown>) ?? {};
  const id = rec.id ? String(rec.id) : `tx-${Math.random().toString(36).slice(2, 8)}`;
  const type = String(rec.type ?? 'deposit') as Transaction['type'];
  const reference = String(rec.description ?? rec.reference ?? '');
  const amountNum = typeof rec.amount === 'number' ? rec.amount : 0;
  const amountCents = Math.round(amountNum);
  const amount = Number((amountCents / 100).toFixed(2));
  const status = (String(rec.status ?? 'confirmado') as Transaction['status']) ?? 'confirmado';
  const timestamp = String(rec.createdAt ?? rec.timestamp ?? new Date().toISOString());
  const channel = (String(rec.channel ?? channelFallback) as LiveChannel) ?? channelFallback;
  return { id, type, reference, amount, amountCents, status, timestamp, channel };
}

async function fetchTransactions(limit: number): Promise<Transaction[]> {
  try {
    const response = await getTransactions({ limit });
    const txTyped = (response as { transactions?: unknown[] }) ?? {};
    const remoteTx = Array.isArray(txTyped.transactions) ? txTyped.transactions : [];
    return remoteTx.map(mapTransaction);
  } catch {
    return [];
  }
}

async function fetchPixCapabilities(): Promise<PixCapabilitiesState> {
  try {
    const caps = await getPixCapabilities();
    return mergeCapabilities(caps);
  } catch {
    return {
      deposit: { ...defaultPixCapabilities.deposit },
      withdraw: { ...defaultPixCapabilities.withdraw },
    };
  }
}

export async function refreshWalletSnapshot(opts?: { accessToken?: string | null }) {
  return useAccountStore.getState().fetchWalletSnapshot(opts);
}

export async function refreshWalletAggregates(
  options?: RefreshWalletAggregatesOptions
): Promise<RefreshWalletAggregatesResult> {
  const limit = options?.transactionsLimit ?? 15;
  const [wallet, transactions, pixCapabilities] = await Promise.all([
    refreshWalletSnapshot(),
    fetchTransactions(limit),
    fetchPixCapabilities(),
  ]);

  return {
    wallet,
    transactions,
    pixCapabilities,
  };
}
