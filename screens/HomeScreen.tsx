import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, StatusBar, Animated, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Bell, Play, Plus, Star, Flame, Award, Clock, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react-native';
import SectionHeader from '../components/common/SectionHeader';
import Avatar from '../components/common/Avatar';
import ActivityFeed from '../components/movie/ActivityFeed';
import { MediaCard } from '../components/movie/MediaCard';
import { Colors, Spacing, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useTrending, usePopular, useTopRated, useTrendingTV, useTopRatedTV } from '../hooks/useMovies';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useLanguage } from '../context/LanguageContext';
import { Movie } from '../types';

// ─── Sidebar widths (must match _layout.tsx) ─────────────────────────────────
const SIDEBAR_FULL = 240;
const SIDEBAR_ICON = 72;

// ─── Genre data ──────────────────────────────────────────────────────────────
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

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function SkeletonRow({ cardWidth, pad }: { cardWidth: number; pad: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] });
  const cardHeight = Math.round(cardWidth * 1.5);
  return (
    <Animated.View style={{ flexDirection: 'row', paddingLeft: pad, opacity, minHeight: cardHeight }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={{ width: cardWidth, height: cardHeight, borderRadius: Radius.md, backgroundColor: Colors.surface, marginRight: 10 }} />
      ))}
    </Animated.View>
  );
}

function HeroSkeleton({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height, backgroundColor: '#1a1a1a', padding: 28, justifyContent: 'flex-end' }}>
      <View style={{ width: '70%', height: 40, backgroundColor: '#2a2a2a', borderRadius: 8, marginBottom: 12 }} />
      <View style={{ width: '40%', height: 16, backgroundColor: '#2a2a2a', borderRadius: 4, marginBottom: 24 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 140, height: 46, backgroundColor: '#2a2a2a', borderRadius: Radius.sm }} />
        <View style={{ width: 120, height: 46, backgroundColor: '#2a2a2a', borderRadius: Radius.sm }} />
      </View>
    </View>
  );
}

// MediaCard is now in components/movie/MediaCard.tsx (memoized + animated)

// ─── Scrollable Section Row with arrow nav for tablet/desktop ────────────────
interface MediaRowProps {
  data: any[];
  cardWidth: number;
  pad: number;
  onPress: (m: any) => void;
  isLarge?: boolean;
}

