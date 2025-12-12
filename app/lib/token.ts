import { authApi } from './sdk/modules/auth';
import { env as staticEnv } from '../config/env';

export type Tokens = { accessToken?: string | null; refreshToken?: string | null };

const STORAGE_KEY = 'frontbet_tokens_v1';
export const ACCESS_TOKEN_COOKIE = 'frontbet_access_token';
export const REFRESH_TOKEN_COOKIE = 'frontbet_refresh_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

let refreshTokenMemory: string | null = null;
let legacyRefreshPurged = false;

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function hasDocument() {
  return typeof document !== 'undefined';
}

type TokenListener = (tokens: Tokens) => void;
const tokenListeners = new Set<TokenListener>();

function notifyListeners(next: Tokens) {
  tokenListeners.forEach((listener) => {
    try {
      listener(next);
    } catch (e) {
      void e;
    }
  });
}

function setCookie(name: string, value: string | null) {
  if (!hasDocument()) return;
  try {
    if (!value) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      return;
    }
    const secure =
      typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  } catch (e) {
    void e;
  }
}

function syncAccessCookie(accessToken: string | null) {
  try {
    setCookie(ACCESS_TOKEN_COOKIE, accessToken ?? null);
  } catch {
    // ignore cookie-sync failures
  }
}

function clearLegacyRefreshCookie() {
  try {
    setCookie(REFRESH_TOKEN_COOKIE, null);
  } catch {
    // ignore cookie failures
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    try {
      if (!event.newValue) {
        refreshTokenMemory = null;
        notifyListeners({ accessToken: null, refreshToken: null });
        return;
      }
      const next = JSON.parse(event.newValue) as Tokens;
      notifyListeners({ accessToken: next.accessToken ?? null, refreshToken: refreshTokenMemory });
    } catch (e) {
      void e;
      notifyListeners({ accessToken: null, refreshToken: refreshTokenMemory });
    }
  });
}

function parseCookieHeader(header?: string | null) {
  if (!header) return {} as Record<string, string>;
  return header.split(';').reduce(
    (acc, part) => {
      const [rawKey, ...rest] = part.trim().split('=');
      if (!rawKey) return acc;
      const key = rawKey.trim();
      const value = rest.join('=').trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value || '');
      return acc;
    },
    {} as Record<string, string>
  );
}

export function readTokensFromCookies(header?: string | null): Tokens {
  const map = parseCookieHeader(header);
  return {
    accessToken: map[ACCESS_TOKEN_COOKIE] ?? null,
    refreshToken: map[REFRESH_TOKEN_COOKIE] ?? null,
  };
}

export function subscribeToTokens(listener: TokenListener) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export function loadTokens(): Tokens {
  return readPersistedTokens();
}

export function saveTokens(tokens: Tokens) {
  try {
    if (!isBrowser()) return;
    try {
      const dev =
        (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
      if (dev) {
        console.info('[token] saveTokens called with', tokens);
      }
    } catch (e) {
      void e;
    }
    if (!tokens.accessToken) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        try {
          const dev =
            (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
          if (dev) console.error('[token][error] localStorage.removeItem failed', err);
        } catch (e) {
          void e;
        }
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: tokens.accessToken }));
      } catch (err) {
        try {
          const dev =
            (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
          if (dev) console.error('[token][error] localStorage.setItem failed', err);
        } catch (e) {
          void e;
        }
      }
    }
    legacyRefreshPurged = true;
  } catch (e) {
    try {
      const dev =
        (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
      if (dev) console.error('[token][error] saveTokens top-level failure');
    } catch (ee) {
      void ee;
    }
    void e;
  }
}

export function clearTokens() {
  if (isBrowser()) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  refreshTokenMemory = null;
  syncAccessCookie(null);
  clearLegacyRefreshCookie();
  notifyListeners({ accessToken: null, refreshToken: null });
}

