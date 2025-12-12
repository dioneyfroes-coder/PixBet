import { useEffect, useState } from 'react';
import type { GameStats } from '../types/games';

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function useGameStats(gameId: string) {
  const [stats, setStats] = useState<GameStats>(() => buildStats(gameId));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStats(buildStats(gameId));
    }, 5000);

    return () => window.clearInterval(interval);
  }, [gameId]);

  return stats;
}

function buildStats(gameId: string): GameStats {
  const now = new Date();
  const insights = [
    { label: 'Tendência', value: randomBetween(45, 70).toFixed(1) + '%' },
    { label: 'Confiança', value: randomBetween(70, 95).toFixed(1) + '%' },
    { label: 'Eventos escaneados', value: Math.floor(randomBetween(120, 480)) },
    { label: 'Latência', value: randomBetween(0.2, 0.6).toFixed(2) + 's' },
  ];

  return {
    activePlayers: Math.floor(randomBetween(240, 3200)),
    winRate: randomBetween(52, 88),
    trend: gameId === 'odds-heatmap' ? 'up' : gameId === 'penalty-analytics' ? 'stable' : 'down',
    lastUpdate: now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    insights,
  };
}
