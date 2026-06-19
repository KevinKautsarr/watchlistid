import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';

const SearchScreenLazy = lazy(() => import('@/screens/SearchScreen'));

export default function SearchRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#C71F37" size="large" />
      </View>
    }>
      <SearchScreenLazy />
    </Suspense>
  );
}
