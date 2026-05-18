import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator, Animated, FlatList, 
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Award, ChevronDown, Clock, Flame,
  Search, Star, TrendingUp, X,
} from "lucide-react-native";

import MovieListItem from '@/components/movie/MovieListItem';
import { Colors, FontSize, FontWeight, IconSize, Radius, Shadow, Spacing } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSearchQuery } from '@/hooks/useSearchQuery';
import { 
  getTrendingMovies, getTrendingTV, getPopularMovies, 
  getTopRatedMovies, getTopRatedTV 
} from '@/services/api';
import { MediaItem } from '@/types';

// Components
import { SearchFilterRow } from '@/components/search/SearchFilterRow';
import { PersonCard } from '@/components/search/PersonCard';
import { SearchEmptyState } from '@/components/search/SearchEmptyState';

// ─── Constants ───────────────────────────────────────────────────────────────
const CATS: any = {
  "trending-movies": { label: "trendingMovies",      subtitle: "catTrendingMoviesSub", Icon: Flame, iconColor: Colors.danger, fetchFn: getTrendingMovies },
  "trending-tv":     { label: "trendingShows",       subtitle: "catTrendingTVSub",     Icon: Flame, iconColor: "#FF6B35", fetchFn: getTrendingTV, normalize: true },
  "popular":         { label: "catPopularOn",        subtitle: "catPopularSub",        Icon: Star,  iconColor: Colors.ratingGold, fetchFn: getPopularMovies },
  "top-rated-movies":{ label: "topRatedMovies",      subtitle: "catTopRatedMoviesSub", Icon: Award, iconColor: Colors.success, fetchFn: getTopRatedMovies },
  "top-rated-tv":    { label: "topRatedShows",       subtitle: "catTopRatedTVSub",     Icon: Award, iconColor: "#2196F3", fetchFn: getTopRatedTV, normalize: true },
};

const FILTER_CHIPS = [
  { id: "all", labelKey: "filterAll" },
  { id: "movies", labelKey: "filterMovies" },
  { id: "tv", labelKey: "filterTV" },
  { id: "anime", labelKey: "filterAnime" },
  { id: "animation", labelKey: "filterAnimation" },
  { id: "28", labelKey: "genreAction" },
  { id: "35", labelKey: "genreComedy" },
  { id: "18", labelKey: "genreDrama" },
  { id: "27", labelKey: "genreHorror" },
  { id: "878", labelKey: "genreSciFi" },
  { id: "10749", labelKey: "genreRomance" },
  { id: "12", labelKey: "genreAdventure" },
  { id: "80", labelKey: "genreCrime" },
];

