import { useCallback, useEffect, useState } from 'react';
import { fetchPremierLeagueMatchFeed, MatchFeedEvent } from '../services/liveScoresService';

export function useMatchFeed() {
  const [matches, setMatches] = useState<MatchFeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchMatchFeed = useCallback(async (options?: { background?: boolean }) => {
    const isBackground = options?.background ?? false;

    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const data = await fetchPremierLeagueMatchFeed();
      // Debug: log the raw feed data
      if (typeof window !== 'undefined') {
        console.log('[FanZone] Raw match feed:', data);
      }
      setMatches(data);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load match feed';
      setError(message);
    } finally {
      if (isBackground) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchMatchFeed();
    const interval = window.setInterval(() => {
      void fetchMatchFeed({ background: true });
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchMatchFeed]);

  return { matches, isLoading, isRefreshing, error, lastUpdated, refresh: fetchMatchFeed };
}
