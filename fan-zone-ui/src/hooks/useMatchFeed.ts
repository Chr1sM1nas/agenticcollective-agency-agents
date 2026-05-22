import { useCallback, useEffect, useState } from 'react';
import { fetchPremierLeagueMatchFeed, MatchFeedEvent } from '../services/liveScoresService';

export function useMatchFeed() {
  const [matches, setMatches] = useState<MatchFeedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchFeed = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPremierLeagueMatchFeed();
      setMatches(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load match feed';
      setError(message);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMatchFeed();
    const interval = window.setInterval(() => {
      void fetchMatchFeed();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchMatchFeed]);

  return { matches, isLoading, error, refresh: fetchMatchFeed };
}
