export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
        }
      }
      watchlist: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          title: string
          poster_path: string | null
          release_date: string | null
          vote_average: number | null
          runtime: number | null
          genres: Json | null
          overview: string | null
          media_type: string | null
          watched: boolean
          status: string | null
          added_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          title: string
          poster_path?: string | null
          release_date?: string | null
          vote_average?: number | null
          runtime?: number | null
          genres?: Json | null
          overview?: string | null
          media_type?: string | null
          watched?: boolean
          status?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          title?: string
          poster_path?: string | null
          release_date?: string | null
          vote_average?: number | null
          runtime?: number | null
          genres?: Json | null
          overview?: string | null
          media_type?: string | null
          watched?: boolean
          status?: string | null
          added_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          rating?: number
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      recently_viewed: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          viewed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          viewed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          viewed_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      movie_logs: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          media_type: string | null
          movie_title: string
          poster_path: string | null
          watched_at: string
          rating: number | null
          review_text: string | null
          is_spoiler: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          media_type?: string | null
          movie_title: string
          poster_path?: string | null
          watched_at?: string
          rating?: number | null
          review_text?: string | null
          is_spoiler?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          media_type?: string | null
          movie_title?: string
          poster_path?: string | null
          watched_at?: string
          rating?: number | null
          review_text?: string | null
          is_spoiler?: boolean
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: string
          reference_id: string | null
          message: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: string
          reference_id?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: string
          reference_id?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          movie_id: number
          media_type: string
          content: string
          rating: number | null
          is_spoiler: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: number
          media_type?: string
          content: string
          rating?: number | null
          is_spoiler?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: number
          media_type?: string
          content?: string
          rating?: number | null
          is_spoiler?: boolean
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
      review_likes: {
        Row: {
          id: string
          user_id: string
          review_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          review_id?: string
          created_at?: string
        }
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[]; }[]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

// ── Custom Utility Types ─────────────────────────────────────────────────────

/**
 * Extracts a specific subset of rows from the watchlist table.
 * Usage: type MovieRow = Extract<Tables<'watchlist'>, { media_type: 'movie' }>
 */
export type UserWatchlistRow = Extract<Tables<'watchlist'>, { media_type: 'movie' | 'tv' }>;

/**
 * Excludes a specific subset of rows.
 */
export type NonMovieWatchlistRow = Exclude<Tables<'watchlist'>, { media_type: 'movie' }>;

/**
 * Type guard forcing `user_id` to be present for RLS-protected inserts/updates.
 */
export type UserScopedQuery<T> = T & { user_id: string };
