import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ArrowUpDown, Film, Check, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { WatchlistMovie } from '../types';
import MovieListItem from '../components/movie/MovieListItem';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useLanguage } from '../context/LanguageContext';

const SORTS = ['Added', 'Rating', 'Release', 'Title'];

const WatchlistScreen: React.FC = () => {
  const router = useRouter();
  const { watchlist, toggleWatched, removeFromWatchlist, userRatings } = useWatchlist();
  const [activeTab, setActiveTab] = useState('Watchlist'); // 'Watchlist' or 'Rated'
  const [activeSort, setActiveSort] = useState('Added');
  const [isAscending, setIsAscending] = useState(false);
  const bp = useBreakpoint();
  const { t } = useLanguage();

  // Filter based on Tab
  const filteredList = useMemo(() => {
    if (activeTab === 'Watchlist') {
      return watchlist;
    } else {
      // Show movies that the user has rated, even if not in watchlist
      // For simplicity in this app, we'll show movies from watchlist that have ratings
      // OR we can map userRatings back to movie objects if we had a full database.
      // For now, let's show items from watchlist that have a user rating.
      return watchlist.filter(m => userRatings[m.id] !== undefined);
    }
  }, [watchlist, activeTab, userRatings]);

  const sortedList = useMemo(() => {
    const list = [...filteredList];
    const modifier = isAscending ? 1 : -1;

    switch (activeSort) {
      case 'Rating':  
        list.sort((a, b) => modifier * ((a.vote_average || 0) - (b.vote_average || 0))); 
        break;
      case 'Release': 
        list.sort((a, b) => modifier * (a.release_date || '').localeCompare(b.release_date || '')); 
        break;
      case 'Title':   
        list.sort((a, b) => modifier * a.title.localeCompare(b.title)); 
        break;
      case 'Added':   
        list.sort((a, b) => modifier * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())); 
        break;
    }
    return list;
  }, [filteredList, activeSort, isAscending]);

  const watched = watchlist.filter(m => m.watched).length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle} allowFontScaling={false}>{t('myWatchlist')}</Text>
          <Text style={styles.headerSub} allowFontScaling={false}>
            {activeTab === 'Watchlist' ? `${watchlist.length} ${t('moviesShowsToWatch')}` : `${filteredList.length} ${t('ratedByYou')}`}
          </Text>
        </View>
      </View>

      {/* ── IMDb Style Tabs ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Watchlist' && styles.tabActive]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Watchlist'); }}
        >
          <Text style={[styles.tabText, activeTab === 'Watchlist' && styles.tabTextActive]}>
            {t('tabWatchlist')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Watchlist' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{watchlist.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Rated' && styles.tabActive]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Rated'); }}
        >
          <Text style={[styles.tabText, activeTab === 'Rated' && styles.tabTextActive]}>
            {t('rated')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Rated' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{Object.keys(userRatings).length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Sort chips ── */}
      <View style={styles.sortRow}>
        <TouchableOpacity 
          style={styles.sortHeaderBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsAscending(!isAscending);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.sortByLbl}>Sort</Text>
          {isAscending ? (
            <ArrowUp size={14} color={Colors.primary} strokeWidth={3} />
          ) : (
            <ArrowDown size={14} color={Colors.primary} strokeWidth={3} />
          )}
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
        </ScrollView>
      </View>

      {/* ── List ── */}
      <FlatList
        data={sortedList}
        keyExtractor={item => item.id.toString()}
        numColumns={1}
        renderItem={({ item, index }) => (
          <MovieListItem
            movie={item}
            onPress={() => router.push(`/movie/${item.id}?type=${item.media_type || 'movie'}` as any)}
            showWatched={true}
            watched={item.watched}
            inWatchlist={true}
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
            <Text style={styles.emptyTitle} allowFontScaling={false}>
              {activeTab === 'Watchlist' ? t('emptyWatchlistTitle') : 'No ratings yet'}
            </Text>
            <Text style={styles.emptySub} allowFontScaling={false}>
              {activeTab === 'Watchlist' 
                ? t('emptyWatchlistSub') 
                : 'Rate movies to see them in this list.'}
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
    fontSize: 20,
    fontWeight: FontWeight.black,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.text.secondary,
    marginTop: 3,
  },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(229,9,20,0.2)',
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: 12,
  },
  sortByLbl: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sortChipActive: {
    backgroundColor: 'rgba(229,9,20,0.1)',
    borderColor: 'rgba(229,9,20,0.3)',
  },
  sortChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
  },
  sortChipTextActive: {
    color: Colors.primary,
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
    color: Colors.text.primary,
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
