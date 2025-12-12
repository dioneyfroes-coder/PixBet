import { useEffect, useRef } from 'react';
import type { AccountHydrationPayload } from '../stores/useAccountStore';
import { useAccountStore } from '../stores/useAccountStore';

/**
 * Hydrates the global account store once with data provided by route loaders.
 * Safe to call multiple times; only the first non-null payload is applied.
 */
export function useAccountHydration(snapshot?: AccountHydrationPayload | null) {
  const hydrateFromLoader = useAccountStore((state) => state.hydrateFromLoader);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!snapshot || hasHydratedRef.current) {
      return;
    }
    hydrateFromLoader(snapshot);
    hasHydratedRef.current = true;
  }, [hydrateFromLoader, snapshot]);
}
