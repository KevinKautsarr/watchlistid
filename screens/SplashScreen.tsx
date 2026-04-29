import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Film } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../constants/theme';

const SplashScreen: React.FC = () => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 0.8,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: logoOpacity,
              transform: [{ scale: logoScale }] 
            }
          ]}
        >
          <Film size={48} color={Colors.primary} strokeWidth={1.5} />
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }] }}>
          <Text style={styles.appName} allowFontScaling={false}>WatchListID</Text>
          <View style={styles.divider} />
        </Animated.View>

        <Animated.Text 
          style={[styles.tagline, { opacity: taglineOpacity }]}
          allowFontScaling={false}
        >
          Your personal movie tracker
        </Animated.Text>
      </View>

      <Animated.View style={[styles.bottomContainer, { opacity: bottomOpacity }]}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.versionText} allowFontScaling={false}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(63, 114, 175, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(63, 114, 175, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.extrabold,
    color: Colors.background,
    letterSpacing: 3,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginVertical: 14,
    alignSelf: 'center',
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.surface,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(219, 226, 239, 0.3)',
  },
  activeDot: {
    backgroundColor: Colors.primary,
  },
  versionText: {
    fontSize: FontSize.xs,
    color: 'rgba(219, 226, 239, 0.4)',
    letterSpacing: 1,
  },
});

export default SplashScreen;
