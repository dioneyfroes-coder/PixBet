import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LiveMatchMonitor } from '../live-match-monitor';
import type { GameDescriptor, GameStats } from '../../types/games';

const descriptor: GameDescriptor = {
  id: 'live-monitor',
  slug: 'live-monitor',
  name: 'Live Monitor',
  icon: '📡',
  category: 'monitoramento',
  loadComponent: async () => ({ default: LiveMatchMonitor }),
  overview: 'Observa partidas em tempo real.',
  highlights: ['Reage em 120ms', 'Integra 18 ligas', 'Alertas automáticos'],
};

const stats: GameStats = {
  activePlayers: 1024,
  winRate: 72.3,
  trend: 'up',
  lastUpdate: '12:00:00',
  insights: [
    { label: 'Tendência', value: '70%' },
    { label: 'Confiança', value: '92%' },
    { label: 'Eventos escaneados', value: 180 },
    { label: 'Latência', value: '0.2s' },
  ],
};

describe('LiveMatchMonitor', () => {
  it('renders overview, highlights and stats', () => {
    render(<LiveMatchMonitor descriptor={descriptor} stats={stats} />);

    expect(screen.getByText('📡 Live Monitor')).toBeInTheDocument();
    descriptor.highlights.forEach((highlight) => {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    });
    expect(screen.getByText('Jogadores ativos')).toBeInTheDocument();
    expect(screen.getByText(/1\.024/)).toBeInTheDocument();
    expect(screen.getByText('Telemetria em tempo real')).toBeInTheDocument();
  });
});
