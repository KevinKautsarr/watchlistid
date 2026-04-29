import React, { useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import { Stack, Redirect } from 'expo-router';

export default function AppEntry() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <SplashScreen />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F7F7', // Match the app background
  },
});
