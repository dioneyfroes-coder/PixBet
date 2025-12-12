import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadGameRegistry, getGameBySlug, clearGameRegistryCache } from '../game-registry';

const mockGetGames = vi.fn(async () => [
  {
    id: 'coin-flip',
    slug: 'coin-flip',
    name: 'Coin Flip',
    icon: '🪙',
    category: 'probabilidades',
    overview: 'Cara ou coroa',
    highlights: ['Instantâneo'],
  },
]);

vi.mock('../../lib/sdk/clients/games', async () => {
  const actual = await vi.importActual<typeof import('../../lib/sdk/clients/games')>(
    '../../lib/sdk/clients/games'
  );
  return {
    ...actual,
    getGames: () => mockGetGames(),
  };
});

describe('gameRegistry (dynamic)', () => {
  beforeEach(() => {
    mockGetGames.mockClear();
    clearGameRegistryCache();
  });

  it('hydrates descriptors with loadable modules', async () => {
    const registry = await loadGameRegistry({ force: true });
    expect(mockGetGames).toHaveBeenCalledTimes(1);
    expect(registry.length).toBeGreaterThan(0);
    const descriptor = registry[0];
    expect(descriptor.slug).toBe('coin-flip');
    expect(typeof descriptor.loadComponent).toBe('function');
    expect(Array.isArray(descriptor.highlights)).toBe(true);
  });

  it('resolves a game by slug when cache is primed', async () => {
    await loadGameRegistry({ force: true });
    const found = await getGameBySlug('coin-flip');
    expect(found?.name).toBe('Coin Flip');
    const missing = await getGameBySlug('inexistente');
    expect(missing).toBeUndefined();
  });
});
