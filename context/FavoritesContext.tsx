import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import Toast from '@/components/common/Toast';

// ── Types ──────────────────────────────────────────────────────────────────
export interface FavoriteItem {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  position: number;
  added_at: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  isLoading: boolean;
  isFavorite: (movieId: number) => boolean;
  addFavorite: (movie: {
    movie_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
  }) => Promise<boolean>;
  removeFavorite: (movieId: number) => Promise<boolean>;
  moveUp: (movieId: number) => Promise<void>;
  moveDown: (movieId: number) => Promise<void>;
  reorderFavorites: (orderedMovieIds: number[]) => Promise<void>;
  fetchFavorites: (userId: string) => Promise<FavoriteItem[]>;
}

// ── Context ────────────────────────────────────────────────────────────────
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'error' }>({
    visible: false, message: '', type: 'success',
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  }, []);

  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  // Load own favorites when user logs in
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .then(({ data }) => {
        setFavorites((data as FavoriteItem[]) || []);
        setIsLoading(false);
      });
  }, [user]);

  // Fetch favorites for any user (for viewing other profiles)
  const fetchFavorites = useCallback(async (userId: string): Promise<FavoriteItem[]> => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      console.error('fetchFavorites error:', error);
      return [];
    }
    return (data as FavoriteItem[]) || [];
  }, []);

  const isFavorite = useCallback((movieId: number) => {
    return favorites.some(f => f.movie_id === movieId);
  }, [favorites]);

  const addFavorite = useCallback(async (movie: {
    movie_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
  }): Promise<boolean> => {
    if (!user) return false;

    if (favorites.length >= 20) {
      showToast('Maksimal 20 film favorit', 'error');
      return false;
    }

    try {
      const { error } = await supabase.rpc('add_favorite', {
        p_movie_id: movie.movie_id,
        p_media_type: movie.media_type,
        p_title: movie.title,
        p_poster_path: movie.poster_path ?? null,
      });

      if (error) throw error;

      // Optimistic update — append to end
      const newItem: FavoriteItem = {
        id: `temp-${movie.movie_id}`,
        user_id: user.id,
        movie_id: movie.movie_id,
        media_type: movie.media_type,
        title: movie.title,
        poster_path: movie.poster_path ?? null,
        position: favorites.length + 1,
        added_at: new Date().toISOString(),
      };
      setFavorites(prev => [...prev, newItem]);
      showToast('Ditambahkan ke Favorit ❤️', 'success');
      return true;
    } catch (err: any) {
      console.error('addFavorite error:', err);
      showToast(err.message || 'Gagal menambahkan favorit', 'error');
      return false;
    }
  }, [user, favorites, showToast]);

  const removeFavorite = useCallback(async (movieId: number): Promise<boolean> => {
    if (!user) return false;

    // Optimistic remove
    setFavorites(prev => {
      const filtered = prev.filter(f => f.movie_id !== movieId);
      // Re-index positions
      return filtered.map((f, i) => ({ ...f, position: i + 1 }));
    });
    showToast('Dihapus dari Favorit', 'info');

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('removeFavorite error:', err);
      // Revert by refetching
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });
      setFavorites((data as FavoriteItem[]) || []);
      return false;
    }
  }, [user, showToast]);

  const moveUp = useCallback(async (movieId: number) => {
    if (!user) return;

    // Optimistic: swap in local state
    setFavorites(prev => {
      const idx = prev.findIndex(f => f.movie_id === movieId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((f, i) => ({ ...f, position: i + 1 }));
    });

    await supabase.rpc('move_favorite', { p_movie_id: movieId, p_direction: 'up' });
  }, [user]);

  const moveDown = useCallback(async (movieId: number) => {
    if (!user) return;

    setFavorites(prev => {
      const idx = prev.findIndex(f => f.movie_id === movieId);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((f, i) => ({ ...f, position: i + 1 }));
    });

    await supabase.rpc('move_favorite', { p_movie_id: movieId, p_direction: 'down' });
  }, [user]);

  const reorderFavorites = useCallback(async (orderedMovieIds: number[]) => {
    if (!user) return;

    // Optimistic: reorder local state
    setFavorites(prev => {
      const map = new Map(prev.map(f => [f.movie_id, f]));
      return orderedMovieIds
        .map((id, i) => {
          const item = map.get(id);
          return item ? { ...item, position: i + 1 } : null;
        })
        .filter(Boolean) as FavoriteItem[];
    });

    await supabase.rpc('reorder_favorites', { p_ordered_movie_ids: orderedMovieIds });
  }, [user]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isLoading,
      isFavorite,
      addFavorite,
      removeFavorite,
      moveUp,
      moveDown,
      reorderFavorites,
      fetchFavorites,
    }}>
      {children}
      <Toast visible={toast.visible} message={toast.message} type={toast.type as any} onHide={hideToast} />
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
