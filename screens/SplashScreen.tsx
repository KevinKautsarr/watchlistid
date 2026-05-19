import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Film } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { nativeDriver } from '@/utils/animation';
import { boxShadow } from '@/utils/webStyles';

const SplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        ...nativeDriver,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 20,
        ...nativeDriver,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7E050B', '#141414', '#141414']} style={StyleSheet.absoluteFill} />
      
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Film size={64} color={Colors.primary} strokeWidth={1.5} style={styles.icon} />
        
        <Text style={styles.appName} allowFontScaling={false}>
          WATCHLISTID
        </Text>
        
        <Text style={styles.tagline} allowFontScaling={false}>
          Your personal movie universe
        </Text>
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: -40, // Visually center it better
  },
  icon: {
    marginBottom: Spacing.lg,
    ...boxShadow(Colors.primary, 0, 4, 12, 0.4, 8),
  },
  appName: {
    fontSize: 42,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  appAccent: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  loader: {
    transform: [{ scale: 1.1 }],
  },
});

export default SplashScreen;

