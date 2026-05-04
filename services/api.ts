import { TMDB_API_KEY, TMDB_BASE_URL } from '../config';
import type { Movie, Person, Genre } from '../types';

// ── Core fetcher ─────────────────────────────────────────────────────────────
async function tmdbGet<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  // Safe by default: exclude adult content from all discovery/trending/general calls
  const defaultParams = { 
    api_key: TMDB_API_KEY, 
    include_adult: 'false' 
  };
  const query = new URLSearchParams({ ...defaultParams, ...params }).toString();
  const res   = await fetch(`${TMDB_BASE_URL}${endpoint}?${query}`);
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${endpoint}`);
  return res.json() as Promise<T>;
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
  tmdbGet<PagedResponse<Movie>>('/trending/movie/week', { page: String(page) });

export const getTrendingAll = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/trending/all/week', { page: String(page) });

export const getPopularMovies = (page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/movie/popular', { page: String(page) });

export const getTopRatedMovies = (page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/movie/top_rated', { page: String(page) });

export const getGenreList = () =>
  tmdbGet<{ genres: Genre[] }>('/genre/movie/list');

export const getMoviesByGenre = (genreId: number, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
    page: String(page),
  });

// ── Search ────────────────────────────────────────────────────────────────────
export const searchMovies = (query: string, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/search/movie', { 
    query, 
    page: String(page),
    include_adult: 'true' // Allow adult content ONLY in direct search
  });

export const searchMulti = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/multi', { 
    query, 
    page: String(page),
    include_adult: 'true' // Allow adult content ONLY in direct search
  });

export const discoverMovies = (genreId?: number, page = 1) =>
  tmdbGet<PagedResponse<Movie>>('/discover/movie', {
    sort_by: 'popularity.desc',
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

export const getFullMovieDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getMovieDetails(id), getMovieCredits(id), getMovieVideos(id),
    getMovieReviews(id), getSimilarMovies(id), getMovieKeywords(id), getMovieReleaseDates(id),
  ]);

  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  return {
    details:      getValue(results[0]),
    credits:      getValue(results[1], { cast: [], crew: [] }),
    videos:       getValue(results[2], { results: [] }),
    reviews:      getValue(results[3], { results: [] }),
    similar:      getValue(results[4], { results: [] }),
    keywords:     getValue(results[5], { keywords: [] }),
    releaseDates: getValue(results[6], { results: [] }),
  };
};

export const getFullTVDetails = async (id: number) => {
  const results = await Promise.allSettled([
    getTVDetails(id), getTVCredits(id), getTVVideos(id),
    getTVReviews(id), getSimilarTV(id), getTVKeywords(id), getTVContentRatings(id),
  ]);

  const getValue = (r: PromiseSettledResult<any>, fallback: any = null) =>
    r.status === 'fulfilled' ? r.value : fallback;

  const details       = getValue(results[0]);
  const credits       = getValue(results[1], { cast: [], crew: [] });
  const videos        = getValue(results[2], { results: [] });
  const reviews       = getValue(results[3], { results: [] });
  const similar       = getValue(results[4], { results: [] });
  const keywords      = getValue(results[5], { results: [] });
  const contentRatings= getValue(results[6], { results: [] });

  const normalizedDetails = details ? {
    ...details,
    title: details.name || 'Unknown Title',
    release_date: details.first_air_date || '',
    runtime: (details.episode_run_time && details.episode_run_time.length > 0) ? details.episode_run_time[0] : 0,
  } : null;

  return { 
    details: normalizedDetails, 
    credits,
    videos,
    reviews,
    similar,
    keywords: { keywords: keywords?.results || [] }, 
    releaseDates: { results: contentRatings?.results || [] } 
  };
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
  tmdbGet<PagedResponse<any>>('/trending/tv/week', { page: String(page) });

export const searchTV = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/tv', { 
    query, 
    page: String(page),
    include_adult: 'true' // Allow adult content ONLY in direct search
  });

export const getTopRatedTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/tv/top_rated', { page: String(page) });

export const getPopularTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/tv/popular', { page: String(page) });

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
    without_keywords: '10423,155477,231015,190370', // hentai, erotica, ecchi, adult animation
    'certification_country': 'US',
    'certification.lte': 'TV-14', // Strict filter for anime recommendations
    sort_by: 'popularity.desc', page: String(page),
  });

// ── Animation (animated movies) ───────────────────────────────────────────────
export const discoverAnimation = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/movie', {
    with_genres: '16', sort_by: 'popularity.desc', page: String(page),
  });
