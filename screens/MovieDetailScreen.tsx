import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Share, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ChevronLeft, Share2, Info } from 'lucide-react-native';

import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { useWatchlist } from '@/context/WatchlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLanguage } from '@/context/LanguageContext';
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
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getRating, addToRecentlyViewed, getMovieStatus, registerMovieLog, toggleWatched, isHydrated } = useWatchlist();
  const { userLogs, addLog } = useSocial();
  
  const { status, data, error } = useMovieDetail(Number(actualId), type);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // TV Show states — season & episode selector
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<number | null>(null);

  const loadEpisodes = useCallback(async (tvId: number, season: number) => {
    setEpisodesLoading(true);
    setExpandedEpisodeId(null);
    try {
      const res = await getTVSeasonDetails(tvId, season);
      if (res && res.episodes) {
        setEpisodes(res.episodes);
      }
    } catch (err) {
      console.error(err);
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
      loadEpisodes(Number(actualId), selectedSeason);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, actualId]);

  if (!isHydrated || status === 'loading') {
    return <MovieDetailSkeleton />;
  }

  if (status === 'error' || !data?.movie) {
    return (
      <View style={styles.errorWrapper}>
        <Info size={48} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.errorTitle} allowFontScaling={false}>
          {t('contentNotFound')}
        </Text>
        <Text style={styles.errorSub} allowFontScaling={false}>
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
        Alert.alert('Gagal', 'Gagal menandai film sebagai sudah ditonton.');
      }
    } catch (err: any) {
      console.error('[DetailScreen] mark watched failed:', err);
      Alert.alert('Error', err.message || 'Terjadi kesalahan saat menyimpan log.');
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
    try {
      const mediaTitle = 'title' in movie ? movie.title : movie.name;
      await Share.share({
        message: `Check out "${mediaTitle}" on CineList! ⭐ ${movie.vote_average?.toFixed(1)}/10`,
        title: mediaTitle,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const featuredTrailer = videos.find(v => v.type === "Trailer");

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
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
              onPlay={() => featuredTrailer && openTrailer(featuredTrailer.key)} 
              onWatchlist={handleWatchlist} 
              onMarkWatched={handleMarkWatched}
              onWriteReview={handleWriteReview}
              onEditReview={handleEditReview}
              t={t} 
            />

            <DetailTrailers 
              videos={videos} 
              featuredTrailer={featuredTrailer} 
              onOpenTrailer={openTrailer} 
              t={t} 
            />

            <DetailStory 
              overview={movie.overview || ''} 
              keywords={keywords} 
              t={t} 
            />

            {/* ── TV Show Season & Episode Selector ─────────────── */}
            {type === 'tv' && (movie as any).seasons && (movie as any).seasons.length > 0 && (
              <View style={styles.episodesSection}>
                <Text style={styles.sectionTitle} allowFontScaling={false}>
                  {t('seasons' as any) || 'Seasons'}
                  {'  '}
                  <Text style={styles.sectionSubcount}>
                    ({(movie as any).number_of_seasons || (movie as any).seasons.length})
                  </Text>
                </Text>

                {/* Season pill selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.seasonPills}
                >
                  {((movie as any).seasons as any[]).map((s: any) => {
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
                          allowFontScaling={false}
                        >
                          {s.name || `Season ${s.season_number}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Episode list */}
                {episodesLoading ? (
                  <View style={{ gap: Spacing.sm, marginVertical: 20 }}>
                    <Shimmer height={60} borderRadius={Radius.md} />
                    <Shimmer height={60} borderRadius={Radius.md} />
                    <Shimmer height={60} borderRadius={Radius.md} />
                  </View>
                ) : (
                  <View style={styles.episodeList}>
                    {episodes.map((ep: any) => {
                      const isExpanded = expandedEpisodeId === ep.id;
                      return (
                        <TouchableOpacity
                          key={ep.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setExpandedEpisodeId(isExpanded ? null : ep.id);
                          }}
                          activeOpacity={0.8}
                          style={[
                            styles.episodeCard,
                            isExpanded && styles.episodeCardExpanded,
                          ]}
                        >
                          <View style={styles.episodeHeader}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={styles.episodeNum}
                                allowFontScaling={false}
                              >
                                EP {ep.episode_number}
                              </Text>
                              <Text
                                style={styles.episodeTitle}
                                numberOfLines={isExpanded ? undefined : 1}
                                allowFontScaling={false}
                              >
                                {ep.name}
                              </Text>
                            </View>
                            <Text
                              style={styles.episodeDate}
                              allowFontScaling={false}
                            >
                              {ep.air_date
                                ? ep.air_date.substring(0, 4)
                                : '—'}
                            </Text>
                          </View>
                          {isExpanded && ep.overview ? (
                            <Text
                              style={styles.episodeOverview}
                              allowFontScaling={false}
                            >
                              {ep.overview}
                            </Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {credits.length > 0 && (
              <View style={styles.castSection}>
                <Text style={styles.sectionTitle} allowFontScaling={false}>{t('topCast')}</Text>
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
              <Text style={styles.sectionTitle} allowFontScaling={false}>{t('details')}</Text>
              <MovieDetailTable movie={movie} />
            </View>

            <ReviewFeed movieId={Number(actualId)} />
          </View>
        </View>

        <View style={[bp.isLarge && styles.largeContentFull]}>
          {similar.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>{t('moreLikeThis')}</Text>
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

      <LogModal 
        visible={showLogModal} 
        movie={movie} 
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
