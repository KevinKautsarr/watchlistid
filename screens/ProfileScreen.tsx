import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useProfileData } from '@/hooks/useProfileData';
import Shimmer from '@/components/common/Shimmer';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

// Components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileTabs from '@/components/profile/ProfileTabs';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';
import ProfileModals from '@/components/profile/ProfileModals';

type ContentTab = 'Diary' | 'Reviews' | 'Watchlist';

interface ProfileScreenProps {
  userId?: string;
}

export default function ProfileScreen({ userId: propUserId }: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const activeIndexVal = useSharedValue(0);
  const activeIndexDecimal = useSharedValue(0);

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
        data={listData}
        keyExtractor={(item: any, index: number) => item?.id?.toString() ?? `item-${index}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
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
              <View style={{ paddingHorizontal: 16 }}>
                <DiaryCard 
                  log={item} 
                  onPressPoster={(movieId, mediaType) => router.push({ pathname: '/movie/[id]', params: { id: movieId.toString(), type: mediaType } } as any)}
                />
              </View>
            );
          }
          if (activeTab === 'Watchlist') {
            return (
              <View style={{ paddingHorizontal: 16, marginVertical: 4 }}>
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
          <View style={styles.emptyWrap}>
            <EmptyStateIcon
              name={
                activeTab === 'Diary'
                  ? 'diary'
                  : activeTab === 'Reviews'
                    ? 'reviews'
                    : 'watchlist'
              }
              size={96}
            />
            <Text style={styles.emptyText} allowFontScaling={false}>
              {isOwner ? (
                activeTab === 'Diary' ? t('emptyWatchedTitle') : activeTab === 'Reviews' ? t('emptyReviewsTitle') : t('noWatchlistYet')
              ) : (
                activeTab === 'Diary' ? t('noLogsYetOthers') : activeTab === 'Reviews' ? t('noReviewsYetOthers') : t('noWatchlistYetOthers')
              )}
            </Text>
          </View>
        }
      />

      <ProfileModals profileState={profileState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
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
