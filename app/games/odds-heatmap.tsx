import type { GameComponentProps } from '../types/games';

export function OddsHeatmap({ descriptor, stats }: GameComponentProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-6">
        <header className="mb-4">
          <p className="text-sm uppercase text-[var(--color-muted)]">{descriptor.category}</p>
          <h2 className="text-2xl font-semibold">
            {descriptor.icon} {descriptor.name}
          </h2>
          <p className="text-[var(--color-muted)]">{descriptor.overview}</p>
        </header>
        <div className="grid gap-3 md:grid-cols-4">
          {stats.insights.map((insight) => (
            <div
              key={insight.label}
              className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
            >
              <p className="text-xs uppercase text-[var(--color-muted)]">{insight.label}</p>
              <p className="text-lg font-semibold">{insight.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--color-border)] p-6">
        <header className="mb-4">
          <h3 className="text-lg font-semibold">Mapa de calor de probabilidades</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Atualizado {stats.lastUpdate} · {stats.activePlayers.toLocaleString('pt-BR')} simulações
          </p>
        </header>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              key={index}
              aria-hidden
              className="aspect-square rounded-lg"
              style={{
                background:
                  index % 5 === 0
                    ? 'rgba(52,211,153,0.7)'
                    : index % 3 === 0
                      ? 'rgba(249,115,22,0.6)'
                      : 'rgba(16,185,129,0.4)',
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
