import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Flame,
  Search,
  Star,
  TrendingUp,
  User,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Avatar from "@/components/common/Avatar";
import MovieListItem from "@/components/movie/MovieListItem";
import { Shimmer } from "@/components/common/Shimmer";
import {
  Colors,
  FontSize,
  FontWeight,
  IconSize,
  Radius,
  Shadow,
  Spacing,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSocial } from "@/context/SocialContext";
import { useWatchlist } from "@/context/WatchlistContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { nativeDriver } from "@/utils/animation";
import { cursorPointer } from "@/utils/webStyles";

import {
  getPopularMovies,
  getTopRatedMovies,
  getTopRatedTV,
  getTrendingMovies,
  getTrendingTV,
} from "@/services/api";
import { FetchState, MediaItem, UserProfile } from "@/types";

// Components
import { PersonCard } from "@/components/search/PersonCard";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { SearchHeader } from "@/components/search/SearchHeader";

// ─── Interfaces & Constants ──────────────────────────────────────────────────
interface CatConfig {
  label: string;
  subtitle: string;
  Icon: React.ComponentType<any>;
  iconColor: string;
  fetchFn: (page: number) => Promise<any>;
  normalize?: boolean;
}

const CATS: Record<string, CatConfig> = {
  "trending-movies": {
    label: "trendingMovies",
    subtitle: "catTrendingMoviesSub",
    Icon: Flame,
    iconColor: Colors.danger,
    fetchFn: getTrendingMovies,
  },
  "trending-tv": {
    label: "trendingShows",
    subtitle: "catTrendingTVSub",
    Icon: Flame,
    iconColor: "#FF6B35",
    fetchFn: getTrendingTV,
    normalize: true,
  },
  popular: {
    label: "catPopularOn",
    subtitle: "catPopularSub",
    Icon: Star,
    iconColor: Colors.ratingGold,
    fetchFn: getPopularMovies,
  },
  "top-rated-movies": {
    label: "topRatedMovies",
    subtitle: "catTopRatedMoviesSub",
    Icon: Award,
    iconColor: Colors.success,
    fetchFn: getTopRatedMovies,
  },
  "top-rated-tv": {
    label: "topRatedShows",
    subtitle: "catTopRatedTVSub",
    Icon: Award,
    iconColor: "#2196F3",
    fetchFn: getTopRatedTV,
    normalize: true,
  },
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
  { id: "53", labelKey: "genreThriller" },
  { id: "14", labelKey: "genreFantasy" },
  { id: "9648", labelKey: "genreMystery" },
  { id: "10751", labelKey: "genreFamily" },
  { id: "99", labelKey: "genreDocumentary" },
];

