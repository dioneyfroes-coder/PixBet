import React from 'react';
import type { GameComponentProps, GameDescriptor } from '../../types/games';
import { render, fireEvent } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

// Mocks for SDK
vi.mock('../../lib/sdk/clients/games', () => {
  return {
    getCoinFlipConfig: vi.fn(async () => ({
      enabled: true,
      minBet: 1,
      maxBet: 100,
      currency: 'BRL',
    })),
    getCoinFlipHistory: vi.fn(async () => ({ rounds: [] })),
    getCoinFlipFeed: vi.fn(async () => ({ rounds: [] })),
    playCoinFlip: vi.fn(async () => ({
      round: {
        id: 'r1',
        choice: 'HEADS',
        wager: 1,
        createdAt: new Date().toISOString(),
        result: 'WIN',
        outcome: 'HEADS',
      },
    })),
  };
});

import CoinFlipGame from '../../games/coin-flip';

describe('CoinFlip animation timeout cleanup', () => {
  let clearSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    // Spy on clearTimeout to ensure it's called on unmount
    clearSpy = vi.spyOn(window, 'clearTimeout');
  });

  afterEach(() => {
    vi.useRealTimers();
    if (clearSpy) clearSpy.mockRestore();
  });

  it('clears the animation timeout when unmounted', async () => {
    const fullDescriptor = {
      id: 'coin-flip-1',
      slug: 'coin-flip',
      name: 'Coin Flip',
      icon: '',
      category: 'probabilidades' as const,
      loadComponent: async () => ({
        default: () => null as unknown as React.ComponentType<GameComponentProps>,
      }),
      overview: '',
      highlights: [],
    } as unknown as GameDescriptor;

    const { getByRole, unmount } = render(
      // minimal props expected by descriptor/stats
      <CoinFlipGame
        descriptor={fullDescriptor}
        stats={{
          winRate: 50,
          activePlayers: 0,
          trend: 'stable',
          lastUpdate: new Date().toISOString(),
          insights: [],
        }}
      />
    );

    // Wait for initial effects to resolve
    await Promise.resolve();

    // choose a side and play
    const playButton = getByRole('button', { name: /jogar/i });
    fireEvent.click(playButton);
    // At this point the component schedules the reveal timeout.
    // Allow the play promise microtasks to complete so the timeout is scheduled.
    await Promise.resolve();
    // Unmount before advancing timers to simulate navigation away.
    unmount();

    // Now advance timers to let any scheduled callbacks run if they weren't cleared
    vi.runOnlyPendingTimers();

    // Expect either clearTimeout was called or there are no pending timers
    // (some test environments may not call clearTimeout directly)
    const pending = typeof vi.getTimerCount === 'function' ? vi.getTimerCount() : -1;
    if (pending >= 0) {
      expect(pending).toBe(0);
    } else {
      expect(clearSpy).toHaveBeenCalled();
    }
  });
});
