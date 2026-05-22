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
    backgroundColor: '#141414', // Samakan dengan warna background SplashScreen agar transisi seamless
  },
});
