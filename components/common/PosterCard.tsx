import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import SafeImage from '@/components/common/SafeImage';
import { Star, Bookmark, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { MediaItem } from '@/types';
import { useWatchlist } from '@/context/WatchlistContext';

interface PosterCardProps {
  movie:       MediaItem;
  width?:      number;
  showRank?:   boolean;
  rank?:       number;
  showBorder?: boolean;
  textColor?:  string;
  onPress?:    () => void;
}

const PosterCard: React.FC<PosterCardProps> = React.memo(({ 
  movie, 
  width = 110, 
  showRank, 
  rank, 
  showBorder, 
  textColor,
  onPress 
}) => {
  const { getMovieStatus } = useWatchlist();
  const status = getMovieStatus(movie.id);

  const containerStyle = React.useMemo(() => [
    styles.container, 
    { width },
    showBorder && styles.goldBorder
  ], [width, showBorder]);

  const textColorStyle = React.useMemo(() => (textColor ? { color: textColor } : {}), [textColor]);
  const textColorOpacityStyle = React.useMemo(() => (textColor ? { color: textColor, opacity: 0.7 } : {}), [textColor]);

  const renderStatusBadge = () => {
    if (status === 'not_added') return null;

    let bgColor = '#1565C0';
    let IconComponent: any = Bookmark;
    let fill = '#fff';

    if (status === 'watched') {
      bgColor = '#B71C1C';
      IconComponent = Check;
      fill = 'none';
    } else if (status === 'reviewed') {
      bgColor = '#F9A825';
      IconComponent = Star;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <IconComponent 
          size={13} 
          color="#fff" 
          fill={fill === 'none' ? undefined : fill} 
          strokeWidth={status === 'watched' ? 3 : 2} 
        />
      </View>
    );
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={containerStyle} 
      onPress={onPress}
    >
      <View style={styles.posterWrap}>
        <SafeImage
          uri={movie.poster_path ? `${Platform.OS === 'web' ? TMDB_IMAGE_SIZES.small : TMDB_IMAGE_SIZES.medium}${movie.poster_path}` : null}
          fallbackType="movie"
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority="low"
          accessibilityLabel={`${('title' in movie ? movie.title : movie.name) || 'Media'} poster`}
        />
        {showRank && rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText} maxFontSizeMultiplier={1.3}>{rank}</Text>
          </View>
        )}
        {renderStatusBadge()}
      </View>
      <View style={styles.infoRow}>
        <Star size={12} color="#F5C518" fill="#F5C518" strokeWidth={0} />
        <Text style={[styles.ratingText, textColorStyle]} maxFontSizeMultiplier={1.3}>
          {movie.vote_average?.toFixed(1)}
        </Text>
      </View>
      <Text style={[styles.title, textColorStyle]} numberOfLines={2} maxFontSizeMultiplier={1.3}>
        {('title' in movie) ? movie.title : movie.name}
      </Text>
      <Text style={[styles.year, textColorOpacityStyle]} maxFontSizeMultiplier={1.3}>
        {('release_date' in movie) ? movie.release_date?.split('-')[0] : movie.first_air_date?.split('-')[0]}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  goldBorder: {
    padding: 2,
    borderWidth: 1.5,
    borderColor: Colors.ratingGold,
    borderRadius: Radius.md + 2,
  },
  posterWrap: {
    height: 160,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  rankBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.overlay.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  rankText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  statusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
    zIndex: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  ratingGold: {
    color: Colors.ratingGold,
    fontSize: FontSize.md,
  },
  ratingText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  year: {
    fontSize: FontSize.xs,
    color: '#C5B0B8',
    fontWeight: '500',
    marginTop: 2,
  },
});

PosterCard.displayName = 'PosterCard';

export default PosterCard;
