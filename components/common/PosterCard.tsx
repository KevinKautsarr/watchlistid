import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TMDB_IMAGE_SIZES } from '../../constants/theme';
import { Movie } from '../../types';

interface PosterCardProps {
  movie:       Movie;
  width?:      number;
  showRank?:   boolean;
  rank?:       number;
  showBorder?: boolean;
  textColor?:  string;
  onPress?:    () => void;
}

const PosterCard: React.FC<PosterCardProps> = ({ 
  movie, 
  width = 110, 
  showRank, 
  rank, 
  showBorder, 
  textColor,
  onPress 
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={[
        styles.container, 
        { width },
        showBorder && styles.goldBorder
      ]} 
      onPress={onPress}
    >
      <View style={styles.posterWrap}>
        <Image
          source={{ uri: `${TMDB_IMAGE_SIZES.medium}${movie.poster_path}` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        {showRank && rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText} allowFontScaling={false}>{rank}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoRow}>
        <Star size={12} color="#F5C518" fill="#F5C518" strokeWidth={0} />
        <Text style={[styles.ratingText, textColor ? { color: textColor } : {}]} allowFontScaling={false}>
          {movie.vote_average?.toFixed(1)}
        </Text>
      </View>
      <Text style={[styles.title, textColor ? { color: textColor } : {}]} numberOfLines={2} allowFontScaling={false}>
        {movie.title}
      </Text>
      <Text style={[styles.year, textColor ? { color: textColor, opacity: 0.7 } : {}]} allowFontScaling={false}>
        {movie.release_date?.split('-')[0]}
      </Text>
    </TouchableOpacity>
  );
};

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
    color: Colors.text.secondary,
    marginTop: 2,
  },
});

export default PosterCard;
