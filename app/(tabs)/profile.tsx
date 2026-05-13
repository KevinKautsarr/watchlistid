import ProfileScreen from '../../screens/ProfileScreen';
import React from 'react';
import ScreenErrorBoundary from '../../components/common/ScreenErrorBoundary';

export default function ProfileRoute() {
  return (
    <ScreenErrorBoundary screenName="Profil">
      <ProfileScreen />
    </ScreenErrorBoundary>
  );
}
