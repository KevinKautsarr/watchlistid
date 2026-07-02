import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, FlatList, RefreshControl,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import LiquidGlassFab from '@/components/common/LiquidGlassFab';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { APP_URL } from '@/config';
import { useProfileData } from '@/hooks/useProfileData';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import Shimmer from '@/components/common/Shimmer';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';
import EmptyStateCTA from '@/components/common/EmptyStateCTA';

// Components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileAnalyticsCharts from '@/components/profile/ProfileAnalyticsCharts';
import FavoritesList from '@/components/profile/FavoritesList';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileTabs from '@/components/profile/ProfileTabs';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';
import ProfileModals from '@/components/profile/ProfileModals';
import { useFavorites } from '@/context/FavoritesContext';

type ContentTab = 'Diary' | 'Reviews' | 'Watchlist';

interface ProfileScreenProps {
  userId?: string;
}

export default function ProfileScreen({ userId: propUserId }: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bp = useBreakpoint();
  const { userId: routeUserId } = useLocalSearchParams<{ userId: string }>();
  const userId = propUserId || routeUserId;

  const profileState = useProfileData(userId);
  const {
    isOwner,
    targetUserId,
    targetProfile,
    profileData,
    followers,
    following,
    isFollowing,
    isFollowLoading,
    setIsEditing,
    activeTab,
    setActiveTab,
    isRefreshing,
    isDeleting,
    userReviewsList,
    userLogsList,
    watchlistList,
    listData,
    avgRating,
    handleFollow,
    handleRefresh,
    setSocialModalVisible,
    setSocialModalTab,
    fetchSocialList,
    isHydrated,
    t
  } = profileState;

  const { fetchFavorites } = useFavorites();
  const [profileFavorites, setProfileFavorites] = React.useState<any[]>([]);

  const displayName = profileData?.full_name || profileData?.username;
  useDocumentMeta(
    targetProfile.status === 'success' && displayName && targetUserId
      ? {
          title: `${displayName} (@${profileData?.username || 'user'}) — WatchlistID`,
          description: profileData?.bio || `Lihat watchlist, diary tontonan, dan ulasan ${displayName} di WatchlistID.`,
          image: profileData?.avatar_url || undefined,
          url: `${APP_URL}/user/${targetUserId}`,
        }
      : null
  );

  React.useEffect(() => {
    if (targetUserId) {
      if (isOwner) {
        // Managed by context
      } else {
        fetchFavorites(targetUserId).then(setProfileFavorites);
      }
    }
  }, [targetUserId, isOwner, isRefreshing, fetchFavorites]);

  const activeIndexVal = useSharedValue(0);
  const activeIndexDecimal = useSharedValue(0);

  // ── Scroll-to-top FAB ──
  const flatListRef = useRef<FlatList>(null);
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
    },
    [showFab, fabAnim],
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleTabPress = (name: string) => {
    setActiveTab(name as ContentTab);
    const tabIdx = name === 'Reviews' ? 0 : name === 'Diary' ? 1 : 2;
    activeIndexVal.value = tabIdx;
    activeIndexDecimal.value = tabIdx;
  };

  if (!isHydrated) return null;

  if (targetProfile.status === 'loading' || isDeleting) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 60, paddingHorizontal: 16 }]}>
        {/* Header Shimmer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Shimmer width={64} height={64} borderRadius={32} />
          <View style={{ flex: 1, gap: 8 }}>
            <Shimmer width="55%" height={13} />
            <Shimmer width="35%" height={9} />
          </View>
        </View>

        {/* Stats Row Shimmer */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <Shimmer width="22%" height={68} borderRadius={10} />
          <Shimmer width="22%" height={68} borderRadius={10} />
          <Shimmer width="22%" height={68} borderRadius={10} />
          <Shimmer width="22%" height={68} borderRadius={10} />
        </View>

        {/* Poster Grid Shimmer */}
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Shimmer width={90} height={132} borderRadius={8} />
            <Shimmer width={90} height={132} borderRadius={8} />
            <Shimmer width={90} height={132} borderRadius={8} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Shimmer width={90} height={132} borderRadius={8} />
            <Shimmer width={90} height={132} borderRadius={8} />
            <Shimmer width={90} height={132} borderRadius={8} />
          </View>
        </View>
      </View>
    );
  }

  if (targetProfile.status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <SearchX size={48} color={Colors.primary} />
        <Text style={styles.errorTitle}>{t('profileNotFound')}</Text>
        <Text style={styles.errorSub}>{t('profileNotFoundDesc')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      <FlatList
        ref={flatListRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={listData}
        keyExtractor={(item: any, index: number) => item?.id?.toString() ?? `item-${index}`}
        contentContainerStyle={[
          { paddingBottom: insets.bottom + 100 },
          bp.isLarge && styles.centeredColumn,
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={9}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 60 }}>
            <ProfileHeader 
              displayName={profileData?.full_name || profileData?.username || 'User'} 
              username={profileData?.username || null}
              avatarUrl={profileData?.avatar_url}
              bio={profileData?.bio}
              isOwner={isOwner}
            />

            <ProfileStats 
              followers={followers}
              following={following}
              reviewsCount={userReviewsList.length}
              avgRating={avgRating}
              watchedCount={userLogsList.length}
              watchlistCount={watchlistList.length}
              onFollowersPress={() => {
                setSocialModalTab('followers');
                setSocialModalVisible(true);
                fetchSocialList('followers');
              }}
              onFollowingPress={() => {
                setSocialModalTab('following');
                setSocialModalVisible(true);
                fetchSocialList('following');
              }}
              t={t}
            />

            <ProfileActions 
              isOwner={isOwner}
              isFollowing={isFollowing}
              isFollowLoading={isFollowLoading}
              onFollowPress={handleFollow}
              onEditPress={() => setIsEditing(true)}
              t={t}
              userId={targetUserId}
              username={profileData?.username || 'User'}
            />

            {targetUserId && (
              <FavoritesList 
                userId={targetUserId} 
                isOwner={isOwner} 
                data={isOwner ? undefined : profileFavorites} 
              />
            )}

            {targetUserId && (
              <ProfileAnalyticsCharts userId={targetUserId} />
            )}

            <View style={styles.tabContainer}>
              <ProfileTabs 
                index={activeIndexVal}
                tabNames={['Reviews', 'Diary', 'Watchlist']}
                onTabPress={handleTabPress}
                indexDecimal={activeIndexDecimal}
                counts={{
                  diary: userLogsList.length,
                  reviews: userReviewsList.length,
                  watchlist: watchlistList.length
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          if (activeTab === 'Diary' || activeTab === 'Reviews') {
            return (
              <View style={{ paddingHorizontal: bp.isLarge ? 24 : 16 }}>
                <DiaryCard 
                  log={item} 
                  onPressPoster={(movieId, mediaType) => router.push({ pathname: '/movie/[id]', params: { id: movieId.toString(), type: mediaType } } as any)}
                />
              </View>
            );
          }
          if (activeTab === 'Watchlist') {
            return (
              <View style={{ paddingHorizontal: bp.isLarge ? 24 : 16, marginVertical: 4 }}>
                <MovieListItem
                  movie={item}
                  onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id.toString(), type: item.mediaType || 'movie' } } as any)}
                  showWatched={false}
                  hideActions={true}
                />
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          isOwner ? (
            <EmptyStateCTA
              icon={activeTab === 'Diary' ? 'diary' : activeTab === 'Reviews' ? 'reviews' : 'watchlist'}
              size={96}
              title={
                activeTab === 'Diary' ? t('emptyWatchedTitle') : activeTab === 'Reviews' ? t('emptyReviewsTitle') : t('noWatchlistYet')
              }
              actionLabel={
                activeTab === 'Diary' ? t('ctaLogFirstMovie') : activeTab === 'Reviews' ? t('ctaWritReview') : t('ctaExplorePopular')
              }
              onAction={() => {
                if (activeTab === 'Reviews') {
                  setActiveTab('Diary');
                } else {
                  router.push('/(tabs)/search');
                }
              }}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyStateIcon
                name={activeTab === 'Diary' ? 'diary' : activeTab === 'Reviews' ? 'reviews' : 'watchlist'}
                size={96}
              />
              <Text style={styles.emptyText} maxFontSizeMultiplier={1.3}>
                {activeTab === 'Diary' ? t('noLogsYetOthers') : activeTab === 'Reviews' ? t('noReviewsYetOthers') : t('noWatchlistYetOthers')}
              </Text>
            </View>
          )
        }
      />

      <LiquidGlassFab
        animValue={fabAnim}
        visible={showFab}
        onPress={scrollToTop}
      />

      <ProfileModals profileState={profileState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  // Tablet/desktop: center the profile column so content doesn't span the
  // full width of large screens.
  centeredColumn: { width: '100%', alignSelf: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 20 },
  errorSub: { color: Colors.text.secondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  tabContainer: { marginTop: Spacing.xl, paddingBottom: Spacing.sm },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' }
});
