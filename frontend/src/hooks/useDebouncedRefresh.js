import { useEffect, useRef, useCallback, useState } from 'react';

// useDebouncedRefresh
// Schedules a debounced refresh function on interval and focus/visibility events
// - refreshFn: async () => void
// - options: { delayMs?: number, intervalMs?: number }
export default function useDebouncedRefresh(refreshFn, options = {}) {
  const { delayMs = 600, intervalMs = 30000 } = options;
  const timerRef = useRef(null);
  const inflightRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const doRefresh = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setIsRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setIsRefreshing(false);
      inflightRef.current = false;
    }
  }, [refreshFn]);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doRefresh();
    }, delayMs);
  }, [delayMs, doRefresh]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleRefresh();
    };
    const handleFocus = () => scheduleRefresh();

    const intervalId = setInterval(scheduleRefresh, intervalMs);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [intervalMs, scheduleRefresh]);

  return { isRefreshing, scheduleRefresh, doRefresh };
}
