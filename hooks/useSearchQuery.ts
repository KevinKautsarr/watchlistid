import { useState, useCallback, useEffect } from 'react';
import { MediaItem, FetchState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  discoverMovies, getPopularMovies, getPopularPeople,
  getTopRatedMovies, getTopRatedTV, getTrendingMovies,
  getTrendingTV, getTrendingAll, searchMovies, searchPeople, searchTV, searchMulti,
  discoverAnime, discoverAnimation,
} from '@/services/api';

const norm = (i: any, defaultType?: 'movie' | 'tv'): MediaItem | null => {
  if (i.media_type === "person") return null;
  return {
    ...i,
    media_type: i.media_type ?? defaultType ?? "movie",
    title: i.title ?? i.name ?? "Unknown",
    original_title: i.original_title ?? i.original_name ?? "Unknown",
    release_date: i.release_date ?? i.first_air_date ?? "",
    poster_path: i.poster_path ?? null,
  } as MediaItem;
};

export const useSearchQuery = (initialCat: any, initialFilter: string) => {
  const [activeCat, setActiveCat] = useState<any>(initialCat);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [searchText, setSearchText] = useState("");
  const debouncedQ = useDebounce(searchText, 450);

  const [itemsState, setItemsState] = useState<FetchState<MediaItem[]>>({ status: 'idle', data: [], error: null });
  const [personState, setPersonState] = useState<FetchState<any[]>>({ status: 'idle', data: [], error: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (query: string, filter: string, p: number, append: boolean) => {
    if (p === 1) {
      setItemsState(prev => ({ ...prev, status: 'loading' }));
      setPersonState(prev => ({ ...prev, status: 'loading' }));
    } else {
      setLoadingMore(true);
    }

    try {
      let raw: any[] = [];
      let tp = 1, tr = 0;

      if (filter === "all") {
        const d = query.trim() ? await searchMulti(query, p) : await getTrendingAll(p);
        raw = (d.results ?? []).map((i: any) => norm(i)).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      } else if (filter === "anime") {
        const d = query.trim() ? await searchTV(query, p) : await discoverAnime(p);
        raw = (d.results ?? []).map((i: any) => norm(i, "tv")).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      } else if (filter === "animation") {
        const d = query.trim() ? await searchMovies(query, p) : await discoverAnimation(p);
        raw = (d.results ?? []).map((i: any) => norm(i, "movie")).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      } else if (filter === "movies") {
        const d = query.trim() ? await searchMovies(query, p) : await getTrendingMovies(p);
        raw = (d.results ?? []).map((i: any) => norm(i, "movie")).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      } else if (filter === "tv") {
        const d = query.trim() ? await searchTV(query, p) : await getTrendingTV(p);
        raw = (d.results ?? []).map((i: any) => norm(i, "tv")).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      } else if (filter === "people") {
        const d = query.trim() ? await searchPeople(query, p) : await getPopularPeople(p);
        const results = d.results ?? [];
        setPersonState(prev => ({
          status: 'success',
          data: append ? [...(prev.data || []), ...results] : results,
          error: null
        }));
        setTotalPages(d.total_pages ?? 1);
        setTotalResults(d.total_results ?? results.length);
        setItemsState({ status: 'success', data: [], error: null });
        return;
      } else {
        const d = query.trim() ? await searchMovies(query, p) : await discoverMovies(Number(filter), p);
        const results = query.trim()
          ? (d.results ?? []).filter((m:any) => m.genre_ids?.includes(Number(filter)))
          : (d.results ?? []);
        raw = results.map((i: any) => norm(i, "movie")).filter((i: any): i is MediaItem => i !== null);
        tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
      }
      
      setItemsState(prev => ({
        status: 'success',
        data: append ? [...(prev.data || []), ...raw] : raw,
        error: null
      }));
      setPersonState({ status: 'success', data: [], error: null });
      setTotalPages(tp);
      setTotalResults(tr);
    } catch(e) { 
      setItemsState(prev => ({ ...prev, status: 'error', error: (e as Error).message }));
      setPersonState(prev => ({ ...prev, status: 'error', error: (e as Error).message }));
    } finally { setLoadingMore(false); }
  }, []);

  const fetchCatPage = useCallback(async (cat: any, p: number, append: boolean, CATS: any) => {
    p === 1 ? setItemsState(prev => ({ ...prev, status: 'loading' })) : setLoadingMore(true);

    try {
      const def = CATS[cat];
      const d = await def.fetchFn(p);
      const mediaType = def.normalize ? 'tv' : 'movie';
      const raw = (d.results ?? []).map((i: any) => norm(i, mediaType)).filter((i: any): i is MediaItem => i !== null);
      setItemsState(prev => ({
        status: 'success',
        data: append ? [...(prev.data || []), ...raw] : raw,
        error: null
      }));

      setTotalPages(d.total_pages ?? 1);
      setTotalResults(d.total_results ?? raw.length);
      setPersonState({ status: 'success', data: [], error: null });
    } catch(e) { 
      setItemsState(prev => ({ ...prev, status: 'error', error: (e as Error).message }));
    } finally { setLoadingMore(false); }
  }, []);

  return {
    activeCat, setActiveCat,
    activeFilter, setActiveFilter,
    searchText, setSearchText, debouncedQ,
    itemsState, personState, setItemsState, setPersonState,
    page, setPage, totalPages, totalResults, loadingMore,
    fetchPage, fetchCatPage
  };
};
