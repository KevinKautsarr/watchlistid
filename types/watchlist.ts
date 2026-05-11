import { Genre } from './tmdb';

export const WATCHLIST_STATUS = {
  PLAN_TO_WATCH: 'plan_to_watch',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;

export type WatchlistStatus = typeof WATCHLIST_STATUS[keyof typeof WATCHLIST_STATUS];

export interface BaseWatchlistItem {
  readonly id: number;
  readonly addedAt: string;
  readonly status: WatchlistStatus;
  readonly overview: string;
  readonly poster_path: string | null;
  readonly backdrop_path: string | null;
  readonly vote_average: number;
  readonly vote_count: number;
  readonly genres?: ReadonlyArray<Genre>;
}

export interface WatchlistItemMovie extends BaseWatchlistItem {
  readonly mediaType: 'movie';
  readonly title: string;
  readonly release_date: string;
  readonly runtime?: number;
}

export interface WatchlistItemTV extends BaseWatchlistItem {
  readonly mediaType: 'tv';
  readonly name: string;
  readonly first_air_date: string;
}

/**
 * Discriminated Union for Watchlist Items
 */
export type WatchlistItem = WatchlistItemMovie | WatchlistItemTV;

/**
 * Conditional Types to extract specific media types from the union.
 */
export type ExtractMovie<T> = T extends { mediaType: 'movie' } ? T : never;
export type ExtractTV<T> = T extends { mediaType: 'tv' } ? T : never;

/**
 * O(1) Lookup Map for Watchlist Items
 */
export type WatchlistMap = Record<string, WatchlistItem>;

/**
 * Local Storage Schema Definition
 */
export interface StorageSchema {
  '@watchlist': WatchlistMap;
  '@userRatings': Record<number, number>;
  '@recentlyViewed': number[];
}