export default function SearchScreen() {
  const router = useRouter();
  const bp = useBreakpoint();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showLoginPrompt } = useLoginPrompt();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, isHydrated } =
    useWatchlist();
  const { searchUsers } = useSocial();
  const params = useLocalSearchParams<{ genre?: string; category?: string }>();

  const {
    activeCat,
    setActiveCat,
    activeFilter,
    setActiveFilter,
    searchText,
    setSearchText,
    debouncedQ,
    itemsState,
    personState,
    page,
    totalPages,
    totalResults,
    loadingMore,
    fetchPage,
    fetchCatPage,
  } = useSearchQuery(params.category || null, params.genre || "all");

  const [searchMode, setSearchMode] = useState<"media" | "users">("media");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: !activeCat,
    });
  }, [navigation, activeCat]);

  const [userResults, setUserResults] = useState<FetchState<UserProfile[]>>({
    status: "idle",
    data: [],
    error: null,
  });
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const lastSearchId = useRef(0);
  const inputScale = useRef(new Animated.Value(1)).current;
  const mediaListRef = useRef<any>(null);
  const userListRef = useRef<any>(null);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const [showFab, setShowFab] = useState(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const shouldShow = y > 250;
      if (shouldShow !== showFab) {
        setShowFab(shouldShow);
        Animated.spring(fabAnim, {
          toValue: shouldShow ? 1 : 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }).start();
      }
    },
    [showFab, fabAnim],
  );

  const scrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (searchMode === "media") {
      mediaListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      userListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const items = itemsState.data || [];
  const personItems = personState.data || [];
  const isLoading =
    itemsState.status === "loading" || personState.status === "loading";

  // Load recent searches from AsyncStorage
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = await AsyncStorage.getItem("recent_searches");
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadRecent();
  }, []);

  // Fetch trending keywords on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const cached = await AsyncStorage.getItem("trending_keywords_cache");
        const cachedTime = await AsyncStorage.getItem("trending_keywords_timestamp");
        const now = Date.now();
        if (cached && cachedTime && now - Number(cachedTime) < 3600000) {
          setTrendingKeywords(JSON.parse(cached));
          return;
        }

        const data = await getTrendingMovies(1);
        const keywords = (data.results ?? []).slice(0, 6).map((m: any) => m.title);
        setTrendingKeywords(keywords);

        await AsyncStorage.setItem("trending_keywords_cache", JSON.stringify(keywords));
        await AsyncStorage.setItem("trending_keywords_timestamp", String(now));
      } catch (e) {
        setTrendingKeywords([]);
      }
    };
    fetchTrending();
  }, []);

  // Sync recent searches and perform media fetch
  useEffect(() => {
    if (!isHydrated) return;
    if (activeCat) fetchCatPage(activeCat, 1, false, CATS);
    else fetchPage(debouncedQ, activeFilter, 1, false);
  }, [
    debouncedQ,
    activeFilter,
    activeCat,
    fetchPage,
    fetchCatPage,
    isHydrated,
  ]);

  // When the active filter changes, jump back to the top so the freshly fetched
  // results are visible — otherwise the list keeps its previous scroll position
  // and switching filters can look like nothing changed.
  useEffect(() => {
    if (searchMode === "media") {
      mediaListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
    }
  }, [activeFilter, searchMode]);

  // Save successful search queries to history
  const saveSearchTerm = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (x) => x.toLowerCase() !== trimmed.toLowerCase()
      );
      const next = [trimmed, ...filtered].slice(0, 5);
      AsyncStorage.setItem("recent_searches", JSON.stringify(next)).catch(
        console.error
      );
      return next;
    });
  }, []);

  const deleteRecentSearch = useCallback(async (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((x) => x !== term);
      AsyncStorage.setItem("recent_searches", JSON.stringify(next)).catch(
        console.error
      );
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem("recent_searches");
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Watch debounced query for search saving
  useEffect(() => {
    if (debouncedQ.trim().length >= 2) {
      saveSearchTerm(debouncedQ.trim());
    }
  }, [debouncedQ, saveSearchTerm]);

  // User search effect
  useEffect(() => {
    if (searchMode !== "users" || !debouncedQ.trim()) {
      if (searchMode === "users" && !debouncedQ.trim()) {
        setUserResults({ status: "idle", data: [], error: null });
      }
      return;
    }
    const searchId = ++lastSearchId.current;
    setUserResults((prev) => ({ ...prev, status: "loading" }));
    searchUsers(debouncedQ)
      .then((data) => {
        if (searchId === lastSearchId.current) {
          setUserResults({ status: "success", data, error: null });
        }
      })
      .catch((err) => {
        if (searchId === lastSearchId.current) {
          setUserResults({ status: "error", data: [], error: err.message });
        }
      });
  }, [debouncedQ, searchMode, searchUsers]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    if (activeCat) fetchCatPage(activeCat, page + 1, true, CATS);
    else fetchPage(debouncedQ, activeFilter, page + 1, true);
  };

  const toggleWL = (m: MediaItem) => {
    if (!user) {
      showLoginPrompt();
      return;
    }
    const has = isInWatchlist(m.id);
    Haptics.notificationAsync(
      has
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
    has ? removeFromWatchlist(m.id) : addToWatchlist(m);
  };

  const goToMovie = (id: number, type: "movie" | "tv" = "movie") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/movie/[id]",
      params: { id: id.toString(), type },
    });
  };

  const goToPerson = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/person/[id]", params: { id: id.toString() } });
  };

  const onFocus = () =>
    Animated.spring(inputScale, {
      toValue: 1.015,
      ...nativeDriver,
      speed: 20,
    }).start();
  const onBlur = () =>
    Animated.spring(inputScale, {
      toValue: 1,
      ...nativeDriver,
      speed: 20,
    }).start();

  const isPeople = activeFilter === "people";
  const showDefault = !activeCat && searchText.length === 0;

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {!isLoading && totalResults > 0 && (
        <Text style={styles.resultCount} maxFontSizeMultiplier={1.3}>
          {t("showingResults")
            .replace(
              "{count}",
              (isPeople ? personItems.length : items.length).toString(),
            )
            .replace("{total}", totalResults.toLocaleString())}
        </Text>
      )}
      {page < totalPages && (
        <TouchableOpacity
          style={[styles.loadMore, cursorPointer]}
          onPress={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <View style={styles.loadMoreContent}>
              <ChevronDown
                size={IconSize.md}
                color={Colors.accent}
                strokeWidth={2.5}
              />
              <Text style={styles.loadMoreTxt}>{t("loadMore")}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (!isHydrated) return null;

  const baseTop = Platform.OS === "web" ? 16 : insets.top;
  const headerHeight = activeCat ? baseTop + 144 : baseTop + 76;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Absolute Header Container ── */}
      {activeCat && (
        <View style={[styles.fixedHeader, { paddingTop: baseTop }]}>
          <View style={[{ width: "100%" }, bp.isLarge && styles.centeredColumn]}>
            <View
              style={[
                styles.headerContainer,
                { paddingHorizontal: bp.contentPadding },
              ]}
            >
              <View style={styles.catHeader}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setActiveCat(null)}
                >
                  <ArrowLeft size={IconSize.md} color={Colors.white} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.catTitle}>
                    {activeCat && CATS[activeCat] ? t(CATS[activeCat].label as any) : ""}
                  </Text>
                  <Text style={styles.catSub}>
                    {activeCat && CATS[activeCat] ? t(CATS[activeCat].subtitle as any) : ""}
                  </Text>
                </View>
              </View>
            </View>

            <Animated.View
              style={[
                styles.searchWrap,
                {
                  marginHorizontal: bp.contentPadding,
                  transform: [{ scale: inputScale }],
                },
              ]}
            >
              <Search size={IconSize.md} color={Colors.primary} strokeWidth={2} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder={t("searchIn").replace(
                  "{category}",
                  activeCat && CATS[activeCat] ? t(CATS[activeCat].label as any) : ""
                )}
                placeholderTextColor={Colors.text.secondary}
                value={searchText}
                onChangeText={setSearchText}
                onFocus={onFocus}
                onBlur={onBlur}
                returnKeyType="search"
                maxFontSizeMultiplier={1.3}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : searchText.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setSearchText("")}
                >
                  <X size={IconSize.xs} color={Colors.white} strokeWidth={3} />
                </TouchableOpacity>
              ) : null}
            </Animated.View>
          </View>
        </View>
      )}

      {/* ── Scrollable list area ── */}
      {/* On tablet/desktop, constrain + center the column so list rows don't
          stretch the full width and become unreadable. */}
      <View style={[{ flex: 1 }, bp.isLarge && styles.centeredColumn]}>
        {searchMode === "media" ? (
          <FlatList
            style={{ flex: 1, opacity: isLoading ? 0.65 : 1 }}
            ref={mediaListRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            data={isPeople ? personItems : items}
            keyExtractor={(i: any) => `${i.media_type ?? "m"}-${i.id}`}
            renderItem={({ item }: { item: any }) =>
              isPeople ? (
                <PersonCard
                  person={item}
                  onPress={() => goToPerson(item.id)}
                  t={t}
                />
              ) : (
                <MovieListItem
                  movie={item}
                  onPress={() => goToMovie(item.id, item.media_type)}
                  onAdd={() => toggleWL(item)}
                  inWatchlist={isInWatchlist(item.id)}
                />
              )
            }
            ListHeaderComponent={
              <View style={styles.headerWrapper}>
                <SearchHeader
                  activeCat={activeCat}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  searchMode={searchMode}
                  setSearchMode={setSearchMode}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  inputRef={inputRef}
                  inputScale={inputScale}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  withMargin={true}
                  contentPadding={bp.contentPadding}
                  t={t}
                  user={user}
                  filterChips={FILTER_CHIPS}
                  isLoading={isLoading}
                />
                {showDefault ? (
                  <View style={styles.defaultHeader}>
                    {recentSearches.length > 0 && (
                      <View style={styles.recentSection}>
                        <View style={styles.recentHeaderRow}>
                          <Text style={styles.sectionLbl}>{t("recent")}</Text>
                          <TouchableOpacity onPress={clearRecentSearches} style={styles.clearAllBtn}>
                            <Text style={styles.clearAllTxt}>{t("clearAll")}</Text>
                          </TouchableOpacity>
                        </View>
                        {recentSearches.map((txt) => (
                          <View key={txt} style={styles.recentItemRow}>
                            <Pressable
                              style={({ pressed }) => [
                                styles.recentRow,
                                pressed && { opacity: 0.7 },
                                { flex: 1 }
                              ]}
                              onPress={() => setSearchText(txt)}
                            >
                              <Clock size={IconSize.sm} color={Colors.primary} />
                              <Text style={styles.recentTxt}>{txt}</Text>
                            </Pressable>
                            <TouchableOpacity
                              style={styles.deleteRecentItemBtn}
                              onPress={() => deleteRecentSearch(txt)}
                            >
                              <X size={16} color={Colors.text.secondary} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                    {trendingKeywords.length > 0 && (
                      <View style={styles.trendingSection}>
                        <Text style={styles.sectionLbl}>
                          {t("trendingSearches")}
                        </Text>
                        <View style={styles.pills}>
                          {trendingKeywords.map((txt) => (
                            <Pressable
                              key={txt}
                              style={({ pressed }) => [
                                styles.pillChip,
                                pressed && {
                                  opacity: 0.7,
                                  transform: [{ scale: 0.98 }],
                                },
                              ]}
                              onPress={() => setSearchText(txt)}
                            >
                              <TrendingUp
                                size={IconSize.xs}
                                color={Colors.primary}
                              />
                              <Text style={styles.pillTxt}>{txt}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                    <Text style={styles.sectionLbl}>
                      {activeFilter === "all" ? t("trendingNow") : t("popular")}
                    </Text>
                  </View>
                ) : null}
              </View>
            }
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              !isLoading ? (
                <SearchEmptyState
                  title={showDefault ? t("searchPlaceholder") : t("noResults")}
                  subtitle={!showDefault ? t("tryAnother") : undefined}
                />
              ) : (
                <ActivityIndicator
                  size="large"
                  color={Colors.primary}
                  style={styles.loadingIndicator}
                />
              )
            }
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: headerHeight },
            ]}
          />
        ) : (
          <FlatList
            style={{ flex: 1, opacity: userResults.status === "loading" ? 0.65 : 1 }}
            ref={userListRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            data={userResults.data || []}
            keyExtractor={(i: UserProfile) => i.id}
            renderItem={({ item }: { item: UserProfile }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.userCard,
                  cursorPointer,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: "/user/[userId]",
                    params: { userId: item.id },
                  } as any);
                }}
              >
                <Avatar
                  uri={item.avatar_url}
                  name={item.full_name || item.username}
                  size={50}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userDisplayName}>
                    {item.full_name || item.username}
                  </Text>
                  <Text style={styles.userHandle}>@{item.username}</Text>
                </View>
                <ChevronRight size={20} color={Colors.text.secondary} />
              </Pressable>
            )}
            ListHeaderComponent={
              <SearchHeader
                activeCat={activeCat}
                searchText={searchText}
                setSearchText={setSearchText}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                inputRef={inputRef}
                inputScale={inputScale}
                onFocus={onFocus}
                onBlur={onBlur}
                withMargin={false}
                contentPadding={bp.contentPadding}
                t={t}
                user={user}
                filterChips={FILTER_CHIPS}
                isLoading={userResults.status === "loading"}
              />
            }
            ListEmptyComponent={
              userResults.status === "loading" ? (
                <View style={{ paddingTop: 12 }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <Shimmer width={50} height={50} borderRadius={25} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Shimmer width="55%" height={12} borderRadius={4} />
                        <Shimmer width="35%" height={9} borderRadius={3} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : debouncedQ.trim() ? (
                <View style={styles.center}>
                  <User size={48} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.emptyTitle}>{t("noUsersFound")}</Text>
                  <Text style={styles.emptySub}>{t("noUsersFoundSub")}</Text>
                </View>
              ) : (
                <View style={styles.center}>
                  <Search size={48} color="rgba(255,255,255,0.05)" />
                  <Text style={styles.emptyTitle}>{t("findYourFriends")}</Text>
                  <Text style={styles.emptySub}>{t("findYourFriendsSub")}</Text>
                </View>
              )
            }
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: headerHeight,
                paddingHorizontal: bp.contentPadding,
              },
            ]}
          />
        )}
      </View>

      {/* ── Scroll-to-top FAB ── */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fabAnim,
            transform: [
              {
                scale: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
            pointerEvents: showFab ? "auto" : "none",
          } as any,
        ]}
      >
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={scrollToTop}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
        >
          <ChevronUp size={22} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerContainer: { paddingTop: Spacing.sm, paddingBottom: 4 },
  titleRow: { marginBottom: Spacing.md },
  pageTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 3,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.overlay.light,
    alignItems: "center",
    justifyContent: "center",
  },
  catTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.text.primary,
  },
  catSub: { fontSize: FontSize.sm, color: Colors.text.secondary },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text.primary },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: { paddingBottom: 100 },
  centeredColumn: { width: "100%", alignSelf: "center" },
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 8,
  },
  loadMore: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    // Red underline accent (matches the Home "Discover/Following" tabs) instead
    // of a gray pill background.
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent,
  },
  loadMoreTxt: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  sectionLbl: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: Spacing.xl,
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllTxt: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: Spacing.xl,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  recentTxt: { fontSize: FontSize.base, color: Colors.text.primary },
  deleteRecentItemBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  pillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillTxt: { fontSize: FontSize.md, color: Colors.text.primary },
  footerContainer: { alignItems: "center", paddingVertical: 16 },
  loadMoreContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  defaultHeader: { paddingBottom: Spacing.md },
  recentSection: { marginBottom: Spacing.xl },
  trendingSection: { marginBottom: Spacing.xl },
  loadingIndicator: { marginTop: 50 },
  headerWrapper: { width: "100%" },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.secondary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userDisplayName: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  userHandle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: FontSize.xs,
    marginTop: 2,
    fontWeight: FontWeight.semibold,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxxl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
  },
  emptySub: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    textAlign: "center",
    marginTop: 4,
  },

  // Scroll-to-top FAB
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 99,
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // Neutral gray surface matching the sidebar (instead of the red brand color).
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 8 },
      web:     { boxShadow: '0 4px 10px rgba(0,0,0,0.4)' } as any,
    }),
  },
});
