import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { useProfileData } from '@/hooks/useProfileData';

// Components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileTabs from '@/components/profile/ProfileTabs';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';
import { Tabs } from 'react-native-collapsible-tab-view';
import ProfileModals from '@/components/profile/ProfileModals';

type ContentTab = 'Diary' | 'Reviews' | 'Watchlist';

interface ProfileScreenProps {
  userId?: string;
}

export default function ProfileScreen({ userId: propUserId }: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = propUserId || useLocalSearchParams<{ userId: string }>().userId;

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
    setActiveTab,
    isRefreshing,
    isDeleting,
    userReviewsList,
    userLogsList,
    watchlistList,
    avgRating,
    handleRefresh,
    setSocialModalVisible,
    setSocialModalTab,
    fetchSocialList,
    handleFollow,
    isHydrated,
    t
  } = profileState;

  if (!isHydrated) return null;

  if (targetProfile.status === 'loading' || isDeleting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
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

      {/* ── Static profile section — always stays at top ── */}
      <View style={[styles.staticHeader, { paddingTop: insets.top + 60 }]}>
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
            fetchSocialList('followers');
            setSocialModalVisible(true);
          }}
          onFollowingPress={() => {
            setSocialModalTab('following');
            fetchSocialList('following');
            setSocialModalVisible(true);
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
      </View>

      {/* ── Swipeable tabs — only the content scrolls ── */}
      <Tabs.Container
        onTabChange={(tab) => setActiveTab(tab.tabName as ContentTab)}
        renderHeader={() => null}
        renderTabBar={(props) => (
          <ProfileTabs 
            {...props}
            counts={{
              diary: userLogsList.length,
              reviews: userReviewsList.length,
              watchlist: watchlistList.length
            }}
          />
        )}
        headerContainerStyle={{
          backgroundColor: Colors.background,
          shadowColor: 'transparent',
          elevation: 0,
        }}
      >
        <Tabs.Tab name="Reviews" label={t('reviews')}>
          <Tabs.FlatList
            data={userReviewsList}
            keyExtractor={(item: any, index: number) => item?.id?.toString() ?? `review-${index}`}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            renderItem={({ item }: { item: any }) => (
              <DiaryCard 
                log={item} 
                onPressPoster={(movieId, mediaType) => router.push({ pathname: '/movie/[id]', params: { id: movieId.toString(), type: mediaType } } as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText} allowFontScaling={false}>
                  {isOwner ? t('emptyReviewsTitle') : t('noReviewsYetOthers')}
                </Text>
              </View>
            }
          />
        </Tabs.Tab>

        <Tabs.Tab name="Diary" label={t('diary')}>
          <Tabs.FlatList
            data={userLogsList}
            keyExtractor={(item: any, index: number) => item?.id?.toString() ?? `diary-${index}`}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            renderItem={({ item }: { item: any }) => (
              <DiaryCard 
                log={item} 
                onPressPoster={(movieId, mediaType) => router.push({ pathname: '/movie/[id]', params: { id: movieId.toString(), type: mediaType } } as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText} allowFontScaling={false}>
                  {isOwner ? t('emptyWatchedTitle') : t('noLogsYetOthers')}
                </Text>
              </View>
            }
          />
        </Tabs.Tab>

        <Tabs.Tab name="Watchlist" label={t('tabWatchlist')}>
          <Tabs.FlatList
            data={watchlistList}
            keyExtractor={(item: any, index: number) => item?.id?.toString() ?? `watchlist-${index}`}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            renderItem={({ item }: { item: any }) => (
              <View style={{ paddingHorizontal: 16, marginVertical: 4 }}>
                <MovieListItem
                  movie={item}
                  onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id.toString(), type: item.mediaType || 'movie' } } as any)}
                  showWatched={false}
                  hideActions={true}
                />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText} allowFontScaling={false}>
                  {isOwner ? t('noWatchlistYet') : t('noWatchlistYetOthers')}
                </Text>
              </View>
            }
          />
        </Tabs.Tab>
      </Tabs.Container>

      <ProfileModals profileState={profileState} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  staticHeader: {
    backgroundColor: Colors.background,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 20 },
  errorSub: { color: Colors.text.secondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' }
});
