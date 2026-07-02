import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, ScrollView, FlatList,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Shimmer } from '@/components/common/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ArrowUpDown, Film, Check, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native';
import LiquidGlassFab from '@/components/common/LiquidGlassFab';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '@/constants/theme';
import { useWatchlist } from '@/context/WatchlistContext';
import { WATCHLIST_STATUS, WatchlistItem } from '@/types/watchlist';
import MovieListItem from '@/components/movie/MovieListItem';
import LogModal from '@/components/movie/LogModal';
import Toast from '@/components/common/Toast';
import { Movie } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cursorPointer } from '@/utils/webStyles';
import { useLanguage } from '@/context/LanguageContext';
import { useSocial } from '@/context/SocialContext';
import EmptyStateCTA from '@/components/common/EmptyStateCTA';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

const UNDO_WINDOW_MS = 5000;

const SORTS = ['Added', 'Rating', 'Release', 'Title'];

// Fixed row height for getItemLayout optimization (image + meta + padding)
const ITEM_HEIGHT = 100;

const WatchlistScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { watchlist, toggleWatched, removeFromWatchlist, getMovieStatus, isHydrated, isInWatchlist } = useWatchlist();
  const { userLogs, deleteLog } = useSocial();
  const [activeTab, setActiveTab] = useState('Watchlist'); // 'Watchlist', 'Watched', or 'Reviewed'

  const [activeSort, setActiveSort] = useState('Added');
  const [isAscending, setIsAscending] = useState(false);
  const bp = useBreakpoint();
  const { t } = useLanguage();
  const { listRef, onScroll: onScrollRestoration } = useScrollRestoration(`watchlist-${activeTab}`);

  // ── Scroll-to-top FAB ──
  const fabAnim = useRef(new Animated.Value(0)).current;
  const [showFab, setShowFab] = useState(false);

  const onScroll = useCallback(
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
      onScrollRestoration(e);
    },
    [showFab, fabAnim, onScrollRestoration],
  );

  const scrollToTop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [listRef]);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [existingLog, setExistingLog] = useState<any>(undefined);

  // Undo-window delete: the id is hidden from the list immediately (optimistic),
  // but the real removeFromWatchlist/deleteLog call is deferred until the
  // undo window elapses, so tapping "Undo" in time can cancel it outright
  // instead of having to re-insert already-deleted data.
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const deleteTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [undoToast, setUndoToast] = useState<{ visible: boolean; id: number | null }>({ visible: false, id: null });

  useEffect(() => {
    return () => {
      // Flush any pending deletes on unmount so they aren't silently lost.
      deleteTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const handleOpenLogModal = useCallback((item: WatchlistItem) => {
    const movieObj: Movie = {
      id: item.id,
      media_type: item.mediaType || 'movie',
      title: item.mediaType === 'movie' ? (item.title || '') : '',
      name: item.mediaType === 'tv' ? (item.name || '') : '',
      poster_path: item.poster_path,
      overview: item.overview || '',
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      popularity: 0,
      original_language: 'en',
      genre_ids: [],
      release_date: item.mediaType === 'movie' ? (item.release_date || '') : '',
    } as any;
    
    const matchLog = userLogs.find(l => l.movie_id === item.id);
    setExistingLog(matchLog);
    setSelectedMovie(movieObj);
    setLogModalVisible(true);
  }, [userLogs]);

  // M5: Stable callbacks — prevent renderItem from re-creating fns on every render
  const handlePress = useCallback((id: number, mediaType: string) => {
    router.push({ pathname: '/movie/[id]', params: { id: id.toString(), type: mediaType } });
  }, [router]);

  const handleToggleWatched = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleWatched(id);
  }, [toggleWatched]);

  // Commits a pending delete for real (called once the undo window elapses,
  // or immediately if the user navigates away/deletes something else first).
  const commitDelete = useCallback(async (id: number) => {
    deleteTimers.current.delete(id);
    removeFromWatchlist(id);
    const log = userLogs.find(l => l.movie_id === id);
    if (log) {
      await deleteLog(log.id);
    }
  }, [removeFromWatchlist, userLogs, deleteLog]);

  const handleRemove = useCallback((id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // Hide immediately (optimistic) without touching global state yet.
    setPendingDeleteIds(prev => new Set(prev).add(id));
    setUndoToast({ visible: true, id });

    const timer = setTimeout(() => commitDelete(id), UNDO_WINDOW_MS);
    deleteTimers.current.set(id, timer);
  }, [commitDelete]);

  const handleUndoRemove = useCallback(() => {
    const id = undoToast.id;
    if (id == null) return;

    const timer = deleteTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      deleteTimers.current.delete(id);
    }
    setPendingDeleteIds(prev => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });
  }, [undoToast.id]);

  // Stable Set of watchlist IDs — avoids rebuilding a Map on every log iteration
  const watchlistIds = useMemo(() => new Set(watchlist.map(w => w.id)), [watchlist]);

  // Combine explicit watchlist and logs into a single duplicate-free collection
  const mergedList = useMemo(() => {
    const result: WatchlistItem[] = [...watchlist];
    const seenIds = new Set<number>(watchlistIds);

    userLogs.forEach(log => {
      if (!seenIds.has(log.movie_id)) {
        seenIds.add(log.movie_id);
        const isTV = log.media_type === 'tv';
        const mappedItem: WatchlistItem = isTV ? {
          id: log.movie_id,
          mediaType: 'tv',
          name: log.movie_title,
          poster_path: log.poster_path || null,
          backdrop_path: null,
          addedAt: log.watched_at || log.created_at || new Date().toISOString(),
          status: WATCHLIST_STATUS.COMPLETED,
          vote_average: log.rating || 0,
          vote_count: 0,
          first_air_date: '',
          overview: '',
        } : {
          id: log.movie_id,
          mediaType: 'movie',
          title: log.movie_title,
          poster_path: log.poster_path || null,
          backdrop_path: null,
          addedAt: log.watched_at || log.created_at || new Date().toISOString(),
          status: WATCHLIST_STATUS.COMPLETED,
          vote_average: log.rating || 0,
          vote_count: 0,
          release_date: '',
          overview: '',
        };
        result.push(mappedItem);
      }
    });

    return result;
  }, [watchlist, userLogs, watchlistIds]);

  // Hide items that are mid-undo-window (see handleRemove) — they're
  // optimistically gone from the UI even though the real removal hasn't
  // happened yet.
  const visibleList = useMemo(
    () => (pendingDeleteIds.size === 0 ? mergedList : mergedList.filter(m => !pendingDeleteIds.has(m.id))),
    [mergedList, pendingDeleteIds]
  );

  const planToWatchList = useMemo(() => visibleList.filter(m => getMovieStatus(m.id) === 'plan_to_watch'), [visibleList, getMovieStatus]);
  const watchedList     = useMemo(() => visibleList.filter(m => getMovieStatus(m.id) === 'watched'), [visibleList, getMovieStatus]);
  const reviewedList    = useMemo(() => visibleList.filter(m => getMovieStatus(m.id) === 'reviewed'), [visibleList, getMovieStatus]);

  // Filter based on Tab
  const filteredList = useMemo(() => {
    if (activeTab === 'Watchlist') return planToWatchList;
    if (activeTab === 'Watched') return watchedList;
    return reviewedList;
  }, [planToWatchList, watchedList, reviewedList, activeTab]);

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

  const renderItem = useCallback(({ item, index }: { item: WatchlistItem; index: number }) => (
    <MovieListItem
      movie={item}
      onPress={() => handlePress(item.id, item.mediaType)}
      showWatched={true}
      watched={getMovieStatus(item.id) !== 'plan_to_watch'}
      inWatchlist={isInWatchlist(item.id)}
      onToggleWatched={() => handleToggleWatched(item.id)}
      onRemove={() => handleRemove(item.id)}
      onWriteReview={() => handleOpenLogModal(item)}
      rank={index + 1}
      status={getMovieStatus(item.id)}
    />
  ), [handlePress, handleToggleWatched, handleRemove, handleOpenLogModal, getMovieStatus, isInWatchlist]);

  if (!isHydrated) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 16,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: 'rgba(255,255,255,0.05)',
            }}
          >
            <Shimmer width={56} height={80} borderRadius={6} />
            <View style={{ flex: 1, gap: 8 }}>
              <Shimmer width="65%" height={12} borderRadius={4} />
              <Shimmer width="40%" height={9} borderRadius={3} />
              <Shimmer width="80%" height={8} borderRadius={3} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  const renderHeader = useMemo(() => {
    return (
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
          <Text style={styles.sortByLbl}>{t('sort')}</Text>
          {isAscending ? (
            <ArrowUp size={IconSize.xs} color={Colors.primary} strokeWidth={3} />
          ) : (
            <ArrowDown size={IconSize.xs} color={Colors.primary} strokeWidth={3} />
          )}
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SORTS.map(s => {
            const label = s === 'Added' ? t('sortAdded') : s === 'Rating' ? t('sortRating') : s === 'Release' ? t('sortRelease') : t('sortTitle');
            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.75}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveSort(s); }}
                style={[styles.sortChip, activeSort === s && styles.sortChipActive, cursorPointer]}
                accessibilityRole="button"
                accessibilityLabel={`${t('sort')} ${label}`}
                accessibilityState={{ selected: activeSort === s }}
              >
                <Text style={[styles.sortChipText, activeSort === s && styles.sortChipTextActive]} maxFontSizeMultiplier={1.3}>
                  {label}
                </Text>
                {activeSort === s && <View style={styles.sortActiveUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [isAscending, activeSort, t]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={[styles.header, bp.isLarge && styles.centeredColumn]}>
        <View>
          <Text style={styles.headerSub} maxFontSizeMultiplier={1.3}>
            {activeTab === 'Watchlist' 
              ? `${planToWatchList.length} ${t('planToWatch')}` 
              : activeTab === 'Watched' 
                ? `${watchedList.length} ${t('diary')}` 
                : `${reviewedList.length} ${t('reviewed')}`}
          </Text>
        </View>
      </View>
 
      {/* ── IMDb Style Tabs ── */}
      <View style={[styles.tabContainer, bp.isLarge && styles.centeredColumn]} accessibilityRole="tablist">
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Watchlist' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Watchlist'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Watchlist' }}
          accessibilityLabel={t('planToWatch')}
        >
          <Text style={[styles.tabText, activeTab === 'Watchlist' && styles.tabTextActive]}>
            {t('planToWatch')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Watchlist' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{planToWatchList.length}</Text>
          </View>
          {activeTab === 'Watchlist' && <View style={styles.activeUnderline} />}
        </TouchableOpacity>
 
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Watched' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Watched'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Watched' }}
          accessibilityLabel={t('diary')}
        >
          <Text style={[styles.tabText, activeTab === 'Watched' && styles.tabTextActive]}>
            {t('diary')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Watched' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{watchedList.length}</Text>
          </View>
          {activeTab === 'Watched' && <View style={styles.activeUnderline} />}
        </TouchableOpacity>
         
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Reviewed' && styles.tabActive, cursorPointer]} 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('Reviewed'); }}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'Reviewed' }}
          accessibilityLabel={t('reviewed')}
        >
          <Text style={[styles.tabText, activeTab === 'Reviewed' && styles.tabTextActive]}>
            {t('reviewed')}
          </Text>
          <View style={[styles.tabBadge, activeTab === 'Reviewed' && styles.tabBadgeActive]}>
            <Text style={styles.tabBadgeText}>{reviewedList.length}</Text>
          </View>
          {activeTab === 'Reviewed' && <View style={styles.activeUnderline} />}
        </TouchableOpacity>
      </View>


      {/* ── List ── */}
      <View style={[{ flex: 1, width: '100%' }, bp.isLarge && styles.centeredColumn]}>
        <FlatList
          ref={listRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          data={sortedList}
          keyExtractor={(item: WatchlistItem) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={(
            <EmptyStateCTA
              icon={activeTab === 'Watchlist' ? 'watchlist' : activeTab === 'Watched' ? 'diary' : 'reviews'}
              size={120}
              title={
                activeTab === 'Watchlist'
                  ? t('watchlistEmptyTitle')
                  : activeTab === 'Watched'
                    ? t('emptyWatchedTitle')
                    : t('emptyReviewsTitle')
              }
              subtitle={
                activeTab === 'Watchlist'
                  ? t('watchlistEmptySub')
                  : activeTab === 'Watched'
                    ? t('emptyWatchedSub')
                    : t('emptyReviewsSub')
              }
              actionLabel={activeTab === 'Watchlist' ? t('ctaExplorePopular') : t('ctaLogFirstMovie')}
              onAction={() => {
                if (activeTab === 'Watchlist') {
                  router.push('/(tabs)/search');
                } else {
                  setActiveTab('Watchlist');
                }
              }}
            />
          )}
        />
      </View>
      <LogModal
        visible={logModalVisible}
        movie={selectedMovie}
        onClose={() => {
          setLogModalVisible(false);
          setSelectedMovie(null);
          setExistingLog(undefined);
        }}
        existingLog={existingLog}
      />

      <Toast
        visible={undoToast.visible}
        message={t('toastRemovedFromWatchlist')}
        type="info"
        actionLabel={t('undo')}
        onAction={handleUndoRemove}
        duration={UNDO_WINDOW_MS}
        onHide={() => setUndoToast(prev => ({ ...prev, visible: false }))}
      />

      <LiquidGlassFab
        animValue={fabAnim}
        visible={showFab}
        onPress={scrollToTop}
      />
    </View>
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
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    paddingBottom: 4,
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
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'relative',
  },
  sortChipActive: {},
  sortChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text.secondary,
    paddingBottom: 4,
  },
  sortChipTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  sortActiveUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  listContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: 4,
  },
  // Tablet/desktop: keep the library a centered, readable column instead of
  // letting full-width list rows stretch across the whole screen.
  centeredColumn: { width: '100%', alignSelf: 'center' },
});

export default WatchlistScreen;
