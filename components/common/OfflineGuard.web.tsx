/**
 * OfflineGuard — WEB platform implementation
 *
 * Uses browser-native navigator.onLine + window 'online'/'offline' events
 * instead of @react-native-community/netinfo (which uses NativeEventEmitter
 * and crashes in a browser environment).
 *
 * Metro automatically picks this file over OfflineGuard.tsx when bundling
 * for the 'web' platform.
 */
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Platform } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

export default function OfflineGuard() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const slideAnim = useRef(new Animated.Value(120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);

  const slideIn = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
        speed: 14,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const slideOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleGoOffline = () => {
    wasOfflineRef.current = true;
    setShowReconnected(false);
    setIsOffline(true);
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    slideIn();
  };

  const handleGoOnline = () => {
    if (!wasOfflineRef.current) return;
    wasOfflineRef.current = false;
    setShowReconnected(true);
    setIsOffline(false);
    slideIn();
    reconnectTimer.current = setTimeout(() => {
      slideOut(() => setShowReconnected(false));
    }, 2500);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('offline', handleGoOffline);
    window.addEventListener('online', handleGoOnline);

    return () => {
      window.removeEventListener('offline', handleGoOffline);
      window.removeEventListener('online', handleGoOnline);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        showReconnected ? styles.containerOnline : styles.containerOffline,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        {showReconnected ? (
          <Wifi size={18} color={Colors.white} strokeWidth={2.5} />
        ) : (
          <WifiOff size={18} color={Colors.white} strokeWidth={2.5} />
        )}
        <Text style={styles.text} maxFontSizeMultiplier={1.3}>
          {showReconnected ? 'Koneksi internet pulih' : 'Mode offline'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  } as any,
  containerOffline: {
    backgroundColor: Colors.primary,
  },
  containerOnline: {
    backgroundColor: Colors.success,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
  },
});
