import type { GameComponentProps } from '../types/games';
import { Button } from '../components/ui/button';

export function PenaltyAnalytics({ descriptor, stats }: GameComponentProps) {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[color:var(--color-border)] p-6">
        <h2 className="text-3xl font-bold">
          {descriptor.icon} {descriptor.name}
        </h2>
        <p className="text-[var(--color-muted)]">{descriptor.overview}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[color:var(--color-border)] p-6">
          <p className="text-sm uppercase text-[var(--color-muted)]">Taxa de conversão</p>
          <p className="text-4xl font-bold">{stats.winRate.toFixed(1)}%</p>
          <p className="text-sm text-[var(--color-muted)]">Última atualização {stats.lastUpdate}</p>
          <Button className="mt-4" size="sm">
            Executar simulação
          </Button>
        </article>
        <article className="rounded-2xl border border-[color:var(--color-border)] p-6">
          <p className="text-sm uppercase text-[var(--color-muted)]">Jogadores monitorados</p>
          <p className="text-4xl font-bold">{stats.activePlayers.toLocaleString('pt-BR')}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
            {descriptor.highlights.map((highlight) => (
              <li key={highlight}>• {highlight}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
