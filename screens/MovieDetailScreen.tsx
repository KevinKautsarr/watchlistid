import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, Share, ActivityIndicator
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
import { useMovieDetail } from '@/hooks/useMovieDetail';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLanguage } from '@/context/LanguageContext';
import type { MediaItem } from '@/types';

import CastCard from '@/components/movie/CastCard';
import MovieDetailTable from '@/components/movie/MovieDetailTable';
import PosterCard from '@/components/common/PosterCard';
import LogModal from '@/components/movie/LogModal';
import ReviewFeed from '@/components/movie/ReviewFeed';

import { DetailHero } from '@/components/movie/detail/DetailHero';
import { DetailRatings } from '@/components/movie/detail/DetailRatings';
import { DetailActions } from '@/components/movie/detail/DetailActions';
import { DetailStory } from '@/components/movie/detail/DetailStory';
import { DetailTrailers } from '@/components/movie/detail/DetailTrailers';

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
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getRating, addToRecentlyViewed } = useWatchlist();
  
  const { status, data, error } = useMovieDetail(Number(actualId), type);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (actualId && status === 'success') {
      addToRecentlyViewed(Number(actualId));
    }
  }, [actualId, status, addToRecentlyViewed]);

  if (status === 'loading') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText} allowFontScaling={false}>{t('preparingExperience')}</Text>
      </View>
    );
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
              inWatchlist={inWatchlist} 
              userRating={userRating} 
              onPlay={() => featuredTrailer && openTrailer(featuredTrailer.key)} 
              onWatchlist={handleWatchlist} 
              onRate={handleRate} 
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
