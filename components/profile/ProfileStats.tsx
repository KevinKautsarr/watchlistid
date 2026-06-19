import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '@/constants/theme';
import { Star, Film, MessageSquare, Bookmark } from 'lucide-react-native';

interface ProfileStatsProps {
  followers: number;
  following: number;
  reviewsCount: number;
  avgRating: number;
  watchedCount: number;
  watchlistCount: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  t: (key: any) => string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  followers,
  following,
  reviewsCount,
  avgRating,
  watchedCount,
  watchlistCount,
  onFollowersPress,
  onFollowingPress,
  t
}) => {
  return (
    <View style={styles.container}>
      {/* Row 1: Social Stats */}
      <View style={styles.socialRow}>
        <Pressable style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]} onPress={onFollowersPress}>
          <Text style={styles.statCount} maxFontSizeMultiplier={1.3} selectable={true}>{followers}</Text>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.3}>{t('followers') || 'Pengikut'}</Text>
        </Pressable>
 
        <Pressable style={({ pressed }) => [styles.statItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]} onPress={onFollowingPress}>
          <Text style={styles.statCount} maxFontSizeMultiplier={1.3} selectable={true}>{following}</Text>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1.3}>{t('following') || 'Mengikuti'}</Text>
        </Pressable>
      </View>
 
      {/* Row 2: Movie & Activity Stats */}
      <View style={styles.movieStatsCard}>
        <View style={styles.movieStatCol}>
          <MessageSquare size={16} color="rgba(255,255,255,0.4)" style={styles.movieStatIcon} />
          <Text style={styles.movieStatValue} maxFontSizeMultiplier={1.3}>{reviewsCount}</Text>
          <Text style={styles.movieStatLabel} maxFontSizeMultiplier={1.3}>{t('reviews')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movieStatCol}>
          <Film size={16} color="rgba(255,255,255,0.4)" style={styles.movieStatIcon} />
          <Text style={styles.movieStatValue} maxFontSizeMultiplier={1.3}>{watchedCount}</Text>
          <Text style={styles.movieStatLabel} maxFontSizeMultiplier={1.3}>{t('watched')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.movieStatCol}>
          <Bookmark size={16} color="rgba(255,255,255,0.4)" style={styles.movieStatIcon} />
          <Text style={styles.movieStatValue} maxFontSizeMultiplier={1.3}>{watchlistCount}</Text>
          <Text style={styles.movieStatLabel} maxFontSizeMultiplier={1.3}>{t('tabWatchlist')}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.movieStatCol}>
          <Star size={16} color={Colors.ratingGold} fill={Colors.ratingGold} style={styles.movieStatIcon} />
          <Text style={styles.movieStatValue} maxFontSizeMultiplier={1.3}>
            {avgRating > 0 ? (avgRating / 2).toFixed(1) : '-'}
          </Text>
          <Text style={styles.movieStatLabel} maxFontSizeMultiplier={1.3}>{t('rating')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  socialRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: Spacing.xxl, 
    width: '100%',
    marginBottom: Spacing.lg,
  },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.white, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  
  movieStatsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  movieStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  movieStatIcon: {
    marginBottom: 4,
  },
  movieStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.white,
  },
  movieStatLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});

export default ProfileStats;
