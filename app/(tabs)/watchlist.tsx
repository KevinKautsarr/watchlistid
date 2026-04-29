import WatchlistScreen from '../../screens/WatchlistScreen';
import { useNavigation } from 'expo-router';
import React from 'react';

export default function WatchlistRoute() {
  const navigation = useNavigation();
  return <WatchlistScreen navigation={navigation} />;
}
