import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import {
  Bell,
  Play,
  Plus,
  Star,
  Flame,
  Award,
  Clock,
  ChevronRight,
  Bookmark,
} from 'lucide-react-native';
import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  FontWeight,
  Shadow,
  TMDB_IMAGE_SIZES,
} from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useTrending, usePopular, useTopRated } from '../hooks/useMovies';
import PosterCard from '../components/common/PosterCard';
import { Movie } from '../types';

// ─── Genre data ────────────────────────────────────────────────────────────
const GENRES = [
  { id: 28,    name: 'Action',    emoji: '💥', from: '#FF6B35', to: '#C62828' },
  { id: 35,    name: 'Comedy',    emoji: '😄', from: '#F9CA24', to: '#F0932B' },
  { id: 18,    name: 'Drama',     emoji: '🎭', from: '#6C5CE7', to: '#A29BFE' },
  { id: 27,    name: 'Horror',    emoji: '💀', from: '#2D3436', to: '#636E72' },
  { id: 878,   name: 'Sci-Fi',   emoji: '🚀', from: '#0984E3', to: '#74B9FF' },
  { id: 53,    name: 'Thriller', emoji: '🔪', from: '#E17055', to: '#FDCB6E' },
  { id: 10749, name: 'Romance',  emoji: '💕', from: '#E84393', to: '#FD79A8' },
  { id: 16,    name: 'Animation',emoji: '✨', from: '#00B894', to: '#55EFC4' },
  { id: 99,    name: 'Anime',    emoji: '⛩️', from: '#E84393', to: '#6C5CE7' },
] as const;

// ─── Shimmer skeleton (single stable component) ────────────────────────────
function SkeletonRow() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });

  return (
    <Animated.View style={{ flexDirection: 'row', paddingLeft: Spacing.xl, opacity }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 110,
            height: 190,
            borderRadius: Radius.md,
            backgroundColor: Colors.surface,
            marginRight: Spacing.md,
          }}
        />
      ))}
    </Animated.View>
  );
}

