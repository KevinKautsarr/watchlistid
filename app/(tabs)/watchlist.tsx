import WatchlistScreen from '@/screens/WatchlistScreen';
import React from 'react';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

export default function WatchlistRoute() {
  return (
    <ScreenErrorBoundary screenNameKey="screenNameWatchlist">
      <WatchlistScreen />
    </ScreenErrorBoundary>
  );
}
