import '@testing-library/jest-dom/vitest';
// MSW mocks removed; keep setup file minimal. Tests should target the real backend
// or provide their own mocks where needed.

// Load optional local test env (ignored in git) so CI/local dev can provide
// test tokens and credentials in `.env.test.local`.
import dotenv from 'dotenv';
// Allow tests to opt into using the project's common `.env` by setting
// `USE_COMMON_ENV=true` in the test command. Otherwise load the ignored
// `.env.test.local` file when present.
if (process.env.USE_COMMON_ENV === 'true') {
  dotenv.config({ path: '.env', override: false });
} else {
  dotenv.config({ path: '.env.test.local', override: false });
}

// Register a test-time access token provider so client code can obtain an
// access token when running in the Node test environment (no localStorage).
import { registerAccessTokenProvider } from './app/lib/token';

// If `TEST_ACCESS_TOKEN` is provided in `.env.test.local`, use it for tests.
// Optionally you can set `TEST_REFRESH_TOKEN` if your backend needs one.
registerAccessTokenProvider(() => {
  try {
    const t = process.env.TEST_ACCESS_TOKEN;
    return t ?? null;
  } catch {
    return null;
  }
});
