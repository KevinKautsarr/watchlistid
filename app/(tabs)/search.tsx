import React from 'react';
import SearchScreen from '@/screens/SearchScreen';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

// Import the screen directly. expo-router (asyncRoutes) already code-splits this
// route, so an extra React.lazy() boundary only adds a second async chunk —
// which is what produced the cross-chunk "useSearchQuery is not a function"
// skew after a redeploy.
export default function SearchRoute() {
  return (
    <ScreenErrorBoundary screenNameKey="screenNameSearch">
      <SearchScreen />
    </ScreenErrorBoundary>
  );
}
