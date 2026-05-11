import { Tables } from './supabase';

export type ReviewItem = Tables<'reviews'> & {
  user?: {
    username: string;
    avatar_url: string | null;
  };
  likes_count: number;
  is_liked_by_me: boolean;
};

export type ReviewLike = Tables<'review_likes'>;

export interface FetchState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}
