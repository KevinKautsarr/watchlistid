import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ArrowUpDown, Film, Check, Trash2 } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistMovie } from '../types';
import MovieListItem from '../components/movie/MovieListItem';

interface WatchlistScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

const SORTS = ['Added', 'Rating', 'Release', 'Title'];

const WatchlistScreen: React.FC<WatchlistScreenProps> = ({ navigation }) => {
  const { watchlist, toggleWatched, removeFromWatchlist } = useWatchlist();
  const [activeSort, setActiveSort] = useState('Added');

  const sortedWatchlist = useMemo(() => {
    const list = [...watchlist];
    switch (activeSort) {
      case 'Rating':  list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)); break;
      case 'Release': list.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || '')); break;
      case 'Title':   list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'Added':   list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()); break;
    }
    return list;
  }, [watchlist, activeSort]);

  const watched = watchlist.filter(m => m.watched).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle} allowFontScaling={false}>Watchlist</Text>
          <Text style={styles.headerSub} allowFontScaling={false}>
            {watchlist.length} titles · {watched} watched
          </Text>
        </View>
      </View>

      {/* ── Sort chips ── */}
      <View style={styles.sortRow}>
        {SORTS.map(s => (
          <TouchableOpacity
            key={s}
            activeOpacity={0.75}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveSort(s); }}
            style={[styles.sortChip, activeSort === s && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, activeSort === s && styles.sortChipTextActive]} allowFontScaling={false}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={sortedWatchlist}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item, index }) => (
          <MovieListItem
            movie={item}
            onPress={() => navigation.navigate('MovieDetail', { id: item.id, title: item.title })}
            showWatched
            watched={item.watched}
            onToggleWatched={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleWatched(item.id);
            }}
            onRemove={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              removeFromWatchlist(item.id);
            }}
            rank={index + 1}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Film size={40} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle} allowFontScaling={false}>Nothing here yet</Text>
            <Text style={styles.emptySub} allowFontScaling={false}>
              Add movies from Home or Discover to start building your list.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: FontWeight.black,
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 3,
  },

  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    ...Shadow.primary,
  },
  sortChipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  sortChipTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: 4,
  },

  empty: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
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

export default WatchlistScreen;
