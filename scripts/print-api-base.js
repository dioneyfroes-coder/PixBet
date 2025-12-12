// prints resolved API base URL for CI/dev diagnostics
// Usage: dotenv -e .env -- node scripts/print-api-base.js

const keys = [
  'VITE_API_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'API_URL',
  'API_BASE_URL',
  'NEXT_PUBLIC_MIN_DEPOSIT',
  'NODE_ENV',
];

function resolve() {
  const env = process.env || {};
  const value =
    env.VITE_API_URL || env.NEXT_PUBLIC_API_BASE_URL || env.API_URL || env.API_BASE_URL || null;
  return { resolved: value, raw: Object.fromEntries(keys.map((k) => [k, env[k]])) };
}

const result = resolve();
console.log('[diag] resolved apiBaseUrl =', result.resolved);
console.log('[diag] env snapshot:', JSON.stringify(result.raw, null, 2));

// Exit with 0 to not fail CI; caller can check output
process.exit(0);
