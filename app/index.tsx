import React, { useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import SplashScreen from '@/screens/SplashScreen';
import { Stack, Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useAuth } from '@/context/AuthContext';
import { nativeDriver } from '@/utils/animation';

export default function AppEntry() {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue:         0,
        duration:        800,
        ...nativeDriver,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2500);

    return () => clearTimeout(timer);
  // fadeAnim is a stable Animated.Value ref — intentionally excluded from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Still loading auth state or showing splash — wait
  if (isLoading || showSplash) {
    return (
      <View style={styles.container}>
        <Head>
          <title>WatchlistID — Track, Rate, and Discover Movies &amp; TV Shows</title>
        </Head>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <SplashScreen />
        </Animated.View>
      </View>
    );
  }

  // After splash: landing on tabs
  // (RootLayout will handle protecting specific tabs)
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: '#F9F7F7',
  },
});
