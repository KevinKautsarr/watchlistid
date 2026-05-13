import { useState, useEffect } from 'react';
import { useContentDetails } from '@/hooks/useMovies';
import { getSupplementaryMovieDetails, getSupplementaryTVDetails } from '@/services/api';
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

export const useMovieDetail = (actualId: number, type: 'movie' | 'tv') => {
  const { data: baseData, isLoading: isBaseLoading, error: baseError } = useContentDetails(actualId, type);
  const { getAverageRating } = useSocial();
  
  const [state, setState] = useState<FetchState<MovieDetailData>>({
    status: 'loading',
    data: null,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      if (!actualId || !baseData?.details) return;

      try {
        const supp = type === 'movie' 
          ? await getSupplementaryMovieDetails(actualId)
          : await getSupplementaryTVDetails(actualId);

        const communityScore = await getAverageRating(actualId);

        if (isMounted) {
          setState({
            status: 'success',
            data: {
              movie: baseData.details,
              credits: baseData.credits?.cast?.slice(0, 15) || [],
              videos: supp?.videos?.results?.filter((v: any) => v.site === 'YouTube') || [],
              reviews: supp?.reviews?.results?.slice(0, 2) || [],
              similar: supp?.similar?.results?.slice(0, 10) || [],
              releaseDates: supp?.releaseDates?.results || [],
              keywords: supp?.keywords?.keywords?.slice(0, 10) || [],
              communityRating: communityScore
            },
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            status: 'error',
            data: null,
            error: (err as Error).message
          });
        }
      }
    };

    if (!isBaseLoading) {
      if (baseError) {
        setState({ status: 'error', data: null, error: typeof baseError === 'string' ? baseError : (baseError as Error).message || String(baseError) });
      } else if (baseData?.details) {
        fetchAllData();
      }
    }

    return () => { isMounted = false; };
  }, [actualId, type, baseData, isBaseLoading, baseError, getAverageRating]);

  return state;
};
