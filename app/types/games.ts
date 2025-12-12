import type { ComponentType, ReactNode } from 'react';

export type GameCategory = 'monitoramento' | 'probabilidades' | 'inteligencia';

export type GameModuleImporter = () => Promise<{ default: ComponentType<GameComponentProps> }>;

export interface GameDescriptor {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: GameCategory;
  loadComponent: GameModuleImporter;
  overview: string;
  highlights: string[];
}

export interface GameComponentProps {
  descriptor: GameDescriptor;
  stats: GameStats;
}

export interface GameStats {
  activePlayers: number;
  winRate: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdate: string;
  insights: Array<{ label: string; value: ReactNode }>;
}
