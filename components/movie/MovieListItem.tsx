import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import SafeImage from '@/components/common/SafeImage';
import { Check, Circle, Trash2, Plus, Eye, MessageSquare } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { MediaItem } from '@/types/tmdb';
import { WatchlistItem } from '@/types/watchlist';
import RatingBadge from '@/components/common/RatingBadge';
import { useLanguage } from '@/context/LanguageContext';


interface MovieListItemProps {
  movie:        MediaItem | WatchlistItem;
  onPress?:     () => void;
  onAdd?:       () => void;
  showWatched?: boolean;
  watched?:     boolean;
  onToggleWatched?: () => void;
  onRemove?:    () => void;
  onWriteReview?: () => void;
  rank?:        number;
  inWatchlist?: boolean;
  status?:      'not_added' | 'plan_to_watch' | 'watched' | 'reviewed';
  hideActions?: boolean;
}

const MovieListItem: React.FC<MovieListItemProps> = React.memo(({
  movie,
  onPress,
  onAdd,
  showWatched,
  watched,
  onToggleWatched,
  onRemove,
  onWriteReview,
  rank,
  inWatchlist,
  status,
  hideActions,
}) => {
  const { t } = useLanguage();
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
        <SafeImage
          uri={movie.poster_path ? `https://image.tmdb.org/t/p/w154${movie.poster_path}` : null}
          fallbackType="movie"
          recyclingKey={String(movie.id)}
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
            <Text style={styles.rankBadgeText} maxFontSizeMultiplier={1.3}>#{rank}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.3}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} maxFontSizeMultiplier={1.3}>{date?.substring(0,4)}</Text>
          {runtime ? (
            <>
              <Text style={styles.metaDot} maxFontSizeMultiplier={1.3}>·</Text>
              <Text style={styles.metaText} maxFontSizeMultiplier={1.3}>
                {`${Math.floor(runtime/60)}h ${runtime%60}m`}
              </Text>
            </>
          ) : null}
        </View>
        <RatingBadge rating={movie.vote_average} size="sm" style={styles.rating} />
        {status && (
          <View style={styles.badgeRow}>
            {status === 'plan_to_watch' && (
              <View style={[styles.statusBadge, styles.planBadge]}>
                <View style={[styles.badgeDot, styles.planDot]} />
                <Text style={styles.planBadgeText} maxFontSizeMultiplier={1.3}>{t('statusPlanToWatch')}</Text>
              </View>
            )}
            {status === 'watched' && (
              <View style={[styles.statusBadge, styles.watchedBadge]}>
                <View style={[styles.badgeDot, styles.watchedDot]} />
                <Text style={styles.watchedBadgeText} maxFontSizeMultiplier={1.3}>{t('statusWatched')}</Text>
              </View>
            )}
            {status === 'reviewed' && (
              <View style={[styles.statusBadge, styles.reviewedBadge]}>
                <Text style={styles.reviewedBadgeText} maxFontSizeMultiplier={1.3}>{t('statusReviewed')}</Text>
              </View>
            )}
          </View>
        )}
        <Text style={styles.overview} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {movie.overview}
        </Text>
      </View>
      {!hideActions && (
        <View style={styles.actionCol}>
          {showWatched ? (
            <>
              {status !== 'reviewed' && (
                <TouchableOpacity 
                  style={[
                    styles.actionBtn, 
                    status === 'watched' ? styles.reviewBtn : (watched ? styles.watchedBtn : styles.unwatchedBtn), 
                    cursorPointer
                  ]}
                  activeOpacity={0.75}
                  onPress={status === 'watched' && onWriteReview ? onWriteReview : onToggleWatched}
                  accessibilityRole="button"
                  accessibilityLabel={status === 'watched' ? t('writeReview') : (watched ? t('markUnwatched') : t('markWatched'))}
                >
                  {status === 'watched' ? (
                    <MessageSquare size={IconSize.sm} color={Colors.ratingGold} strokeWidth={2.5} />
                  ) : watched ? (
                    <Check size={IconSize.md} color={Colors.primary} strokeWidth={3} />
                  ) : (
                    <Eye size={IconSize.sm} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.deleteBtn, cursorPointer]}
                activeOpacity={0.75}
                onPress={onRemove}
                accessibilityRole="button"
                accessibilityLabel={t('removeFromWatchlistLabel')}
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
              accessibilityLabel={inWatchlist ? t('removeFromWatchlistLabel') : t('addToWatchlist')}
            >
              {inWatchlist ? (
                <Check size={IconSize.md} color={Colors.primary} strokeWidth={3} />
              ) : (
                <Plus size={IconSize.md} color={Colors.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
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
    gap: Spacing.lg,
    alignItems: 'center'
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
    color: '#C5B0B8',
    fontWeight: '500'
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
    lineHeight: 19 
  },
  actionCol: { 
    gap: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36
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
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
  },
  reviewBtn: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
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
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    justifyContent: 'center', 
    alignItems: 'center', 
    flexShrink: 0, 
  },
  wlCircleActive: { 
    backgroundColor: Colors.surface, 
    borderWidth: 0,
  },
  wlIcon: { 
    fontSize: FontSize.xl, 
    color: Colors.primary 
  },
  wlIconActive: { 
    color: Colors.white 
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  planBadge: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  planDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  planBadgeText: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: FontWeight.bold,
  },
  watchedBadge: {
    borderColor: `${Colors.primary}40`,
    backgroundColor: `${Colors.primary}0D`,
  },
  watchedDot: {
    backgroundColor: Colors.primary,
  },
  watchedBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  reviewedBadge: {
    borderColor: `${Colors.ratingGold}40`,
    backgroundColor: `${Colors.ratingGold}0D`,
  },
  reviewedBadgeText: {
    fontSize: 10,
    color: Colors.ratingGold,
    fontWeight: FontWeight.bold,
  },
});

MovieListItem.displayName = 'MovieListItem';

export default MovieListItem;
