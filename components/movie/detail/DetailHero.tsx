import React from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import SafeImage from '@/components/common/SafeImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES } from '@/constants/theme';

interface DetailHeroProps {
  movie: any;
  userRating: number | null;
  bp: { isLarge: boolean; maxContentWidth: number };
  ageRating: string;
}

export const DetailHero: React.FC<DetailHeroProps> = ({ movie, userRating, bp, ageRating }) => {
  const renderTitleBlock = () => (
    <View style={[styles.titleBlock, bp.isLarge && { marginTop: 24, paddingHorizontal: 0 }]}>
      <Text style={[styles.movieTitle, bp.isLarge && { fontSize: 36, lineHeight: 40 }]} maxFontSizeMultiplier={1.3}>{movie.title || movie.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText} maxFontSizeMultiplier={1.3}>{movie.release_date?.substring(0,4) || movie.first_air_date?.substring(0,4)}</Text>
        <View style={styles.agePill}><Text style={styles.agePillText} maxFontSizeMultiplier={1.3}>{ageRating}</Text></View>
        <Text style={styles.metaText} maxFontSizeMultiplier={1.3}>{movie.runtime || movie.episode_run_time?.[0] ? `${Math.floor((movie.runtime || movie.episode_run_time?.[0])/60)}h ${(movie.runtime || movie.episode_run_time?.[0])%60}m` : 'N/A'}</Text>
      </View>
      {movie.tagline ? <Text style={styles.tagline} maxFontSizeMultiplier={1.3}>{movie.tagline}</Text> : null}
    </View>
  );

  return (
    <>
      <View style={[styles.heroWrap, bp.isLarge && { width: '100%', maxWidth: bp.maxContentWidth, height: 450 }]}>
        <SafeImage 
          uri={movie.backdrop_path ? `${TMDB_IMAGE_SIZES.backdrop}${movie.backdrop_path}` : null} 
          fallbackType="movie"
          style={styles.backdrop} 
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority="high"
        />
        <LinearGradient
          colors={['transparent', 'transparent', Colors.background]}
          locations={[0, 0.4, 1]}
          style={styles.backdropOverlay}
        />
        
        {userRating && !bp.isLarge && (
          <Animated.View style={styles.userRatingOverlayBadge}>
            <Star size={14} color={Colors.ratingGold} fill={Colors.ratingGold} />
            <Text style={styles.userRatingOverlayText}>{userRating}</Text>
          </Animated.View>
        )}
      </View>
 
      <View style={[bp.isLarge && { flexDirection: 'row', width: '100%', maxWidth: bp.maxContentWidth, paddingHorizontal: 40 }]}>
        <View style={[bp.isLarge && { width: 300, marginRight: 40 }]}>
          {bp.isLarge && (
            <SafeImage 
              uri={movie.poster_path ? `${TMDB_IMAGE_SIZES.large}${movie.poster_path}` : null} 
              fallbackType="movie"
              style={{ width: 300, height: 450, borderRadius: Radius.lg, marginTop: -200, borderWidth: 1, borderColor: Colors.overlay.light10 } as any} 
              contentFit="cover" 
              cachePolicy="memory-disk"
              transition={200}
              priority="high"
            />
          )}
          {!bp.isLarge && renderTitleBlock()}
        </View>
        {bp.isLarge && <View style={{ flex: 1 }}>{renderTitleBlock()}</View>}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  heroWrap: { width: '100%', height: 400, position: 'relative' },
  backdrop: { width: '100%', height: '100%' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject },
  titleBlock: { backgroundColor: Colors.background, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  movieTitle: { fontSize: 32, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  metaText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)' },
  agePill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  agePillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  tagline: { marginTop: 24, fontSize: FontSize.md, color: Colors.primary, fontStyle: 'italic' },
  userRatingOverlayBadge: {
    position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(20,20,20,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  } as ViewStyle,
  userRatingOverlayText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.black },
});
