import { TMDB_API_KEY, TMDB_BASE_URL } from '../config';
import type {
  Movie, Person, Genre
} from '../types';

// ── Core fetcher ────────────────────────────────────────────
async function tmdbGet<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const query = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params,
  }).toString();

  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query}`);

  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

// ── Home ────────────────────────────────────────────────────
export const getTrendingMovies = () =>
  tmdbGet<{ results: Movie[] }>('/trending/movie/week');

export const getPopularMovies = () =>
  tmdbGet<{ results: Movie[] }>('/movie/popular');

export const getTopRatedMovies = () =>
  tmdbGet<{ results: Movie[] }>('/movie/top_rated');

export const getGenreList = () =>
  tmdbGet<{ genres: Genre[] }>('/genre/movie/list');

export const getMoviesByGenre = (genreId: number) =>
  tmdbGet<{ results: Movie[] }>('/discover/movie', {
    with_genres: String(genreId),
    sort_by: 'popularity.desc',
  });

// ── Search ──────────────────────────────────────────────────
export const searchMovies = (query: string, page = 1) =>
  tmdbGet<{ results: Movie[]; total_results: number }>('/search/movie', {
    query,
    page: String(page),
  });

export const discoverMovies = (genreId?: number) =>
  tmdbGet<{ results: Movie[] }>('/discover/movie', {
    sort_by: 'popularity.desc',
    ...(genreId ? { with_genres: String(genreId) } : {}),
  });

// ── Movie Detail ────────────────────────────────────────────
export const getMovieDetails = (id: number) =>
  tmdbGet<Movie>(`/movie/${id}`);

export const getMovieCredits = (id: number) =>
  tmdbGet<{ cast: any[]; crew: any[] }>(`/movie/${id}/credits`);

export const getMovieVideos = (id: number) =>
  tmdbGet<{ results: any[] }>(`/movie/${id}/videos`);

export const getMovieReviews = (id: number) =>
  tmdbGet<{ results: any[] }>(`/movie/${id}/reviews`);

export const getSimilarMovies = (id: number) =>
  tmdbGet<{ results: Movie[] }>(`/movie/${id}/similar`);

export const getMovieKeywords = (id: number) =>
  tmdbGet<{ keywords: any[] }>(`/movie/${id}/keywords`);

export const getMovieReleaseDates = (id: number) =>
  tmdbGet<{ results: any[] }>(`/movie/${id}/release_dates`);

export const getFullMovieDetails = async (id: number) => {
  const [
    details,
    credits,
    videos,
    reviews,
    similar,
    keywords,
    releaseDates,
  ] = await Promise.all([
    getMovieDetails(id),
    getMovieCredits(id),
    getMovieVideos(id),
    getMovieReviews(id),
    getSimilarMovies(id),
    getMovieKeywords(id),
    getMovieReleaseDates(id),
  ]);

  return { details, credits, videos, reviews, similar, keywords, releaseDates };
};

// ── Person ──────────────────────────────────────────────────
export const getPersonDetails = (id: number) =>
  tmdbGet<Person>(`/person/${id}`);

export const getPersonCredits = (id: number) =>
  tmdbGet<{ cast: Movie[] }>(`/person/${id}/movie_credits`);
