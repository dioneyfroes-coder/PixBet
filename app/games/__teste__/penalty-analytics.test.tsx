import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PenaltyAnalytics } from '../penalty-analytics';
import type { GameDescriptor, GameStats } from '../../types/games';

const descriptor: GameDescriptor = {
  id: 'penalty-analytics',
  slug: 'penalty-analytics',
  name: 'Penalty Analytics',
  icon: '🥅',
  category: 'inteligencia',
  loadComponent: async () => ({ default: PenaltyAnalytics }),
  overview: 'Simulador de pênaltis.',
  highlights: ['Modelo por campeonato', 'Loop de aprendizado'],
};

const stats: GameStats = {
  activePlayers: 900,
  winRate: 78.9,
  trend: 'down',
  lastUpdate: '14:10:00',
  insights: [
    { label: 'Conversão', value: '78%' },
    { label: 'Confiança', value: '91%' },
    { label: 'Eventos', value: 300 },
    { label: 'Latência', value: '0.5s' },
  ],
};

describe('PenaltyAnalytics', () => {
  it('shows conversion metrics and highlights', () => {
    render(<PenaltyAnalytics descriptor={descriptor} stats={stats} />);

    expect(screen.getByText('🥅 Penalty Analytics')).toBeInTheDocument();
    expect(screen.getByText(/78.9%/)).toBeInTheDocument();
    descriptor.highlights.forEach((highlight) => {
      expect(screen.getByText(new RegExp(highlight))).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Executar simulação/ })).toBeInTheDocument();
  });
});
