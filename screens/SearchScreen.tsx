import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator, Animated, FlatList, Image, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft, Award, ChevronDown, Clock, Flame,
  Search, SearchX, Star, TrendingUp, User, X,
} from "lucide-react-native";
import MovieListItem from "../components/movie/MovieListItem";
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing, TMDB_IMAGE_SIZES } from "../constants/theme";
import { useWatchlist } from "../context/WatchlistContext";
import { useDebounce } from "../hooks/useDebounce";
import { useBreakpoint } from "../hooks/useBreakpoint";
import {
  discoverMovies, getPopularMovies, getPopularPeople,
  getTopRatedMovies, getTopRatedTV, getTrendingMovies,
  getTrendingTV, searchMovies, searchPeople, searchTV,
} from "../services/api";
import { Movie } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const norm = (i: any): Movie => ({
  ...i,
  title: i.title ?? i.name ?? "Unknown",
  release_date: i.release_date ?? i.first_air_date ?? "",
  poster_path: i.poster_path ?? null,
});

// ─── Category definitions ─────────────────────────────────────────────────────
type CatKey = "trending-movies"|"trending-tv"|"popular"|"top-rated-movies"|"top-rated-tv";
interface CatDef {
  label: string; subtitle: string;
  Icon: React.ElementType; iconColor: string;
  fetchFn: (page: number) => Promise<{ results: any[]; total_pages: number; total_results: number }>;
  normalize?: boolean;
}
const CATS: Record<CatKey, CatDef> = {
  "trending-movies": { label:"Trending Movies",      subtitle:"What the world is watching right now", Icon:Flame, iconColor:"#E50914", fetchFn: getTrendingMovies },
  "trending-tv":     { label:"Trending Shows",        subtitle:"Most-watched series this week",        Icon:Flame, iconColor:"#FF6B35", fetchFn: getTrendingTV,     normalize:true },
  "popular":         { label:"Popular on WatchList",  subtitle:"Most-loved by our community",          Icon:Star,  iconColor:"#F5C518", fetchFn: getPopularMovies },
  "top-rated-movies":{ label:"Top Rated Movies",      subtitle:"Critically acclaimed films of all time",Icon:Award, iconColor:"#4CAF50", fetchFn: getTopRatedMovies },
  "top-rated-tv":    { label:"Top Rated Shows",        subtitle:"The finest TV series ever made",       Icon:Award, iconColor:"#2196F3", fetchFn: getTopRatedTV,    normalize:true },
};

const FILTER_CHIPS = [
  {id:"movies",label:"Movies"},{id:"tv",label:"TV Shows"},
  {id:"28",label:"Action"},{id:"35",label:"Comedy"},{id:"18",label:"Drama"},
  {id:"27",label:"Horror"},{id:"878",label:"Sci-Fi"},{id:"10749",label:"Romance"},
  {id:"12",label:"Adventure"},{id:"80",label:"Crime"},{id:"people",label:"People"},
];
const HOT = ["Dune Part 3","Mission Impossible 8","Avatar 3","Deadpool 4","The Batman 2","John Wick 5"];

