import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Shimmer from '@/components/common/Shimmer';

// ─── Movie Detail Skeleton ────────────────────────────────────────────────────
export const MovieDetailSkeleton: React.FC = () => {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Hero backdrop */}
      <Shimmer height={300} borderRadius={0} />

      {/* Title + genre pills area */}
      <View style={s.titleArea}>
        <Shimmer width="70%" height={30} style={{ marginBottom: 10 }} />
        <Shimmer width="45%" height={18} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Shimmer width={72} height={26} borderRadius={Radius.full} />
          <Shimmer width={80} height={26} borderRadius={Radius.full} />
          <Shimmer width={60} height={26} borderRadius={Radius.full} />
        </View>
      </View>

      {/* Ratings row */}
      <View style={s.ratingsRow}>
        <Shimmer width="48%" height={78} borderRadius={Radius.md} />
        <Shimmer width="48%" height={78} borderRadius={Radius.md} />
      </View>

      {/* CTA buttons */}
      <View style={s.actionsRow}>
        <Shimmer width="58%" height={52} borderRadius={Radius.lg} />
        <Shimmer width="38%" height={52} borderRadius={Radius.lg} />
      </View>

      {/* Overview lines */}
      <View style={s.section}>
        <Shimmer width={110} height={22} style={{ marginBottom: 12 }} />
        <Shimmer width="100%" height={15} style={{ marginBottom: 8 }} />
        <Shimmer width="95%" height={15} style={{ marginBottom: 8 }} />
        <Shimmer width="75%" height={15} />
      </View>

      {/* Cast circles */}
      <View style={s.section}>
        <Shimmer width={90} height={22} style={{ marginBottom: 14 }} />
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Shimmer width={72} height={72} borderRadius={36} />
              <Shimmer width={64} height={12} borderRadius={4} />
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
        <Shimmer height={240} borderRadius={0} />
        {/* Floating profile circle */}
        <View style={s.profileFloat}>
          <Shimmer width={100} height={100} borderRadius={50} />
        </View>
      </View>

      {/* Content below the float */}
      <View style={[s.section, { marginTop: 58 }]}>
        <Shimmer width="55%" height={30} style={{ marginBottom: 8 }} />
        <Shimmer width="35%" height={16} style={{ marginBottom: 20 }} />

        {/* Stats row */}
        <View style={s.statsRow}>
          <Shimmer width="30%" height={68} borderRadius={Radius.md} />
          <Shimmer width="30%" height={68} borderRadius={Radius.md} />
          <Shimmer width="30%" height={68} borderRadius={Radius.md} />
        </View>

        {/* Bio lines */}
        <View style={{ marginTop: 24 }}>
          <Shimmer width={120} height={22} style={{ marginBottom: 12 }} />
          <Shimmer width="100%" height={15} style={{ marginBottom: 8 }} />
          <Shimmer width="100%" height={15} style={{ marginBottom: 8 }} />
          <Shimmer width="80%" height={15} />
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