export function setTokens(t: Tokens) {
  const current = loadTokens();
  const hasAccessToken = Object.prototype.hasOwnProperty.call(t, 'accessToken');
  const nextAccessToken = hasAccessToken ? (t.accessToken ?? null) : (current.accessToken ?? null);
  saveTokens({ accessToken: nextAccessToken });
  syncAccessCookie(nextAccessToken ?? null);
  clearLegacyRefreshCookie();

  try {
    const dev =
      (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
    if (dev) {
      console.info(
        '[token] setTokens nextAccessToken=',
        nextAccessToken,
        'refreshToken=',
        t.refreshToken ?? refreshTokenMemory
      );
    }
  } catch (e) {
    void e;
  }

  if (Object.prototype.hasOwnProperty.call(t, 'refreshToken')) {
    refreshTokenMemory = t.refreshToken ?? null;
  }

  notifyListeners({ accessToken: nextAccessToken ?? null, refreshToken: refreshTokenMemory });
}

export function getRefreshToken(): string | null {
  return refreshTokenMemory;
}

// External provider type: can be sync or async
export type AccessTokenProvider = () => Promise<string | null> | string | null;

let externalAccessTokenProvider: (() => Promise<string | null>) | null = null;

// Serialize in-flight refresh attempts so concurrent callers reuse the same Promise
let refreshInFlight: Promise<string | null> | null = null;

export function registerAccessTokenProvider(fn: AccessTokenProvider | null) {
  if (fn == null) {
    externalAccessTokenProvider = null;
    return;
  }
  // Normalize to async provider
  externalAccessTokenProvider = async () => {
    try {
      const provider = fn as AccessTokenProvider;
      const v = provider();
      return await Promise.resolve(v);
    } catch {
      return null;
    }
  };
}

// Attempts to obtain an access token using (in order):
// 1) registered external provider (if any)
// 2) fallback to localStorage persisted tokens
export async function getAccessToken(): Promise<string | null> {
  // 1) external provider
  try {
    if (externalAccessTokenProvider) {
      const t = await externalAccessTokenProvider();
      if (t) return t;
    }
  } catch {
    // swallow provider errors and fallback
  }
  // If no external provider is registered, fall back to persisted tokens in localStorage.

  // Show a single warning in dev when no provider is registered to help migration.
  try {
    if (
      !externalAccessTokenProvider &&
      (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production'
    ) {
      console.warn(
        '[token] no external access token provider registered; falling back to persisted tokens. Register a provider with registerAccessTokenProvider() (recommended).'
      );
    }
  } catch {
    // ignore logging failures
  }
  // 3) fallback to stored tokens
  try {
    const t = loadTokens();
    return t.accessToken ?? null;
  } catch {
    return null;
  }
}

// Attempt to refresh tokens by calling backend via the typed SDK.
// If an external provider is registered, try it first since it may manage refresh internally.

export async function refreshTokens(): Promise<string | null> {
  // If a refresh is already in flight, await and reuse it
  if (refreshInFlight) return await refreshInFlight;

  // Otherwise create a shared in-flight promise
  refreshInFlight = (async () => {
    // If external provider exists, try to obtain a fresh token from it first
    try {
      if (externalAccessTokenProvider) {
        const t = await externalAccessTokenProvider();
        if (t) return t;
      }
    } catch (e) {
      void e;
    }

    const refresh = getRefreshToken();
    try {
      if (!refresh) {
        return null;
      }
      const { data } = await authApi.refresh({ refreshToken: refresh });
      if (!data) return null;
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken ?? null;
      setTokens({ accessToken, refreshToken });
      return accessToken ?? null;
    } catch (e) {
      void e;
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function readPersistedTokens(): Tokens {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Tokens;
    if (
      !legacyRefreshPurged &&
      typeof parsed.refreshToken === 'string' &&
      parsed.refreshToken.length > 0
    ) {
      refreshTokenMemory = parsed.refreshToken;
      legacyRefreshPurged = true;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ accessToken: parsed.accessToken ?? null })
        );
      } catch (e) {
        void e;
      }
    }
    return { accessToken: parsed.accessToken ?? null };
  } catch (e) {
    try {
      const dev =
        (staticEnv as unknown as Record<string, string | undefined>).NODE_ENV !== 'production';
      if (dev)
        console.error(
          '[token][error] readPersistedTokens failed while reading/parsing localStorage'
        );
    } catch (ee) {
      void ee;
    }
    void e;
    return {};
  }
}

// Register a fallback provider that simply returns the access token persisted in localStorage.
// This prevents noisy console warnings when apps forget to register a custom provider while
// still allowing downstream callers to override the provider when needed.
registerAccessTokenProvider(async () => {
  try {
    const tokens = loadTokens();
    return tokens.accessToken ?? null;
  } catch (e) {
    void e;
    return null;
  }
});
