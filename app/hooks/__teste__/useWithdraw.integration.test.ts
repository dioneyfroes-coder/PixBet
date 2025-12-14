import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { requestPixWithdrawal } from '../../lib/sdk/clients/payments';
import { setTokens, clearTokens } from '../../lib/token';
import { updateApiBaseUrl } from '../../lib/sdk/core/config';

// Integration-style test that stubs global.fetch instead of relying on MSW.
beforeEach(() => {
  clearTokens();
});

afterEach(() => {
  // restore any stubbed fetch
  const fetchStub = globalThis.fetch as unknown as { mockRestore?: () => void } | undefined;
  if (fetchStub && typeof fetchStub.mockRestore === 'function') {
    // vitest mock restore
    fetchStub.mockRestore();
  }
});

describe('payments integration (fetch stub)', () => {
  it('requestPixWithdrawal resolves true on success', async () => {
    // ensure API base url is configured for sendApiRequest
    updateApiBaseUrl('http://localhost:3000/api');
    setTokens({ accessToken: 'test-access-token' });

    // stub fetch to simulate API envelope expected by sendApiRequest
    // use a legacy-style wallet snapshot (balance as number) to satisfy schema
    // stub global.fetch; arguments intentionally unused so prefix with _
    vi.stubGlobal('fetch', async (_input: unknown, _init?: unknown) => {
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            success: true,
            data: { wallet: { userId: 'user-test', balance: 1000 } },
          }),
      } as unknown as Response;
    });

    const ok = await requestPixWithdrawal({ amount: 100, pixKey: 'teste@pix' });
    expect(ok).toBe(true);
  });

  // NOTE: password handling is currently implemented at the hook level and forwarded
  // to the payments client when a custom payments client supports it. The generated
  // `requestPixWithdrawal` client maps directly to the `/wallets/withdraw` payload
  // and does not include a `password` field by default; therefore we only assert
  // the successful path here.
});
