import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ChevronLeft, Share2, Info, CheckCircle2 } from 'lucide-react-native';

import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import { APP_URL } from '@/config';
import { cursorPointer } from '@/utils/webStyles';
import { shareOrCopy } from '@/utils/share';
import { useWatchlist } from '@/context/WatchlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLanguage } from '@/context/LanguageContext';
import { useFavorites } from '@/context/FavoritesContext';
import type { MediaItem } from '@/types';

import CastCard from '@/components/movie/CastCard';
import MovieDetailTable from '@/components/movie/MovieDetailTable';
import PosterCard from '@/components/common/PosterCard';
import LogModal from '@/components/movie/LogModal';
import ReviewFeed from '@/components/movie/ReviewFeed';
import { MovieDetailSkeleton } from '@/components/common/DetailSkeleton';
import Shimmer from '@/components/common/Shimmer';

import { DetailHero } from '@/components/movie/detail/DetailHero';
import { DetailRatings } from '@/components/movie/detail/DetailRatings';
import { DetailActions } from '@/components/movie/detail/DetailActions';
import { DetailStory } from '@/components/movie/detail/DetailStory';
import { DetailTrailers } from '@/components/movie/detail/DetailTrailers';
import { getTVSeasonDetails } from '@/services/api';

export default function MovieDetailScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const actualId = params.id || params.movieId;
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type: 'movie' | 'tv' = rawType === 'tv' ? 'tv' : 'movie';
  
  const insets = useSafeAreaInsets();
  const bp = useBreakpoint();
  const { session } = useAuth();
  const { t } = useLanguage();
  const {
    isInWatchlist, addToWatchlist, removeFromWatchlist, getRating,
    addToRecentlyViewed, getMovieStatus, registerMovieLog, toggleWatched,
    isHydrated, toggleEpisodeWatch, isEpisodeWatched, fetchWatchedEpisodes
  } = useWatchlist();
  const { userLogs, addLog } = useSocial();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  
  const { status, data, error } = useMovieDetail(Number(actualId), type);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // TV Show states — season & episode selector
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null);

  const watchedCount = type === 'tv' ? episodes.filter(ep => isEpisodeWatched(Number(actualId), selectedSeason, ep.episode_number)).length : 0;
  const progressPercent = type === 'tv' && episodes.length > 0 ? (watchedCount / episodes.length) * 100 : 0;

  const loadEpisodes = useCallback(async (tvId: number, season: number) => {
    setEpisodesLoading(true);
    setEpisodes([]); // Reset episodes list immediately to clear previous season list
    setExpandedEpisodeId(null);
    try {
      const res = await getTVSeasonDetails(tvId, season);
      if (res && res.episodes) {
        setEpisodes(res.episodes);
      } else {
        setEpisodes([]);
      }
    } catch (err) {
      console.error(err);
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (actualId && status === 'success') {
      addToRecentlyViewed(Number(actualId));
    }
  }, [actualId, status, addToRecentlyViewed]);

  // Load first season episodes when TV show data is ready
  useEffect(() => {
    if (type === 'tv' && status === 'success' && actualId) {
      setSelectedSeason(1);
      loadEpisodes(Number(actualId), 1);
    }
  }, [type, status, actualId, loadEpisodes]);

  // Load watched episodes list
  useEffect(() => {
    if (type === 'tv' && status === 'success' && actualId) {
      fetchWatchedEpisodes(Number(actualId));
    }
  }, [type, status, actualId, fetchWatchedEpisodes]);

  if (!isHydrated || status === 'loading') {
    return <MovieDetailSkeleton />;
  }

  if (status === 'error' || !data?.movie) {
    return (
      <View style={styles.errorWrapper}>
        <Info size={48} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.errorTitle} maxFontSizeMultiplier={1.3}>
          {t('contentNotFound')}
        </Text>
        <Text style={styles.errorSub} maxFontSizeMultiplier={1.3}>
          {error || t('contentNotFoundDesc')}
        </Text>
        <TouchableOpacity 
          style={[styles.retryBtn, cursorPointer]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.retryBtnText}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { movie, credits, videos, similar, releaseDates, keywords, communityRating } = data;
  const inWatchlist = isInWatchlist(movie.id);
  const userRating = getRating(movie.id);

  let ageRating = 'NR';
  if (releaseDates) {
    const usRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'US');
    if (usRelease) {
      if (usRelease.rating) ageRating = usRelease.rating;
      else if (usRelease.release_dates?.length > 0) {
        const rating = usRelease.release_dates.find((r: any) => r.certification !== '');
        if (rating) ageRating = rating.certification;
      }
    }
  }

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (inWatchlist) removeFromWatchlist(movie.id);
    else addToWatchlist({ ...movie, media_type: type } as any);
  };

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!session) {
      router.push('/auth/login');
      return;
    }
    const isFav = isFavorite(movie.id);
    if (isFav) {
      await removeFavorite(movie.id);
    } else {
      await addFavorite({
        movie_id: movie.id,
        media_type: type,
        title: ('title' in movie) ? movie.title : (movie as any).name || '',
        poster_path: movie.poster_path,
      });
    }
  };

  const handleRate = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setShowLogModal(true);
  };

  const handleMarkWatched = async () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const success = await addLog({
        movie_id: movie.id,
        media_type: type,
        movie_title: 'title' in movie ? movie.title : movie.name,
        poster_path: movie.poster_path || undefined,
        watched_at: new Date().toISOString().split('T')[0],
        rating: undefined as any,
        is_spoiler: false,
      });

      if (success) {
        registerMovieLog(movie.id);
        
        if (inWatchlist) {
          const currentStatus = getMovieStatus(movie.id);
          if (currentStatus === 'plan_to_watch') {
            toggleWatched(movie.id);
          }
        } else {
          await addToWatchlist({ ...movie, media_type: type, status: 'completed' } as any);
        }
      } else {
        Alert.alert(t('failedTitle'), t('markWatchedFailed'));
      }
    } catch (err: any) {
      console.error('[DetailScreen] mark watched failed:', err);
      Alert.alert(t('errorTitle'), err.message || t('genericError'));
    }
  };

  const handleWriteReview = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setShowLogModal(true);
  };

  const handleEditReview = () => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    setShowLogModal(true);
  };

  const openTrailer = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${key}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mediaTitle = 'title' in movie ? movie.title : movie.name;
    const ratingStr = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const url = `${APP_URL}/movie/${movie.id}`;
    const text = t('shareMovieMessage')
      .replace('{title}', mediaTitle)
      .replace('{rating}', ratingStr);
    const result = await shareOrCopy({ message: `${text}\n${url}`, url, title: mediaTitle });
    if (result === 'copied') Alert.alert(t('linkCopied'));
  };

  const featuredTrailer = videos.find(v => v.type === "Trailer");

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        contentContainerStyle={[bp.isLarge && styles.largeCenter]}
      >
        <DetailHero 
          movie={movie} 
          userRating={userRating} 
          bp={bp} 
          ageRating={ageRating} 
        />

        <View style={[bp.isLarge && styles.largeContentRow]}>
          
          <DetailRatings 
            movie={movie} 
            userRating={userRating} 
            communityRating={{ data: communityRating }} 
            onRatePress={handleRate} 
            t={t} 
            bp={bp} 
          />

          <View style={[bp.isLarge && styles.flex1]}>
            <DetailActions 
              featuredTrailer={featuredTrailer} 
              movieStatus={getMovieStatus(movie.id)}
              isFavorite={isFavorite(movie.id)}
              onPlay={() => featuredTrailer && openTrailer(featuredTrailer.key)} 
              onWatchlist={handleWatchlist} 
              onMarkWatched={handleMarkWatched}
              onWriteReview={handleWriteReview}
              onEditReview={handleEditReview}
              onToggleFavorite={handleToggleFavorite}
              t={t} 
            />

          </View>
        </View>

        {/* Full-width sections on desktop for videos, cast, details, and reviews to maintain perfect symmetry */}
        <View style={[bp.isLarge && styles.largeContentFull]}>
          <DetailStory 
            overview={movie.overview || ''} 
            keywords={keywords} 
            t={t} 
          />

          <DetailTrailers 
            videos={videos} 
            featuredTrailer={featuredTrailer} 
            onOpenTrailer={openTrailer} 
            t={t} 
          />

          {/* ── TV Show Season & Episode Selector ─────────────── */}
          {type === 'tv' && (movie as any).seasons && (movie as any).seasons.length > 0 && (
            <View style={styles.episodesSection}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                {t('seasons') || 'Seasons'}
                {'  '}
                <Text style={styles.sectionSubcount}>
                  ({((movie as any).seasons as any[]).filter((s: any) => s.season_number > 0).length})
                </Text>
              </Text>

              {/* Season pill selector */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.seasonPills}
              >
                {((movie as any).seasons as any[])
                  .filter((s: any) => s.season_number > 0)
                  .map((s: any) => {
                    const isActive = selectedSeason === s.season_number;
                    return (
                      <TouchableOpacity
                        key={s.id ?? s.season_number}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedSeason(s.season_number);
                          loadEpisodes(Number(actualId), s.season_number);
                        }}
                        style={[
                          styles.seasonPill,
                          isActive && styles.seasonPillActive,
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.seasonPillText,
                            isActive && styles.seasonPillTextActive,
                          ]}
                          maxFontSizeMultiplier={1.3}
                        >
                          {s.name || `Season ${s.season_number}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              {/* Season progress bar */}
              {episodes.length > 0 && !episodesLoading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressText} maxFontSizeMultiplier={1.3}>
                      {t('episodeProgress')
                        .replace('{watched}', String(watchedCount))
                        .replace('{total}', String(episodes.length))} ({Math.round(progressPercent)}%)
                    </Text>
                    {progressPercent === 100 && (
                      <View style={styles.completedBadge}>
                        <CheckCircle2 size={14} color={Colors.success} />
                        <Text style={styles.completedBadgeText} maxFontSizeMultiplier={1.3}>
                          {t('seasonCompleted')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              )}

              {/* Episode list */}
              {episodesLoading ? (
                <View style={{ gap: Spacing.sm, marginVertical: 20 }}>
                  <Shimmer height={60} borderRadius={Radius.md} />
                  <Shimmer height={60} borderRadius={Radius.md} />
                  <Shimmer height={60} borderRadius={Radius.md} />
                </View>
              ) : episodes.length === 0 ? (
                <View style={styles.emptyEpisodes}>
                  <Text style={styles.emptyEpisodesTitle} maxFontSizeMultiplier={1.3}>
                    {t('noEpisodesFound')}
                  </Text>
                  <Text style={styles.emptyEpisodesSub} maxFontSizeMultiplier={1.3}>
                    {t('noEpisodesFoundSub')}
                  </Text>
                </View>
              ) : (
                <View style={styles.episodeList}>
                  {episodes.map((ep: any) => {
                    const isExpanded = expandedEpisodeId === ep.id;
                    const isWatched = isEpisodeWatched(Number(actualId), selectedSeason, ep.episode_number);
                    return (
                      <View
                        key={ep.id}
                        style={[
                          styles.episodeCard,
                          isExpanded && styles.episodeCardExpanded,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {/* Checkmark Button */}
                          <TouchableOpacity
                            style={[styles.checkBtn, cursorPointer]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              toggleEpisodeWatch(Number(actualId), selectedSeason, ep.episode_number);
                            }}
                            activeOpacity={0.7}
                          >
                            <CheckCircle2
                              size={22}
                              color={isWatched ? Colors.primary : 'rgba(255,255,255,0.2)'}
                              fill={isWatched ? `${Colors.primary}30` : 'transparent'}
                            />
                          </TouchableOpacity>

                          {/* Card Content (Expandable) */}
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setExpandedEpisodeId(isExpanded ? null : ep.id);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={styles.episodeHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.episodeNum} maxFontSizeMultiplier={1.3}>
                                  EP {ep.episode_number}
                                </Text>
                                <Text
                                  style={[styles.episodeTitle, isWatched && styles.episodeTitleWatched]}
                                  numberOfLines={isExpanded ? undefined : 1}
                                  maxFontSizeMultiplier={1.3}
                                >
                                  {ep.name}
                                </Text>
                              </View>
                              <Text style={styles.episodeDate} maxFontSizeMultiplier={1.3}>
                                {ep.air_date ? ep.air_date.substring(0, 4) : '—'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>

                        {isExpanded && ep.overview ? (
                          <Text style={styles.episodeOverview} maxFontSizeMultiplier={1.3}>
                            {ep.overview}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {credits.length > 0 && (
            <View style={styles.castSection}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>{t('topCast')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {credits.map((actor) => (
                  <CastCard 
                    key={actor.id} 
                    cast={actor} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: '/person/[id]', params: { id: actor.id, name: actor.name } });
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>{t('details')}</Text>
            <MovieDetailTable movie={movie} />
          </View>

          <ReviewFeed movieId={Number(actualId)} />
        </View>

        <View style={[bp.isLarge && styles.largeContentFull]}>
          {similar.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>{t('moreLikeThis')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {similar.map((item) => (
                  <PosterCard 
                    key={item.id} 
                    movie={item} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/movie/${item.id}?type=${type}`);
                    }} 
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      <TouchableOpacity 
        style={[styles.backBtn, { top: insets.top + 10 }, cursorPointer]} 
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}
      >
        <ChevronLeft size={IconSize.md} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.shareBtn, { top: insets.top + 10 }, cursorPointer]} 
        onPress={handleShare}
      >
        <Share2 size={IconSize.sm} color={Colors.white} strokeWidth={2} />
      </TouchableOpacity>

      <LogModal 
        visible={showLogModal} 
        movie={{ ...movie, media_type: type } as any} 
        onClose={() => setShowLogModal(false)} 
        existingLog={userLogs.find(l => l.movie_id === movie.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center'
  },
  shareBtn: {
    position: 'absolute', right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center'
  },
  castSection: { paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10 },
  detailsSection: { paddingHorizontal: 24, paddingTop: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10, paddingBottom: 24 },
  sectionTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, marginBottom: 16, paddingHorizontal: 24 },
  hScroll: { paddingHorizontal: 24, gap: 16 },
  similarSection: { paddingTop: 24, paddingBottom: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.overlay.light50, marginTop: 12 },

  // TV Season/Episode styles
  episodesSection: {
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderColor: Colors.overlay.light10,
  },
  seasonPills: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  seasonPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  seasonPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  seasonPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  seasonPillTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeight.bold,
  },
  episodeList: {
    paddingHorizontal: 24,
    gap: 10,
  },
  episodeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  episodeCardExpanded: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.surfaceElevated,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  episodeNum: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  episodeTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    paddingRight: 8,
  },
  episodeDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.xs,
    paddingTop: 2,
  },
  episodeOverview: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    marginTop: 10,
    lineHeight: 20,
  },
  sectionSubcount: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  completedBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.overlay.light10,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  emptyEpisodes: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyEpisodesTitle: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptyEpisodesSub: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  checkBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeTitleWatched: {
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },

  errorWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: Colors.background },
  errorTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 20, textAlign: 'center' },
  errorSub: { color: Colors.overlay.light60, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  largeCenter: { alignItems: 'center' },
  largeContentRow: { flexDirection: 'row', width: '100%', maxWidth: 1200, paddingHorizontal: 40 }, // Assuming 1200 as bp.maxContentWidth
  largeContentFull: { width: '100%', maxWidth: 1200, paddingHorizontal: 40 },
  flex1: { flex: 1 },
  bottomSpacer: { height: 100 },
});
