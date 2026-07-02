import HomeScreen from '@/screens/HomeScreen';
import React from 'react';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

export default function HomeRoute() {
  return (
    <ScreenErrorBoundary screenNameKey="screenNameHome">
      <HomeScreen />
    </ScreenErrorBoundary>
  );
}
