import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, WatchlistMovie } from '../types';

interface WatchlistContextType {
  watchlist: WatchlistMovie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  toggleWatched: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  userRatings: Record<number, number>;
  setRating: (movieId: number, rating: number) => void;
  getRating: (movieId: number) => number | null;
  recentlyViewed: number[];
  addToRecentlyViewed: (movieId: number) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedWatchlist = await AsyncStorage.getItem('@watchlist');
        const storedRatings   = await AsyncStorage.getItem('@userRatings');
        const storedHistory   = await AsyncStorage.getItem('@recentlyViewed');

        if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
        if (storedRatings)   setUserRatings(JSON.parse(storedRatings));
        if (storedHistory)   setRecentlyViewed(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save to AsyncStorage when state changes
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

  const addToWatchlist = (movie: Movie) => {
    setWatchlist(prev => {
      if (prev.find(m => m.id === movie.id)) return prev;
      const newItem: WatchlistMovie = { 
        ...movie, 
        addedAt: new Date().toISOString(), 
        watched: false 
      };
      return [...prev, newItem];
    });
  };

  const removeFromWatchlist = (movieId: number) => {
    setWatchlist(prev => prev.filter(m => m.id !== movieId));
  };

  const toggleWatched = (movieId: number) => {
    setWatchlist(prev =>
      prev.map(m => m.id === movieId ? { ...m, watched: !m.watched } : m)
    );
  };

  const isInWatchlist = (movieId: number) => {
    return watchlist.some(m => m.id === movieId);
  };

  const setRating = (movieId: number, rating: number) => {
    setUserRatings(prev => ({ ...prev, [movieId]: rating }));
  };

  const getRating = (movieId: number) => {
    return userRatings[movieId] || null;
  };

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

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
