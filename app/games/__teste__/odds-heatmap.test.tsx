import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OddsHeatmap } from '../odds-heatmap';
import type { GameDescriptor, GameStats } from '../../types/games';

const descriptor: GameDescriptor = {
  id: 'odds-heatmap',
  slug: 'odds-heatmap',
  name: 'Odds Heatmap',
  icon: '🔥',
  category: 'probabilidades',
  loadComponent: async () => ({ default: OddsHeatmap }),
  overview: 'Mapa de calor de volatilidade.',
  highlights: ['Clusterização automática'],
};

const stats: GameStats = {
  activePlayers: 500,
  winRate: 61.2,
  trend: 'stable',
  lastUpdate: '13:30:00',
  insights: [
    { label: 'Exposição', value: '32%' },
    { label: 'Confiança', value: '85%' },
    { label: 'Velocidade', value: '0.4s' },
    { label: 'Eventos', value: 220 },
  ],
};

describe('OddsHeatmap', () => {
  it('surface insights and telemetria summary', () => {
    render(<OddsHeatmap descriptor={descriptor} stats={stats} />);

    expect(screen.getByText('🔥 Odds Heatmap')).toBeInTheDocument();
    stats.insights.forEach((insight) => {
      expect(screen.getByText(insight.label)).toBeInTheDocument();
      expect(screen.getByText(String(insight.value))).toBeInTheDocument();
    });
    expect(screen.getByText(/Mapa de calor de probabilidades/)).toBeInTheDocument();
    expect(screen.getByText(/500 simulações/)).toBeInTheDocument();
  });
});
