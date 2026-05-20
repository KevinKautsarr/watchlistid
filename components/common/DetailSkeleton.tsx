import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── Shared animation config ─────────────────────────────────────────────────
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ─── Base pulsing skeleton block ─────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export const PulsingSkeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  borderRadius = Radius.sm,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 900,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.surfaceElevated,
          opacity: pulseAnim,
        } as any,
        style,
      ]}
    />
  );
};

// ─── Movie Detail Skeleton ────────────────────────────────────────────────────
export const MovieDetailSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Hero backdrop */}
      <PulsingSkeleton height={300} borderRadius={0} />

      {/* Title + genre pills area */}
      <View style={s.titleArea}>
        <PulsingSkeleton width="70%" height={30} style={{ marginBottom: 10 }} />
        <PulsingSkeleton width="45%" height={18} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PulsingSkeleton width={72} height={26} borderRadius={Radius.full} />
          <PulsingSkeleton width={80} height={26} borderRadius={Radius.full} />
          <PulsingSkeleton width={60} height={26} borderRadius={Radius.full} />
        </View>
      </View>

      {/* Ratings row */}
      <View style={s.ratingsRow}>
        <PulsingSkeleton width="48%" height={78} borderRadius={Radius.md} />
        <PulsingSkeleton width="48%" height={78} borderRadius={Radius.md} />
      </View>

      {/* CTA buttons */}
      <View style={s.actionsRow}>
        <PulsingSkeleton width="58%" height={52} borderRadius={Radius.lg} />
        <PulsingSkeleton width="38%" height={52} borderRadius={Radius.lg} />
      </View>

      {/* Overview lines */}
      <View style={s.section}>
        <PulsingSkeleton width={110} height={22} style={{ marginBottom: 12 }} />
        <PulsingSkeleton width="100%" height={15} style={{ marginBottom: 8 }} />
        <PulsingSkeleton width="95%" height={15} style={{ marginBottom: 8 }} />
        <PulsingSkeleton width="75%" height={15} />
      </View>

      {/* Cast circles */}
      <View style={s.section}>
        <PulsingSkeleton width={90} height={22} style={{ marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <PulsingSkeleton width={72} height={72} borderRadius={36} />
              <PulsingSkeleton width={64} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─── Person Detail Skeleton ───────────────────────────────────────────────────
export const PersonDetailSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Backdrop */}
      <View style={{ position: 'relative' }}>
        <PulsingSkeleton height={240} borderRadius={0} />
        {/* Floating profile circle */}
        <View style={s.profileFloat}>
          <PulsingSkeleton width={100} height={100} borderRadius={50} />
        </View>
      </View>

      {/* Content below the float */}
      <View style={[s.section, { marginTop: 58 }]}>
        <PulsingSkeleton width="55%" height={30} style={{ marginBottom: 8 }} />
        <PulsingSkeleton width="35%" height={16} style={{ marginBottom: 20 }} />

        {/* Stats row */}
        <View style={s.statsRow}>
          <PulsingSkeleton width="30%" height={68} borderRadius={Radius.md} />
          <PulsingSkeleton width="30%" height={68} borderRadius={Radius.md} />
          <PulsingSkeleton width="30%" height={68} borderRadius={Radius.md} />
        </View>

        {/* Bio lines */}
        <View style={{ marginTop: 24 }}>
          <PulsingSkeleton width={120} height={22} style={{ marginBottom: 12 }} />
          <PulsingSkeleton width="100%" height={15} style={{ marginBottom: 8 }} />
          <PulsingSkeleton width="100%" height={15} style={{ marginBottom: 8 }} />
          <PulsingSkeleton width="80%" height={15} />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleArea: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  profileFloat: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 3,
    borderColor: Colors.background,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});
