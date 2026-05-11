import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/api';
import type { Movie } from '../types';

interface UseMoviesState<T> {
  data:       T | null;
  isLoading:  boolean;
  error:      string | null;
  refetch:    () => void;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
): UseMoviesState<T> {
  const [data, setData]         = useState<T | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  // Use a counter to trigger manual refetch
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then(result => { if (!cancelled) setData(result); })
      .catch(e     => { if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error'); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return { data, isLoading, error, refetch };
}

export const useTrending = () =>
  useAsync(() => api.getTrendingMovies().then(r => r.results.slice(0, 15)));

export const usePopular = () =>
  useAsync(() => api.getPopularMovies().then(r => r.results.slice(0, 12)));

export const useTopRated = () =>
  useAsync(() => api.getTopRatedMovies().then(r => r.results.slice(0, 12)));

export const useTrendingTV = () =>
  useAsync(() => api.getTrendingTV().then(r => r.results.slice(0, 12)));

export const useTopRatedTV = () =>
  useAsync(() => api.getTopRatedTV().then(r => r.results.slice(0, 12)));

export const useContentDetails = (id: number, type: 'movie' | 'tv' = 'movie') =>
  useAsync(() => type === 'movie' ? api.getFullMovieDetails(id) : api.getFullTVDetails(id), [id, type]);

export const useMovieDetails = (id: number) =>
  useAsync(() => api.getFullMovieDetails(id), [id]);

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
    [id]
  );
