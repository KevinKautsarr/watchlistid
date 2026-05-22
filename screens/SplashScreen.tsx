import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { Film } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { nativeDriver } from '@/utils/animation';

const SplashScreen: React.FC = () => {
  // Nilai Animasi Terpisah untuk efek bertahap
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, []);

  return (
    <View style={styles.container}>
      {/* Ambient Glow: Gradasi dibuat seolah memancar dari tengah */}
      <LinearGradient 
        colors={['#1A0405', '#141414', '#141414']} 
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }}>
          <View style={styles.iconWrapper}>
            <Film size={56} color={Colors.primary} strokeWidth={1.5} style={styles.icon} />
          </View>
        </Animated.View>
        
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.appName} allowFontScaling={false}>
            WATCHLIST<Text style={styles.appAccent}>ID</Text>
          </Text>
        </Animated.View>
        
        <Animated.View style={{ opacity: taglineOpacity }}>
          <Text style={styles.tagline} allowFontScaling={false}>
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
    backgroundColor: '#141414', // Warna dasar solid
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
    color: 'rgba(255,255,255,0.4)',
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
