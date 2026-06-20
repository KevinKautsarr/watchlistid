import React from 'react';
import ProfileScreen from '@/screens/ProfileScreen';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

// Import directly — expo-router already code-splits the route. A nested
// React.lazy() only adds a redundant chunk boundary prone to cross-chunk skew.
export default function ProfileRoute() {
  return (
    <ScreenErrorBoundary screenName="Profil">
      <ProfileScreen />
    </ScreenErrorBoundary>
  );
}
