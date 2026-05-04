export interface Movie {
  id:             number;
  media_type?:    'movie' | 'tv';
  title:          string;
  overview:       string;
  poster_path:    string | null;
  backdrop_path:  string | null;
  vote_average:   number;
  vote_count:     number;
  release_date:   string;
  genre_ids?:     number[];
  genres?:        Genre[];
  runtime?:       number;
  tagline?:       string;
  status?:        string;
  budget?:        number;
  revenue?:       number;
  popularity?:    number;
  original_language?: string;
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  keywords?: { keywords: Keyword[] };
}

export interface Genre {
  id:   number;
  name: string;
}

export interface CastMember {
  id:           number;
  name:         string;
  character:    string;
  profile_path: string | null;
  order:        number;
}

export interface CrewMember {
  id:         number;
  name:       string;
  job:        string;
  department: string;
}

export interface Video {
  id:       string;
  key:      string;
  name:     string;
  site:     string;
  type:     'Trailer' | 'Teaser' | 'Clip' | 'Featurette' | 'Behind the Scenes';
  official: boolean;
}

export interface Review {
  id:           string;
  author:       string;
  content:      string;
  created_at:   string;
  author_details: {
    rating: number | null;
    avatar_path: string | null;
  };
}

export interface Person {
  id:               number;
  name:             string;
  biography:        string;
  birthday:         string | null;
  place_of_birth:   string | null;
  profile_path:     string | null;
  known_for_department: string;
  popularity:       number;
}

export interface ProductionCompany {
  id:   number;
  name: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name:       string;
}

export interface Keyword {
  id:   number;
  name: string;
}

export interface WatchlistMovie extends Movie {
  watched:   boolean;
  addedAt:   string;
  userRating?: number;
}

export interface MovieCredits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface MovieDetails extends Movie {
  credits:      MovieCredits;
  videos:       { results: Video[] };
  reviews:      { results: Review[] };
  similar:      { results: Movie[] };
}

export interface MovieLog {
  id: string;
  user_id: string;
  movie_id: number;
  media_type?: 'movie' | 'tv';
  movie_title: string;
  poster_path?: string;
  watched_at: string;
  rating?: number;
  review_text?: string;
  is_spoiler: boolean;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
  is_liked_by_me?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}
