import { z } from 'zod';

type EnvRecord = Record<string, string | undefined>;

function readFromImportMeta(key: string): string | undefined {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const envLike = import.meta.env as EnvRecord;
      return envLike[key];
    }
  } catch {
    // ignore when import.meta is unavailable
  }
  return undefined;
}

function readFromProcess(key: string): string | undefined {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch {
    // ignore when process is unavailable
  }
  return undefined;
}

function getRawEnv(key: string): string | undefined {
  const fromImportMeta = readFromImportMeta(key);
  if (fromImportMeta !== undefined) {
    return fromImportMeta;
  }
  return readFromProcess(key);
}

const rawEnv = {
  NEXT_PUBLIC_API_BASE_URL: getRawEnv('NEXT_PUBLIC_API_BASE_URL'),
  NODE_ENV: getRawEnv('NODE_ENV'),
  NEXT_PUBLIC_CONTACT_RATE_MAX: getRawEnv('NEXT_PUBLIC_CONTACT_RATE_MAX'),
  NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS: getRawEnv('NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS'),
  NEXT_PUBLIC_MIN_DEPOSIT: getRawEnv('NEXT_PUBLIC_MIN_DEPOSIT'),
  NEXT_PUBLIC_MAX_DEPOSIT: getRawEnv('NEXT_PUBLIC_MAX_DEPOSIT'),
  NEXT_PUBLIC_MIN_WITHDRAWAL: getRawEnv('NEXT_PUBLIC_MIN_WITHDRAWAL'),
  NEXT_PUBLIC_MAX_WITHDRAWAL: getRawEnv('NEXT_PUBLIC_MAX_WITHDRAWAL'),
};

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1, 'NEXT_PUBLIC_API_BASE_URL must be defined.'),
  NODE_ENV: z.string().optional().default('development'),
  NEXT_PUBLIC_CONTACT_RATE_MAX: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
  NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
  NEXT_PUBLIC_MIN_DEPOSIT: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
  NEXT_PUBLIC_MAX_DEPOSIT: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
  NEXT_PUBLIC_MIN_WITHDRAWAL: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
  NEXT_PUBLIC_MAX_WITHDRAWAL: z.preprocess((val) => {
    if (val === undefined) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : val;
  }, z.number().int().positive().optional()),
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  const reason = JSON.stringify(parsed.error.format());
  throw new Error(`[env] Failed to load environment variables: ${reason}`);
}

export const env = parsed.data as z.infer<typeof envSchema>;

if (env.NODE_ENV !== 'production') {
  console.info('[env] Loaded environment configuration', {
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    contactRateMax: env.NEXT_PUBLIC_CONTACT_RATE_MAX,
    contactRateWindowMs: env.NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS,
  });
}

// Friendly typed exports for commonly used numeric values (with safe defaults)
export const contactRateMax: number = env.NEXT_PUBLIC_CONTACT_RATE_MAX ?? 3;
export const contactRateWindowMs: number = env.NEXT_PUBLIC_CONTACT_RATE_WINDOW_MS ?? 60_000;
// Deposit/withdrawal limits exported as numbers (values are cents)
export const minDeposit: number = env.NEXT_PUBLIC_MIN_DEPOSIT ?? 1000;
export const maxDeposit: number = env.NEXT_PUBLIC_MAX_DEPOSIT ?? 1_500_000;
export const minWithdrawal: number = env.NEXT_PUBLIC_MIN_WITHDRAWAL ?? 2000;
export const maxWithdrawal: number = env.NEXT_PUBLIC_MAX_WITHDRAWAL ?? 1_000_000;
