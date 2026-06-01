import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const GlassHeaderBackground = () => {
  if (Platform.OS === 'web') {
    return (
      <View 
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(10, 10, 11, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.05)'
          } as any
        ]} 
      />
    );
  }
  return (
    <BlurView 
      intensity={80} 
      tint="dark" 
      style={[
        StyleSheet.absoluteFill,
        {
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.05)'
        }
      ]} 
    />
  );
};

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SocialProvider } from '@/context/SocialContext';
import { LanguageProvider } from '@/context/LanguageContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import OfflineGuard from '@/components/common/OfflineGuard';

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
    setMeta('theme-color', '#641220');
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



    // lang attribute on <html>
    document.documentElement.lang = 'en';

    // Unregister any stale Service Workers that may cause cache loops
    // in normal browsers. Incognito always starts fresh, which is why
    // the app worked there but not in normal mode.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.unregister();
        });
      }).catch((_err) => { /* SW unregister failed — non-critical */ });
    }

    // Clear Cache Storage to remove any stale cached responses
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(name => {
          caches.delete(name);
        });
      }).catch((_err) => { /* Cache clear failed — non-critical */ });
    }
  }, []);

  return null;
}

// Routes that require authentication — defined at module level so they're stable
const PROTECTED_ROUTES: string[] = ['watchlist', 'profile', 'notifications', 'search-users'];

function RootLayoutNav() {
  const { session, isLoading, profileError } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isResetPassword = (segments[1] as string) === 'reset-password';
    
    // Check if ANY part of the current route is in the protected list
    const isProtectedRoute = segments.some(s => PROTECTED_ROUTES.includes(s));

    if (!session && isProtectedRoute) {
      // Redirect to login only if trying to access protected routes while not logged in
      router.replace('/auth/login');
    } else if (session && inAuthGroup && !isResetPassword) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [session, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' }}>
        {/* LCP candidate: text is immediately visible so Lighthouse can measure it */}
        <Text
          style={{ color: '#E50914', fontSize: 28, fontWeight: '900', letterSpacing: 3, marginBottom: 24 }}
          allowFontScaling={false}
        >
          WATCHLISTID
        </Text>
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
        <Stack.Screen name="user/[userId]" options={{ 
          headerShown: true,
          headerTransparent: true,
          title: 'Profile',
          headerTintColor: '#F5F0F1',
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#F5F0F1',
          },
          headerBackground: () => <GlassHeaderBackground />,
          headerStyle: { backgroundColor: 'transparent' }
        }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <OfflineGuard />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <WebHead />
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <SocialProvider>
                <WatchlistProvider>
                  <RootLayoutNav />
                </WatchlistProvider>
              </SocialProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
