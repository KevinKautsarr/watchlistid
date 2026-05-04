import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { WatchlistProvider } from '../context/WatchlistContext';
import { NotificationProvider } from '../context/NotificationContext';
import { SocialProvider } from '../context/SocialContext';
import { LanguageProvider } from '../context/LanguageContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Global Polish: Prevent font scaling
if ((Text as any).defaultProps) {
  (Text as any).defaultProps.allowFontScaling = false;
} else {
  (Text as any).defaultProps = { allowFontScaling: false };
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const segment0 = segments[0] as string;
    const segment1 = segments[1] as string;
    const isPublicTab = segment1 === 'index' || segment1 === 'search' || segment0 === 'index';
    const isDetailScreen = segment0 === 'movie/[id]' || segment0 === 'person/[id]';
    
    // Protected tabs (Watchlist & Profile)
    const isProtectedRoute = segments[1] === 'watchlist' || segments[1] === 'profile';

    if (!session && isProtectedRoute) {
      // Redirect to login only if trying to access protected routes while not logged in
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="movie/[id]" />
        <Stack.Screen name="person/[id]" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <SocialProvider>
              <WatchlistProvider>
                <RootLayoutNav />
              </WatchlistProvider>
            </SocialProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
