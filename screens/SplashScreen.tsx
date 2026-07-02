import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
  Image,
} from 'react-native';
// Remove Film import on line 10 if not used elsewhere, let's keep others
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { nativeDriver } from '@/utils/animation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SplashScreen: React.FC = () => {
  const reducedMotion = useReducedMotion();

  // Nilai Animasi Terpisah untuk efek bertahap
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reduced motion: skip straight to the end state instead of animating.
    if (reducedMotion) {
      logoOpacity.setValue(1);
      logoTranslateY.setValue(0);
      textOpacity.setValue(1);
      taglineOpacity.setValue(1);
      loaderOpacity.setValue(1);
      return;
    }

    // Animasi sekuensial bergaya sinematik
    Animated.sequence([
      // 1. Ikon muncul dan naik perlahan
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          ...nativeDriver,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.ease),
          ...nativeDriver,
        }),
      ]),
      // 2. Nama Aplikasi muncul
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        ...nativeDriver,
      }),
      // 3. Tagline muncul
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        ...nativeDriver,
      }),
      // 4. Jeda sejenak, lalu tampilkan indikator loading
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        ...nativeDriver,
      }),
    ]).start();
  }, [reducedMotion]);

  return (
    <View style={styles.container}>
      {/* Ambient Glow: Gradasi dibuat seolah memancar dari tengah */}
      <LinearGradient 
        colors={['#1A0405', '#0A0A0B', '#0A0A0B']} 
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }}>
          <View style={styles.iconWrapper}>
            <Image 
              source={require('@/assets/images/android-icon-foreground.png')} 
              style={{ width: 84, height: 84 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
        
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.appName} maxFontSizeMultiplier={1.3}>
            WATCHLIST<Text style={styles.appAccent}>ID</Text>
          </Text>
        </Animated.View>
        
        <Animated.View style={{ opacity: taglineOpacity }}>
          <Text style={styles.tagline} maxFontSizeMultiplier={1.3}>
            Your Personal Movie Universe
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomContainer, { opacity: loaderOpacity }]}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B', // Warna dasar solid
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: -50, // Angkat sedikit ke atas agar lebih proporsional di mata
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
    padding: 16,
    borderRadius: 24,
    // Memberikan background transparan yang subtle di belakang ikon
    backgroundColor: 'rgba(229, 9, 20, 0.03)', 
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.1)',
  },
  icon: {
    // Hapus atau kurangi boxShadow di sini agar tidak terlihat 'kotor'
  },
  appName: {
    fontSize: 40,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: 4, // Jarak huruf diperlebar agar lebih elegan
    textAlign: 'center',
  },
  appAccent: {
    color: Colors.primary, // 'ID' akan memiliki warna merah
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: Spacing.md,
    textTransform: 'uppercase', // Membuatnya terlihat seperti poster film
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
});

export default SplashScreen;
