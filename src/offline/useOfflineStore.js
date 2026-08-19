import { useCallback, useEffect, useState } from 'react';

/**
 * Talks to the service worker's download routine.
 *
 * Cached state is always read back from the worker (which checks the real Cache
 * Storage), never from localStorage — the browser can evict behind our back, and
 * a stale "downloaded" tick produces a broken demo with a green checkmark, which
 * is worse than no checkmark at all.
 */
export function useOfflineStore() {
  const [groups, setGroups] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [progress, setProgress] = useState(null);
  const [failures, setFailures] = useState([]);
  const [quotaError, setQuotaError] = useState(null);
  const [supported, setSupported] = useState(true);

  const post = useCallback((message) => {
    navigator.serviceWorker?.ready
      .then((reg) => reg.active?.postMessage(message))
      .catch(() => setSupported(false));
  }, []);

  const refresh = useCallback(() => post({ type: 'OFFLINE_STATUS' }), [post]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSupported(false);
      return undefined;
    }

    const onMessage = (event) => {
      const data = event.data ?? {};
      if (data.type === 'OFFLINE_STATUS') {
        setGroups(data.groups);
        setEstimate(data.estimate);
      }
      if (data.type === 'OFFLINE_PROGRESS') setProgress(data);
      if (data.type === 'OFFLINE_QUOTA') {
        setQuotaError({ needed: data.needed, available: data.available });
        setProgress(null);
      }
      if (data.type === 'OFFLINE_COMPLETE') {
        setProgress(null);
        setFailures(data.failed ?? []);
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    refresh();
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [refresh]);

  const download = useCallback(
    (groupIds) => {
      setQuotaError(null);
      setFailures([]);
      setProgress({ doneBytes: 0, totalBytes: 0, doneCount: 0, totalCount: 0 });
      post({ type: 'OFFLINE_DOWNLOAD', groupIds });
    },
    [post]
  );

  const cancel = useCallback(() => {
    post({ type: 'OFFLINE_CANCEL' });
    setProgress(null);
  }, [post]);

  const purge = useCallback((groupIds) => post({ type: 'OFFLINE_PURGE', groupIds }), [post]);

  return {
    groups,
    estimate,
    progress,
    failures,
    quotaError,
    supported,
    download,
    cancel,
    purge,
    refresh,
  };
}
