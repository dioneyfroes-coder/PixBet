import type { ReactNode } from 'react';
import type { GameComponentProps } from '../types/games';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function LiveMatchMonitor({ descriptor, stats }: GameComponentProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 rounded-2xl border border-[color:var(--color-border)] p-6">
        <p className="text-sm uppercase tracking-wide text-[var(--color-muted)]">
          {descriptor.category}
        </p>
        <h2 className="text-3xl font-bold">
          {descriptor.icon} {descriptor.name}
        </h2>
        <p className="text-[var(--color-muted)]">{descriptor.overview}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {descriptor.highlights.map((highlight) => (
          <Card key={highlight}>
            <CardHeader>
              <CardTitle className="text-base">Insight</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--color-muted)]">{highlight}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telemetria em tempo real</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-4">
          <DataPoint label="Jogadores ativos" value={stats.activePlayers.toLocaleString('pt-BR')} />
          <DataPoint
            label="Taxa de acerto"
            value={`${stats.winRate.toFixed(1)}%`}
            trend={stats.trend}
          />
          <DataPoint label="Atualizado" value={stats.lastUpdate} />
          <DataPoint label="Insight" value={stats.insights[0]?.value ?? '—'} />
        </CardContent>
      </Card>
    </div>
  );
}

function DataPoint({
  label,
  value,
  trend,
}: {
  label: string;
  value: ReactNode;
  trend?: 'up' | 'down' | 'stable';
}) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
        ? 'text-red-400'
        : 'text-[var(--color-muted)]';

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <p className={`text-2xl font-semibold ${trend ? trendColor : ''}`}>{value}</p>
    </div>
  );
}
