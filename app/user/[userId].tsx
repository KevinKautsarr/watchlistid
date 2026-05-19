import React, { lazy, Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import ScreenErrorBoundary from '@/components/common/ScreenErrorBoundary';

import { useLocalSearchParams } from 'expo-router';

const ProfileScreenLazy = lazy(() => import('@/screens/ProfileScreen'));

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Runtime check for userId in the route component
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return (
      <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#E50914', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Profil Tidak Ditemukan</Text>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' }}>User ID tidak valid atau tidak disediakan dalam rute.</Text>
      </View>
    );
  }

  return (
    <ScreenErrorBoundary screenName="User Profile">
      <Suspense fallback={
        <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#E50914" size="large" />
        </View>
      }>
        <ProfileScreenLazy userId={userId} />
      </Suspense>
    </ScreenErrorBoundary>
  );
}
