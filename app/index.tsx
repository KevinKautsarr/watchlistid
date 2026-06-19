import React, { useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import SplashScreen from '@/screens/SplashScreen';
import { Stack, Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useAuth } from '@/context/AuthContext';
import { nativeDriver } from '@/utils/animation';

export default function AppEntry() {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(Platform.OS !== 'web');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Sedikit dipercepat agar aplikasi terasa lebih responsif (snappy)
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Transisi fade-out dibuat lebih cepat (500ms dari sebelumnya 800ms)
        ...nativeDriver,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2000); 

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On web: skip both splash and auth-loading wait. _layout.tsx → RootLayoutNav
  // already guards protected routes and redirects to /auth/login when unauthenticated.
  // Jumping straight to the redirect lets the browser paint the actual LCP element
  // (the hero carousel / page content) as fast as possible.
  if (Platform.OS === 'web') {
    return <Redirect href="/(tabs)" />;
  }

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

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B', // Samakan dengan warna background SplashScreen agar transisi seamless
  },
});
