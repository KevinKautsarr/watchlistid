import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '../context/AuthContext';
import { WatchlistProvider } from '../context/WatchlistContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Global Polish: Prevent font scaling
if (Text.defaultProps) {
  Text.defaultProps.allowFontScaling = false;
} else {
  Text.defaultProps = { allowFontScaling: false };
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <WatchlistProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="movie/[id]" />
              <Stack.Screen name="person/[id]" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style="dark" backgroundColor="#F9F7F7" />
          </ThemeProvider>
        </WatchlistProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
