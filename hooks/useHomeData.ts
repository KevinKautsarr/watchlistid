import { useState, useCallback, useEffect } from 'react';
import { useTrending, usePopular, useTopRated, useTrendingTV, useTopRatedTV } from '@/hooks/useMovies';
import { MediaItem, FetchState } from '@/types';

export interface HomeData {
  trending: MediaItem[];
  popular: MediaItem[];
  topRated: MediaItem[];
  trendingTV: MediaItem[];
  topRatedTV: MediaItem[];
}

export const useHomeData = () => {
  // Phase 1 — critical: fetch immediately (needed for HeroCarousel)
  const { data: trendingData,   isLoading: lt,   refetch: rt   } = useTrending();

  // Phase 2 — deferred: hooks always fetch, but we mask their data for 800ms
  const { data: popularData,    isLoading: lp,   refetch: rp   } = usePopular();
  const { data: topRatedData,   isLoading: ltr,  refetch: rtr  } = useTopRated();
  const { data: trendingTVData, isLoading: ltv,  refetch: rtv  } = useTrendingTV();
  const { data: topRatedTVData, isLoading: lrtv, refetch: rrtv } = useTopRatedTV();

  // deferredEnabled gates whether deferred data is surfaced to the UI
  const [deferredEnabled, setDeferredEnabled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDeferredEnabled(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const filter = (data: any): MediaItem[] =>
    ((data as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);

  const trending   = filter(trendingData);
  const popular    = deferredEnabled ? filter(popularData)    : [];
  const topRated   = deferredEnabled ? filter(topRatedData)   : [];
  const trendingTV = deferredEnabled ? filter(trendingTVData) : [];
  const topRatedTV = deferredEnabled ? filter(topRatedTVData) : [];

  // isLoading only blocks on phase-1 (trending); deferred has its own flag
  const isLoading = lt;
  const isDeferredLoading = deferredEnabled && (lp || ltr || ltv || lrtv);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([rt(), rp(), rtr(), rtv(), rrtv()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [rt, rp, rtr, rtv, rrtv]);

  const state: FetchState<HomeData> = {
    status: isLoading ? 'loading' : 'success',
    data: { trending, popular, topRated, trendingTV, topRatedTV },
    error: null,
  };

  return { state, isRefreshing, onRefresh, isDeferredLoading, deferredEnabled };
};
