import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { Movie, WatchlistMovie } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────
interface WatchlistContextType {
  watchlist:            WatchlistMovie[];
  addToWatchlist:       (movie: Movie) => void;
  removeFromWatchlist:  (movieId: number) => void;
  toggleWatched:        (movieId: number) => void;
  isInWatchlist:        (movieId: number) => boolean;
  userRatings:          Record<number, number>;
  setRating:            (movieId: number, rating: number) => void;
  getRating:            (movieId: number) => number | null;
  recentlyViewed:       number[];
  addToRecentlyViewed:  (movieId: number) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// ── Supabase helpers ───────────────────────────────────────────────────────
function toSupabaseRow(movie: WatchlistMovie, userId: string) {
  return {
    user_id:      userId,
    movie_id:     movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path ?? null,
    release_date: movie.release_date ?? null,
    vote_average: movie.vote_average ?? null,
    runtime:      movie.runtime ?? null,
    genres:       movie.genres ?? null,
    overview:     movie.overview ?? null,
    watched:      movie.watched,
    added_at:     movie.addedAt,
  };
}

function fromSupabaseRow(row: any): WatchlistMovie {
  return {
    id:            row.movie_id,
    title:         row.title,
    overview:      row.overview ?? '',
    poster_path:   row.poster_path ?? null,
    backdrop_path: null,
    vote_average:  row.vote_average ?? 0,
    vote_count:    0,
    release_date:  row.release_date ?? '',
    runtime:       row.runtime ?? undefined,
    genres:        row.genres ?? undefined,
    watched:       row.watched,
    addedAt:       row.added_at,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────
export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist,      setWatchlist]      = useState<WatchlistMovie[]>([]);
  const [userRatings,    setUserRatings]    = useState<Record<number, number>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [isLoaded,       setIsLoaded]       = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);

  // ── Track auth state (no dependency on AuthContext to avoid circular imports)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Load from AsyncStorage on mount ───────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedWatchlist, storedRatings, storedHistory] = await Promise.all([
          AsyncStorage.getItem('@watchlist'),
          AsyncStorage.getItem('@userRatings'),
          AsyncStorage.getItem('@recentlyViewed'),
        ]);
        if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
        if (storedRatings)   setUserRatings(JSON.parse(storedRatings));
        if (storedHistory)   setRecentlyViewed(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to load local data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // ── When user logs in, fetch cloud data and merge (cloud wins) ─────────
  useEffect(() => {
    if (!userId || !isLoaded) return;

    const syncFromCloud = async () => {
      try {
        // Watchlist
        const { data: cloudRows } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', userId)
          .order('added_at', { ascending: true });

        if (cloudRows && cloudRows.length > 0) {
          const cloudList = cloudRows.map(fromSupabaseRow);
          setWatchlist(cloudList);
          AsyncStorage.setItem('@watchlist', JSON.stringify(cloudList)).catch(console.error);
        }

        // Ratings
        const { data: ratingRows } = await supabase
          .from('user_ratings')
          .select('movie_id, rating')
          .eq('user_id', userId);

        if (ratingRows && ratingRows.length > 0) {
          const ratings: Record<number, number> = {};
          ratingRows.forEach(r => { ratings[r.movie_id] = r.rating; });
          setUserRatings(ratings);
          AsyncStorage.setItem('@userRatings', JSON.stringify(ratings)).catch(console.error);
        }
      } catch (e) {
        console.error('Failed to sync from cloud', e);
      }
    };

    syncFromCloud();
  }, [userId, isLoaded]);

  // ── Persist watchlist to AsyncStorage ─────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('@watchlist', JSON.stringify(watchlist)).catch(console.error);
  }, [watchlist, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('@userRatings', JSON.stringify(userRatings)).catch(console.error);
  }, [userRatings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem('@recentlyViewed', JSON.stringify(recentlyViewed)).catch(console.error);
  }, [recentlyViewed, isLoaded]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const addToWatchlist = (movie: Movie) => {
    setWatchlist(prev => {
      if (prev.find(m => m.id === movie.id)) return prev;
      const newItem: WatchlistMovie = {
        ...movie,
        addedAt: new Date().toISOString(),
        watched: false,
      };
      // Cloud sync
      if (userId) {
        supabase.from('watchlist')
          .upsert(toSupabaseRow(newItem, userId))
          .then(({ error }) => { if (error) console.error('Supabase add error', error); });
      }
      return [...prev, newItem];
    });
  };

  const removeFromWatchlist = (movieId: number) => {
    setWatchlist(prev => prev.filter(m => m.id !== movieId));
    if (userId) {
      supabase.from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .then(({ error }) => { if (error) console.error('Supabase delete error', error); });
    }
  };

  const toggleWatched = (movieId: number) => {
    setWatchlist(prev =>
      prev.map(m => {
        if (m.id !== movieId) return m;
        const updated = { ...m, watched: !m.watched };
        // Cloud sync
        if (userId) {
          supabase.from('watchlist')
            .update({ watched: updated.watched })
            .eq('user_id', userId)
            .eq('movie_id', movieId)
            .then(({ error }) => { if (error) console.error('Supabase toggle error', error); });
        }
        return updated;
      }),
    );
  };

  const isInWatchlist = (movieId: number) => watchlist.some(m => m.id === movieId);

  const setRating = (movieId: number, rating: number) => {
    setUserRatings(prev => ({ ...prev, [movieId]: rating }));
    if (userId) {
      supabase.from('user_ratings')
        .upsert({ user_id: userId, movie_id: movieId, rating })
        .then(({ error }) => { if (error) console.error('Supabase rating error', error); });
    }
  };

  const getRating = (movieId: number) => userRatings[movieId] || null;

  const addToRecentlyViewed = (movieId: number) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== movieId);
      return [movieId, ...filtered].slice(0, 10);
    });
  };

  return (
    <WatchlistContext.Provider value={{
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      toggleWatched,
      isInWatchlist,
      userRatings,
      setRating,
      getRating,
      recentlyViewed,
      addToRecentlyViewed,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────
export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
