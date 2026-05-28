import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star, Film, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { MovieLog } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { formatHumanDate } from '@/utils/dateFormatter';
import RatingBadge from '@/components/common/RatingBadge';

interface DiaryCardProps {
  log: MovieLog;
  onDelete?: (id: string) => void;
  onPressPoster?: (movieId: number, mediaType: 'movie' | 'tv') => void;
  onWriteReview?: (log: MovieLog) => void;
  rank?: number;
  priority?: 'low' | 'normal' | 'high';
}

const DiaryCard: React.FC<DiaryCardProps> = React.memo(({ log, onDelete, onPressPoster, onWriteReview, rank, priority = 'low' }) => {
  const { t, language } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(!log.is_spoiler);

  const handleToggleSpoiler = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date} allowFontScaling={false}>
            {formatHumanDate(log.watched_at, language)}
          </Text>
        </View>
        
        <View style={styles.headerCenter}>
          {rank != null && (
            <Text style={styles.rankText} allowFontScaling={false}>#{rank}</Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {onDelete && (
            <TouchableOpacity 
              onPress={() => onDelete?.(log.id)} 
              style={[styles.deleteBtn, cursorPointer]}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="Delete log"
            >
              <Trash2 size={IconSize.sm} color={Colors.overlay.light30} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.posterContainer, cursorPointer]}
          activeOpacity={0.8}
          onPress={() => onPressPoster?.(log.movie_id, log.media_type || 'movie')}
          accessibilityRole="button"
          accessibilityLabel={`${log.movie_title} poster`}
        >
          {log.poster_path ? (
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w92${log.poster_path}` }} 
              style={styles.poster} 
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              accessibilityLabel={`${log.movie_title} poster`}
              priority={priority}
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Film size={IconSize.lg} color={Colors.overlay.light30} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.title} allowFontScaling={false}>{log.movie_title}</Text>
          
          <View style={styles.ratingsWrapper}>
            {log.rating ? (
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={IconSize.xs * 0.8} 
                    color={Colors.ratingGold} 
                    fill={i < Math.floor(log.rating! / 2) ? Colors.ratingGold : "transparent"} 
                  />
                ))}
              </View>
            ) : null}
            {log.vote_average ? (
              <RatingBadge rating={log.vote_average} size="sm" style={styles.globalRating} />
            ) : null}
          </View>

          {log.overview ? (
            <Text style={styles.overview} numberOfLines={2} allowFontScaling={false}>
              {log.overview}
            </Text>
          ) : null}
          {log.review_text && (
            <View style={styles.reviewWrapper}>
              {!isRevealed ? (
                <TouchableOpacity 
                  style={[styles.spoilerOverlay, cursorPointer]} 
                  onPress={handleToggleSpoiler}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel={t('clickToReveal')}
                >
                  <EyeOff size={IconSize.sm} color={Colors.primary} style={styles.spoilerIcon} />
                  <Text style={styles.spoilerText} allowFontScaling={false}>
                    {t('clickToReveal')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.review} numberOfLines={isRevealed ? undefined : 3} allowFontScaling={false}>
                    {log.review_text}
                  </Text>
                  {log.is_spoiler && (
                    <TouchableOpacity onPress={handleToggleSpoiler} style={[styles.hideBtn, cursorPointer]} accessibilityRole="button" accessibilityLabel={t('hideSpoilers')}>
                      <Text style={styles.hideBtnText}>{t('hideSpoilers')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
          {!log.review_text && onWriteReview && (
            <TouchableOpacity 
              style={[styles.writeReviewBtn, cursorPointer]}
              onPress={() => onWriteReview(log)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Tulis ulasan"
            >
              <MessageSquare size={12} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.writeReviewBtnText} allowFontScaling={false}>
                Tulis Ulasan
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay.light5,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  rankText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
    color: Colors.overlay.light20,
    letterSpacing: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  posterContainer: {
    width: 70,
    height: 105,
    minHeight: 105,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.overlay.light5,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 8,
  },
  globalRating: {
    marginTop: 0,
  },
  overview: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 6,
  },
  reviewWrapper: {
    marginTop: 4,
  },
  review: {
    fontSize: FontSize.sm,
    color: Colors.overlay.light85,
    lineHeight: 20,
    paddingVertical: 6,
  },
  spoilerOverlay: {
    backgroundColor: Colors.overlay.light3,
    borderRadius: Radius.sm,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.overlay.light10,
  },
  spoilerText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  hideBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  hideBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  spoilerIcon: {
    marginBottom: 4,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.2)',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 8,
  },
  writeReviewBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});

DiaryCard.displayName = 'DiaryCard';

export default DiaryCard;
