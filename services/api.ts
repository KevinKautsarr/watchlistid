import { TMDB_API_KEY, TMDB_BASE_URL } from '../config';
import type { Movie, Person, Genre } from '../types';

// ── Core fetcher ─────────────────────────────────────────────────────────────
async function tmdbGet<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const query = new URLSearchParams({ api_key: TMDB_API_KEY, ...params }).toString();
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
  tmdbGet<PagedResponse<Movie>>('/search/movie', { query, page: String(page) });

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

export const getFullMovieDetails = async (id: number) => {
  const [details, credits, videos, reviews, similar, keywords, releaseDates] = await Promise.all([
    getMovieDetails(id), getMovieCredits(id), getMovieVideos(id),
    getMovieReviews(id), getSimilarMovies(id), getMovieKeywords(id), getMovieReleaseDates(id),
  ]);
  return { details, credits, videos, reviews, similar, keywords, releaseDates };
};

// ── Person ────────────────────────────────────────────────────────────────────
export const getPersonDetails = (id: number) => tmdbGet<Person>(`/person/${id}`);
export const getPersonCredits = (id: number) => tmdbGet<{ cast: Movie[] }>(`/person/${id}/movie_credits`);

export const searchPeople = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/person', { query, page: String(page) });

export const getPopularPeople = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/person/popular', { page: String(page) });

// ── TV Shows ──────────────────────────────────────────────────────────────────
export const getTrendingTV = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/trending/tv/week', { page: String(page) });

export const searchTV = (query: string, page = 1) =>
  tmdbGet<PagedResponse<any>>('/search/tv', { query, page: String(page) });

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
    sort_by: 'popularity.desc', page: String(page),
  });

// ── Animation (animated movies) ───────────────────────────────────────────────
export const discoverAnimation = (page = 1) =>
  tmdbGet<PagedResponse<any>>('/discover/movie', {
    with_genres: '16', sort_by: 'popularity.desc', page: String(page),
  });
