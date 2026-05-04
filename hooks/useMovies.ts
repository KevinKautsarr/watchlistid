import { useState, useEffect, useCallback } from 'react';
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

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export const useTrending = () =>
  useAsync(() => api.getTrendingMovies().then(r => r.results));

export const usePopular = () =>
  useAsync(() => api.getPopularMovies().then(r => r.results));

export const useTopRated = () =>
  useAsync(() => api.getTopRatedMovies().then(r => r.results));

export const useTrendingTV = () =>
  useAsync(() => api.getTrendingTV().then(r => r.results));

export const useTopRatedTV = () =>
  useAsync(() => api.getTopRatedTV().then(r => r.results));

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
