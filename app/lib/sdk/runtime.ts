import { updateApiBaseUrl, apiRuntimeConfig } from './core/config';

const readMetaEnv = (): Record<string, string | undefined> => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env as Record<string, string | undefined>;
    }
  } catch {
    // ignore when bundler does not provide import.meta.env
  }
  return {};
};

const readProcessEnv = (): Record<string, string | undefined> => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  return {};
};

/**
 * Atualiza a configuração global do cliente HTTP usando o valor
 * padrão do ambiente (caso exista) ou o origin atual do browser.
 */
const resolveDefaultBaseUrl = () => {
  const metaEnv = readMetaEnv();
  const processEnv = readProcessEnv();
  return (
    metaEnv.VITE_API_URL ??
    metaEnv.NEXT_PUBLIC_API_BASE_URL ??
    processEnv.VITE_API_URL ??
    processEnv.NEXT_PUBLIC_API_BASE_URL ??
    processEnv.API_URL ??
    processEnv.API_BASE_URL ??
    (typeof window !== 'undefined' && window.location ? window.location.origin : undefined)
  );
};

const defaultBaseUrl = resolveDefaultBaseUrl();

const ensureApiPrefix = (candidate?: string | null | undefined) => {
  if (!candidate) return candidate;
  const trimmed = String(candidate).trim().replace(/\/+$/, '');
  // If the candidate already contains '/api' at the end or after origin, keep it.
  if (/\/api(\/|$)/i.test(trimmed)) return trimmed;
  return `${trimmed}/api`;
};

export const bootstrapApiRuntime = (baseUrl?: string | null) => {
  const resolved = baseUrl ?? defaultBaseUrl ?? null;
  // For this project the HTTP API lives under the '/api' prefix.
  const apiReady = ensureApiPrefix(resolved);
  updateApiBaseUrl(apiReady ?? null);
};

bootstrapApiRuntime();

// In development, log the resolved API base URL to help debugging environment issues.
try {
  const metaEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as unknown as Record<string, unknown>)
      : {};
  const metaDev = Boolean(metaEnv?.DEV);
  const procDev =
    typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
  if (metaDev || procDev) {
    console.info('[sdk] apiBaseUrl =', apiRuntimeConfig.baseUrl);
  }
} catch (e) {
  void e;
}
