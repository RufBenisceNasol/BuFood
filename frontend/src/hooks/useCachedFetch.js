import { useEffect, useState, useCallback } from 'react';

// useCachedFetch
// Generic cache-first data loader with background refresh and localStorage persistence
// - cacheKey: string
// - fetchFn: async () => data
// - options: { initialData?: any, enabled?: boolean, showLoaderIfNoCache?: boolean }
export default function useCachedFetch(cacheKey, fetchFn, options = {}) {
  const { initialData = null, enabled = true, showLoaderIfNoCache = true } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(showLoaderIfNoCache));
  const [error, setError] = useState('');
  const [hadCache, setHadCache] = useState(false);

  const refresh = useCallback(async (opts = {}) => {
    const { showLoader = false } = opts;
    try {
      if (showLoader) setLoading(true);
      const fresh = await fetchFn();
      setData(fresh);
      try { localStorage.setItem(cacheKey, JSON.stringify(fresh)); } catch {}
      setError('');
    } catch (e) {
      setError(e?.message || 'Failed to fetch');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [cacheKey, fetchFn]);

  useEffect(() => {
    if (!enabled) return;
    let had = false;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached != null) {
        had = true;
        setHadCache(true);
        setData(cached);
        setLoading(false);
      }
    } catch {}
    refresh({ showLoader: showLoaderIfNoCache && !had });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled]);

  return { data, setData, loading, error, hadCache, refresh };
}
