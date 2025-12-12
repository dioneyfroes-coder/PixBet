import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'frontbet:rate_limiter:';

function now() {
  return Date.now();
}

function readTimestamps(key: string): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const arr = JSON.parse(raw) as number[];
    if (!Array.isArray(arr)) return [];
    return arr.filter((v) => typeof v === 'number');
  } catch {
    return [];
  }
}

function writeTimestamps(key: string, values: number[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(values));
  } catch {
    // ignore
  }
}

export default function useRateLimiter(key: string, maxAttempts = 3, windowMs = 60_000) {
  const storageKey = `${key}:${maxAttempts}:${windowMs}`;
  const [timestamps, setTimestamps] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    const nowTs = now();
    return readTimestamps(storageKey).filter((t) => nowTs - t <= windowMs);
  });

  useEffect(() => {
    // Keep storage in sync
    writeTimestamps(storageKey, timestamps);
  }, [storageKey, timestamps]);

  const prune = useCallback(() => {
    const nowTs = now();
    setTimestamps((curr) => curr.filter((t) => nowTs - t <= windowMs));
  }, [windowMs]);

  useEffect(() => {
    const id = setInterval(prune, Math.max(1000, Math.floor(windowMs / 4)));
    return () => clearInterval(id);
  }, [prune, windowMs]);

  const remaining = useMemo(
    () => Math.max(0, maxAttempts - timestamps.length),
    [maxAttempts, timestamps.length]
  );
  const canSubmit = remaining > 0;

  const retryAfterMs = useMemo(() => {
    if (timestamps.length < maxAttempts) return 0;
    const sorted = [...timestamps].sort((a, b) => a - b);
    const oldest = sorted[0] ?? 0;
    const when = oldest + windowMs - now();
    return when > 0 ? when : 0;
  }, [timestamps, maxAttempts, windowMs]);

  const recordHit = useCallback(() => {
    const nowTs = now();
    setTimestamps((curr) => {
      const kept = curr.filter((t) => nowTs - t <= windowMs);
      const next = [...kept, nowTs];
      writeTimestamps(storageKey, next);
      return next;
    });
  }, [storageKey, windowMs]);

  const reset = useCallback(() => {
    setTimestamps([]);
    writeTimestamps(storageKey, []);
  }, [storageKey]);

  return { canSubmit, remaining, retryAfterMs, recordHit, reset } as const;
}
