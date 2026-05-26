import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Flame, Star, Award, Clock, UserPlus } from 'lucide-react-native';

import Avatar from '@/components/common/Avatar';
import ActivityFeed from '@/components/movie/ActivityFeed';
import { MovieSkeleton } from '@/components/common/MovieSkeleton';
import SectionHeader from '@/components/common/SectionHeader';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { MediaRow } from '@/components/home/MediaRow';
import { GenreRow } from '@/components/home/GenreRow';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { useWatchlist } from '@/context/WatchlistContext';
import { useAuth } from '@/context/AuthContext';
import { useHomeData } from '@/hooks/useHomeData';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useLanguage } from '@/context/LanguageContext';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { MediaItem } from '@/types';

const GENRES = [
  { id: 28,    nameKey: 'genreAction',    image: '/ff2ti5DkA9UYLzyqhQfI2kZqEuh.jpg' },
  { id: 35,    nameKey: 'genreComedy',    image: '/rHTAgPq6ZGoj5CqxFAh04Q3hJWH.jpg' },
  { id: 18,    nameKey: 'genreDrama',     image: '/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg' },
  { id: 27,    nameKey: 'genreHorror',    image: '/ecKQlAEG95k62SMGhvX83oEqANK.jpg' },
  { id: 878,   nameKey: 'genreSciFi',    image: '/2ssWTSVklAEc98frZUQhgtGHx7s.jpg' },
  { id: 10749, nameKey: 'genreRomance',   image: '/qBChUbS8ksbJoPTfZpogsnxG5tY.jpg' },
  { id: 12,    nameKey: 'genreAdventure', image: '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg' },
  { id: 80,    nameKey: 'genreCrime',     image: '/cfT29Im5VDvjE0RpyKOSdCKZal7.jpg' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, recentlyViewed } = useWatchlist();
  const scrollY = useRef(new Animated.Value(0)).current;
  const bp = useBreakpoint();
  const { t } = useLanguage();
  const [visibleSections, setVisibleSections] = useState(1);
  const [homeTab, setHomeTab] = useState<'discover' | 'following'>('discover');

  const { state: homeState, isRefreshing, onRefresh, isDeferredLoading, deferredEnabled } = useHomeData();
  const { trending, popular, topRated, trendingTV, topRatedTV } = homeState.data || {
    trending: [], popular: [], topRated: [], trendingTV: [], topRatedTV: []
  };
  const isLoading = homeState.status === 'loading';

  const { showLoginPrompt } = useLoginPrompt();

  const goToMovie = (id: number, type: 'movie' | 'tv') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/movie/[id]', params: { id: id.toString(), type } });
  };

  const toggleWL = (item: MediaItem) => {
    if (!user) {
      showLoginPrompt();
      return;
    }
    const has = isInWatchlist(item.id);
    Haptics.notificationAsync(has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    has ? removeFromWatchlist(item.id) : addToWatchlist(item);
  };

  const recentMovies = useMemo(() => {
    const all = [...trending, ...popular, ...topRated, ...trendingTV, ...topRatedTV];
    return recentlyViewed.map(id => all.find(m => m.id === id)).filter((m): m is MediaItem => m != null).slice(0, 10);
  }, [recentlyViewed, trending, popular, topRated, trendingTV, topRatedTV]);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Colors.overlay.dark50, 'rgba(20,20,20,0.97)'],
    extrapolate: 'clamp',
  });

  const username = profile?.data?.username || user?.user_metadata?.username || user?.email || 'User';
  const avatarUrl = profile?.data?.avatar_url || user?.user_metadata?.avatar_url;

  const sidebarW = bp.isDesktop ? 240 : bp.isTablet ? 72 : 0;
  const contentWidth = Math.min(bp.width - sidebarW, bp.maxContentWidth);
  const HERO_HEIGHT = bp.isDesktop ? 600 : bp.isTablet ? 500 : 480;
  const CARD = bp.isDesktop ? 175 : bp.isTablet ? 150 : 130;
  const PAD = bp.isDesktop ? 36 : bp.isTablet ? 24 : 20;

  const loadMore = () => {
    if (visibleSections < 5) setVisibleSections(prev => prev + 1);
  };

  const renderHeader = () => (
    <>
      {isLoading ? (
        <View style={[s.heroSkeleton, { width: contentWidth, height: HERO_HEIGHT }]} />
      ) : trending.length > 0 ? (
        <HeroCarousel
          data={trending}
          width={contentWidth}
          height={HERO_HEIGHT}
          onPressItem={goToMovie}
        />
      ) : null}

      <View style={[s.body, { paddingHorizontal: PAD }]}>
        {bp.isLarge && (
          <View style={s.browseHeader}>
            <Text style={s.browseTitle} allowFontScaling={false}>{t('browse')}</Text>
            <Text style={s.browseSub} allowFontScaling={false}>{t('browseSub')}</Text>
          </View>
        )}

        <View style={s.tabSwitcher}>
          <TouchableOpacity 
            style={[s.tabItem, homeTab === 'discover' && s.tabItemActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHomeTab('discover'); }}
          >
            <Text style={[s.tabItemText, homeTab === 'discover' && s.tabItemTextActive]}>{t('tabDiscover')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabItem, homeTab === 'following' && s.tabItemActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHomeTab('following'); }}
          >
            <Text style={[s.tabItemText, homeTab === 'following' && s.tabItemTextActive]}>{t('following')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const sections = useMemo(() => {
    if (homeTab === 'following') return [{ id: 'activity-feed', type: 'feed' }];
    const items = [
      { id: 'trending-movies', type: 'row', title: t('trendingMovies'), icon: Flame, iconColor: Colors.danger, data: trending, category: 'trending-movies', mediaType: 'movie' },
      { id: 'trending-tv',     type: 'row', title: t('trendingShows'),  icon: Flame, iconColor: "#FF6B35", data: trendingTV, category: 'trending-tv', mediaType: 'tv' },
      { id: 'popular',         type: 'row', title: t('popular'),        icon: Star,  iconColor: Colors.ratingGold, data: popular, category: 'popular', mediaType: 'movie' },
      { id: 'top-rated-movies',type: 'row', title: t('topRatedMovies'), icon: Award, iconColor: "#4CAF50", data: topRated, category: 'top-rated-movies', mediaType: 'movie' },
      { id: 'top-rated-tv',    type: 'row', title: t('topRatedShows'),  icon: Award, iconColor: "#2196F3", data: topRatedTV, category: 'top-rated-tv', mediaType: 'tv' },
      { id: 'genres',          type: 'genres' },
      { id: 'recent',          type: 'row', title: t('recentlyViewed'), icon: Clock, iconColor: Colors.danger, data: recentMovies, mediaType: 'movie' },
    ];
    return items.slice(0, visibleSections + 2);
  }, [homeTab, trending, trendingTV, popular, topRated, topRatedTV, recentMovies, visibleSections, t]);

  const renderSection = ({ item }: { item: any }) => {
    if (item.type === 'feed') {
      return (
        <View style={[s.feedContainer, { paddingHorizontal: PAD }]}>
          <ActivityFeed />
        </View>
      );
    }

    if (item.type === 'genres') {
      return (
        <View style={s.genreSection}>
          <SectionHeader 
            title={t('browseByGenre')} Icon={Flame} iconColor="#6C5CE7" textColor="#fff" 
            actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search')} 
          />
          <GenreRow 
            genres={GENRES} 
            pad={PAD} 
            onPress={(id) => router.push(`/(tabs)/search?genre=${id}`)} 
            t={t} 
            isDesktop={bp.isDesktop} 
            isTablet={bp.isTablet} 
          />
        </View>
      );
    }

    if (item.data.length === 0 && !isLoading && !isDeferredLoading) return null;
    if (item.data.length === 0 && isDeferredLoading) {
      return (
        <View style={s.rowSection}>
          <SectionHeader title={item.title} Icon={item.icon} iconColor={item.iconColor} textColor={Colors.white} />
          <View style={[s.skeletonRow, { paddingLeft: PAD }]}>
            <MovieSkeleton layout="horizontal" count={6} />
          </View>
        </View>
      );
    }

    return (
      <View style={s.rowSection}>
        <SectionHeader 
          title={item.title} Icon={item.icon} iconColor={item.iconColor} textColor={Colors.white} 
          actionLabel={item.category ? t('seeAll') : undefined} 
          onAction={item.category ? () => router.push(`/(tabs)/search?category=${item.category}`) : undefined} 
        />
        {isLoading ? (
          <View style={[s.skeletonRow, { paddingLeft: PAD }]}>
             <MovieSkeleton layout="horizontal" count={6} />
          </View>
        ) : (
          <MediaRow 
            data={item.data.slice(0, bp.isDesktop ? 20 : 12)} 
            cardWidth={CARD} 
            pad={PAD} 
            type={item.mediaType as 'movie' | 'tv'}
            onPress={goToMovie} 
          />
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {bp.isMobile && (
        <Animated.View style={[s.header, { backgroundColor: headerBg, paddingTop: Math.max(insets.top, 20) }]}>
          <Text style={s.logo} allowFontScaling={false}>WATCHLISTID</Text>
          <View style={s.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/search-users')}
              accessibilityRole="button"
              accessibilityLabel="Cari teman"
              style={[s.headerIcon, cursorPointer]}
            >
              <UserPlus size={20} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.avatar, cursorPointer]} onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button">
              <Avatar uri={avatarUrl} name={username} size={36} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Animated.FlatList
        data={sections}
        keyExtractor={item => item.id}
        renderItem={renderSection}
        ListHeaderComponent={renderHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.danger} colors={[Colors.danger]} />}
        contentContainerStyle={[s.listContent, { maxWidth: bp.maxContentWidth }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141414' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, justifyContent: 'space-between', paddingBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.danger, letterSpacing: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  body: { paddingTop: Spacing.sm },
  heroSkeleton: { backgroundColor: Colors.surface },
  browseHeader: { paddingTop: 28, paddingBottom: 4 },
  browseTitle: { fontSize: FontSize.h1, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.3 },
  browseSub: { fontSize: FontSize.base, color: Colors.text.secondary, marginTop: Spacing.xs },
  tabSwitcher: { flexDirection: 'row', gap: 20, marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.overlay.light10 },
  tabItem: { paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.accentBlue },
  tabItemText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text.secondary },
  tabItemTextActive: { color: Colors.white },
  feedContainer: { paddingTop: 10 },
  genreSection: { paddingBottom: 20 },
  rowSection: { paddingBottom: 10 },
  skeletonRow: { paddingBottom: 4, flexDirection: 'row', gap: 10 },
  listContent: { alignSelf: 'center', width: '100%', paddingBottom: 100 },
});
