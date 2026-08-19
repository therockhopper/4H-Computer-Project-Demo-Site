import { useCallback, useEffect, useState } from 'react';

/**
 * `navigator.onLine` only reports "attached to a network" — which is exactly
 * `true` on the captive-portal WiFi you meet at a fairground. So we pair it with
 * a real reachability probe against a NetworkOnly route, which cannot be
 * answered from the cache.
 */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [reachable, setReachable] = useState(true);

  const probe = useCallback(async () => {
    if (!navigator.onLine) {
      setReachable(false);
      return;
    }
    const timeout = AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined;
    try {
      const res = await fetch('/ping.txt', { cache: 'no-store', signal: timeout });
      setReachable(res.ok);
    } catch {
      setReachable(false);
    }
  }, []);

  useEffect(() => {
    const up = () => {
      setOnline(true);
      probe();
    };
    const down = () => {
      setOnline(false);
      setReachable(false);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') probe();
    };

    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    document.addEventListener('visibilitychange', onVisible);
    probe();

    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [probe]);

  return { online: online && reachable, rawOnline: online, recheck: probe };
}

/** True when running as an installed app rather than a browser tab. */
export function useStandalone() {
  const [standalone] = useState(
    () =>
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  );
  return standalone;
}

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
