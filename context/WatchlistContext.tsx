import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, typedFrom } from '../supabase';
import { Movie, TVShow, MediaItem } from '@/types/tmdb';
import { WatchlistMap, WatchlistItem, WATCHLIST_STATUS, StorageSchema } from '@/types/watchlist';
import Toast from '@/components/common/Toast';
import { useLanguage } from '@/context/LanguageContext';

// ── Supabase helpers ───────────────────────────────────────────────────────
function toSupabaseRow(item: WatchlistItem, userId: string) {
  return {
    user_id:      userId,
    movie_id:     item.id,
    media_type:   item.mediaType,
    title:        (item.mediaType === 'movie' ? item.title : item.name) || 'Title',
    poster_path:  item.poster_path,
    release_date: (item.mediaType === 'movie' ? item.release_date : item.first_air_date) || '',
    vote_average: item.vote_average,
    runtime:      (item.mediaType === 'movie' ? item.runtime : null) ?? null,
    genres:       (item.genres as any) ?? null, // Genres as Json
    overview:     item.overview,
    watched:      item.status === WATCHLIST_STATUS.COMPLETED,
    added_at:     item.addedAt,
  };
}

function fromSupabaseRow(row: any): WatchlistItem {
  const isMovie = row.media_type === 'movie' || !row.media_type;
  
  let status = row.status;
  if (!status) {
    status = row.watched ? WATCHLIST_STATUS.COMPLETED : WATCHLIST_STATUS.PLAN_TO_WATCH;
  }

  const base = {
    id:            row.movie_id,
    overview:      row.overview ?? '',
    poster_path:   row.poster_path ?? null,
    backdrop_path: null,
    vote_average:  row.vote_average ?? 0,
    vote_count:    0,
    genres:        row.genres ?? undefined,
    addedAt:       row.added_at,
    status:        status,
  };

  if (isMovie) {
    return {
      ...base,
      mediaType: 'movie',
      title: row.title,
      release_date: row.release_date ?? '',
      runtime: row.runtime ?? undefined,
    } as WatchlistItem;
  } else {
    return {
      ...base,
      mediaType: 'tv',
      name: row.title,
      first_air_date: row.release_date ?? '',
    } as WatchlistItem;
  }
}

