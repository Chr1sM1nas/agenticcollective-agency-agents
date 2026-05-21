import { useCallback, useEffect, useState } from 'react';
import { fetchPremierLeagueLiveMatches, LiveMatchEvent } from '../services/liveScoresService';

export function useLiveMatches() {
  const [matches, setMatches] = useState<LiveMatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMatches = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPremierLeagueLiveMatches();
      setMatches(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load live matches';
      setError(message);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveMatches();
    const interval = window.setInterval(() => {
      void fetchLiveMatches();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [fetchLiveMatches]);

  return { matches, isLoading, error, refresh: fetchLiveMatches };
}
