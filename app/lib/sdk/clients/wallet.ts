import { walletsApi } from '../modules';
import type { WalletSnapshot as RemoteWalletSnapshot } from '../schemas';
import { resolveAuthOptions } from './_internal';
import type { AccessTokenOptions } from './_internal';

export type CurrencyAmount = {
  amount: number;
  currency?: string | null;
};

export type WalletSnapshot = Omit<RemoteWalletSnapshot, 'balance' | 'lockedBalance'> & {
  balance?: CurrencyAmount | null;
  lockedBalance?: CurrencyAmount | null;
};

const normalizeAmount = (
  value?: number | null,
  currency?: string | null
): CurrencyAmount | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return {
    amount: Math.round(value),
    currency: currency ?? 'BRL',
  };
};

const mapWalletSnapshot = (remote?: RemoteWalletSnapshot | null): WalletSnapshot | null => {
  if (!remote) {
    return null;
  }
  const { balance, lockedBalance, currency, ...rest } = remote;
  return {
    ...rest,
    currency: currency ?? 'BRL',
    balance: normalizeAmount(balance ?? null, currency ?? 'BRL'),
    lockedBalance: normalizeAmount(lockedBalance ?? null, currency ?? 'BRL'),
  };
};

export async function getMyWallet(opts?: AccessTokenOptions): Promise<WalletSnapshot | null> {
  const authOptions = await resolveAuthOptions(opts);
  const { data } = await walletsApi.getSummary(authOptions);
  return mapWalletSnapshot(data);
}

export default { getMyWallet };
