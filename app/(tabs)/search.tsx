import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';

const SearchScreenLazy = lazy(() => import('@/screens/SearchScreen'));

export default function SearchRoute() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E50914" size="large" />
      </View>
    }>
      <SearchScreenLazy />
    </Suspense>
  );
}
