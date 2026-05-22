import React from 'react';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';
import MovieDetailScreen from '@/screens/MovieDetailScreen';

export default function MovieDetailRoute() {
  return (
    <ScreenErrorBoundary screenName="Detail Film">
      <MovieDetailScreen />
    </ScreenErrorBoundary>
  );
}
