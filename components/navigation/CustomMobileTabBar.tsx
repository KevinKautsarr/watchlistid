import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions, Animated, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Home, Compass, Bookmark, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const PILL_HEIGHT = 60;
const CIRCLE_SIZE = 48;
const SVG_WIDTH = 2000;
const DIP_CENTER = 1000;

const ACTIVE_TINT = '#E50914'; // Netflix Red
const BAR_BG = '#141414';      // Dark background
const INACTIVE_TINT = '#808080'; // Grey for inactive icons

export default function CustomMobileTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const containerMargin = 24;
  const containerWidth = width - containerMargin * 2;
  const tabWidth = containerWidth / state.routes.length;
  
  const activeIndex = state.index;
  const animatedValue = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [activeIndex]);

  const svgTranslateX = animatedValue.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => ((i + 0.5) * tabWidth) - DIP_CENTER),
  });

  const circleTranslateX = animatedValue.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => ((i + 0.5) * tabWidth) - (CIRCLE_SIZE / 2)),
  });

  // Calculate scaling for the active icon inside the circle
  const iconScale = animatedValue.interpolate({
    inputRange: [activeIndex - 1, activeIndex, activeIndex + 1],
    outputRange: [0.3, 1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.shadowWrapper}>
        
        {/* Background pill with SVG cutout */}
        <View style={styles.svgClipper}>
          <AnimatedSvg
            width={SVG_WIDTH}
            height={PILL_HEIGHT}
            style={{ transform: [{ translateX: svgTranslateX }] }}
          >
            {/* 
              Dip logic: 
              Dip width ~90. Center is 1000. 
              Starts at 955, ends at 1045. Depth 38.
            */}
            <Path
              d={`
                M 0 0 
                L 955 0 
                C 972 0, 975 38, 1000 38 
                C 1025 38, 1028 0, 1045 0 
                L ${SVG_WIDTH} 0 
                L ${SVG_WIDTH} ${PILL_HEIGHT} 
                L 0 ${PILL_HEIGHT} 
                Z
              `}
              fill={BAR_BG}
            />
          </AnimatedSvg>
        </View>

        {/* The floating green circle */}
        <Animated.View style={[styles.floatingCircle, { transform: [{ translateX: circleTranslateX }] }]}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              if (!isFocused) return null;
              
              let IconComponent = Home;
              if (route.name === 'search') IconComponent = Compass;
              if (route.name === 'watchlist') IconComponent = Bookmark;
              if (route.name === 'profile') IconComponent = User;

              return (
                <IconComponent key={route.key} size={22} color="#FFFFFF" strokeWidth={2.5} />
              );
            })}
          </Animated.View>
        </Animated.View>

        {/* Invisible clickable layer & Inactive Icons */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            };

            let IconComponent = Home;
            if (route.name === 'search') IconComponent = Compass;
            if (route.name === 'watchlist') IconComponent = Bookmark;
            if (route.name === 'profile') IconComponent = User;

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={1}
                onPress={onPress}
                style={styles.tabButton}
              >
                {!isFocused && (
                  <IconComponent size={24} color={INACTIVE_TINT} strokeWidth={1.5} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 100,
  },
  shadowWrapper: {
    height: PILL_HEIGHT,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  svgClipper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  floatingCircle: {
    position: 'absolute',
    top: -16, // Float above the bar
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: ACTIVE_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACTIVE_TINT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  tabsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  tabButton: {
    flex: 1,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
