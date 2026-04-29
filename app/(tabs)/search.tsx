import SearchScreen from '../../screens/SearchScreen';
import { useNavigation } from 'expo-router';
import React from 'react';

export default function SearchRoute() {
  const navigation = useNavigation();
  return <SearchScreen navigation={navigation} />;
}
