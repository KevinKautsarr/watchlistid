import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ProfileStatsProps {
  followers: number;
  following: number;
  watched: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onWatchedPress?: () => void;
  t: (key: any) => string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  followers,
  following,
  watched,
  onFollowersPress,
  onFollowingPress,
  onWatchedPress,
  t
}) => {
  return (
    <View style={styles.statsRow}>
      <TouchableOpacity style={styles.statItem} onPress={onWatchedPress}>
        <Text style={styles.statCount} allowFontScaling={false}>{watched}</Text>
        <Text style={styles.statLabel} allowFontScaling={false}>{t('watched')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.statItem} onPress={onFollowersPress}>
        <Text style={styles.statCount} allowFontScaling={false}>{followers}</Text>
        <Text style={styles.statLabel} allowFontScaling={false}>{t('followers')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statItem} onPress={onFollowingPress}>
        <Text style={styles.statCount} allowFontScaling={false}>{following}</Text>
        <Text style={styles.statLabel} allowFontScaling={false}>{t('following')}</Text>
      </TouchableOpacity>
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
  statCount: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
});

export default ProfileStats;
