import { useEffect, useRef } from 'react';
import { useToast } from '../components/ToastProvider';
import { env } from '../config/env';

const DEFAULT_API_BASE = env.NEXT_PUBLIC_API_BASE_URL ?? '';

export type BackendCheckOptions = {
  endpoint?: string; // relative path to ping, default '/api/health'
  intervalMs?: number | null; // if provided, poll at this interval (ms). null = only once
  toastMessage?: string; // message to show on successful connection
  showOnce?: boolean; // only show toast once (default true)
  timeoutMs?: number; // fetch timeout in ms
  enabled?: boolean; // allow easily toggling the module off
  debugShowTestToast?: boolean; // show a test toast on mount (debug)
};

export async function checkBackend(endpoint = '/health', timeoutMs = 5000) {
  const url = endpoint.startsWith('http') ? endpoint : `${DEFAULT_API_BASE}${endpoint}`;
  const controller = timeoutMs > 0 ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`Backend check failed with status ${response.status}`);
    }
    return true;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * BackendHealthNotifier
 *
 * Small, easy-to-add component that pings a configurable backend endpoint and
 * shows a success toast when the connection is confirmed. It is intentionally
 * lightweight so it can be added/removed easily (place it in `app/root.tsx` or
 * any top-level layout).
 */
export default function BackendHealthNotifier({
  endpoint = '/health',
  intervalMs = null,
  toastMessage = 'Conexão com backend estabelecida',
  showOnce = true,
  timeoutMs = 5000,
  enabled = true,
  // for debugging: show a test toast on mount so developers can verify toasts
  debugShowTestToast = false,
}: BackendCheckOptions) {
  const { show } = useToast();
  const shownRef = useRef(false);
  useEffect(() => {
    if (!enabled) return undefined;

    // initialization is silent by default to avoid noisy logs in production/dev

    if (debugShowTestToast) {
      try {
        show('Backend check initialized (debug)', 'info');
      } catch (e) {
        void e;
      }
    }

    let mounted = true;

    const runCheck = async () => {
      try {
        await checkBackend(endpoint, timeoutMs);
        if (!mounted) return;
        // successful check: show toast but avoid noisy console debug output
        if (!showOnce || !shownRef.current) {
          shownRef.current = true;
          show(toastMessage, 'info');
        }
      } catch {
        // swallow failures silently; the notifier only reports successful checks
        // Swallow errors here — this module only notifies on success.
      }
    };

    // initial check
    runCheck();

    let timer: NodeJS.Timeout | null = null;
    if (intervalMs && intervalMs > 0) {
      timer = setInterval(runCheck, intervalMs);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [endpoint, intervalMs, toastMessage, showOnce, timeoutMs, enabled, show, debugShowTestToast]);

  return null;
}