// ─── Section row header ────────────────────────────────────────────────────
function SectionRow({
  title,
  Icon,
  iconColor,
  onSeeAll,
}: {
  title: string;
  Icon: React.ComponentType<any>;
  iconColor: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={sectionStyles.left}>
        <View style={[sectionStyles.iconBox, { backgroundColor: iconColor + '22' }]}>
          <Icon size={14} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text style={sectionStyles.title} allowFontScaling={false}>{title}</Text>
      </View>
      {onSeeAll ? (
        <TouchableOpacity style={sectionStyles.seeAll} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={sectionStyles.seeAllText} allowFontScaling={false}>See all</Text>
          <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    color: Colors.dark,
    letterSpacing: -0.2,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});

// ══════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, recentlyViewed } =
    useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data: trendingData, isLoading: loadingTrend, refetch: refetchTrend } = useTrending();
  const { data: popularData,  isLoading: loadingPop,   refetch: refetchPop   } = usePopular();
  const { data: topRatedData, isLoading: loadingTop,   refetch: refetchTop   } = useTopRated();

  const trending = (trendingData as Movie[] | null) ?? [];
  const popular  = (popularData  as Movie[] | null) ?? [];
  const topRated = (topRatedData as Movie[] | null) ?? [];
  const loading  = loadingTrend || loadingPop || loadingTop;

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Promise.allSettled([refetchTrend(), refetchPop(), refetchTop()]);
    } finally {
      setRefreshing(false);
    }
  };

  const goToMovie = (movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/movie/${movie.id}` as any);
  };

  const toggleWL = (movie: Movie) => {
    const has = isInWatchlist(movie.id);
    Haptics.notificationAsync(
      has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    has ? removeFromWatchlist(movie.id) : addToWatchlist(movie);
  };

  const hero      = trending[0] ?? null;
  const heroInWL  = hero ? isInWatchlist(hero.id) : false;
  const spotlight = trending.slice(1, 4);

  const recentMovies = useMemo(() => {
    const all = [...trending, ...popular, ...topRated];
    return recentlyViewed
      .map(id => all.find(m => m.id === id))
      .filter((m): m is Movie => m != null)
      .slice(0, 10);
  }, [recentlyViewed, trending, popular, topRated]);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: ['rgba(249,247,247,0)', Colors.background],
    extrapolate: 'clamp',
  });
  const headerShadow = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Floating header ── */}
      <Animated.View
        style={[s.header, { backgroundColor: headerBg, shadowOpacity: headerShadow }]}
      >
        <Text style={s.logo} allowFontScaling={false}>
          WatchList<Text style={s.logoAccent}>ID</Text>
        </Text>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Bell size={20} color={Colors.dark} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.avatar}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile');
            }}
          >
            <Text style={s.avatarText} allowFontScaling={false}>M</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ── HERO ── */}
        {hero != null && (
          <View style={s.heroWrap}>
            <Image
              source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${hero.backdrop_path}` }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(17,45,78,0.10)', 'rgba(17,45,78,0.55)', 'rgba(17,45,78,0.94)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={s.heroBadge}>
              <Flame size={11} color="#FF6B35" strokeWidth={2.5} />
              <Text style={s.heroBadgeText} allowFontScaling={false}>#1 TRENDING</Text>
            </View>

            <View style={s.heroContent}>
              <Text style={s.heroTitle} numberOfLines={2} allowFontScaling={false}>
                {hero.title}
              </Text>

              <View style={s.heroMeta}>
                <View style={s.ratingPill}>
                  <Star size={11} color="#F5C518" fill="#F5C518" strokeWidth={0} />
                  <Text style={s.ratingScore} allowFontScaling={false}>
                    {hero.vote_average?.toFixed(1)}
                  </Text>
                </View>
                <Text style={s.heroYear} allowFontScaling={false}>
                  {hero.release_date?.split('-')[0]}
                </Text>
                <View style={s.agePill}>
                  <Text style={s.agePillText} allowFontScaling={false}>PG-13</Text>
                </View>
              </View>

              <View style={s.heroButtons}>
                <TouchableOpacity
                  style={s.playBtn}
                  activeOpacity={0.8}
                  onPress={() => goToMovie(hero)}
                >
                  <Play size={15} color="#fff" fill="#fff" strokeWidth={0} />
                  <Text style={s.playBtnText} allowFontScaling={false}>Watch Trailer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={heroInWL ? [s.wlBtn, s.wlBtnActive] : s.wlBtn}
                  activeOpacity={0.8}
                  onPress={() => toggleWL(hero)}
                >
                  {heroInWL
                    ? <Bookmark size={18} color="#fff" fill="#fff" strokeWidth={0} />
                    : <Plus size={20} color={Colors.white} strokeWidth={2.5} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── SPOTLIGHT ROW (#2-#4) ── */}
        {spotlight.length > 0 && (
          <View style={s.spotRow}>
            {spotlight.map((m, i) => (
              <TouchableOpacity
                key={m.id}
                style={s.spotCard}
                activeOpacity={0.85}
                onPress={() => goToMovie(m)}
              >
                <Image
                  source={{ uri: `${TMDB_IMAGE_SIZES.medium}${m.poster_path}` }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(17,45,78,0.87)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={s.spotBadge}>
                  <Text style={s.spotBadgeText} allowFontScaling={false}>#{i + 2}</Text>
                </View>
                <Text style={s.spotTitle} numberOfLines={2} allowFontScaling={false}>
                  {m.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── BODY ── */}
        <View style={s.body}>

          {/* Trending */}
          <SectionRow
            title="Trending This Week"
            Icon={Flame}
            iconColor="#FF6B35"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          {loading ? (
            <SkeletonRow />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.hScroll}
            >
              {trending.slice(0, 12).map((m, i) => (
                <PosterCard
                  key={m.id}
                  movie={m}
                  showRank
                  rank={i + 1}
                  onPress={() => goToMovie(m)}
                />
              ))}
            </ScrollView>
          )}

          <View style={s.divider} />

          {/* Fan Favorites */}
          <SectionRow
            title="Fan Favorites"
            Icon={Star}
            iconColor="#F5C518"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          {loading ? (
            <SkeletonRow />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.hScroll}
            >
              {popular.slice(0, 12).map(m => (
                <PosterCard key={m.id} movie={m} onPress={() => goToMovie(m)} />
              ))}
            </ScrollView>
          )}

          <View style={s.divider} />

          {/* Top Rated */}
          <SectionRow
            title="Top Rated All Time"
            Icon={Award}
            iconColor={Colors.primary}
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          {loading ? (
            <SkeletonRow />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.hScroll}
            >
              {topRated.slice(0, 12).map(m => (
                <PosterCard key={m.id} movie={m} showBorder onPress={() => goToMovie(m)} />
              ))}
            </ScrollView>
          )}

          <View style={s.divider} />

          {/* Browse by Genre */}
          <SectionRow
            title="Browse by Genre"
            Icon={Flame}
            iconColor="#6C5CE7"
            onSeeAll={() => router.push('/(tabs)/search')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hScroll}
          >
            {GENRES.map(g => (
              <TouchableOpacity
                key={g.id}
                style={s.genreCard}
                activeOpacity={0.82}
                onPress={() => router.push('/(tabs)/search')}
              >
                <LinearGradient
                  colors={[g.from, g.to]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={s.genreEmoji} allowFontScaling={false}>{g.emoji}</Text>
                <Text style={s.genreName} allowFontScaling={false}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Recently Viewed */}
          {recentMovies.length > 0 && (
            <>
              <View style={s.divider} />
              <SectionRow title="Recently Viewed" Icon={Clock} iconColor={Colors.primary} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hScroll}
              >
                {recentMovies.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={s.recentCard}
                    onPress={() => goToMovie(m)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: `${TMDB_IMAGE_SIZES.medium}${m.poster_path}` }}
                      style={s.recentImg}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={{ height: 110 }} />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  logo: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.dark,
    letterSpacing: 0.3,
  },
  logoAccent:    { color: Colors.primary },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.base, color: Colors.white, fontWeight: FontWeight.bold },

  heroWrap: { width: '100%', height: 420, overflow: 'hidden' },
  heroBadge: {
    position: 'absolute',
    top: 68,
    left: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.black,
    color: '#FF6B35',
    letterSpacing: 1.2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,197,24,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingScore:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#F5C518' },
  heroYear:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  agePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  agePillText:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },
  heroButtons:  { flexDirection: 'row', gap: Spacing.sm },
  playBtn: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.primary,
  },
  playBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  wlBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wlBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.primary,
  },

  spotRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: 10,
  },
  spotCard: {
    flex: 1,
    height: 118,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  spotBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spotBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.black, color: Colors.white },
  spotTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    padding: 6,
    lineHeight: 14,
  },

  body: { paddingTop: Spacing.md },

  genreCard: {
    width: 108,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  genreEmoji: { fontSize: 20, marginBottom: 3 },
  genreName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  recentCard: {
    marginRight: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  recentImg: { width: 66, height: 94, backgroundColor: Colors.surface },

  hScroll: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.overlay.light,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.xxl,
  },
});
