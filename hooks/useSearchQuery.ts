import { useState, useCallback, useRef } from 'react';
import { MediaItem, FetchState } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  discoverMovies, discoverTV, getPopularMovies, getPopularPeople,
  getTopRatedMovies, getTopRatedTV, getTrendingMovies,
  getTrendingTV, getTrendingAll, searchMovies, searchPeople, searchTV, searchMulti,
  discoverAnime, discoverAnimation,
} from '@/services/api';

// Maps a TMDB *movie* genre id (used by the filter chips) to its closest *TV*
// genre id, so a genre chip surfaces matching shows as well as films. Genres
// with no TV equivalent (Horror, Romance) are intentionally omitted → movies only.
const TV_GENRE_MAP: Record<number, number> = {
  28: 10759,    // Action          → Action & Adventure
  12: 10759,    // Adventure       → Action & Adventure
  35: 35,       // Comedy
  18: 18,       // Drama
  878: 10765,   // Sci-Fi          → Sci-Fi & Fantasy
  80: 80,       // Crime
  14: 10765,    // Fantasy         → Sci-Fi & Fantasy
  9648: 9648,   // Mystery
  10751: 10751, // Family
  99: 99,       // Documentary
  // 53 Thriller, 27 Horror, 10749 Romance: no TV equivalent → movies only
};

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

  const [itemsState, setItemsState] = useState<FetchState<MediaItem[]>>({ status: 'loading', data: [], error: null });
  const [personState, setPersonState] = useState<FetchState<any[]>>({ status: 'loading', data: [], error: null });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Monotonic id for the latest media request. A response is only applied if it
  // still matches — this prevents a slow earlier fetch (e.g. the previous filter)
  // from overwriting the results of the filter the user just tapped.
  const requestSeq = useRef(0);

  const fetchPage = useCallback(async (query: string, filter: string, p: number, append: boolean) => {
    const seq = ++requestSeq.current;
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
        if (seq !== requestSeq.current) return;
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
        // Genre chip (numeric TMDB movie-genre id, e.g. 28 = Action).
        const genreId = Number(filter);
        const tvGenre = TV_GENRE_MAP[genreId];

        if (query.trim()) {
          // Text + genre: multi-search, then strictly keep only items whose
          // genre_ids include the genre (movie id or its TV equivalent). This
          // makes typed search genre-accurate across both movies and shows.
          const d = await searchMulti(query, p);
          const results = (d.results ?? []).filter((m: any) => {
            if (m.media_type === "person") return false;
            const ids: number[] = m.genre_ids ?? [];
            return ids.includes(genreId) || (tvGenre != null && ids.includes(tvGenre));
          });
          raw = results.map((i: any) => norm(i)).filter((i: any): i is MediaItem => i !== null);
          tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
        } else {
          // Browse by genre: discover movies (+ TV where an equivalent genre
          // exists) and merge by popularity so the feed is genre-accurate and
          // includes both films and shows.
          const [mv, tv] = await Promise.all([
            discoverMovies(genreId, p),
            tvGenre != null
              ? discoverTV(tvGenre, p)
              : Promise.resolve({ results: [], total_pages: 1, total_results: 0 } as any),
          ]);
          const merged = [
            ...(mv.results ?? []).map((i: any) => norm(i, "movie")),
            ...(tv.results ?? []).map((i: any) => norm(i, "tv")),
          ]
            .filter((i: any): i is MediaItem => i !== null)
            .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
          raw = merged;
          tp = Math.max(mv.total_pages ?? 1, tv.total_pages ?? 1);
          tr = (mv.total_results ?? 0) + (tv.total_results ?? 0);
        }
      }
      
      if (seq !== requestSeq.current) return; // superseded by a newer fetch
      setItemsState(prev => ({
        status: 'success',
        data: append ? [...(prev.data || []), ...raw] : raw,
        error: null
      }));
      setPersonState({ status: 'success', data: [], error: null });
      setTotalPages(tp);
      setTotalResults(tr);
      setPage(p);
    } catch(e) {
      if (seq !== requestSeq.current) return; // a newer fetch is in charge
      // Drop stale data on a fresh (page-1) fetch so the list doesn't keep
      // showing the previous filter's results when this request fails.
      setItemsState(prev => ({ status: 'error', data: p === 1 ? [] : (prev.data || []), error: (e as Error).message }));
      setPersonState(prev => ({ ...prev, status: 'error', error: (e as Error).message }));
    } finally {
      if (seq === requestSeq.current) setLoadingMore(false);
    }
  }, []);

  const fetchCatPage = useCallback(async (cat: any, p: number, append: boolean, CATS: any) => {
    const seq = ++requestSeq.current;
    p === 1 ? setItemsState(prev => ({ ...prev, status: 'loading' })) : setLoadingMore(true);

    try {
      const def = CATS[cat];
      const d = await def.fetchFn(p);
      const mediaType = def.normalize ? 'tv' : 'movie';
      const raw = (d.results ?? []).map((i: any) => norm(i, mediaType)).filter((i: any): i is MediaItem => i !== null);
      if (seq !== requestSeq.current) return; // superseded by a newer fetch
      setItemsState(prev => ({
        status: 'success',
        data: append ? [...(prev.data || []), ...raw] : raw,
        error: null
      }));

      setTotalPages(d.total_pages ?? 1);
      setTotalResults(d.total_results ?? raw.length);
      setPersonState({ status: 'success', data: [], error: null });
      setPage(p);
    } catch(e) {
      if (seq !== requestSeq.current) return;
      setItemsState(prev => ({ status: 'error', data: p === 1 ? [] : (prev.data || []), error: (e as Error).message }));
    } finally {
      if (seq === requestSeq.current) setLoadingMore(false);
    }
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
