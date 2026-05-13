import { useLocalSearchParams, useNavigation } from 'expo-router';
import MovieDetailScreen from '@/screens/MovieDetailScreen';
import React from 'react';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

export default function MovieDetailRoute() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  // Extract ID from segment 'id' or query param 'movieId'
  const movieId = params.id || params.movieId;
  const movieTitle = params.title || params.movieTitle;

  const route = {
    params: {
      movieId,
      movieTitle,
      type: params.type || 'movie',
    }
  };

  return (
    <ScreenErrorBoundary screenName="Detail Film">
      <MovieDetailScreen />
    </ScreenErrorBoundary>
  );
}
