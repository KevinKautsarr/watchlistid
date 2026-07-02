/**
 * LiquidGlassFab — Apple-style "Liquid Glass" floating action button.
 *
 * Visual recipe:
 *  • iOS       : expo-blur BlurView + specular top highlight + dark bottom rim
 *  • Android   : BlurView dengan experimentalBlurMethod (fallback: bg semi-opaque)
 *  • Web       : CSS backdrop-filter blur + saturate + inset shadow rim + hover state
 *
 * Self-contained: cukup pass `onPress`. `animValue` opsional — kalau tidak
 * diberikan, FAB dibuat selalu terlihat (internal Animated.Value(1)).
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronUp } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Haptics opsional — tidak error kalau expo-haptics belum terpasang.
let Haptics: typeof import('expo-haptics') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {
  Haptics = null;
}

export interface LiquidGlassFabProps {
  onPress: () => void;
  /** Animated.Value 0→1 untuk animasi masuk. Opsional — default selalu terlihat. */
  animValue?: Animated.Value;
  /** Jika false, tombol mengabaikan pointer event (tetap ter-mount, tak terlihat). */
  visible?: boolean;
  /** Offset bawah dari tepi layar. Default 100. */
  bottom?: number;
  /** Offset kanan dari tepi layar. Default 20. */
  right?: number;
  /** Diameter tombol. Default 50. */
  size?: number;
  /** Ikon custom. Default ChevronUp. */
  icon?: React.ReactNode;
  /** Tint blur untuk native. Default 'dark'. */
  tint?: 'dark' | 'light' | 'default';
  /** Aktifkan haptic feedback saat ditekan (butuh expo-haptics). Default true. */
  haptics?: boolean;
  /** Label aksesibilitas. Default 'Scroll to top'. */
  accessibilityLabel?: string;
  /** Style tambahan untuk container terluar. */
  style?: ViewStyle;
}

const LiquidGlassFab: React.FC<LiquidGlassFabProps> = ({
  onPress,
  animValue,
  visible = true,
  bottom = 100,
  right = 20,
  size = 50,
  icon,
  tint = 'dark',
  haptics = true,
  accessibilityLabel = 'Scroll to top',
  style,
}) => {
  // Fallback: kalau tidak ada animValue eksternal, pakai nilai konstan 1.
  const internalAnim = useRef(new Animated.Value(1)).current;
  const anim = animValue ?? internalAnim;

  // Spring untuk feedback tekan — jauh lebih halus daripada style statis.
  const pressScale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
    if (haptics && Haptics && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [haptics, pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 9, // sedikit "kenyal" khas liquid glass
    }).start();
  }, [pressScale]);

  const entranceStyle = useMemo(
    () => ({
      opacity: anim,
      transform: [
        {
          scale: Animated.multiply(
            anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
            pressScale,
          ),
        },
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0],
            easing: Easing.out(Easing.cubic),
          }),
        },
      ],
    }),
    [anim, pressScale],
  );

  const radius = size / 2;
  const iconNode = icon ?? (
    <ChevronUp size={size * 0.44} color="rgba(255,255,255,0.95)" strokeWidth={2.5} />
  );

  const glassShapeStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.fab, glassShapeStyle, { bottom, right }, entranceStyle, style]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: !visible }}
        style={glassShapeStyle}
      >
        {Platform.OS === 'web' ? (
          <View
            style={[
              styles.webGlass,
              glassShapeStyle,
              hovered && styles.webGlassHovered,
            ]}
          >
            {iconNode}
          </View>
        ) : (
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 55}
            tint={tint}
            // Tanpa ini, blur di Android hanya berupa tint transparan.
            experimentalBlurMethod="dimezisBlurView"
            style={[styles.blurContainer, glassShapeStyle]}
          >
            {/* Fallback wash agar tetap terbaca di device tanpa dukungan blur */}
            <View style={[StyleSheet.absoluteFill, styles.fallbackWash]} />
            {/* Rim kaca: hairline border mengikuti lingkaran, bukan garis lurus */}
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.glassRim, { borderRadius: radius }]}
            />
            {iconNode}
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 99,
    // Bayangan luar ditaruh di wrapper (bukan di view ber-overflow:hidden)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: { elevation: 14 },
      web: { willChange: 'transform, opacity' } as any,
    }),
  },

  // ── Native (BlurView) ───────────────────────────────────────────────────
  blurContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackWash: {
    backgroundColor: 'rgba(30,30,34,0.28)',
  },

  // ── Web (CSS backdrop-filter) ───────────────────────────────────────────
  webGlass: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
    // @ts-ignore — web-only CSS
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    transition: 'background-color 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
    outlineStyle: 'none',
    boxShadow: [
      '0 8px 32px rgba(0,0,0,0.45)',
      '0 2px 8px rgba(0,0,0,0.30)',
      'inset 0 1px 0 rgba(255,255,255,0.30)', // glow dalam tepi atas
      'inset 0 -1px 0 rgba(0,0,0,0.18)', // rim gelap tepi bawah
      'inset 0 0 0 0.5px rgba(255,255,255,0.12)', // rim ultra-tipis
    ].join(', '),
  } as any,
  webGlassHovered: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    boxShadow: [
      '0 10px 36px rgba(0,0,0,0.50)',
      '0 2px 8px rgba(0,0,0,0.30)',
      'inset 0 1px 0 rgba(255,255,255,0.40)',
      'inset 0 -1px 0 rgba(0,0,0,0.18)',
      'inset 0 0 0 0.5px rgba(255,255,255,0.18)',
    ].join(', '),
  } as any,

  // ── Rim kaca (native) ───────────────────────────────────────────────────
  // Hairline border melingkar penuh — meniru tepi kaca yang menangkap cahaya,
  // menggantikan garis lurus yang terlihat seperti artefak.
  glassRim: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
});

export default React.memo(LiquidGlassFab);