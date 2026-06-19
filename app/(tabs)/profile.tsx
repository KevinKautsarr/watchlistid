import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

const ProfileScreenLazy = lazy(() => import('@/screens/ProfileScreen'));

export default function ProfileRoute() {
  return (
    <ScreenErrorBoundary screenName="Profil">
      <Suspense fallback={
        <View style={{ flex: 1, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#C71F37" size="large" />
        </View>
      }>
        <ProfileScreenLazy />
      </Suspense>
    </ScreenErrorBoundary>
  );
}