// ── Provider Logic Hook ────────────────────────────────────────────────────
function useWatchlistProviderLogic() {
  const { t } = useLanguage();
  const [watchlistMap,   setWatchlistMap]   = useState<WatchlistMap>({});
  const [userRatings,    setUserRatings]    = useState<Record<number, number>>({});
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [userLogsMap,    setUserLogsMap]    = useState<Record<number, boolean>>({});
  const [userReviewsMap, setUserReviewsMap] = useState<Record<number, boolean>>({});
  const [isLoaded,       setIsLoaded]       = useState(false);
  const [isSyncing,      setIsSyncing]      = useState(false);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [isHydrated,     setIsHydrated]     = useState(false);
  const [isAuthReady,    setIsAuthReady]    = useState(false);

  const [watchedEpisodesMap, setWatchedEpisodesMap] = useState<Record<number, Record<number, number[]>>>({});

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' }>({
    visible: false, message: '', type: 'success',
  });

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setIsAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setIsAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedWatchlist, storedRatings, storedHistory] = await Promise.all([
          AsyncStorage.getItem('@watchlist'),
          AsyncStorage.getItem('@userRatings'),
          AsyncStorage.getItem('@recentlyViewed'),
        ]);

        if (storedWatchlist) {
          const parsed = JSON.parse(storedWatchlist);
          if (Array.isArray(parsed)) {
            // Migration Logic: Array -> Record
            const migratedMap: WatchlistMap = {};
            parsed.forEach((item: any) => {
              const status = item.watched ? WATCHLIST_STATUS.COMPLETED : WATCHLIST_STATUS.PLAN_TO_WATCH;
              const isMovie = item.media_type === 'movie' || !item.media_type;
              
              if (isMovie) {
                migratedMap[item.id] = {
                  ...item,
                  mediaType: 'movie',
                  status,
                  title: item.title,
                  release_date: item.release_date ?? '',
                };
              } else {
                migratedMap[item.id] = {
                  ...item,
                  mediaType: 'tv',
                  status,
                  name: item.title || item.name,
                  first_air_date: item.release_date || item.first_air_date || '',
                };
              }
            });
            setWatchlistMap(migratedMap);
          } else {
            setWatchlistMap(parsed as WatchlistMap);
          }
        }

        if (storedRatings) {
          const parsed = JSON.parse(storedRatings);
          const sanitized: Record<number, number> = {};
          Object.keys(parsed).forEach(k => {
            sanitized[Number(k)] = parsed[k];
          });
          setUserRatings(sanitized);
        }
        
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          if (Array.isArray(parsed)) {
            setRecentlyViewed(parsed.map(Number).filter(n => !isNaN(n)));
          }
        }
      } catch (e) {
        console.error('Failed to load local data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Sync from Cloud
  useEffect(() => {
    if (!userId || !isLoaded) return;
    const syncFromCloud = async () => {
      setIsSyncing(true);
      try {
        const { data: cloudRows } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', userId)
          .order('added_at', { ascending: true });

        if (cloudRows) {
          const newMap: WatchlistMap = {};
          cloudRows.forEach(row => {
            const item = fromSupabaseRow(row);
            newMap[item.id] = item;
          });
          setWatchlistMap(newMap);
          AsyncStorage.setItem('@watchlist', JSON.stringify(newMap)).catch(console.error);
        }

        const { data: ratingRows } = await typedFrom('user_ratings').select('movie_id, rating').eq('user_id', userId);
        if (ratingRows) {
          const ratings: Record<number, number> = {};
          ratingRows.forEach(r => { ratings[r.movie_id] = r.rating; });
          setUserRatings(ratings);
          AsyncStorage.setItem('@userRatings', JSON.stringify(ratings)).catch(console.error);
        }

        // Fetch user logs to populate status helper
        const { data: logRows } = await typedFrom('movie_logs').select('movie_id').eq('user_id', userId);
        if (logRows) {
          const logs: Record<number, boolean> = {};
          logRows.forEach(l => { logs[l.movie_id] = true; });
          setUserLogsMap(logs);
        }

        // Fetch user reviews to populate status helper
        const { data: reviewRows } = await typedFrom('reviews').select('movie_id').eq('user_id', userId);
        if (reviewRows) {
          const revs: Record<number, boolean> = {};
          reviewRows.forEach(r => { revs[r.movie_id] = true; });
          setUserReviewsMap(revs);
        }
      } catch (e) {
        console.error('Cloud sync error:', e);
      } finally {
        setIsSyncing(false);
        setIsHydrated(true);
      }
    };
    syncFromCloud();
  }, [userId, isLoaded]);

  // Guest users hydration check
  useEffect(() => {
    if (isAuthReady && isLoaded && userId === null) {
      setIsHydrated(true);
    }
  }, [isAuthReady, isLoaded, userId]);

  // Persist to AsyncStorage
  useEffect(() => { if (isLoaded) AsyncStorage.setItem('@watchlist', JSON.stringify(watchlistMap)).catch(console.error); }, [watchlistMap, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem('@userRatings', JSON.stringify(userRatings)).catch(console.error); }, [userRatings, isLoaded]);
  useEffect(() => { if (isLoaded) AsyncStorage.setItem('@recentlyViewed', JSON.stringify(recentlyViewed)).catch(console.error); }, [recentlyViewed, isLoaded]);

  // Mutations
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => setToast({ visible: true, message, type }), []);
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  const addToWatchlist = useCallback((item: MediaItem) => {
    if (!userId) return;
    if (watchlistMap[item.id]) return; // already present — no-op

    const meta = {
      addedAt: new Date().toISOString(),
      status: item.status || WATCHLIST_STATUS.PLAN_TO_WATCH,
    };
    const newItem: WatchlistItem = item.media_type === 'movie'
      ? ({ ...item, mediaType: 'movie', ...meta } as WatchlistItem)
      : ({ ...item, mediaType: 'tv', ...meta } as WatchlistItem);

    // Keep the state updater pure; run side effects (network + toast) outside it.
    setWatchlistMap(prev => (prev[item.id] ? prev : { ...prev, [item.id]: newItem }));
    typedFrom('watchlist').upsert(toSupabaseRow(newItem, userId)).then(({ error }) => error && console.error(error));
    showToast(t('toastAddedToWatchlist'), 'success');
  }, [userId, watchlistMap, showToast, t]);

  const removeFromWatchlist = useCallback((id: number) => {
    if (!userId) return;
    setWatchlistMap(prev => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    showToast(t('toastRemovedFromWatchlist'), 'info');
    typedFrom('watchlist').delete().eq('user_id', userId).eq('movie_id', id).then(({ error }) => error && console.error(error));
  }, [userId, showToast, t]);

  const toggleWatched = useCallback((id: number) => {
    if (!userId) return;
    const item = watchlistMap[id];
    if (!item) return;

    const newStatus = item.status === WATCHLIST_STATUS.COMPLETED ? WATCHLIST_STATUS.PLAN_TO_WATCH : WATCHLIST_STATUS.COMPLETED;

    // Pure updater; network call runs outside it.
    setWatchlistMap(prev => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, status: newStatus } as WatchlistItem };
    });
    typedFrom('watchlist')
      .update({ watched: newStatus === WATCHLIST_STATUS.COMPLETED })
      .eq('user_id', userId)
      .eq('movie_id', id)
      .then(({ error }) => error && console.error(error));
  }, [userId, watchlistMap]);

  const isInWatchlist = useCallback((id: number) => !!watchlistMap[id], [watchlistMap]);

  const setRating = useCallback((id: number, rating: number) => {
    setUserRatings(prev => ({ ...prev, [id]: rating }));
      if (userId) typedFrom('user_ratings').upsert({ user_id: userId, movie_id: id, rating }).then(({ error }) => error && console.error(error));
  }, [userId]);

  const getRating = useCallback((id: number) => userRatings[id] || null, [userRatings]);

  const addToRecentlyViewed = useCallback((id: number) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(vid => vid !== id);
      return [id, ...filtered].slice(0, 10);
    });
  }, []);

  const fetchWatchedEpisodes = useCallback(async (tvShowId: number) => {
    if (!userId) return {};
    try {
      const { data, error } = await supabase
        .from('tv_episode_logs')
        .select('season_number, episode_number')
        .eq('user_id', userId)
        .eq('tv_show_id', tvShowId);
      
      if (error) throw error;
      
      const episodes: Record<number, number[]> = {};
      data?.forEach(row => {
        const s = row.season_number;
        const e = row.episode_number;
        if (!episodes[s]) episodes[s] = [];
        episodes[s].push(e);
      });
      
      setWatchedEpisodesMap(prev => ({
        ...prev,
        [tvShowId]: episodes
      }));
      return episodes;
    } catch (e) {
      console.error('Failed to fetch watched episodes', e);
      return {};
    }
  }, [userId]);

  const toggleEpisodeWatch = useCallback(async (tvShowId: number, seasonNumber: number, episodeNumber: number) => {
    if (!userId) return false;
    
    const currentTv = watchedEpisodesMap[tvShowId] || {};
    const currentSeason = currentTv[seasonNumber] || [];
    const isWatched = currentSeason.includes(episodeNumber);
    
    try {
      if (isWatched) {
        const { error } = await supabase
          .from('tv_episode_logs')
          .delete()
          .eq('user_id', userId)
          .eq('tv_show_id', tvShowId)
          .eq('season_number', seasonNumber)
          .eq('episode_number', episodeNumber);
          
        if (error) throw error;
        
        setWatchedEpisodesMap(prev => {
          const tv = prev[tvShowId] || {};
          const season = tv[seasonNumber] || [];
          return {
            ...prev,
            [tvShowId]: {
              ...tv,
              [seasonNumber]: season.filter(e => e !== episodeNumber)
            }
          };
        });
        return false;
      } else {
        const { error } = await supabase
          .from('tv_episode_logs')
          .insert({
            user_id: userId,
            tv_show_id: tvShowId,
            season_number: seasonNumber,
            episode_number: episodeNumber
          });
          
        if (error) throw error;
        
        setWatchedEpisodesMap(prev => {
          const tv = prev[tvShowId] || {};
          const season = tv[seasonNumber] || [];
          return {
            ...prev,
            [tvShowId]: {
              ...tv,
              [seasonNumber]: [...season, episodeNumber]
            }
          };
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to toggle episode watch', e);
      return isWatched;
    }
  }, [userId, watchedEpisodesMap]);

  const isEpisodeWatched = useCallback((tvShowId: number, seasonNumber: number, episodeNumber: number) => {
    const tv = watchedEpisodesMap[tvShowId];
    if (!tv) return false;
    const season = tv[seasonNumber];
    if (!season) return false;
    return season.includes(episodeNumber);
  }, [watchedEpisodesMap]);

  const clearData = async () => {
    setWatchlistMap({});
    setUserRatings({});
    setRecentlyViewed([]);
    setUserLogsMap({});
    setUserReviewsMap({});
    setWatchedEpisodesMap({});
    try { await Promise.all([AsyncStorage.removeItem('@watchlist'), AsyncStorage.removeItem('@userRatings'), AsyncStorage.removeItem('@recentlyViewed')]); } catch (e) { console.error(e); }
  };

  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== null && !userId) clearData();
    prevUserIdRef.current = userId;
  }, [userId, isLoaded]);

  const getMovieStatus = useCallback((movieId: number): 'not_added' | 'plan_to_watch' | 'watched' | 'reviewed' => {
    if (userReviewsMap[movieId]) {
      return 'reviewed';
    }
    const item = watchlistMap[movieId];
    if (item) {
      if (item.status === WATCHLIST_STATUS.COMPLETED || userLogsMap[movieId]) {
        return 'watched';
      }
      return 'plan_to_watch';
    }
    if (userLogsMap[movieId]) {
      return 'watched';
    }
    return 'not_added';
  }, [watchlistMap, userLogsMap, userReviewsMap]);

  const registerMovieLog = useCallback((movieId: number) => {
    setUserLogsMap(prev => ({ ...prev, [movieId]: true }));
  }, []);

  const registerMovieReview = useCallback((movieId: number) => {
    setUserReviewsMap(prev => ({ ...prev, [movieId]: true }));
  }, []);

  const watchlistArray = useMemo(() => Object.values(watchlistMap), [watchlistMap]);

  return {
    watchlistMap,
    watchlist: watchlistArray,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    isInWatchlist,
    userRatings,
    setRating,
    getRating,
    recentlyViewed,
    addToRecentlyViewed,
    isLoading: isSyncing || !isLoaded,
    toast,
    hideToast,
    clearData,
    getMovieStatus,
    registerMovieLog,
    registerMovieReview,
    isHydrated,
    watchedEpisodesMap,
    fetchWatchedEpisodes,
    toggleEpisodeWatch,
    isEpisodeWatched,
  };
}

// ── Types & Context ────────────────────────────────────────────────────────
export type WatchlistContextType = Omit<ReturnType<typeof useWatchlistProviderLogic>, 'toast' | 'hideToast'>;
const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast, hideToast, ...contextValue } = useWatchlistProviderLogic();

  return (
    <WatchlistContext.Provider value={contextValue}>
      {children}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (context === undefined) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return context;
};
