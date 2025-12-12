import { describe, it, beforeEach, expect, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameLoader } from '../useGameLoader';
import { useParams } from 'react-router';

const fakeRegistry = [
  {
    id: 'live-monitor',
    slug: 'live-monitor',
    name: 'Live Monitor',
    icon: '🎯',
    category: 'monitoramento' as const,
    overview: 'Live monitor overview',
    highlights: [],
    loadComponent: vi.fn(),
  },
  {
    id: 'odds-heatmap',
    slug: 'odds-heatmap',
    name: 'Odds Heatmap',
    icon: '🔥',
    category: 'probabilidades' as const,
    overview: 'Heatmap overview',
    highlights: [],
    loadComponent: vi.fn(),
  },
  {
    id: 'penalty-analytics',
    slug: 'penalty-analytics',
    name: 'Penalty Analytics',
    icon: '🥅',
    category: 'inteligencia' as const,
    overview: 'Penalty overview',
    highlights: [],
    loadComponent: vi.fn(),
  },
];

const mockUseGames = vi.fn(() => ({
  data: fakeRegistry,
  loading: false,
  error: undefined,
  refetch: vi.fn(),
}));

vi.mock('../useGames', () => ({
  useGames: () => mockUseGames(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

const mockedUseParams = useParams as unknown as Mock;

describe('useGameLoader', () => {
  beforeEach(() => {
    mockedUseParams.mockReturnValue({ slug: 'live-monitor' });
    mockUseGames.mockReset();
    mockUseGames.mockReturnValue({
      data: fakeRegistry,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('returns initial game when provided', () => {
    const initial = fakeRegistry[1];
    mockedUseParams.mockReturnValue({ slug: undefined });

    const { result } = renderHook(() => useGameLoader(initial.slug, initial));

    expect(result.current.game).toBe(initial);
    expect(result.current.slug).toBe(initial.slug);
    expect(result.current.allGames).toContain(initial);
  });

  it('falls back to params slug and registry lookup', () => {
    const expected = fakeRegistry[2];
    mockedUseParams.mockReturnValue({ slug: expected.slug });

    const { result } = renderHook(() => useGameLoader());

    expect(result.current.game).toEqual(expected);
    expect(result.current.slug).toBe(expected.slug);
  });
});
