import { create } from 'zustand';
import {
  getMyWallet,
  type WalletSnapshot as RemoteWalletSnapshot,
} from '../lib/sdk/clients/wallet';
import {
  me as getMyProfile,
  type UserSnapshot as RemoteUserSnapshot,
} from '../lib/sdk/clients/auth';
import { getAccessToken } from '../lib/token';

export type WalletSnapshot = RemoteWalletSnapshot;
export type UserSnapshot = RemoteUserSnapshot;

type AccountState = {
  wallet: WalletSnapshot | null | undefined;
  user: UserSnapshot | null | undefined;
  lastSyncedAt: string | null;
  loading: {
    wallet: boolean;
    user: boolean;
  };
  errors: {
    wallet: string | null;
    user: string | null;
  };
};

export type AccountHydrationPayload = {
  wallet?: WalletSnapshot | null;
  user?: UserSnapshot | null;
  syncedAt?: string | Date | null;
};

type AuthenticatedFetchOptions = {
  accessToken?: string | null;
};

type AccountActions = {
  hydrateFromLoader: (payload?: AccountHydrationPayload) => void;
  fetchWalletSnapshot: (opts?: AuthenticatedFetchOptions) => Promise<WalletSnapshot | null>;
  fetchUserSnapshot: (opts?: AuthenticatedFetchOptions) => Promise<UserSnapshot | null>;
  refreshAll: (
    opts?: AuthenticatedFetchOptions
  ) => Promise<{ wallet: WalletSnapshot | null; user: UserSnapshot | null }>;
};

export type AccountStore = AccountState & AccountActions;

const resolveIsoTimestamp = (value?: string | Date | null) => {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toISOString();
};

const resolveUserEntity = (
  user: UserSnapshot | null | undefined
): Record<string, unknown> | null => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  const maybe = (user as { user?: unknown }).user;
  if (maybe && typeof maybe === 'object') {
    return maybe as Record<string, unknown>;
  }
  return user as Record<string, unknown>;
};

const missingWalletTokenMessage =
  'Sessão expirada. Faça login novamente para sincronizar a carteira.';
const missingUserTokenMessage = 'Sessão expirada. Faça login novamente para sincronizar o perfil.';

async function resolveAccessToken(override?: string | null) {
  if (override && override.length > 0) {
    return override;
  }
  return await getAccessToken();
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  wallet: undefined,
  user: undefined,
  lastSyncedAt: null,
  loading: { wallet: false, user: false },
  errors: { wallet: null, user: null },

  hydrateFromLoader: (payload) => {
    set((state) => {
      const hasIncoming =
        payload?.wallet !== undefined ||
        payload?.user !== undefined ||
        payload?.syncedAt !== undefined;
      const nextTimestamp =
        resolveIsoTimestamp(payload?.syncedAt) ??
        (hasIncoming ? new Date().toISOString() : state.lastSyncedAt);

      return {
        wallet: payload?.wallet !== undefined ? (payload?.wallet ?? null) : state.wallet,
        user: payload?.user !== undefined ? (payload?.user ?? null) : state.user,
        lastSyncedAt: nextTimestamp,
      };
    });
  },

  fetchWalletSnapshot: async (opts) => {
    set((state) => ({
      loading: { ...state.loading, wallet: true },
      errors: { ...state.errors, wallet: null },
    }));
    try {
      const accessToken = await resolveAccessToken(opts?.accessToken);
      if (!accessToken) {
        throw new Error(missingWalletTokenMessage);
      }
      const wallet = await getMyWallet({ accessToken });
      set((state) => ({
        wallet,
        lastSyncedAt: new Date().toISOString(),
        loading: { ...state.loading, wallet: false },
        errors: { ...state.errors, wallet: null },
      }));
      return wallet;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível sincronizar a carteira agora.';
      set((state) => ({
        loading: { ...state.loading, wallet: false },
        errors: { ...state.errors, wallet: message },
      }));
      return null;
    }
  },

  fetchUserSnapshot: async (opts) => {
    set((state) => ({
      loading: { ...state.loading, user: true },
      errors: { ...state.errors, user: null },
    }));
    try {
      const accessToken = await resolveAccessToken(opts?.accessToken);
      if (!accessToken) {
        throw new Error(missingUserTokenMessage);
      }
      const user = await getMyProfile({ accessToken });
      set((state) => ({
        user,
        loading: { ...state.loading, user: false },
        errors: { ...state.errors, user: null },
      }));
      return user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível sincronizar o usuário agora.';
      set((state) => ({
        loading: { ...state.loading, user: false },
        errors: { ...state.errors, user: message },
      }));
      return null;
    }
  },

  refreshAll: async (opts) => {
    const accessToken = await resolveAccessToken(opts?.accessToken);
    if (!accessToken) {
      return {
        wallet: get().wallet ?? null,
        user: get().user ?? null,
      };
    }
    const [wallet, user] = await Promise.all([
      get().fetchWalletSnapshot({ accessToken }),
      get().fetchUserSnapshot({ accessToken }),
    ]);
    return { wallet, user };
  },
}));

export const selectWallet = (state: AccountStore) => state.wallet;
export const selectUser = (state: AccountStore) => state.user;
export const selectWalletBalance = (state: AccountStore) => state.wallet?.balance?.amount ?? null;
export const selectWalletLoading = (state: AccountStore) => state.loading.wallet;
export const selectWalletError = (state: AccountStore) => state.errors.wallet;
export const selectUserDisplayName = (state: AccountStore) => {
  const entity = resolveUserEntity(state.user);
  if (!entity) return null;
  const base = entity as {
    firstName?: unknown;
    lastName?: unknown;
    username?: unknown;
    email?: unknown;
  };
  const firstName = typeof base.firstName === 'string' ? base.firstName : '';
  const lastName = typeof base.lastName === 'string' ? base.lastName : '';
  const username = typeof base.username === 'string' ? base.username : '';
  const email = typeof base.email === 'string' ? base.email : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName.length > 0) {
    return fullName;
  }
  if (username.length > 0) {
    return username;
  }
  return email.length > 0 ? email : null;
};
export const selectIsWalletStale = (maxAgeMs: number) => (state: AccountStore) => {
  if (!state.lastSyncedAt) {
    return true;
  }
  const last = Date.parse(state.lastSyncedAt);
  if (Number.isNaN(last)) {
    return true;
  }
  return Date.now() - last > maxAgeMs;
};
