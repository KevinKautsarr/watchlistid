import { useState, useCallback } from 'react';
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
  const { data: trendingData,   isLoading: lt,   refetch: rt   } = useTrending();
  const { data: popularData,    isLoading: lp,   refetch: rp   } = usePopular();
  const { data: topRatedData,   isLoading: ltr,  refetch: rtr  } = useTopRated();
  const { data: trendingTVData, isLoading: ltv,  refetch: rtv  } = useTrendingTV();
  const { data: topRatedTVData, isLoading: lrtv, refetch: rrtv } = useTopRatedTV();

  const trending   = ((trendingData   as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);
  const popular    = ((popularData    as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);
  const topRated   = ((topRatedData   as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);
  const trendingTV = ((trendingTVData as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);
  const topRatedTV = ((topRatedTVData as unknown as MediaItem[] | null) ?? []).filter(m => !('adult' in m) || !m.adult);

  const isLoading = lt || lp || ltr || ltv || lrtv;
  
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
    error: null
  };

  return { state, isRefreshing, onRefresh };
};
