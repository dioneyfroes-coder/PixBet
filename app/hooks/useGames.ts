import { useCallback, useEffect, useState } from 'react';
import type { GameDescriptor } from '../types/games';
import { loadGameRegistry } from '../data/game-registry';

export function useGames() {
  const [data, setData] = useState<GameDescriptor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const registry = await loadGameRegistry();
      setData(registry);
      setError(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames().catch(() => {
      /* handled above */
    });
  }, [fetchGames]);

  return { data, loading, error, refetch: fetchGames };
}
