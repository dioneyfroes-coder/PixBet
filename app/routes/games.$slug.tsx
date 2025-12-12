import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { useLoaderData } from 'react-router';
import { PageShell } from '../components/page-shell';
import { getGameBySlug } from '../data/game-registry';
import { useGameLoader } from '../hooks/useGameLoader';
import { useGameStats } from '../hooks/useGameStats';
import type { GameDescriptor, GameComponentProps } from '../types/games';
import { useI18n } from '../i18n/i18n-provider';
import type { GameDetailCopy } from '../types/i18n';

export const loader = async ({ params }: { params: { slug?: string } }) => {
  const game = await getGameBySlug(params.slug);
  if (!game) {
    throw new Response('Game not found', { status: 404 });
  }
  return Response.json({ game });
};

export default function GameBySlug() {
  const { game: initialGame } = useLoaderData<{ game: GameDescriptor }>();
  const { game, error } = useGameLoader(initialGame?.slug, initialGame);
  const descriptor = game ?? initialGame;

  const stats = useGameStats(descriptor.id);
  const [GameComponent, setGameComponent] = useState<ComponentType<GameComponentProps> | null>(
    null
  );

  useEffect(() => {
    if (!descriptor || typeof descriptor.loadComponent !== 'function') {
      setGameComponent(null);
      return;
    }

    let cancelled = false;
    descriptor
      .loadComponent()
      .then((module) => {
        if (!cancelled) {
          setGameComponent(() => module.default);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGameComponent(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [descriptor]);

  const { messages } = useI18n();
  const gameDetail: GameDetailCopy = messages.gameDetail;

  return (
    <PageShell
      title={
        <span>
          {descriptor.icon} {descriptor.name}
        </span>
      }
      description={descriptor.overview}
    >
      {descriptor && GameComponent ? (
        <GameComponent descriptor={descriptor} stats={stats} />
      ) : (
        <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-6 text-sm text-[var(--color-muted)]">
          {error ? error : gameDetail.loading}
        </div>
      )}
    </PageShell>
  );
}