// ─── Load More Button ─────────────────────────────────────────────────────────
function LoadMoreBtn({ onPress, loading, page, total }: { onPress:()=>void; loading:boolean; page:number; total:number }) {
  if (page >= total) return null;
  return (
    <TouchableOpacity style={s.loadMore} onPress={onPress} activeOpacity={0.8} disabled={loading}>
      {loading
        ? <ActivityIndicator size="small" color="#E50914" />
        : <>
            <ChevronDown size={18} color="#fff" strokeWidth={2.5} />
            <Text style={s.loadMoreTxt} allowFontScaling={false}>Load More</Text>
            <Text style={s.loadMorePage} allowFontScaling={false}>Page {page} of {total}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

// ─── Person row ───────────────────────────────────────────────────────────────
function PersonCard({ person, onPress }: { person:any; onPress:()=>void }) {
  const uri = person.profile_path ? `${TMDB_IMAGE_SIZES.small}${person.profile_path}` : null;
  return (
    <TouchableOpacity style={s.personRow} onPress={onPress} activeOpacity={0.75}>
      {uri ? <Image source={{uri}} style={s.personImg} />
            : <View style={[s.personImg,s.personPholder]}><User size={22} color={Colors.primary} strokeWidth={1.5}/></View>}
      <View style={{flex:1}}>
        <Text style={s.personName} numberOfLines={1} allowFontScaling={false}>{person.name}</Text>
        <Text style={s.personDept} numberOfLines={1} allowFontScaling={false}>
          {person.known_for_department ?? "Actor"}
          {person.known_for?.[0] ? ` · ${person.known_for[0]?.title ?? person.known_for[0]?.name ?? ""}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function SearchScreen() {
  const router = useRouter();
  const bp     = useBreakpoint();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const params = useLocalSearchParams<{ genre?:string; category?:string }>();

  // ── mode state ──────────────────────────────────────────────────────────────
  const [activeCat,    setActiveCat]    = useState<CatKey|null>((params.category as CatKey) ?? null);
  const [activeFilter, setActiveFilter] = useState(params.genre || "movies");
  const [searchText,   setSearchText]   = useState("");
  const debouncedQ = useDebounce(searchText, 450);

  // ── data state ──────────────────────────────────────────────────────────────
  const [items,         setItems]         = useState<Movie[]>([]);
  const [personItems,   setPersonItems]   = useState<any[]>([]);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalResults,  setTotalResults]  = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [recentSearches,setRecentSearches]= useState<string[]>([]);

  const inputRef   = useRef<TextInput>(null);
  const inputScale = useRef(new Animated.Value(1)).current;

  // ── sync params ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = params.category as CatKey|undefined;
    if (c) { setActiveCat(c); setSearchText(""); setItems([]); setPage(1); }
  }, [params.category]);

  useEffect(() => {
    if (params.genre) { setActiveCat(null); setActiveFilter(params.genre); setSearchText(""); }
  }, [params.genre]);

  // ── fetch helpers ────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (query: string, filter: string, p: number, append: boolean) => {
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      let raw: any[]  = [];
      let tp = 1, tr = 0;

      if (filter === "people") {
        const d = query.trim() ? await searchPeople(query, p) : await getPopularPeople(p);
        raw = d.results ?? []; tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
        setPersonItems(append ? prev => [...prev, ...raw] : raw);
        if (!append) setItems([]);
      } else {
        if (filter === "movies") {
          const d = query.trim() ? await searchMovies(query, p) : await getTrendingMovies(p);
          raw = d.results ?? []; tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
        } else if (filter === "tv") {
          const d = query.trim() ? await searchTV(query, p) : await getTrendingTV(p);
          raw = (d.results ?? []).map(norm); tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
        } else {
          const d = query.trim() ? await searchMovies(query, p) : await discoverMovies(Number(filter), p);
          raw = query.trim()
            ? (d.results ?? []).filter((m:any) => m.genre_ids?.includes(Number(filter)))
            : (d.results ?? []);
          tp = d.total_pages ?? 1; tr = d.total_results ?? raw.length;
        }
        setItems(append ? prev => [...prev, ...raw] : raw);
        if (!append) setPersonItems([]);
      }
      setTotalPages(tp);
      setTotalResults(tr);
    } catch(e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  const numCols   = bp.isDesktop ? 3 : bp.isTablet ? 2 : 1;

  const filteredItems = useMemo(() => {
    return items.filter(m => !searchText.trim() || m.title?.toLowerCase().includes(searchText.toLowerCase()));
  }, [items, searchText]);

  const listContentStyle = useMemo(() => [
    s.listContent,
    numCols > 1 ? { paddingTop: 8 } : null
  ], [numCols]);

  const columnStyle = useMemo(() => 
    numCols > 1 ? { gap: 10, paddingHorizontal: bp.contentPadding } : undefined
  , [numCols, bp.contentPadding]);

  // ── category fetch ───────────────────────────────────────────────────────────
  const fetchCatPage = useCallback(async (cat: CatKey, p: number, append: boolean) => {
    p === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const def = CATS[cat];
      const d   = await def.fetchFn(p);
      const raw = def.normalize ? (d.results ?? []).map(norm) : (d.results ?? []);
      setItems(append ? prev => [...prev, ...raw] : raw);
      setTotalPages(d.total_pages ?? 1);
      setTotalResults(d.total_results ?? raw.length);
      setPersonItems([]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  // ── effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeCat) { setPage(1); fetchCatPage(activeCat, 1, false); }
  }, [activeCat]);

  useEffect(() => {
    if (activeCat) return;
    setPage(1);
    fetchPage(debouncedQ, activeFilter, 1, false);
  }, [debouncedQ, activeFilter, activeCat]);

  // ── actions ──────────────────────────────────────────────────────────────────
  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    if (activeCat) fetchCatPage(activeCat, next, true);
    else fetchPage(debouncedQ, activeFilter, next, true);
  };

  const exitCat = () => { setActiveCat(null); setItems([]); setPage(1); setSearchText(""); };
  const toggleWL = (m: Movie) => {
    const has = isInWatchlist(m.id);
    Haptics.notificationAsync(has ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    has ? removeFromWatchlist(m.id) : addToWatchlist(m);
  };
  const goToMovie  = (id:number) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/movie/${id}` as any); };
  const goToPerson = (id:number) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/person/${id}` as any); };
  const hitSearch  = (t:string)  => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearchText(t); };
  const onFocus = () => Animated.spring(inputScale,{toValue:1.015,useNativeDriver:true,speed:20}).start();
  const onBlur  = () => Animated.spring(inputScale,{toValue:1,useNativeDriver:true,speed:20}).start();

  const isPeople  = activeFilter === "people";
  const showDefault = !activeCat && searchText.length === 0;

  // ─── shared search bar ───────────────────────────────────────────────────────
  const SearchBar = (
    <Animated.View style={[s.searchWrap, { marginHorizontal: bp.contentPadding, transform:[{scale:inputScale}] }]}>
      <Search size={18} color={Colors.primary} strokeWidth={2} />
      <TextInput
        ref={inputRef} style={s.searchInput}
        placeholder={activeCat ? `Search in ${CATS[activeCat]?.label}…` : "Movies, TV shows, people…"}
        placeholderTextColor={Colors.text.secondary}
        value={searchText} onChangeText={setSearchText}
        onSubmitEditing={() => { const t=searchText.trim(); if(t&&!recentSearches.includes(t)) setRecentSearches(p=>[t,...p].slice(0,5)); }}
        onFocus={onFocus} onBlur={onBlur}
        returnKeyType="search" allowFontScaling={false} autoCorrect={false}
      />
      {searchText.length>0 && (
        <TouchableOpacity style={s.clearBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearchText(""); }}>
          <X size={13} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // ─── shared footer ────────────────────────────────────────────────────────────
  const Footer = (
    <View style={{alignItems:"center", paddingVertical: 16}}>
      {!loading && totalResults > 0 && (
        <Text style={s.resultCount} allowFontScaling={false}>
          Showing {items.length} of {totalResults.toLocaleString()} results
        </Text>
      )}
      <LoadMoreBtn onPress={loadMore} loading={loadingMore} page={page} total={totalPages} />
    </View>
  );

  // ─── CATEGORY MODE ────────────────────────────────────────────────────────────
  if (activeCat) {
    const def = CATS[activeCat];
    return (
      <SafeAreaView style={s.root} edges={["top"]}>
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={[s.catHeader, {paddingHorizontal: bp.contentPadding}]}>
          <TouchableOpacity style={s.backBtn} onPress={exitCat} activeOpacity={0.75}>
            <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{flex:1}}>
            <View style={{flexDirection:"row", alignItems:"center", gap:8, marginBottom:3}}>
              <def.Icon size={18} color={def.iconColor} strokeWidth={2.5} />
              <Text style={s.catTitle} allowFontScaling={false}>{def.label}</Text>
            </View>
            <Text style={s.catSub} allowFontScaling={false}>{def.subtitle}</Text>
          </View>
        </View>
        {SearchBar}
        {!loading && items.length > 0 && (
          <Text style={[s.resultCount, {paddingHorizontal: bp.contentPadding, marginBottom: 8}]} allowFontScaling={false}>
            {totalResults.toLocaleString()} titles
          </Text>
        )}
        <FlatList
          data={filteredItems}
          keyExtractor={i => `cat-${i.id}`}
          numColumns={numCols} key={bp.breakpoint}
          columnWrapperStyle={columnStyle}
          renderItem={({item}) => (
            <MovieListItem movie={item} onPress={() => goToMovie(item.id)} onAdd={() => toggleWL(item)} inWatchlist={isInWatchlist(item.id)} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={listContentStyle}
          keyboardDismissMode="on-drag"
          ListFooterComponent={Footer}
          ListEmptyComponent={!loading ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><SearchX size={36} color={Colors.primary} strokeWidth={1.5}/></View>
              <Text style={s.emptyTitle} allowFontScaling={false}>No results</Text>
              <Text style={s.emptySub}   allowFontScaling={false}>Try a different keyword.</Text>
            </View>
          ) : null}
        />
      </SafeAreaView>
    );
  }

  // ─── DISCOVER MODE ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <View style={[s.titleRow, {paddingHorizontal: bp.contentPadding}]}>
        <Text style={s.pageTitle} allowFontScaling={false}>Discover</Text>
        <Text style={s.pageSub}   allowFontScaling={false}>Search movies, shows, and people</Text>
      </View>
      {SearchBar}
      {/* Filter chips */}
      <View style={{flexGrow:0, marginBottom: Spacing.md}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTER_CHIPS.map(c => (
            <TouchableOpacity key={c.id} activeOpacity={0.75}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(c.id); }}
              style={[s.chip, activeFilter===c.id && s.chipActive]}>
              <Text style={[s.chipTxt, activeFilter===c.id && s.chipTxtActive]} allowFontScaling={false}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* People */}
      {isPeople && (
        <FlatList
          data={personItems} keyExtractor={i => String(i.id)}
          renderItem={({item}) => <PersonCard person={item} onPress={() => goToPerson(item.id)} />}
          showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}
          keyboardDismissMode="on-drag"
          ListFooterComponent={Footer}
          ListEmptyComponent={!loading ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><SearchX size={36} color={Colors.primary} strokeWidth={1.5}/></View>
              <Text style={s.emptyTitle} allowFontScaling={false}>{showDefault?"Search for people":"No results"}</Text>
            </View>
          ) : null}
        />
      )}
      {/* Movies / TV */}
      {!isPeople && (
        <FlatList
          data={items} keyExtractor={i => `disc-${i.id}`}
          numColumns={numCols} key={bp.breakpoint}
          columnWrapperStyle={columnStyle}
          renderItem={({item}) => (
            <MovieListItem movie={item} onPress={() => goToMovie(item.id)} onAdd={() => toggleWL(item)} inWatchlist={isInWatchlist(item.id)} />
          )}
          showsVerticalScrollIndicator={false} contentContainerStyle={listContentStyle}
          keyboardDismissMode="on-drag"
          ListHeaderComponent={showDefault ? (
            <View style={{paddingBottom: Spacing.md}}>
              {recentSearches.length>0 && (
                <View style={{marginBottom: Spacing.xl}}>
                  <Text style={s.sectionLbl} allowFontScaling={false}>Recent</Text>
                  {recentSearches.map(t => (
                    <TouchableOpacity key={t} style={s.recentRow} onPress={() => hitSearch(t)}>
                      <Clock size={14} color={Colors.primary} strokeWidth={2}/>
                      <Text style={s.recentTxt} allowFontScaling={false}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{marginBottom: Spacing.xl}}>
                <Text style={s.sectionLbl} allowFontScaling={false}>Trending Searches</Text>
                <View style={s.pills}>
                  {HOT.map(t => (
                    <TouchableOpacity key={t} style={s.pill} onPress={() => hitSearch(t)}>
                      <TrendingUp size={12} color={Colors.primary} strokeWidth={2.5}/>
                      <Text style={s.pillTxt} allowFontScaling={false}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text style={s.sectionLbl} allowFontScaling={false}>
                {activeFilter==="movies" ? "Trending Today" : activeFilter==="tv" ? "Trending TV" : "Popular"}
              </Text>
            </View>
          ) : null}
          ListFooterComponent={Footer}
          ListEmptyComponent={!loading && !showDefault ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}><SearchX size={36} color={Colors.primary} strokeWidth={1.5}/></View>
              <Text style={s.emptyTitle} allowFontScaling={false}>No results</Text>
              <Text style={s.emptySub}   allowFontScaling={false}>Try another keyword.</Text>
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor: Colors.background },
  titleRow:  { paddingTop: Spacing.sm, paddingBottom: 4 },
  pageTitle: { fontSize:30, fontWeight: FontWeight.black, color: Colors.text.primary, letterSpacing:-0.5 },
  pageSub:   { fontSize:13, color: Colors.text.secondary, marginTop:3, marginBottom: Spacing.lg },

  catHeader: { flexDirection:"row", alignItems:"center", paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap:14 },
  backBtn:   { width:38, height:38, borderRadius:19, backgroundColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center" },
  catTitle:  { fontSize:22, fontWeight: FontWeight.black, color: Colors.text.primary, letterSpacing:-0.3 },
  catSub:    { fontSize:13, color: Colors.text.secondary },

  searchWrap: { flexDirection:"row", alignItems:"center", gap: Spacing.md, marginBottom: Spacing.lg, height:52, backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, ...Shadow.md },
  searchInput:{ flex:1, fontSize: FontSize.base, color: Colors.text.primary, minWidth:0 },
  clearBtn:   { width:26, height:26, borderRadius:13, backgroundColor: Colors.primary, justifyContent:"center", alignItems:"center" },

  filterRow: { flexDirection:"row", paddingHorizontal: Spacing.xl, paddingVertical:10, gap: Spacing.sm, marginBottom: Spacing.md },
  chip:      { paddingHorizontal:16, paddingVertical:8, borderRadius: Radius.full, backgroundColor: Colors.surface },
  chipActive:{ backgroundColor: Colors.primary, ...Shadow.primary },
  chipTxt:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  chipTxtActive:{ color: Colors.white, fontWeight: FontWeight.bold },

  listContent:{ paddingBottom: Platform.OS==="ios" ? 100 : 80 },

  resultCount: { fontSize:12, color: Colors.text.secondary, fontWeight: FontWeight.semibold, marginBottom:4 },

  // Load More Button
  loadMore: {
    flexDirection:"row", alignItems:"center", gap:8,
    marginTop:12, marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    height:48, borderRadius: Radius.lg,
    backgroundColor:"rgba(229,9,20,0.12)",
    borderWidth:1, borderColor:"rgba(229,9,20,0.35)",
    justifyContent:"center",
  },
  loadMoreTxt:  { fontSize:15, fontWeight: FontWeight.bold, color:"#E50914" },
  loadMorePage: { fontSize:12, color:"rgba(229,9,20,0.65)", fontWeight: FontWeight.semibold },

  sectionLbl: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  pills: { flexDirection:"row", flexWrap:"wrap", paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  pill:  { flexDirection:"row", alignItems:"center", gap:5, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal:14, paddingVertical:8, ...Shadow.sm },
  pillTxt: { fontSize: FontSize.md, color: Colors.text.primary, fontWeight: FontWeight.medium },
  recentRow: { flexDirection:"row", alignItems:"center", gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical:11, borderBottomWidth:1, borderBottomColor: Colors.overlay.light },
  recentTxt: { fontSize: FontSize.base, color: Colors.text.primary, fontWeight: FontWeight.medium },

  empty:      { paddingTop:72, alignItems:"center", paddingHorizontal:40 },
  emptyIcon:  { width:76, height:76, borderRadius:38, backgroundColor:"rgba(63,114,175,0.10)", alignItems:"center", justifyContent:"center", marginBottom: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub:   { fontSize: FontSize.base, color: Colors.text.secondary, textAlign:"center", lineHeight:22 },

  personRow:   { flexDirection:"row", alignItems:"center", paddingHorizontal: Spacing.xl, paddingVertical:12, borderBottomWidth:1, borderBottomColor: Colors.overlay.light, gap: Spacing.md },
  personImg:   { width:52, height:52, borderRadius:26, backgroundColor: Colors.surface },
  personPholder:{ alignItems:"center", justifyContent:"center" },
  personName:  { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text.primary },
  personDept:  { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop:3 },
});
