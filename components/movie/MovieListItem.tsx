import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Check, Circle, Trash2, Plus, Eye } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { MediaItem } from '@/types/tmdb';
import { WatchlistItem } from '@/types/watchlist';
import RatingBadge from '@/components/common/RatingBadge';

interface MovieListItemProps {
  movie:        MediaItem | WatchlistItem;
  onPress?:     () => void;
  onAdd?:       () => void;
  showWatched?: boolean;
  watched?:     boolean;
  onToggleWatched?: () => void;
  onRemove?:    () => void;
  rank?:        number;
  inWatchlist?: boolean;
}

const MovieListItem: React.FC<MovieListItemProps> = React.memo(({
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
  // Safe extraction without 'any'
  const isMovie = ('mediaType' in movie && movie.mediaType === 'movie') || ('media_type' in movie && movie.media_type === 'movie');
  
  const title = 'title' in movie 
    ? movie.title 
    : 'name' in movie 
      ? movie.name 
      : 'Title';

  const date = 'release_date' in movie 
    ? movie.release_date 
    : 'first_air_date' in movie 
      ? movie.first_air_date 
      : null;

  const runtime = 'runtime' in movie ? movie.runtime : undefined;

  return (
    <View style={styles.container}>

      <TouchableOpacity 
        style={[styles.posterWrap, cursorPointer]}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Image 
          source={{ uri: `https://image.tmdb.org/t/p/w154${movie.poster_path}` }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority="low"
          accessibilityLabel={`${title} poster`}
          alt={`${title} poster`}
        />
        {rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText} allowFontScaling={false}>#{rank}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1} allowFontScaling={false}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} allowFontScaling={false}>{date?.substring(0,4)}</Text>
          {runtime ? (
            <>
              <Text style={styles.metaDot} allowFontScaling={false}>·</Text>
              <Text style={styles.metaText} allowFontScaling={false}>
                {`${Math.floor(runtime/60)}h ${runtime%60}m`}
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
              style={[styles.actionBtn, watched ? styles.watchedBtn : styles.unwatchedBtn, cursorPointer]}
              activeOpacity={0.75}
              onPress={onToggleWatched}
              accessibilityRole="button"
              accessibilityLabel={watched ? "Mark as unwatched" : "Mark as watched"}
            >
              {watched ? (
                <Check size={IconSize.md} color={Colors.primary} strokeWidth={3} />
              ) : (
                <Eye size={IconSize.md} color={Colors.white} strokeWidth={2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.deleteBtn, cursorPointer]}
              activeOpacity={0.75}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove from watchlist"
            >
              <Trash2 size={IconSize.sm} color={Colors.text.secondary} strokeWidth={2} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.wlCircle, inWatchlist && styles.wlCircleActive, cursorPointer]}
            activeOpacity={0.75}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {inWatchlist ? (
              <Check size={IconSize.md} color={Colors.white} strokeWidth={3} />
            ) : (
              <Plus size={IconSize.md} color={Colors.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

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
    backgroundColor: Colors.danger + 'F2', // 95% opacity
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
    minHeight: 88,
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

MovieListItem.displayName = 'MovieListItem';

export default MovieListItem;