const MediaRow = React.memo(({ data, cardWidth, pad, onPress, isLarge }: MediaRowProps) => {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX,  setScrollX]  = useState(0);
  const [maxScroll, setMaxScroll] = useState(1);

  if (!data.length) return null;

  // Step = 4 cards at a time
  const STEP = (cardWidth + 10) * 4;

  const scrollLeft  = () => scrollRef.current?.scrollTo({ x: Math.max(0, scrollX - STEP), animated: true });
  const scrollRight = () => scrollRef.current?.scrollTo({ x: Math.min(maxScroll, scrollX + STEP), animated: true });

  const atStart = scrollX <= 4;
  const atEnd   = scrollX >= maxScroll - 4;

  return (
    <View style={sr.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: pad, paddingRight: pad, paddingBottom: 4, gap: 10 }}
        onScroll={e => setScrollX(e.nativeEvent.contentOffset.x)}
        onContentSizeChange={(w, _) => setMaxScroll(w)}
        scrollEventThrottle={16}
      >
        {data.map((m: any) => (
          <MediaCard key={m.id} {...m} width={cardWidth} onPress={() => onPress(m)} />
        ))}
      </ScrollView>

      {/* Arrow buttons — only on tablet/desktop */}
      {isLarge && (
        <>
          <TouchableOpacity
            style={[sr.arrow, sr.arrowLeft, atStart && sr.arrowDisabled]}
            onPress={scrollLeft}
            activeOpacity={0.75}
            disabled={atStart}
          >
            <ChevronLeft size={20} color={atStart ? 'rgba(255,255,255,0.25)' : '#fff'} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[sr.arrow, sr.arrowRight, atEnd && sr.arrowDisabled]}
            onPress={scrollRight}
            activeOpacity={0.75}
            disabled={atEnd}
          >
            <ChevronRight size={20} color={atEnd ? 'rgba(255,255,255,0.25)' : '#fff'} strokeWidth={2.5} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

const sr = StyleSheet.create({
  wrap: { position: 'relative' },
  arrow: {
    position: 'absolute',
    top: '30%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,20,20,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  arrowLeft:     { left: 6 },
  arrowRight:    { right: 6 },
  arrowDisabled: { opacity: 0.35 },
});

// ─── Hero Carousel ───────────────────────────────────────────────────────────
interface HeroProps {
  items: any[];
  contentWidth: number;  // <-- width of the content area (total - sidebar)
  onPressItem: (item: any) => void;
  onToggleWL: (item: any) => void;
  isInWatchlist: (id: number) => boolean;
  heroHeight: number;
}
function HeroCarousel({ items, contentWidth, onPressItem, onToggleWL, isInWatchlist, heroHeight }: HeroProps) {
  const [idx, setIdx] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const ref  = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slides = items.slice(0, 5);

  useEffect(() => {
    // Wait for the app to settle before enabling the full carousel
    const readyTimer = setTimeout(() => setIsReady(true), 3000);
    return () => clearTimeout(readyTimer);
  }, []);

  const scrollTo = useCallback((i: number) => {
    const c = Math.max(0, Math.min(i, slides.length - 1));
    setIdx(c);
    ref.current?.scrollTo({ x: c * contentWidth, animated: true });
  }, [slides.length, contentWidth]);

  const startAuto = useCallback(() => {
    timer.current = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % slides.length;
        ref.current?.scrollTo({ x: next * contentWidth, animated: true });
        return next;
      });
    }, 7000); // increased from 5000 to reduce JS main-thread load
  }, [slides.length, contentWidth]);

  useEffect(() => {
    if (!isReady) return;
    startAuto();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startAuto, isReady]);

  const resetAuto = () => { if (timer.current) clearInterval(timer.current); startAuto(); };

  if (!slides.length) return null;
  const cur = slides[idx];
  const inWL = isInWatchlist(cur?.id);

  return (
    <View style={{ width: contentWidth, height: heroHeight, minHeight: heroHeight }}>
      {/* Backdrop slides */}
      {!isReady ? (
        <View style={{ width: contentWidth, height: heroHeight }}>
          <Image
            source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${slides[0].backdrop_path}` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            priority="high"
            accessibilityLabel={slides[0].title || slides[0].name || 'Movie backdrop'}
          />
          <LinearGradient
            colors={['rgba(20,20,20,0.02)', 'rgba(20,20,20,0.45)', '#141414']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        <ScrollView ref={ref} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false}>
          {slides.map((m, i) => (
            <View key={m.id} style={{ width: contentWidth, height: heroHeight }}>
              <Image
                source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${m.backdrop_path}` }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                priority={i === 0 ? 'high' : 'low'}
                accessibilityLabel={m.title || m.name || 'Movie backdrop'}
              />
              <LinearGradient
                colors={['rgba(20,20,20,0.02)', 'rgba(20,20,20,0.45)', '#141414']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Overlay content */}
      <View style={s.heroContent}>
        <Text style={s.heroTitle} numberOfLines={2} allowFontScaling={false}>{cur?.title}</Text>
        <View style={s.heroMeta}>
          <View style={s.ratingPill}>
            <Star size={11} color="#F5C518" fill="#F5C518" strokeWidth={0} />
            <Text style={s.ratingScore} allowFontScaling={false}>{cur?.vote_average?.toFixed(1)}</Text>
          </View>
          <Text style={s.heroYear} allowFontScaling={false}>{cur?.release_date?.split('-')[0]}</Text>
        </View>
        <View style={s.heroButtons}>
          <TouchableOpacity style={s.playBtn} activeOpacity={0.85} onPress={() => onPressItem(cur)}>
            <Play size={14} color="#000" fill="#000" strokeWidth={0} />
            <Text style={s.playBtnText} allowFontScaling={false}>Watch Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.wlBtn, inWL && s.wlBtnActive]} activeOpacity={0.85} onPress={() => onToggleWL(cur)}>
            {inWL ? <Bookmark size={16} color="#fff" fill="#fff" strokeWidth={0} /> : <Plus size={18} color="#fff" strokeWidth={2.5} />}
            <Text style={s.wlBtnText} allowFontScaling={false}>My List</Text>
          </TouchableOpacity>
        </View>
        <View style={s.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => { scrollTo(i); resetAuto(); }}>
              <View style={[s.dot, i === idx && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Arrow buttons */}
      <TouchableOpacity style={[s.arrow, { left: 14 }]} onPress={() => { scrollTo(idx - 1); resetAuto(); }} activeOpacity={0.75}>
        <ChevronLeft size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity style={[s.arrow, { right: 14 }]} onPress={() => { scrollTo(idx + 1); resetAuto(); }} activeOpacity={0.75}>
        <ChevronRight size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, recentlyViewed } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const bp = useBreakpoint();
  const { t } = useLanguage();
  const [visibleSections, setVisibleSections] = useState(1);
  const [homeTab, setHomeTab] = useState<'discover' | 'following'>('discover');

  const { data: trendingData,   isLoading: lt,   refetch: rt   } = useTrending();
  const { data: popularData,    isLoading: lp,   refetch: rp   } = usePopular();
  const { data: topRatedData,   isLoading: ltr,  refetch: rtr  } = useTopRated();
  const { data: trendingTVData, isLoading: ltv,  refetch: rtv  } = useTrendingTV();
  const { data: topRatedTVData, isLoading: lrtv, refetch: rrtv } = useTopRatedTV();

  const trending   = ((trendingData   as Movie[] | null) ?? []).filter(m => !m.adult);
  const popular    = ((popularData    as Movie[] | null) ?? []).filter(m => !m.adult);
  const topRated   = ((topRatedData   as Movie[] | null) ?? []).filter(m => !m.adult);
  const trendingTV = ((trendingTVData as Movie[] | null) ?? []).filter(m => !m.adult);
  const topRatedTV = ((topRatedTVData as Movie[] | null) ?? []).filter(m => !m.adult);
  const loading    = lt || lp || ltr;

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { await Promise.allSettled([rt(), rp(), rtr(), rtv(), rrtv()]); }
    finally { setRefreshing(false); }
  };

  const goToMovie = (movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const type = movie.media_type || (('first_air_date' in movie) ? 'tv' : 'movie');
    router.push({ pathname: '/movie/[id]', params: { id: movie.id.toString(), type } } as any);
  };
  const toggleWL = (movie: Movie) => {
    if (!user) {
      (global as any).showLoginPrompt?.();
      return;
    }
    const has = isInWatchlist(movie.id);
    Haptics.notificationAsync(has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    has ? removeFromWatchlist(movie.id) : addToWatchlist(movie as any);
  };

  const recentMovies = useMemo(() => {
    const all = [...trending, ...popular, ...topRated, ...trendingTV, ...topRatedTV];
    return recentlyViewed.map(id => all.find((m) => m.id === id)).filter((m): m is Movie => m != null).slice(0, 10);
  }, [recentlyViewed, trending, popular, topRated, trendingTV, topRatedTV]);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(20,20,20,0)', 'rgba(20,20,20,0.97)'],
    extrapolate: 'clamp',
  });

  const username  = profile?.data?.username || user?.user_metadata?.username || user?.email || 'User';
  const avatarUrl = profile?.data?.avatar_url || user?.user_metadata?.avatar_url;

  const sidebarW    = bp.isDesktop ? SIDEBAR_FULL : bp.isTablet ? SIDEBAR_ICON : 0;
  const contentWidth = Math.min(bp.width - sidebarW, bp.maxContentWidth);
  const HERO_HEIGHT = bp.isDesktop ? 600 : bp.isTablet ? 500 : 480;
  const CARD = bp.isDesktop ? 175 : bp.isTablet ? 150 : 130;
  const PAD  = bp.isDesktop ? 36 : bp.isTablet ? 24 : 20;
  const N = bp.isDesktop ? 20 : bp.isTablet ? 15 : 12;

  const rowProps = { cardWidth: CARD, pad: PAD, onPress: goToMovie, isLarge: bp.isLarge };

  const loadMore = () => {
    if (visibleSections < 5) {
      setVisibleSections(prev => prev + 1);
    }
  };

  const renderHeader = () => (
    <>
      {/* ── HERO ── */}
      {lt ? (
        <HeroSkeleton width={contentWidth} height={HERO_HEIGHT} />
      ) : trending.length > 0 ? (
        <HeroCarousel
          items={trending}
          contentWidth={contentWidth}
          heroHeight={HERO_HEIGHT}
          onPressItem={goToMovie}
          onToggleWL={toggleWL}
          isInWatchlist={isInWatchlist}
        />
      ) : null}

      <View style={s.body}>
        {bp.isLarge && (
          <View style={{ paddingHorizontal: PAD, paddingTop: 28, paddingBottom: 4 }}>
            <Text style={s.browseTitle} allowFontScaling={false}>{t('browse')}</Text>
            <Text style={s.browseSub}   allowFontScaling={false}>{t('browseSub')}</Text>
          </View>
        )}

        <View style={[s.tabSwitcher, { paddingHorizontal: PAD }]}>
          <TouchableOpacity 
            style={[s.tabItem, homeTab === 'discover' && s.tabItemActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHomeTab('discover');
            }}
          >
            <Text style={[s.tabItemText, homeTab === 'discover' && s.tabItemTextActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabItem, homeTab === 'following' && s.tabItemActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHomeTab('following');
            }}
          >
            <Text style={[s.tabItemText, homeTab === 'following' && s.tabItemTextActive]}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const sections = useMemo(() => {
    if (homeTab === 'following') return [{ id: 'activity-feed', type: 'feed' }];
    
    const items = [
      { id: 'trending-movies', type: 'row', title: t('trendingMovies'), icon: Flame, iconColor: "#E50914", data: trending, category: 'trending-movies' },
      { id: 'trending-tv',     type: 'row', title: t('trendingShows'),  icon: Flame, iconColor: "#FF6B35", data: trendingTV, category: 'trending-tv' },
      { id: 'popular',         type: 'row', title: t('popular'),        icon: Star,  iconColor: "#F5C518", data: popular, category: 'popular' },
      { id: 'top-rated-movies',type: 'row', title: t('topRatedMovies'), icon: Award, iconColor: "#4CAF50", data: topRated, category: 'top-rated-movies' },
      { id: 'top-rated-tv',    type: 'row', title: t('topRatedShows'),  icon: Award, iconColor: "#2196F3", data: topRatedTV, category: 'top-rated-tv' },
      { id: 'genres',          type: 'genres' },
      { id: 'recent',          type: 'row', title: t('recentlyViewed'), icon: Clock, iconColor: "#E50914", data: recentMovies },
    ];
    
    return items.slice(0, visibleSections + 2);
  }, [homeTab, trending, trendingTV, popular, topRated, topRatedTV, recentMovies, visibleSections, t]);

  const renderSection = ({ item }: { item: any }) => {
    if (item.type === 'feed') {
      return (
        <View style={{ paddingHorizontal: PAD, paddingTop: 10 }}>
          <ActivityFeed />
        </View>
      );
    }

    if (item.type === 'genres') {
      return (
        <View style={{ paddingBottom: 20 }}>
          <SectionHeader title={t('browseByGenre')} Icon={Flame} iconColor="#6C5CE7" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search' as any)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: PAD, paddingRight: PAD, paddingBottom: 4, gap: 10 }}>
            {GENRES.map(g => {
              const gW = bp.isDesktop ? 160 : bp.isTablet ? 140 : 120;
              const gH = Math.round(gW * 0.62);
              return (
                <TouchableOpacity key={g.id} style={{ width: gW, height: gH, borderRadius: Radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.82} onPress={() => router.push(`/(tabs)/search?genre=${g.id}` as any)}>
                  <Image source={{ uri: `${TMDB_IMAGE_SIZES.thumb}${g.image}` }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
                  <Text style={s.genreName} allowFontScaling={false}>{t(g.nameKey as any)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (item.data.length === 0 && !loading) return null;

    return (
      <View style={{ paddingBottom: 10 }}>
        <SectionHeader 
          title={item.title} 
          Icon={item.icon} 
          iconColor={item.iconColor} 
          textColor="#fff" 
          actionLabel={item.category ? t('seeAll') : undefined} 
          onAction={item.category ? () => router.push(`/(tabs)/search?category=${item.category}` as any) : undefined} 
        />
        {loading ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={item.data.slice(0, N)} />}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {bp.isMobile && (
        <Animated.View style={[s.header, { backgroundColor: headerBg, paddingTop: Math.max(insets.top, 20), paddingBottom: 14 }]}>
          <Text style={s.logo} allowFontScaling={false}>WATCHLISTID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={s.avatar} onPress={() => router.push('/(tabs)/profile')}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E50914" colors={['#E50914']} />}
        contentContainerStyle={{
          alignSelf: 'center',
          width: '100%',
          maxWidth: bp.maxContentWidth,
          paddingBottom: 100
        }}
      />
    </View>
  );
}

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141414' },

  // Mobile header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  logo:    { fontSize: 20, fontWeight: '900', color: '#E50914', letterSpacing: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E50914',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#141414',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.black,
    color: Colors.white,
  },
  avatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: FontSize.lg, color: Colors.white, fontWeight: FontWeight.bold },

  // Hero
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, alignItems: 'center',
  },
  heroTitle: {
    fontSize: FontSize.h1 * 1.1, fontWeight: FontWeight.black, color: Colors.white,
    letterSpacing: -0.5, lineHeight: 42, marginBottom: Spacing.sm, textAlign: 'center',
    textShadowColor: Colors.overlay.dark, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  heroMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.18)', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  ratingScore:{ fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.ratingGold },
  heroYear:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroButtons:{ flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center', marginBottom: 16 },
  playBtn:    { flex: 1, maxWidth: 165, height: 46, backgroundColor: Colors.white, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playBtnText:{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.dark },
  wlBtn:      { flex: 1, maxWidth: 150, height: 46, backgroundColor: 'rgba(40,40,40,0.85)', borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  wlBtnActive:{ backgroundColor: Colors.primary + 'D9' },
  wlBtnText:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  dots:       { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive:  { width: 22, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  arrow: {
    position: 'absolute', top: '42%',
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  // Body
  body:        { paddingTop: Spacing.sm, paddingHorizontal: Spacing.xl },
  browseTitle: { fontSize: FontSize.h1, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.3 },
  browseSub:   { fontSize: FontSize.base, color: 'rgba(255,255,255,0.45)', marginTop: Spacing.xs },

  tabSwitcher: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabItem: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.accentBlue,
  },
  tabItemText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.4)',
  },
  tabItemTextActive: {
    color: Colors.white,
  },

  // Card (all sections)
  card: { borderRadius: Radius.md, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: Colors.surface },
  cardMeta:      { padding: 8 },
  cardRating:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  cardRatingTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.ratingGold },
  cardTitle:     { fontWeight: FontWeight.bold, color: Colors.white, lineHeight: 15 },

  // Genre
  genreName: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.4 },
});
