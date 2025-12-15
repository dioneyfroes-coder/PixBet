import { describe, it, expect, beforeEach, vi } from 'vitest';
// import the module under test
import * as tokenModule from '../token';

describe('token provider fallback', () => {
  const STORAGE_KEY = 'frontbet_tokens_v1';

  beforeEach(() => {
    // reset globals
    // Provide a minimal localStorage mock
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
      setItem: (k: string, v: string) => {
        storage[k] = v;
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
    } as unknown as Storage);
  });

  it('returns persisted access token when present', async () => {
    // persist a token into the mocked localStorage
    const tokens = { accessToken: 'persisted-token' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));

    const t = await tokenModule.getAccessToken();
    expect(t).toBe('persisted-token');
  });

  it('returns null when no token present', async () => {
    localStorage.removeItem(STORAGE_KEY);
    const t = await tokenModule.getAccessToken();
    expect(t).toBeNull();
  });
});
