import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Check, Circle, Trash2, Plus, Eye } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES } from '../../constants/theme';
import { Movie, WatchlistMovie } from '../../types';
import RatingBadge from '../common/RatingBadge';

interface MovieListItemProps {
  movie:        Movie | WatchlistMovie;
  onPress?:     () => void;
  onAdd?:       () => void;
  showWatched?: boolean;
  watched?:     boolean;
  onToggleWatched?: () => void;
  onRemove?:    () => void;
  rank?:        number;
  inWatchlist?: boolean;
}

const MovieListItem: React.FC<MovieListItemProps> = ({
  movie,
  onPress,
  onAdd,
  showWatched,
  watched,
  onToggleWatched,
  onRemove,
  rank,
  inWatchlist,
}) => {
  return (
    <View style={styles.container}>

      <TouchableOpacity 
        style={styles.posterWrap}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Image 
          source={{ uri: `${TMDB_IMAGE_SIZES.medium}${movie.poster_path}` }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover" 
        />
        {rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText} allowFontScaling={false}>#{rank}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>{movie.title || (movie as any).name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} allowFontScaling={false}>{(movie.release_date || (movie as any).first_air_date)?.substring(0,4)}</Text>
          {movie.runtime ? (
            <>
              <Text style={styles.metaDot} allowFontScaling={false}>·</Text>
              <Text style={styles.metaText} allowFontScaling={false}>
                {`${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m`}
              </Text>
            </>
          ) : null}
        </View>
        <RatingBadge rating={movie.vote_average} size="sm" style={styles.rating} />
        <Text style={styles.overview} numberOfLines={2} allowFontScaling={false}>
          {movie.overview}
        </Text>
      </View>
      <View style={styles.actionCol}>
        {showWatched ? (
          <>
            <TouchableOpacity 
              style={[styles.actionBtn, watched ? styles.watchedBtn : styles.unwatchedBtn]}
              activeOpacity={0.75}
              onPress={onToggleWatched}
            >
              {watched ? (
                <Check size={18} color={Colors.primary} strokeWidth={3} />
              ) : (
                <Eye size={18} color={Colors.white} strokeWidth={2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteBtn}
              activeOpacity={0.75}
              onPress={onRemove}
            >
              <Trash2 size={16} color={Colors.text.secondary} strokeWidth={2} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.wlCircle, inWatchlist && styles.wlCircleActive]}
            activeOpacity={0.75}
            onPress={onAdd}
          >
            {inWatchlist ? (
              <Check size={18} color={Colors.white} strokeWidth={3} />
            ) : (
              <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg, 
    borderBottomWidth: 1, 
    borderColor: Colors.overlay.light, 
    gap: Spacing.lg 
  },
  rankBadge: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    backgroundColor: 'rgba(229,9,20,0.95)', 
    paddingHorizontal: 5, 
    paddingVertical: 2, 
    borderBottomRightRadius: Radius.sm,
    zIndex: 10,
  },
  rankBadgeText: { 
    fontSize: 10, 
    fontWeight: FontWeight.black, 
    color: Colors.white 
  },
  posterWrap: { 
    width: 60, 
    height: 88, 
    borderRadius: Radius.sm, 
    backgroundColor: Colors.surface, 
    overflow: 'hidden' 
  },
  contentCol: { 
    flex: 1,
    minWidth: 0,
  },
  title: { 
    fontSize: FontSize.lg, 
    fontWeight: FontWeight.bold, 
    color: Colors.text.primary 
  },
  metaRow: { 
    flexDirection: 'row', 
    gap: Spacing.sm, 
    marginTop: Spacing.xs, 
    alignItems: 'center' 
  },
  metaText: { 
    fontSize: FontSize.xs, 
    color: Colors.text.secondary 
  },
  metaDot: { 
    color: Colors.text.secondary 
  },
  rating: {
    marginTop: Spacing.xs,
  },
  overview: { 
    fontSize: FontSize.xs, 
    color: Colors.text.secondary, 
    marginTop: Spacing.sm, 
    lineHeight: 17 
  },
  actionCol: { 
    gap: Spacing.sm 
  },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  watchedBtn: { 
    backgroundColor: Colors.surface 
  },
  unwatchedBtn: { 
    backgroundColor: Colors.primary 
  },
  actionIcon: { 
    fontWeight: FontWeight.bold 
  },
  watchedIcon: { 
    color: Colors.primary, 
    fontSize: FontSize.lg 
  },
  unwatchedIcon: { 
    color: Colors.background, 
    fontSize: FontSize.base 
  },
  deleteBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: Colors.overlay.light, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  deleteIcon: { 
    fontSize: FontSize.base, 
    color: Colors.text.secondary 
  },
  wlCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: Radius.full, 
    backgroundColor: Colors.surface, 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexShrink: 0, 
    marginTop: Spacing.xs 
  },
  wlCircleActive: { 
    backgroundColor: Colors.primary 
  },
  wlIcon: { 
    fontSize: FontSize.xl, 
    color: Colors.primary 
  },
  wlIconActive: { 
    color: Colors.white 
  },
});

export default MovieListItem;
