import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ProfileStatsProps {
  followers: number;
  following: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  t: (key: any) => string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  followers,
  following,
  onFollowersPress,
  onFollowingPress,
  t
}) => {
  return (
    <View style={styles.statsRow}>
      <Pressable style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]} onPress={onFollowersPress}>
        <Text style={styles.statCount} allowFontScaling={false} selectable={true}>{followers}</Text>
        <Text style={styles.statLabel} allowFontScaling={false}>{t('followers')}</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]} onPress={onFollowingPress}>
        <Text style={styles.statCount} allowFontScaling={false} selectable={true}>{following}</Text>
        <Text style={styles.statLabel} allowFontScaling={false}>{t('following')}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.xxxl, 
    marginTop: Spacing.xl, 
    width: '100%' 
  },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
});

export default ProfileStats;
