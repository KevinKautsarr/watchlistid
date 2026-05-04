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
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  return (
    <Animated.View style={{ flexDirection: 'row', paddingLeft: pad, opacity }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={{ width: cardWidth, height: Math.round(cardWidth * 1.5), borderRadius: Radius.md, backgroundColor: Colors.surface, marginRight: 10 }} />
      ))}
    </Animated.View>
  );
}

// ─── Media Card ──────────────────────────────────────────────────────────────
interface MediaCardProps {
  poster_path?: string;
  title?: string;
  name?: string;
  vote_average?: number;
  onPress: () => void;
  width: number;
}
function MediaCard({ poster_path, title, name, vote_average, onPress, width }: MediaCardProps) {
  const height = Math.round(width * 1.5);
  return (
    <TouchableOpacity style={[s.card, { width, height }]} activeOpacity={0.82} onPress={onPress}>
      <Image
        source={{ uri: `${TMDB_IMAGE_SIZES.medium}${poster_path}` }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={s.cardMeta}>
        <View style={s.cardRating}>
          <Star size={9} color="#F5C518" fill="#F5C518" strokeWidth={0} />
          <Text style={s.cardRatingTxt} allowFontScaling={false}>{vote_average?.toFixed(1)}</Text>
        </View>
        <Text style={[s.cardTitle, { fontSize: width >= 170 ? 13 : 11 }]} numberOfLines={2} allowFontScaling={false}>
          {title || name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Scrollable Section Row with arrow nav for tablet/desktop ────────────────
interface MediaRowProps {
  data: any[];
  cardWidth: number;
  pad: number;
  onPress: (m: any) => void;
  isLarge?: boolean;
}

function MediaRow({ data, cardWidth, pad, onPress, isLarge }: MediaRowProps) {
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
}

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
}
function HeroCarousel({ items, contentWidth, onPressItem, onToggleWL, isInWatchlist }: HeroProps) {
  const [idx, setIdx] = useState(0);
  const ref  = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slides = items.slice(0, 8);

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
    }, 5000);
  }, [slides.length, contentWidth]);

  useEffect(() => {
    startAuto();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startAuto]);

  const resetAuto = () => { if (timer.current) clearInterval(timer.current); startAuto(); };

  if (!slides.length) return null;
  const cur = slides[idx];
  const inWL = isInWatchlist(cur?.id);

  const HERO_HEIGHT = contentWidth < 600 ? 480 : 520;

  return (
    <View style={{ width: contentWidth, height: HERO_HEIGHT }}>
      {/* Backdrop slides */}
      <ScrollView ref={ref} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false}>
        {slides.map((m) => (
          <View key={m.id} style={{ width: contentWidth, height: HERO_HEIGHT }}>
            <Image
              source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${m.backdrop_path}` }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(20,20,20,0.02)', 'rgba(20,20,20,0.45)', '#141414']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ))}
      </ScrollView>

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

  const { data: trendingData,   isLoading: lt,   refetch: rt   } = useTrending();
  const { data: popularData,    isLoading: lp,   refetch: rp   } = usePopular();
  const { data: topRatedData,   isLoading: ltr,  refetch: rtr  } = useTopRated();
  const { data: trendingTVData, isLoading: ltv,  refetch: rtv  } = useTrendingTV();
  const { data: topRatedTVData, isLoading: lrtv, refetch: rrtv } = useTopRatedTV();

  const trending   = ((trendingData   as any[] | null) ?? []).filter(m => !m.adult);
  const popular    = ((popularData    as any[] | null) ?? []).filter(m => !m.adult);
  const topRated   = ((topRatedData   as any[] | null) ?? []).filter(m => !m.adult);
  const trendingTV = ((trendingTVData as any[] | null) ?? []).filter(m => !m.adult);
  const topRatedTV = ((topRatedTVData as any[] | null) ?? []).filter(m => !m.adult);
  const loading    = lt || lp || ltr;

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try { await Promise.allSettled([rt(), rp(), rtr(), rtv(), rrtv()]); }
    finally { setRefreshing(false); }
  };

  const goToMovie = (movie: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    router.push(`/movie/${movie.id}?type=${type}` as any);
  };
  const toggleWL = (movie: any) => {
    if (!user) {
      router.push('/auth/login' as any);
      return;
    }
    const has = isInWatchlist(movie.id);
    Haptics.notificationAsync(has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    has ? removeFromWatchlist(movie.id) : addToWatchlist(movie);
  };

  const recentMovies = useMemo(() => {
    const all = [...trending, ...popular, ...topRated, ...trendingTV, ...topRatedTV];
    return recentlyViewed.map(id => all.find((m: any) => m.id === id)).filter((m): m is Movie => m != null).slice(0, 10);
  }, [recentlyViewed, trending, popular, topRated, trendingTV, topRatedTV]);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(20,20,20,0)', 'rgba(20,20,20,0.97)'],
    extrapolate: 'clamp',
  });

  const username  = profile?.username || user?.user_metadata?.username || user?.email || 'User';
  const initial   = username.charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  // ── Key responsive values ────────────────────────────────────────────────
  // contentWidth = screen width minus sidebar (so hero fills exactly the content area)
  const sidebarW    = bp.isDesktop ? SIDEBAR_FULL : bp.isTablet ? SIDEBAR_ICON : 0;
  const contentWidth = bp.width - sidebarW;

  // Card widths — larger on bigger screens
  const CARD =
    bp.isDesktop ? 175 :
    bp.isTablet  ? 150 :
                   130;

  // Left padding for all rows
  const PAD  = bp.isDesktop ? 36 : bp.isTablet ? 24 : 20;

  // How many items per section
  const N = bp.isDesktop ? 20 : bp.isTablet ? 15 : 12;

  const rowProps = { cardWidth: CARD, pad: PAD, onPress: goToMovie, isLarge: bp.isLarge };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Mobile floating header only ── */}
      {bp.isMobile && (
        <Animated.View style={[s.header, { backgroundColor: headerBg, paddingTop: Math.max(insets.top, 20), paddingBottom: 14 }]}>
          <Text style={s.logo} allowFontScaling={false}>WATCHLISTID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={s.avatar} onPress={() => router.push('/(tabs)/profile')}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                : <Text style={s.avatarTxt} allowFontScaling={false}>{initial}</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E50914" colors={['#E50914']} />}
      >
        {/* ── HERO ── */}
        {trending.length > 0 && (
          <HeroCarousel
            items={trending}
            contentWidth={contentWidth}
            onPressItem={goToMovie}
            onToggleWL={toggleWL}
            isInWatchlist={isInWatchlist}
          />
        )}

        {/* ── CONTENT BODY ── */}
        <View style={s.body}>

          {/* Desktop "Browse" page header */}
          {bp.isLarge && (
            <View style={{ paddingHorizontal: PAD, paddingTop: 28, paddingBottom: 4 }}>
              <Text style={s.browseTitle} allowFontScaling={false}>{t('browse')}</Text>
              <Text style={s.browseSub}   allowFontScaling={false}>{t('browseSub')}</Text>
            </View>
          )}

          {/* Trending Movies */}
          <SectionHeader title={t('trendingMovies')}      Icon={Flame} iconColor="#E50914" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search?category=trending-movies' as any)} />
          {loading ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={trending.slice(0, N)} />}

          {/* Trending Shows */}
          <SectionHeader title={t('trendingShows')}       Icon={Flame} iconColor="#FF6B35" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search?category=trending-tv' as any)} />
          {ltv    ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={trendingTV.slice(0, N)} />}

          {/* Popular */}
          <SectionHeader title={t('popular')} Icon={Star}  iconColor="#F5C518" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search?category=popular' as any)} />
          {loading ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={popular.slice(0, N)} />}

          {/* Top Rated Movies */}
          <SectionHeader title={t('topRatedMovies')}     Icon={Award} iconColor="#4CAF50" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search?category=top-rated-movies' as any)} />
          {loading ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={topRated.slice(0, N)} />}

          {/* Top Rated Shows */}
          <SectionHeader title={t('topRatedShows')}      Icon={Award} iconColor="#2196F3" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search?category=top-rated-tv' as any)} />
          {lrtv   ? <SkeletonRow cardWidth={CARD} pad={PAD} /> : <MediaRow {...rowProps} data={topRatedTV.slice(0, N)} />}



          {/* Browse by Genre */}
          <SectionHeader title={t('browseByGenre')}     Icon={Flame} iconColor="#6C5CE7" textColor="#fff" actionLabel={t('seeAll')} onAction={() => router.push('/(tabs)/search' as any)} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: PAD, paddingRight: PAD, paddingBottom: 4, gap: 10 }}>
            {GENRES.map(g => {
              const gW = bp.isDesktop ? 160 : bp.isTablet ? 140 : 120;
              const gH = Math.round(gW * 0.62);
              return (
                <TouchableOpacity key={g.id} style={{ width: gW, height: gH, borderRadius: Radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.82} onPress={() => router.push(`/(tabs)/search?genre=${g.id}` as any)}>
                  <Image source={{ uri: `${TMDB_IMAGE_SIZES.small}${g.image}` }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
                  <Text style={s.genreName} allowFontScaling={false}>{t(g.nameKey as any)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Recently Viewed */}
          {recentMovies.length > 0 && (
            <>
              <SectionHeader title={t('recentlyViewed')} Icon={Clock} iconColor="#E50914" textColor="#fff" />
              <MediaRow {...rowProps} data={recentMovies} />
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>
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
    fontWeight: '900',
    color: '#fff',
  },
  avatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, color: '#fff', fontWeight: '700' },

  // Hero
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 28, paddingBottom: 36, alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36, fontWeight: '900', color: '#fff',
    letterSpacing: -0.5, lineHeight: 42, marginBottom: 8, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  heroMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.18)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  ratingScore:{ fontSize: 13, fontWeight: '700', color: '#F5C518' },
  heroYear:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  heroButtons:{ flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center', marginBottom: 16 },
  playBtn:    { flex: 1, maxWidth: 165, height: 46, backgroundColor: '#fff', borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playBtnText:{ fontSize: 15, fontWeight: '700', color: '#000' },
  wlBtn:      { flex: 1, maxWidth: 150, height: 46, backgroundColor: 'rgba(40,40,40,0.85)', borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  wlBtnActive:{ backgroundColor: 'rgba(229,9,20,0.85)' },
  wlBtnText:  { fontSize: 15, fontWeight: '700', color: '#fff' },
  dots:       { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive:  { width: 22, height: 6, borderRadius: 3, backgroundColor: '#E50914' },
  arrow: {
    position: 'absolute', top: '42%',
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },

  // Body
  body:        { paddingTop: 8 },
  browseTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  browseSub:   { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 },

  // Card (all sections)
  card: { borderRadius: Radius.md, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: Colors.surface },
  cardMeta:      { padding: 8 },
  cardRating:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  cardRatingTxt: { fontSize: 11, fontWeight: '700', color: '#F5C518' },
  cardTitle:     { fontWeight: '700', color: '#fff', lineHeight: 15 },

  // Genre
  genreName: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.4 },
});
