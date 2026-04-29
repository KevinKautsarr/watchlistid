import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Platform, StatusBar, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Search, X, TrendingUp, Clock, SearchX } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { searchMovies, getTrendingMovies } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { Movie } from '../types';
import MovieListItem from '../components/movie/MovieListItem';

interface SearchScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const TRENDING_SEARCHES = [
  'Dune Part 3', 'Mission Impossible 8', 'Avatar 3',
  'Deadpool 4', 'The Batman 2', 'John Wick 5',
  'Avengers Secret Wars', 'Fast X 2',
];

const FILTER_CHIPS = [
  { id: 'movies',    label: 'Movies' },
  { id: 'tv',        label: 'TV Shows' },
  { id: 'anime',     label: '⛩️ Anime' },
  { id: 'animation', label: '✨ Animation' },
  { id: 'people',    label: 'People' },
];

const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [searchText, setSearchText]       = useState('');
  const [activeFilter, setActiveFilter]   = useState('movies');
  const [results, setResults]             = useState<Movie[]>([]);
  const [loading, setLoading]             = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const inputScale = useRef(new Animated.Value(1)).current;

  const debouncedSearch = useDebounce(searchText, 450);

  useEffect(() => {
    if (debouncedSearch.trim().length > 0) performSearch(debouncedSearch);
    else fetchTrending();
  }, [debouncedSearch]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const data = await getTrendingMovies();
      setResults(data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const data = await searchMovies(query);
      setResults(data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = () => {
    const term = searchText.trim();
    if (term && !recentSearches.includes(term)) {
      setRecentSearches(prev => [term, ...prev].slice(0, 5));
    }
  };

  const hitSearch = (term: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchText(term);
  };

  const toggleWL = (movie: Movie) => {
    const isAdded = isInWatchlist(movie.id);
    Haptics.notificationAsync(
      isAdded ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    );
    isAdded ? removeFromWatchlist(movie.id) : addToWatchlist(movie);
  };

  const navigateDetail = (movie: Movie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MovieDetail', { id: movie.id, title: movie.title });
  };

  const onFocus = () =>
    Animated.spring(inputScale, { toValue: 1.015, useNativeDriver: true, speed: 20 }).start();
  const onBlur = () =>
    Animated.spring(inputScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const showDefault = searchText.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Page title ── */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle} allowFontScaling={false}>Discover</Text>
      </View>

      {/* ── Search bar ── */}
      <Animated.View style={[styles.searchWrap, { transform: [{ scale: inputScale }] }]}>
        <Search size={18} color={Colors.primary} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Movies, TV shows, people…"
          placeholderTextColor={Colors.text.secondary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmit}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
          allowFontScaling={false}
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.75}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearchText(''); }}
          >
            <X size={13} color={Colors.white} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.id}
            activeOpacity={0.75}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(chip.id); }}
            style={[styles.filterChip, activeFilter === chip.id && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, activeFilter === chip.id && styles.filterChipTextActive]} allowFontScaling={false}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Results / default ── */}
      <FlatList
        data={results}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <MovieListItem
            movie={item}
            onPress={() => navigateDetail(item)}
            onAdd={() => toggleWL(item)}
            inWatchlist={isInWatchlist(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={showDefault ? (
          <View style={styles.defaultHeader}>

            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel} allowFontScaling={false}>Recent</Text>
                {recentSearches.map(term => (
                  <TouchableOpacity key={term} style={styles.recentRow} onPress={() => hitSearch(term)}>
                    <Clock size={14} color={Colors.primary} strokeWidth={2} />
                    <Text style={styles.recentText} allowFontScaling={false}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel} allowFontScaling={false}>Trending Searches</Text>
              <View style={styles.trendingPills}>
                {TRENDING_SEARCHES.map(term => (
                  <TouchableOpacity key={term} style={styles.trendPill} onPress={() => hitSearch(term)}>
                    <TrendingUp size={12} color={Colors.primary} strokeWidth={2.5} />
                    <Text style={styles.trendPillText} allowFontScaling={false}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.sectionLabel} allowFontScaling={false}>Trending Today</Text>
          </View>
        ) : null}
        ListEmptyComponent={!loading && !showDefault ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <SearchX size={36} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle} allowFontScaling={false}>No results</Text>
            <Text style={styles.emptySub} allowFontScaling={false}>
              No results for "{searchText}". Try a different keyword.
            </Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  titleRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: FontWeight.black,
    color: Colors.dark,
    letterSpacing: -0.5,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.dark,
    minWidth: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    ...Shadow.primary,
  },
  filterChipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },

  defaultHeader: { paddingBottom: Spacing.md },
  section: { marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },

  trendingPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    ...Shadow.sm,
  },
  trendPillText: {
    fontSize: FontSize.md,
    color: Colors.dark,
    fontWeight: FontWeight.medium,
  },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay.light,
  },
  recentText: {
    fontSize: FontSize.base,
    color: Colors.dark,
    fontWeight: FontWeight.medium,
  },

  empty: { paddingTop: 72, alignItems: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(63,114,175,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SearchScreen;
