import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/services/api';
import type { Movie } from '@/types';

interface UseMoviesState<T> {
  data:       T | null;
  isLoading:  boolean;
  error:      string | null;
  refetch:    () => void;
}

// ── In-Memory Cache ──────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const movieCache: Record<string, { data: any, timestamp: number }> = {};

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  cacheKey?: string
): UseMoviesState<T> {
  const [data, setData]         = useState<T | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Cache check
    if (cacheKey && movieCache[cacheKey]) {
      const entry = movieCache[cacheKey];
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        setData(entry.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    fetcher()
      .then(result => { 
        if (!cancelled) {
          setData(result);
          if (cacheKey) movieCache[cacheKey] = { data: result, timestamp: Date.now() };
        }
      })
      .catch(e     => { if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { data, isLoading, error, refetch };
}

export const useTrending = () =>
  useAsync(() => api.getTrendingMovies().then(r => (r.results || []).slice(0, 15).map(m => ({ ...m, media_type: 'movie' }))), [], 'trending');

export const usePopular = () =>
  useAsync(() => api.getPopularMovies().then(r => (r.results || []).slice(0, 12).map(m => ({ ...m, media_type: 'movie' }))), [], 'popular');

export const useTopRated = () =>
  useAsync(() => api.getTopRatedMovies().then(r => (r.results || []).slice(0, 12).map(m => ({ ...m, media_type: 'movie' }))), [], 'top-rated');

// Home rows use the stricter ecchi/fan-service block (getHome* variants) so no
// ecchi is recommended on Home. Search keeps the regular getTrendingTV/getTopRatedTV.
export const useTrendingTV = () =>
  useAsync(() => api.getHomeTrendingTV().then(r => (r.results || []).slice(0, 12).map(m => ({ ...m, media_type: 'tv' }))), [], 'home-trending-tv');

export const useTopRatedTV = () =>
  useAsync(() => api.getHomeTopRatedTV().then(r => (r.results || []).slice(0, 12).map(m => ({ ...m, media_type: 'tv' }))), [], 'home-top-rated-tv');

export const useContentDetails = (id: number, type: 'movie' | 'tv' = 'movie') => {
  const cacheKey = `details-${type}-${id}`;
  
  const criticalFetcher = useCallback(() => 
    type === 'movie' ? api.getCriticalMovieDetails(id) : api.getCriticalTVDetails(id)
  , [id, type]);

  const state = useAsync(criticalFetcher, [id, type], cacheKey);

  // Load supplementary data if critical data is loaded and not already supplemented
  useEffect(() => {
    if (state.data && !('videos' in state.data)) {
      const loadSupplementary = async () => {
        try {
          const supp = type === 'movie' 
            ? await api.getSupplementaryMovieDetails(id) 
            : await api.getSupplementaryTVDetails(id);
          
          const fullData = { ...state.data, ...supp };
          // Update cache with full data
          movieCache[cacheKey] = { data: fullData, timestamp: Date.now() };
          // Note: we don't force a re-render of the hook state here to avoid loops,
          // but next time it's accessed or if we had a proper cache listener it would update.
          // For now, the screen will handle supplementary fetching if needed or we update state.
        } catch (e) {
          console.error('Failed to load supplementary data', e);
        }
      };
      loadSupplementary();
    }
  }, [state.data, id, type, cacheKey]);

  return state;
};

export const usePersonDetails = (id: number) =>
  useAsync(
    () => Promise.all([
      api.getPersonDetails(id),
      api.getPersonCredits(id),
    ]).then(([person, credits]) => ({ 
      person, 
      credits: { 
        cast: credits.cast || [], 
        crew: credits.crew || [] 
      } 
    })),
    [id],
    `person-${id}`
  );

