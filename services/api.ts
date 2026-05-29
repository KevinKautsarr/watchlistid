import AsyncStorage from '@react-native-async-storage/async-storage';
import { TMDB_BASE_URL } from '../config';
import type { Movie, Person, Genre } from '@/types';

// ── In-memory cache with TTL to avoid redundant TMDB fetches ─────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
interface CacheEntry<T> { data: T; expiresAt: number }
const memCache = new Map<string, CacheEntry<any>>();
const inflight  = new Map<string, Promise<any>>();

const STORAGE_PREFIX = '@tmdb_cache:';
const MAX_PERSISTED_ENTRIES = 50; // prevent unbounded storage growth

// ── Core fetcher with cache & deduplication ───────────────────────────────────
const NSFW_KEYWORDS = '10423,155477,231015,190370,10222,9350,158588,2945,183952'; // hentai, erotica, ecchi, adult animation, sex, softcore, pornography, nudity, softcore porn

async function tmdbGet<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  // Safe by default: exclude adult content from all discovery/trending/general calls
  const defaultParams = { 
    include_adult: 'false' 
  };
  const queryParams = new URLSearchParams({ ...defaultParams, ...params });
  // Pass the target TMDB endpoint as a query parameter for the Supabase Edge Function proxy
  queryParams.set('endpoint', endpoint);
  
  const queryString = queryParams.toString();
  const cacheKey = `${endpoint}?${queryString}`;

  // Return cached result if still fresh
  const cached = memCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data as T;

  // Deduplicate simultaneous identical requests
  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<T>;

  const promise = (async () => {
    const res = await fetch(`${TMDB_BASE_URL}?${queryString}`);
    if (!res.ok) throw new Error(`TMDB error ${res.status}: ${endpoint}`);
    const data = await res.json() as T;
    memCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    // Persist to storage — skip paginated results beyond page 1 to save space
    const shouldPersist = !cacheKey.includes('page=') || cacheKey.includes('page=1');
    if (shouldPersist) {
      AsyncStorage.setItem(
        STORAGE_PREFIX + cacheKey,
        JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS })
      ).catch(() => {});
    }
    inflight.delete(cacheKey);
    return data;
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

// ── AsyncStorage persistence ─────────────────────────────────────────────────
async function hydrateCacheFromStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tmdbKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    if (tmdbKeys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(tmdbKeys);
    const now = Date.now();
    pairs.forEach(([key, value]) => {
      if (!value) return;
      try {
        const entry: CacheEntry<any> = JSON.parse(value);
        if (entry.expiresAt > now) {
          const cacheKey = key.replace(STORAGE_PREFIX, '');
          memCache.set(cacheKey, entry);
        } else {
          AsyncStorage.removeItem(key).catch(() => {});
        }
      } catch {}
    });
  } catch (e) {
    console.warn('[api] Failed to hydrate cache from storage', e);
  }
}

// Fire and forget — does not block first render
// Guard: AsyncStorage uses `window` which is not available during SSR/static rendering
if (typeof window !== 'undefined') {
  hydrateCacheFromStorage();
}

export async function clearPersistedCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const tmdbKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
    if (tmdbKeys.length > 0) await AsyncStorage.multiRemove(tmdbKeys);
    memCache.clear();
  } catch (e) {
    console.warn('[api] Failed to clear persisted cache', e);
  }
}

// ── Paginated response type ───────────────────────────────────────────────────
export interface PagedResponse<T> {
  results:       T[];
  page:          number;
  total_pages:   number;
  total_results: number;
}

// ── Home ─────────────────────────────────────────────────────────────────────
export const getTrendingMovies = (page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', { 
    sort_by: 'popularity.desc', 
    page: String(page),
    without_keywords: NSFW_KEYWORDS
  });

export const getTrendingAll = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/trending/all/week', { page: String(page) });

export const getPopularMovies = (page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', { 
    sort_by: 'popularity.desc', 
    page: String(page),
    without_keywords: NSFW_KEYWORDS
  });

export const getTopRatedMovies = (page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/movie/top_rated', { page: String(page) });

export const getGenreList = () =>
  tmdbGet<{ genres: Genre[] }>('/genre/movie/list');

export const getMoviesByGenre = (genreId: number, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', {
    with_genres: String(genreId),
    without_keywords: NSFW_KEYWORDS,
    sort_by: 'popularity.desc',
    page: String(page),
  });

// ── Search ────────────────────────────────────────────────────────────────────
export const searchMovies = (query: string, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/search/movie', { 
    query, 
    page: String(page),
    include_adult: 'false'
  });

export const searchMulti = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/multi', { 
    query, 
    page: String(page),
    include_adult: 'false'
  });

export const discoverMovies = (genreId?: number, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', {
    sort_by: 'popularity.desc',
    without_keywords: NSFW_KEYWORDS,
    page: String(page),
    ...(genreId ? { with_genres: String(genreId) } : {}),
  });

// ── Movie Detail ──────────────────────────────────────────────────────────────
export const getMovieDetails     = (id: number) => tmdbGet<Movie>(`/movie/${id}`);
export const getMovieCredits     = (id: number) => tmdbGet<{ cast: any[]; crew: any[] }>(`/movie/${id}/credits`);
export const getMovieVideos      = (id: number) => tmdbGet<{ results: any[] }>(`/movie/${id}/videos`);
export const getMovieReviews     = (id: number) => tmdbGet<{ results: any[] }>(`/movie/${id}/reviews`);
export const getSimilarMovies    = (id: number) => tmdbGet<{ results: Movie[] }>(`/movie/${id}/similar`);
export const getMovieKeywords    = (id: number) => tmdbGet<{ keywords: any[] }>(`/movie/${id}/keywords`);
export const getMovieReleaseDates= (id: number) => tmdbGet<{ results: any[] }>(`/movie/${id}/release_dates`);

