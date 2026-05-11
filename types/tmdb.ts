/**
 * TMDB API Type Definitions
 * 
 * Comprehensive TypeScript definitions for TMDB API responses.
 * Uses discriminated unions, generic paginated responses, and strict null safety.
 */

export type MediaType = 'movie' | 'tv' | 'person';

// ── Generic API Response ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  readonly page: number;
  readonly results: ReadonlyArray<T>;
  readonly total_pages: number;
  readonly total_results: number;
}

// ── Shared Base Media ──────────────────────────────────────────────────────

export interface BaseMedia {
  readonly id: number;
  readonly overview: string;
  readonly poster_path: string | null;
  readonly backdrop_path: string | null;
  readonly vote_average: number;
  readonly vote_count: number;
  readonly popularity: number;
  readonly original_language: string;
  readonly genre_ids: ReadonlyArray<number>;
  readonly genres?: ReadonlyArray<Genre>;
  readonly tagline?: string;
  readonly status?: string;
  readonly production_companies?: ReadonlyArray<ProductionCompany>;
}

// ── Discriminated Unions for Media ─────────────────────────────────────────

export interface Movie extends BaseMedia {
  readonly media_type: 'movie'; // Enforced via normalization
  readonly title: string;
  readonly original_title: string;
  readonly release_date: string; // Format: YYYY-MM-DD
  readonly video?: boolean;
  readonly adult?: boolean;
  readonly runtime?: number;
  readonly budget?: number;
  readonly revenue?: number;
}

export interface TVShow extends BaseMedia {
  readonly media_type: 'tv'; // Enforced via normalization
  readonly name: string;
  readonly original_name: string;
  readonly first_air_date: string; // Format: YYYY-MM-DD
  readonly origin_country: ReadonlyArray<string>;
  readonly episode_run_time?: ReadonlyArray<number>;
  readonly number_of_episodes?: number;
  readonly number_of_seasons?: number;
}

export type MediaItem = Movie | TVShow;

// ── Utility Types (Lightweight Views) ──────────────────────────────────────

/**
 * Lightweight Card Types using Pick and Omit.
 * Ideal for FlatLists where we only need a subset of the full response.
 */
export type MovieCard = Readonly<Pick<Movie, 'id' | 'media_type' | 'title' | 'poster_path' | 'vote_average' | 'release_date'>>;
export type TVShowCard = Readonly<Pick<TVShow, 'id' | 'media_type' | 'name' | 'poster_path' | 'vote_average' | 'first_air_date'>>;

export type MediaCardItem = MovieCard | TVShowCard;

/**
 * Detailed views excluding raw genre_ids in favor of full Genre objects.
 */
export type MovieDetail = Omit<Movie, 'genre_ids'> & {
  readonly genres: ReadonlyArray<Genre>;
  readonly runtime: number; // Required in detail fetch
};

export type TVShowDetail = Omit<TVShow, 'genre_ids'> & {
  readonly genres: ReadonlyArray<Genre>;
};

// ── Nested Entities ────────────────────────────────────────────────────────

export interface Genre {
  readonly id: number;
  readonly name: string;
}

export interface ProductionCompany {
  readonly id: number;
  readonly logo_path: string | null;
  readonly name: string;
  readonly origin_country: string;
}

// ── Credits ────────────────────────────────────────────────────────────────

export interface Cast {
  readonly id: number;
  readonly cast_id?: number;
  readonly credit_id: string;
  readonly name: string;
  readonly original_name: string;
  readonly character: string;
  readonly profile_path: string | null;
  readonly order: number;
  readonly gender: number | null;
  readonly known_for_department: string;
}

export interface Crew {
  readonly id: number;
  readonly credit_id: string;
  readonly name: string;
  readonly original_name: string;
  readonly job: string;
  readonly department: string;
  readonly profile_path: string | null;
  readonly gender: number | null;
}

export interface CreditsResponse {
  readonly id: number;
  readonly cast: ReadonlyArray<Cast>;
  readonly crew: ReadonlyArray<Crew>;
}

// ── Videos ─────────────────────────────────────────────────────────────────

export type VideoType = 'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes' | 'Bloopers';

export interface Video {
  readonly id: string;
  readonly iso_639_1: string;
  readonly iso_3166_1: string;
  readonly key: string;
  readonly name: string;
  readonly site: string;
  readonly size: number;
  readonly type: VideoType;
  readonly official: boolean;
  readonly published_at: string;
}

export interface VideosResponse {
  readonly id: number;
  readonly results: ReadonlyArray<Video>;
}

// ── Person ─────────────────────────────────────────────────────────────────

export interface PersonDetail {
  readonly id: number;
  readonly name: string;
  readonly biography: string;
  readonly birthday: string | null;
  readonly deathday: string | null;
  readonly place_of_birth: string | null;
  readonly profile_path: string | null;
  readonly known_for_department: string;
  readonly popularity: number;
  readonly gender: number; // 0: Not set/specified, 1: Female, 2: Male, 3: Non-binary
  readonly imdb_id: string | null;
  readonly homepage: string | null;
}
