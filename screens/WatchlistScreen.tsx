import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ArrowUpDown, Film, Check, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '@/constants/theme';
import { useWatchlist } from '@/context/WatchlistContext';
import { WATCHLIST_STATUS } from '@/types/watchlist';
import MovieListItem from '@/components/movie/MovieListItem';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cursorPointer } from '@/utils/webStyles';
import { useLanguage } from '@/context/LanguageContext';

const SORTS = ['Added', 'Rating', 'Release', 'Title'];

// Fixed row height for getItemLayout optimization (image + meta + padding)
const ITEM_HEIGHT = 100;

const WatchlistScreen: React.FC = () => {
  const router = useRouter();
  const { watchlist, toggleWatched, removeFromWatchlist, userRatings } = useWatchlist();
  const [activeTab, setActiveTab] = useState('Watchlist'); // 'Watchlist' or 'Rated'
  const [activeSort, setActiveSort] = useState('Added');
  const [isAscending, setIsAscending] = useState(false);
  const bp = useBreakpoint();
  const { t } = useLanguage();

  // M5: Stable callbacks — prevent renderItem from re-creating fns on every render
  const handlePress = useCallback((id: number, mediaType: string) => {
    router.push({ pathname: '/movie/[id]', params: { id: id.toString(), type: mediaType } });
  }, [router]);

  const handleToggleWatched = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWatched(id);
  }, [toggleWatched]);

  const handleRemove = useCallback((id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeFromWatchlist(id);
  }, [removeFromWatchlist]);

  const planToWatchList = useMemo(() => watchlist.filter(m => m.status === WATCHLIST_STATUS.PLAN_TO_WATCH), [watchlist]);
  const watchedList = useMemo(() => watchlist.filter(m => m.status === WATCHLIST_STATUS.COMPLETED), [watchlist]);
  const ratedList = useMemo(() => watchlist.filter(m => userRatings[m.id] !== undefined), [watchlist, userRatings]);

  // Filter based on Tab
  const filteredList = useMemo(() => {
    if (activeTab === 'Watchlist') return planToWatchList;
    if (activeTab === 'Watched') return watchedList;
    return ratedList;
  }, [planToWatchList, watchedList, ratedList, activeTab]);

  const sortedList = useMemo(() => {
    const list = [...filteredList];
    const modifier = isAscending ? 1 : -1;

    switch (activeSort) {
      case 'Rating':  
        list.sort((a, b) => modifier * ((a.vote_average || 0) - (b.vote_average || 0))); 
        break;
      case 'Release': 
        list.sort((a, b) => {
          const dateA = a.mediaType === 'movie' ? a.release_date : a.first_air_date;
          const dateB = b.mediaType === 'movie' ? b.release_date : b.first_air_date;
          return modifier * (dateA || '').localeCompare(dateB || '');
        }); 
        break;
      case 'Title':   
        list.sort((a, b) => {
          const titleA = a.mediaType === 'movie' ? a.title : a.name;
          const titleB = b.mediaType === 'movie' ? b.title : b.name;
          return modifier * titleA.localeCompare(titleB);
        }); 
        break;
      case 'Added':   
        list.sort((a, b) => modifier * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())); 
        break;
    }
    return list;
  }, [filteredList, activeSort, isAscending]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle} allowFontScaling={false}>{t('myWatchlist')}</Text>
          <Text style={styles.headerSub} allowFontScaling={false}>
            {activeTab === 'Watchlist' ? `${planToWatchList.length} ${t('moviesShowsToWatch')}` : activeTab === 'Watched' ? `${watchedList.length} Watched` : `${ratedList.length} ${t('ratedByYou')}`}
          </Text>
        </View>
      </View>

      {/* ── IMDb Style Tabs ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Watchlist' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Watchlist'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Watchlist' }}
          accessibilityLabel={t('tabWatchlist')}
        >
          <Text style={[styles.tabText, activeTab === 'Watchlist' && styles.tabTextActive]}>
            {t('tabWatchlist')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Watchlist' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{planToWatchList.length}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Watched' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Watched'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Watched' }}
          accessibilityLabel="Watched"
        >
          <Text style={[styles.tabText, activeTab === 'Watched' && styles.tabTextActive]}>
            Watched
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Watched' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{watchedList.length}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Rated' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Rated'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Rated' }}
          accessibilityLabel={t('rated')}
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
          style={[styles.sortHeaderBtn, cursorPointer]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsAscending(!isAscending);
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Sort direction: ${isAscending ? 'ascending' : 'descending'}`}
          accessibilityHint="Toggles sort order"
        >
          <Text style={styles.sortByLbl}>Sort</Text>
          {isAscending ? (
            <ArrowUp size={IconSize.xs} color={Colors.primary} strokeWidth={3} />
          ) : (
            <ArrowDown size={IconSize.xs} color={Colors.primary} strokeWidth={3} />
          )}
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SORTS.map(s => (
            <TouchableOpacity
              key={s}
              activeOpacity={0.75}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveSort(s); }}
              style={[styles.sortChip, activeSort === s && styles.sortChipActive, cursorPointer]}
              accessibilityRole="button"
              accessibilityLabel={`Sort by ${s}`}
              accessibilityState={{ selected: activeSort === s }}
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
            onPress={() => handlePress(item.id, item.mediaType)}
            showWatched={true}
            watched={item.status === WATCHLIST_STATUS.COMPLETED}
            inWatchlist={true}
            onToggleWatched={() => handleToggleWatched(item.id)}
            onRemove={() => handleRemove(item.id)}
            rank={index + 1}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        windowSize={5}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        removeClippedSubviews={true}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Film size={IconSize.xl} color={Colors.primary} strokeWidth={1.5} />
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
    fontSize: FontSize.xl,
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
    backgroundColor: Colors.overlay.light,
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
    backgroundColor: Colors.overlay.light5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: Colors.danger,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
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
    backgroundColor: Colors.overlay.light5,
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
    borderColor: Colors.overlay.light5,
  },
  sortChipActive: {
    backgroundColor: Colors.overlay.light20,
    borderColor: Colors.danger,
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
