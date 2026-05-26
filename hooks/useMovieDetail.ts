import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getCriticalMovieDetails, 
  getCriticalTVDetails, 
  getSupplementaryMovieDetails, 
  getSupplementaryTVDetails 
} from '@/services/api';
import { useSocial } from '@/context/SocialContext';
import { FetchState, Movie, CastMember, Video } from '@/types';

export interface MovieDetailData {
  movie: Movie;
  credits: CastMember[];
  videos: Video[];
  reviews: any[];
  similar: Movie[];
  releaseDates: any[];
  keywords: any[];
  communityRating: { average: number; count: number };
}

// In-Memory Cache for complete movie/TV details
const detailCache: Record<string, { data: MovieDetailData; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DETAIL_STORAGE_PREFIX = '@movie_detail:';
const DETAIL_DISK_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function hydrateDetailCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const detailKeys = keys.filter(k => k.startsWith(DETAIL_STORAGE_PREFIX));
    if (detailKeys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(detailKeys);
    const now = Date.now();
    pairs.forEach(([key, value]) => {
      if (!value) return;
      try {
        const entry = JSON.parse(value);
        if (entry.timestamp + DETAIL_DISK_TTL > now) {
          const cacheKey = key.replace(DETAIL_STORAGE_PREFIX, '');
          detailCache[cacheKey] = entry;
        } else {
          AsyncStorage.removeItem(key).catch(() => {});
        }
      } catch {}
    });
  } catch (e) {
    console.warn('[useMovieDetail] Failed to hydrate detail cache', e);
  }
}

hydrateDetailCache();

export const useMovieDetail = (actualId: number, type: 'movie' | 'tv') => {
  const { getAverageRating } = useSocial();
  
  const [state, setState] = useState<FetchState<MovieDetailData>>({
    status: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    if (!actualId || isNaN(actualId)) {
      setState({ status: 'loading', data: null, error: null });
      return;
    }

    const cacheKey = `${type}-${actualId}`;
    
    // Check in-memory cache first for instant load
    if (detailCache[cacheKey]) {
      const cachedEntry = detailCache[cacheKey];
      if (Date.now() - cachedEntry.timestamp < CACHE_TTL) {
        setState({
          status: 'success',
          data: cachedEntry.data,
          error: null
        });
        return;
      }
    }

    // Reset state to loading when actualId changes and there is no cache
    setState({ status: 'loading', data: null, error: null });

    let isMounted = true;

    const fetchAllData = async () => {
      try {
        // Run all network requests in parallel
        const criticalPromise = type === 'movie' 
          ? getCriticalMovieDetails(actualId)
          : getCriticalTVDetails(actualId);

        const supplementaryPromise = type === 'movie'
          ? getSupplementaryMovieDetails(actualId)
          : getSupplementaryTVDetails(actualId);

        const ratingPromise = getAverageRating(actualId);

        const [critical, supplementary, communityRating] = await Promise.all([
          criticalPromise,
          supplementaryPromise,
          ratingPromise
        ]);

        let finalCritical = critical;
        let finalSupplementary = supplementary;
        let finalType = type;

        // Auto-detect media type mismatch fallback!
        // If content details are not found with the requested type, try the other type.
        if (!finalCritical.details) {
          const fallbackType = type === 'movie' ? 'tv' : 'movie';
          const fallbackCritical = fallbackType === 'movie' 
            ? await getCriticalMovieDetails(actualId)
            : await getCriticalTVDetails(actualId);

          if (fallbackCritical.details) {
            finalCritical = fallbackCritical;
            finalType = fallbackType;
            finalSupplementary = fallbackType === 'movie'
              ? await getSupplementaryMovieDetails(actualId)
              : await getSupplementaryTVDetails(actualId);
          }
        }

        if (!finalCritical.details) {
          throw new Error('Content details not found');
        }

        const mergedData: MovieDetailData = {
          movie: {
            ...finalCritical.details,
            media_type: finalType // Force correct type mapping in UI
          },
          credits: finalCritical.credits?.cast?.slice(0, 15) || [],
          videos: finalSupplementary.videos?.results?.filter((v: any) => v.site === 'YouTube') || [],
          reviews: finalSupplementary.reviews?.results?.slice(0, 2) || [],
          similar: finalSupplementary.similar?.results?.slice(0, 10) || [],
          releaseDates: finalSupplementary.releaseDates?.results || [],
          keywords: finalSupplementary.keywords?.keywords?.slice(0, 10) || [],
          communityRating: communityRating
        };

        // Cache the fully merged details for both the requested key and the final detected key
        const finalCacheKey = `${finalType}-${actualId}`;
        const cacheEntry = { data: mergedData, timestamp: Date.now() };
        detailCache[cacheKey] = cacheEntry;
        if (finalCacheKey !== cacheKey) {
          detailCache[finalCacheKey] = cacheEntry;
        }
        AsyncStorage.setItem(DETAIL_STORAGE_PREFIX + cacheKey, JSON.stringify(cacheEntry)).catch(() => {});
        if (finalCacheKey !== cacheKey) {
          AsyncStorage.setItem(DETAIL_STORAGE_PREFIX + finalCacheKey, JSON.stringify(cacheEntry)).catch(() => {});
        }

        if (isMounted) {
          setState({
            status: 'success',
            data: mergedData,
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [actualId, type, getAverageRating]);

  return state;
};

export async function clearDetailCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const detailKeys = keys.filter(k => k.startsWith(DETAIL_STORAGE_PREFIX));
    if (detailKeys.length > 0) await AsyncStorage.multiRemove(detailKeys);
    Object.keys(detailCache).forEach(k => delete detailCache[k]);
  } catch (e) {
    console.warn('[useMovieDetail] Failed to clear detail cache', e);
  }
}
