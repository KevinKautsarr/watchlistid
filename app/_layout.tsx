import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text, View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SocialProvider } from '@/context/SocialContext';
import { LanguageProvider } from '@/context/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Global Polish: Enable font scaling but recommend max multipliers for layout-critical text
// Note: individual components will be updated to use maxFontSizeMultiplier where necessary

export const unstable_settings = {
  anchor: '(tabs)',
};

// ── Web-only SEO & Security head injection ────────────────────────────────────
function WebHead() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Title
    if (!document.title || document.title === '') {
      document.title = 'WatchlistID — Track Movies & TV Shows';
    }

    // Charset & viewport (idempotent)
    let charset = document.querySelector('meta[charset]');
    if (!charset) {
      charset = document.createElement('meta');
      charset.setAttribute('charset', 'utf-8');
      document.head.insertBefore(charset, document.head.firstChild);
    }

    // SEO basics
    setMeta('description', 'WatchlistID is your personal movie and TV show tracker. Discover trending films, build your watchlist, rate what you have watched, and follow friends.');
    setMeta('robots', 'index, follow');
    setMeta('theme-color', '#141414');
    setMeta('color-scheme', 'dark');

    // Open Graph
    setMeta('og:type', 'website', 'property');
    setMeta('og:title', 'WatchlistID — Track Movies & TV Shows', 'property');
    setMeta('og:description', 'Your personal movie and TV show tracker. Discover, rate and share.', 'property');
    setMeta('og:site_name', 'WatchlistID', 'property');

    // Twitter card
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', 'WatchlistID — Track Movies & TV Shows');
    setMeta('twitter:description', 'Your personal movie and TV show tracker.');

    // Security headers via meta (best-effort; full protection requires server headers)
    // Content-Security-Policy
    setMeta(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // RN web requires inline scripts
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://image.tmdb.org https://*.supabase.co https://*.ytimg.com https://*.googleusercontent.com",
        "connect-src 'self' https://api.themoviedb.org https://*.supabase.co wss://*.supabase.co",
        "media-src 'self' https://www.youtube.com",
        "frame-src https://www.youtube.com",
        "object-src 'none'",
        "base-uri 'self'",
      ].join('; '),
      'http-equiv'
    );

    // X-Frame-Options (clickjacking protection)
    setMeta('X-Frame-Options', 'SAMEORIGIN', 'http-equiv');

    // Cross-Origin-Opener-Policy
    setMeta('Cross-Origin-Opener-Policy', 'same-origin-allow-popups', 'http-equiv');

    // lang attribute on <html>
    document.documentElement.lang = 'en';
  }, []);

  return null;
}

function RootLayoutNav() {
  const { session, isLoading, profileError } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const PROTECTED_ROUTES = ['watchlist', 'profile', 'notifications', 'search-users'];

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    // Check if ANY part of the current route is in the protected list
    const isProtectedRoute = segments.some(s => PROTECTED_ROUTES.includes(s));

    if (!session && isProtectedRoute) {
      // Redirect to login only if trying to access protected routes while not logged in
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E50914" size="large" accessibilityLabel="Loading aplikasi" aria-label="Loading aplikasi" />
      </View>
    );
  }

  if (profileError) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="error" options={{ 
            title: 'Sistem Bermasalah',
            headerShown: true,
            headerStyle: { backgroundColor: '#141414' },
            headerTintColor: '#fff'
          }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    );
  }

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
      <WebHead />
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
