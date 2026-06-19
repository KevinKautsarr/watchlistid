import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, TrendingUp } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import StarRating from '@/components/common/StarRating';
import { cursorPointer } from '@/utils/webStyles';

interface DetailRatingsProps {
  movie: any;
  userRating: number | null;
  communityRating: any;
  onRatePress: () => void;
  t: any;
  bp: any;
}

export const DetailRatings: React.FC<DetailRatingsProps> = ({ movie, userRating, communityRating, onRatePress, t, bp }) => {
  return (
    <View style={[bp.isLarge && { flexDirection: 'column', width: 300, paddingHorizontal: 0 }, !bp.isLarge && { width: '100%' }]}>
      <View style={[styles.ratingBlock, bp.isLarge && { paddingHorizontal: 0, borderBottomWidth: 0 }]}>
        <View style={styles.ratingCol}>
          <Text style={styles.ratingLabel} maxFontSizeMultiplier={1.3}>{t('imdbRating')}</Text>
          <View style={styles.scoreRow}>
            <Star size={28} color={Colors.ratingGold} fill={Colors.ratingGold} strokeWidth={0} />
            <Text style={styles.scoreVal} maxFontSizeMultiplier={1.3}>{movie.vote_average?.toFixed(1)}</Text>
            <Text style={styles.scoreMax} maxFontSizeMultiplier={1.3}>/10</Text>
          </View>
          <Text style={styles.voteCount} maxFontSizeMultiplier={1.3}>{movie.vote_count?.toLocaleString()} {t('votes')}</Text>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.ratingCol}>
          <Text style={styles.ratingLabel} maxFontSizeMultiplier={1.3}>{t('popularity')}</Text>
          <TrendingUp size={IconSize.md} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.popScore} maxFontSizeMultiplier={1.3}>{movie.popularity?.toFixed(0)}</Text>
        </View>
        <View style={styles.vDivider} />
        <TouchableOpacity 
          style={[styles.ratingCol, cursorPointer]} 
          activeOpacity={0.7}
          onPress={onRatePress}
        >
          <Text style={styles.ratingLabel} maxFontSizeMultiplier={1.3}>{t('yourRatingLabel')}</Text>
          {userRating ? (
            <>
              <Star size={IconSize.md} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
              <Text style={styles.userRateScore} maxFontSizeMultiplier={1.3}>{userRating}/10</Text>
            </>
          ) : (
            <>
              <Star size={IconSize.md} color={Colors.surface} strokeWidth={1.5} />
              <Text style={styles.rateTextAction} maxFontSizeMultiplier={1.3}>{t('log')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {communityRating.data && communityRating.data.count > 0 && (
        <View style={[styles.communityRatingCard, bp.isLarge && { marginHorizontal: 0, marginTop: 0 }]}>
          <View style={styles.communityHeader}>
            <View>
              <Text style={styles.communityLabel}>WatchlistID Community</Text>
              <Text style={styles.communitySub}>{communityRating.data.count} reviews from our users</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>{(communityRating.data.average / 2).toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.starsRow}>
            <StarRating rating={communityRating.data.average / 2} size={24} />
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${(communityRating.data.average / 10) * 100}%` }]} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ratingBlock: {
    backgroundColor: Colors.background, paddingHorizontal: 24, paddingVertical: 24,
    flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.overlay.light10
  },
  ratingCol: { flex: 1, alignItems: 'center' },
  ratingLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreVal: { fontSize: FontSize.xxxl + 4, fontWeight: FontWeight.extrabold, color: Colors.white },
  scoreMax: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  voteCount: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  vDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  popScore: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white },
  userRateScore: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: 4 },
  rateTextAction: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: 4 },
  communityRatingCard: {
    backgroundColor: `${Colors.accent}14`,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: Radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  communityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  communityLabel: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.black, letterSpacing: -0.3 },
  communitySub: { color: Colors.text.secondary, fontSize: FontSize.xs, marginTop: 2 },
  scoreBox: { backgroundColor: Colors.accent, width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: Colors.white, fontSize: 18, fontWeight: FontWeight.black },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 6, backgroundColor: Colors.overlay.light5, borderRadius: Radius.full, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.ratingGold, borderRadius: Radius.full },
});
