import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { GameDescriptor } from '../types/games';
import { useGames } from './useGames';

export function useGameLoader(initialSlug?: string, initialGame?: GameDescriptor) {
  const params = useParams();
  const slug = initialSlug ?? initialGame?.slug ?? params.slug ?? '';
  const { data: registry, loading, error } = useGames();
  const [game, setGame] = useState<GameDescriptor | undefined>(initialGame);

  useEffect(() => {
    if (!registry || !slug) return;
    const found = registry.find((descriptor) => descriptor.slug === slug || descriptor.id === slug);
    if (found) {
      setGame(found);
    }
  }, [registry, slug]);

  const allGames = registry ?? [];

  return { game, slug, allGames, loading, error };
}
