import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStats } from '../useGameStats';

describe('useGameStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with telemetry payload', () => {
    const { result } = renderHook(() => useGameStats('live-monitor'));

    expect(result.current.activePlayers).toBeGreaterThan(0);
    expect(result.current.insights).toHaveLength(4);
  });

  it('refreshes stats periodically', () => {
    const { result } = renderHook(() => useGameStats('odds-heatmap'));
    const firstUpdate = result.current.lastUpdate;

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.lastUpdate).not.toEqual(firstUpdate);
  });
});