// ── TV Detail ─────────────────────────────────────────────────────────────────
export const getTVDetails        = (id: number) => tmdbGet<any>(`/tv/${id}`);
export const getTVCredits        = (id: number) => tmdbGet<{ cast: any[]; crew: any[] }>(`/tv/${id}/credits`);
export const getTVVideos         = (id: number) => tmdbGet<{ results: any[] }>(`/tv/${id}/videos`);
export const getTVReviews        = (id: number) => tmdbGet<{ results: any[] }>(`/tv/${id}/reviews`);
export const getSimilarTV        = (id: number) => tmdbGet<{ results: any[] }>(`/tv/${id}/similar`);
export const getTVKeywords       = (id: number) => tmdbGet<{ results: any[] }>(`/tv/${id}/keywords`);
export const getTVContentRatings = (id: number) => tmdbGet<{ results: any[] }>(`/tv/${id}/content_ratings`);

/**
 * Fetch detailed data for a specific TV season, including episodes
 * @param tvId The TMDB TV Show ID
 * @param seasonNumber The season number to fetch
 */
export const getTVSeasonDetails = (tvId: number, seasonNumber: number) => 
  tmdbGet<any>(`/tv/${tvId}/season/${seasonNumber}`);

export const getCriticalMovieDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getMovieDetails(id), getMovieCredits(id)
  ]);
  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  return {
    details: getValue(results[0]),
    credits: getValue(results[1], { cast: [], crew: [] }),
  };
};

export const getSupplementaryMovieDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getMovieVideos(id), getMovieReviews(id), getSimilarMovies(id), 
    getMovieKeywords(id), getMovieReleaseDates(id),
  ]);
  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  return {
    videos:       getValue(results[0], { results: [] }),
    reviews:      getValue(results[1], { results: [] }),
    similar:      getValue(results[2], { results: [] }),
    keywords:     getValue(results[3], { keywords: [] }),
    releaseDates: getValue(results[4], { results: [] }),
  };
};

export const getFullMovieDetails = async (id: number) => {
  const [critical, supplementary] = await Promise.all([
    getCriticalMovieDetails(id),
    getSupplementaryMovieDetails(id)
  ]);
  return { ...critical, ...supplementary };
};


export const getCriticalTVDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getTVDetails(id), getTVCredits(id)
  ]);
  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  const details = getValue(results[0]);
  const credits = getValue(results[1], { cast: [], crew: [] });

  const normalizedDetails = details ? {
    ...details,
    title: details.name || 'Unknown Title',
    release_date: details.first_air_date || '',
    runtime: (details.episode_run_time && details.episode_run_time.length > 0) ? details.episode_run_time[0] : 0,
  } : null;

  return { details: normalizedDetails, credits };
};

export const getSupplementaryTVDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getTVVideos(id), getTVReviews(id), getSimilarTV(id), 
    getTVKeywords(id), getTVContentRatings(id),
  ]);
  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  const videos        = getValue(results[0], { results: [] });
  const reviews       = getValue(results[1], { results: [] });
  const similar       = getValue(results[2], { results: [] });
  const keywords      = getValue(results[3], { results: [] });
  const contentRatings= getValue(results[4], { results: [] });

  return { 
    videos,
    reviews,
    similar,
    keywords: { keywords: keywords?.results || [] }, 
    releaseDates: { results: contentRatings?.results || [] } 
  };
};

export const getFullTVDetails = async (id: number) => {
  const [critical, supplementary] = await Promise.all([
    getCriticalTVDetails(id),
    getSupplementaryTVDetails(id)
  ]);
  return { ...critical, ...supplementary };
};


// ── Person ────────────────────────────────────────────────────────────────────
export const getPersonDetails = (id: number) => tmdbGet<Person>(`/person/${id}`);
export const getPersonCredits = (id: number) => tmdbGet<{ cast: any[]; crew: any[] }>(`/person/${id}/combined_credits`);

export const searchPeople = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/person', { query, page: String(page) });

export const getPopularPeople = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/person/popular', { page: String(page) });

// ── TV Shows ──────────────────────────────────────────────────────────────────
export const getTrendingTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/tv', { 
    sort_by: 'popularity.desc', 
    page: String(page),
    without_keywords: NSFW_KEYWORDS
  });

export const searchTV = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/tv', { 
    query, 
    page: String(page),
    include_adult: 'false'
  });

export const getTopRatedTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/tv/top_rated', { page: String(page) });

export const getPopularTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/tv', { 
    sort_by: 'popularity.desc', 
    page: String(page),
    without_keywords: NSFW_KEYWORDS
  });

export const getStudioMovies = (companyId: number, page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/movie', {
    with_companies: String(companyId),
    sort_by: 'popularity.desc',
    page: String(page),
  });

// ── Anime (JP animated TV) ────────────────────────────────────────────────────
export const discoverAnime = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/tv', {
    with_genres: '16', with_origin_country: 'JP',
    without_keywords: NSFW_KEYWORDS,
    'certification_country': 'US',
    'certification.lte': 'TV-14', // Strict filter for anime recommendations
    sort_by: 'popularity.desc', page: String(page),
  });

// ── Animation (animated movies) ───────────────────────────────────────────────
export const discoverAnimation = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/movie', {
    with_genres: '16', 
    without_keywords: NSFW_KEYWORDS,
    sort_by: 'popularity.desc', page: String(page),
  });
