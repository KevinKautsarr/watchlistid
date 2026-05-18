import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

const MovieDetailScreenLazy = lazy(() => import('@/screens/MovieDetailScreen'));

export default function MovieDetailRoute() {
  return (
    <ScreenErrorBoundary screenName="Detail Film">
      <Suspense fallback={
        <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#E50914" size="large" />
        </View>
      }>
        <MovieDetailScreenLazy />
      </Suspense>
    </ScreenErrorBoundary>
  );
}