export default function SearchScreen() {
  const router = useRouter();
  const bp     = useBreakpoint();
  const { t }  = useLanguage();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const params = useLocalSearchParams<{ genre?:string; category?:string }>();

  const {
    activeCat, setActiveCat,
    activeFilter, setActiveFilter,
    searchText, setSearchText, debouncedQ,
    itemsState, personState,
    page, totalPages, totalResults, loadingMore,
    fetchPage, fetchCatPage
  } = useSearchQuery(params.category || null, params.genre || "all");

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const inputScale = useRef(new Animated.Value(1)).current;

  const items = itemsState.data || [];
  const personItems = personState.data || [];
  const isLoading = itemsState.status === 'loading' || personState.status === 'loading';

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingMovies(1);
        setTrendingKeywords((data.results ?? []).slice(0, 6).map((m: any) => m.title));
      } catch (e) {
        setTrendingKeywords(["Dune", "Oppenheimer", "Spider-Man", "Batman", "Civil War"]);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (activeCat) fetchCatPage(activeCat, 1, false, CATS);
    else fetchPage(debouncedQ, activeFilter, 1, false);
  }, [debouncedQ, activeFilter, activeCat, fetchPage, fetchCatPage]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    if (activeCat) fetchCatPage(activeCat, page + 1, true, CATS);
    else fetchPage(debouncedQ, activeFilter, page + 1, true);
  };

  const toggleWL = (m: MediaItem) => {
    const has = isInWatchlist(m.id);
    Haptics.notificationAsync(has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    has ? removeFromWatchlist(m.id) : addToWatchlist(m);
  };

  const goToMovie = (id: number, type: 'movie' | 'tv' = 'movie') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/movie/[id]', params: { id: id.toString(), type } });
  };

  const goToPerson = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/person/[id]', params: { id: id.toString() } });
  };

  const onFocus = () => Animated.spring(inputScale, { toValue: 1.015, useNativeDriver: true, speed: 20 }).start();
  const onBlur  = () => Animated.spring(inputScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const isPeople = activeFilter === "people";
  const showDefault = !activeCat && searchText.length === 0;

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {!isLoading && totalResults > 0 && (
        <Text style={styles.resultCount} allowFontScaling={false}>
          {t('showingResults').replace('{count}', (isPeople ? personItems.length : items.length).toString()).replace('{total}', totalResults.toLocaleString())}
        </Text>
      )}
      {page < totalPages && (
        <TouchableOpacity style={[styles.loadMore, cursorPointer]} onPress={loadMore} disabled={loadingMore}>
          {loadingMore ? <ActivityIndicator size="small" color={Colors.danger} /> : (
            <View style={styles.loadMoreContent}>
              <ChevronDown size={IconSize.md} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.loadMoreTxt}>{t('loadMore')}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.headerContainer, { paddingHorizontal: bp.contentPadding }]}>
        {activeCat ? (
          <View style={styles.catHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setActiveCat(null)}>
              <ArrowLeft size={IconSize.md} color={Colors.white} />
            </TouchableOpacity>
            <View>
              <Text style={styles.catTitle}>{t(CATS[activeCat]?.label)}</Text>
              <Text style={styles.catSub}>{t(CATS[activeCat]?.subtitle)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{t('discoverTitle')}</Text>
            <Text style={styles.pageSub}>{t('discoverSub')}</Text>
          </View>
        )}
      </View>

      <Animated.View style={[styles.searchWrap, { marginHorizontal: bp.contentPadding, transform: [{ scale: inputScale }] }]}>
        <Search size={IconSize.md} color={Colors.primary} strokeWidth={2} />
        <TextInput
          ref={inputRef} style={styles.searchInput}
          placeholder={activeCat ? t('searchIn').replace('{category}', t(CATS[activeCat]?.label)) : t('searchMoviesTVPeople')}
          placeholderTextColor={Colors.text.secondary}
          value={searchText} onChangeText={setSearchText}
          onFocus={onFocus} onBlur={onBlur}
          returnKeyType="search" allowFontScaling={false} autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchText("")}>
            <X size={IconSize.xs} color={Colors.white} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {!activeCat && (
        <SearchFilterRow 
          filters={FILTER_CHIPS} 
          activeFilter={activeFilter} 
          onSelect={setActiveFilter} 
          t={t} 
        />
      )}

      <FlatList
        data={isPeople ? personItems : items}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => isPeople ? (
          <PersonCard person={item} onPress={() => goToPerson(item.id)} t={t} />
        ) : (
          <MovieListItem 
            movie={item} 
            onPress={() => goToMovie(item.id, item.media_type)} 
            onAdd={() => toggleWL(item)} 
            inWatchlist={isInWatchlist(item.id)} 
          />
        )}
        ListHeaderComponent={showDefault ? (
          <View style={styles.defaultHeader}>
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.sectionLbl}>{t('recent')}</Text>
                {recentSearches.map(txt => (
                  <TouchableOpacity key={txt} style={styles.recentRow} onPress={() => setSearchText(txt)}>
                    <Clock size={IconSize.sm} color={Colors.primary} />
                    <Text style={styles.recentTxt}>{txt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {trendingKeywords.length > 0 && (
              <View style={styles.trendingSection}>
                <Text style={styles.sectionLbl}>{t('trendingSearches')}</Text>
                <View style={styles.pills}>
                  {trendingKeywords.map(txt => (
                    <TouchableOpacity key={txt} style={styles.pill} onPress={() => setSearchText(txt)}>
                      <TrendingUp size={IconSize.xs} color={Colors.primary} />
                      <Text style={styles.pillTxt}>{txt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <Text style={styles.sectionLbl}>
              {activeFilter === "all" ? t('trendingNow') : t('popular')}
            </Text>
          </View>
        ) : null}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? (
          <SearchEmptyState title={showDefault ? t('searchPlaceholder') : t('noResults')} subtitle={!showDefault ? t('tryAnother') : undefined} />
        ) : <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { paddingTop: Spacing.sm, paddingBottom: 4 },
  titleRow: { marginBottom: Spacing.md },
  pageTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.text.primary, letterSpacing: -0.5 },
  pageSub: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 3 },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: Spacing.lg },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.overlay.light, alignItems: "center", justifyContent: "center" },
  catTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text.primary },
  catSub: { fontSize: FontSize.sm, color: Colors.text.secondary },
  searchWrap: { 
    flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.lg, 
    height: 52, backgroundColor: Colors.surface, borderRadius: Radius.lg, 
    paddingHorizontal: Spacing.lg, ...Shadow.md 
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary },
  clearBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100 },
  resultCount: { fontSize: FontSize.xs, color: Colors.text.secondary, textAlign: 'center', marginBottom: 8 },
  loadMore: { 
    height: 48, borderRadius: Radius.lg, backgroundColor: Colors.overlay.light, 
    justifyContent: "center", alignItems: "center", marginHorizontal: Spacing.xl 
  },
  loadMoreTxt: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.danger },
  sectionLbl: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  recentRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: 12 },
  recentTxt: { fontSize: FontSize.base, color: Colors.text.primary },
  pills: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  pillTxt: { fontSize: FontSize.md, color: Colors.text.primary },
  footerContainer: { alignItems: "center", paddingVertical: 16 },
  loadMoreContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultHeader: { paddingBottom: Spacing.md },
  recentSection: { marginBottom: Spacing.xl },
  trendingSection: { marginBottom: Spacing.xl },
  loadingIndicator: { marginTop: 50 },
});
