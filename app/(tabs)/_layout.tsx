import React from 'react';
import { View, Text, Platform, useWindowDimensions, TouchableOpacity, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import CustomMobileTabBar from '@/components/navigation/CustomMobileTabBar';
import { Colors } from '@/constants/theme';
import { BlurView } from 'expo-blur';

const INACTIVE = Colors.overlay.light50;
const BAR_BG   = Colors.tabBarBackground;

const GlassHeaderBackground = () => {
  if (Platform.OS === 'web') {
    return (
      <View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            backgroundColor: 'rgba(10, 10, 11, 0.75)',
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

// ─── Root layout ─────────────────────────────────────────────────────────────
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;
  const isTablet  = width >= 768 && width < 1100;
  const isLarge   = !isMobile;
  const collapsed = isTablet; // tablet = icon-only sidebar

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Tabs
          tabBar={(props) => (isMobile ? <CustomMobileTabBar {...props} /> : null)}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index"     options={{ title: 'WatchlistID — Home' }} />
          <Tabs.Screen name="search"    options={{ 
            title: 'Search',
            headerShown: true,
            headerTransparent: true,
            headerTintColor: '#F5F0F1',
            headerTitleAlign: 'left',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '800',
              color: '#F5F0F1',
              letterSpacing: 0.5,
            },
            headerBackground: () => <GlassHeaderBackground />,
            headerStyle: { backgroundColor: 'transparent' }
          }} />
          <Tabs.Screen name="watchlist" options={{ 
            title: 'Watchlist',
            headerShown: true,
            headerTransparent: true,
            headerTintColor: '#F5F0F1',
            headerTitleAlign: 'left',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '800',
              color: '#F5F0F1',
              letterSpacing: 0.5,
            },
            headerBackground: () => <GlassHeaderBackground />,
            headerStyle: { backgroundColor: 'transparent' }
          }} />
          <Tabs.Screen name="profile"   options={{ 
            title: 'Profile',
            headerShown: true,
            headerTransparent: true,
            headerTintColor: '#F5F0F1',
            headerTitleAlign: 'left',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '800',
              color: '#F5F0F1',
              letterSpacing: 0.5,
            },
            headerBackground: () => <GlassHeaderBackground />,
            headerStyle: { backgroundColor: 'transparent' }
          }} />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#0A0A0B' },
  content: { flex: 1, overflow: 'hidden' },
});
