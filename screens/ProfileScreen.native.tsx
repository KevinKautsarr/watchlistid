import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Pressable, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, SearchX, Settings as SettingsIcon } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';

import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { useWatchlist } from '@/context/WatchlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/LanguageContext';
import { MediaItem } from '@/types';
import { useProfileData } from '@/hooks/useProfileData';
import { typedFrom } from '@/supabase';
import { exportWatchlistToCSV } from '@/utils/exportWatchlist';
import SafeImage from '@/components/common/SafeImage';

// Components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';
import LogModal from '@/components/movie/LogModal';
import { Movie } from '@/types';
import { Tabs } from 'react-native-collapsible-tab-view';
import ImageCropModal from '@/components/common/ImageCropModal';
import SettingsSheet from '@/components/settings/SettingsSheet';
import LanguageSheet from '@/components/settings/LanguageSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import SocialListSheet from '@/components/settings/SocialListSheet';

type ContentTab = 'Diary' | 'Reviews' | 'Watchlist';

interface ProfileScreenProps {
  userId?: string;
}

export default function ProfileScreen({ userId: propUserId }: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { signOut, deleteAccount, profile, user } = useAuth();
  const { watchlist, toggleWatched, removeFromWatchlist, getMovieStatus, isHydrated, userRatings } = useWatchlist();
  const { userLogs, deleteLog } = useSocial();
  const { userId: routeUserId } = useLocalSearchParams<{ userId: string }>();
  const userId = propUserId || routeUserId;

  const {
    isOwner,
    targetUserId,
    targetProfile,
    followers,
    following,
    isFollowing,
    isFollowLoading,
    isEditing, setIsEditing,
    isSaving,
    pickedImage,
    showCropModal, setShowCropModal,
    showSettingsSheet, setShowSettingsSheet,
    handleFollow,
    handlePickImage,
    handleSaveProfile,
    handleUpdateAvatar,
    targetLogs,
    targetWatchlist,
    targetReviews,
    fetchUserContent,
    fetchSocialStats,
    // Social Modal Exports
    socialModalVisible, setSocialModalVisible,
    socialModalTab, setSocialModalTab,
    socialUsers,
    isSocialLoading,
    fetchSocialList,
    handleSocialFollowToggle
  } = useProfileData(userId);

  // Diagnostic logs removed for production security

  const [activeTab, setActiveTab] = useState<ContentTab>('Reviews');
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [existingLog, setExistingLog] = useState<any>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleOpenLogModal = useCallback((logItem: any) => {
    const movieObj: Movie = {
      id: logItem.movie_id,
      media_type: logItem.media_type || 'movie',
      title: logItem.media_type === 'movie' ? logItem.movie_title : '',
      name: logItem.media_type === 'tv' ? logItem.movie_title : '',
      poster_path: logItem.poster_path,
      overview: '',
      vote_average: logItem.rating || 0,
      vote_count: 0,
      popularity: 0,
      original_language: 'en',
      genre_ids: [],
      release_date: '',
    } as any;
    
    const matchLog = userLogs.find(l => l.movie_id === logItem.movie_id);
    setExistingLog(matchLog);
    setSelectedMovie(movieObj);
    setLogModalVisible(true);
  }, [userLogs]);

  const navigation = useNavigation();
  // Declare profileData here so the useEffect below can reference it
  const profileData = targetProfile.data;

  // Dynamic header title — show viewed user's username once loaded
  useEffect(() => {
    navigation.setOptions({
      title: profileData?.username || 'Profile',
      headerLeft: userId ? () => (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/search');
            }
          }}
          style={({ pressed }) => [{ marginLeft: 8, padding: 8, opacity: pressed ? 0.6 : 1, justifyContent: 'center', alignItems: 'center' }, cursorPointer]}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <ArrowLeft color={Colors.white} size={IconSize.md || 24} />
        </Pressable>
      ) : undefined,
      headerRight: () => isOwner ? (
        <Pressable
          onPress={() => setShowSettingsSheet(true)}
          style={({ pressed }) => [{ marginRight: 16, padding: 8, opacity: pressed ? 0.6 : 1 }, cursorPointer]}
          accessibilityRole="button"
          accessibilityLabel={t('settings')}
        >
          <SettingsIcon color={Colors.white} size={IconSize.md || 24} />
        </Pressable>
      ) : null
    });
  }, [navigation, isOwner, t, router, userId, profileData?.username]);

  // Re-fetch data each time the screen receives focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserContent();
      fetchSocialStats();
    });
    return unsubscribe;
  }, [navigation, fetchUserContent, fetchSocialStats]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserContent(), fetchSocialStats()]);
    setIsRefreshing(false);
  }, [fetchUserContent, fetchSocialStats]);

  // ── Dialog state ────────────────────────────────────────────────────────
  const [showSignOutConfirm,  setShowSignOutConfirm]  = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [showLangSheet,       setShowLangSheet]       = useState(false);
  const [showExportConfirm,   setShowExportConfirm]   = useState(false);
  const [isDeleting,          setIsDeleting]          = useState(false);

  // Combine explicit watchlist and logs to build a single comprehensive duplicate-free collection
  const mergedList = useMemo(() => {
    if (!isOwner) return [];
    const map = new Map<number, any>();
    
    // 1. Add all items from the explicit watchlist
    watchlist.forEach(item => {
      map.set(item.id, item);
    });
    
    // 2. Add all items from user logs (mapping them to WatchlistItem shape)
    userLogs.forEach(log => {
      if (!map.has(log.movie_id)) {
        const isTV = log.media_type === 'tv';
        const mappedItem = isTV ? {
          id: log.movie_id,
          mediaType: 'tv',
          name: log.movie_title,
          poster_path: log.poster_path || null,
          backdrop_path: null,
          addedAt: log.watched_at || log.created_at || new Date().toISOString(),
          status: 'completed',
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
          status: 'completed',
          vote_average: log.rating || 0,
          vote_count: 0,
          release_date: '',
          overview: '',
        };
        map.set(log.movie_id, mappedItem);
      }
    });
    
    return Array.from(map.values());
  }, [isOwner, watchlist, userLogs]);

  const userReviewsList = useMemo(() => {
    return targetReviews;
  }, [targetReviews]);

  const userLogsList = useMemo(() => {
    if (isOwner) {
      const ownerWatchedItems = mergedList.filter(m => {
        const status = getMovieStatus(m.id);
        return status === 'watched' || status === 'reviewed';
      });
      return ownerWatchedItems.map(item => {
        const matchingLog = userLogs.find(l => l.movie_id === item.id);
        return {
          id: matchingLog?.id || `watch-${item.id}`,
          movie_id: item.id,
          movie_title: item.mediaType === 'movie' ? item.title : item.name,
          poster_path: item.poster_path,
          watched_at: matchingLog?.watched_at || item.addedAt,
          rating: matchingLog?.rating || userRatings[item.id] || null,
          review_text: matchingLog?.review_text || undefined,
          is_spoiler: matchingLog?.is_spoiler || false,
          media_type: item.mediaType,
        };
      });
    }
    // Non-owner: combine movie_logs entries + watchlist items marked watched
    // (toggleWatched sets watchlist.watched=true but doesn't create a movie_logs row)
    const loggedIds = new Set(targetLogs.map((l: any) => l.movie_id));
    const watchedFromWatchlist = targetWatchlist
      .filter(item => item.status === 'completed' && !loggedIds.has(item.id))
      .map(item => ({
        id: `watch-${item.id}`,
        movie_id: item.id,
        movie_title: item.title || item.name,
        poster_path: item.poster_path,
        watched_at: item.addedAt,
        rating: item.vote_average || null,
        review_text: undefined,
        is_spoiler: false,
        media_type: item.mediaType,
      }));
    return [...targetLogs, ...watchedFromWatchlist];
  }, [isOwner, mergedList, userLogs, userRatings, targetLogs, targetWatchlist, getMovieStatus]);

  const watchlistList = useMemo(() => {
    if (isOwner) {
      return mergedList.filter(m => getMovieStatus(m.id) === 'plan_to_watch');
    }
    // Non-owner: only show plan_to_watch items, not watched ones
    return targetWatchlist.filter(item => item.status === 'plan_to_watch');
  }, [isOwner, mergedList, targetWatchlist, getMovieStatus]);

  const avgRating = useMemo(() => {
    const movieRatings = new Map<number, number>();
    
    if (isOwner) {
      Object.entries(userRatings).forEach(([mId, r]) => {
        if (r && r > 0) movieRatings.set(Number(mId), r);
      });
      targetReviews.forEach(rev => {
        if (rev.rating && rev.rating > 0) movieRatings.set(rev.movie_id, rev.rating);
      });
      userLogs.forEach(l => {
        if (l.rating && l.rating > 0) movieRatings.set(l.movie_id, l.rating);
      });
    } else {
      targetLogs.forEach(l => {
        if (l.rating && l.rating > 0) movieRatings.set(l.movie_id, l.rating);
      });
      targetReviews.forEach(rev => {
        if (rev.rating && rev.rating > 0) movieRatings.set(rev.movie_id, rev.rating);
      });
    }
    
    const uniqueRatings = Array.from(movieRatings.values());
    return uniqueRatings.length > 0 
      ? uniqueRatings.reduce((sum, r) => sum + r, 0) / uniqueRatings.length 
      : 0;
  }, [isOwner, userRatings, targetReviews, userLogs, targetLogs]);

  // Perhitungan dinamis estimasi ukuran file CSV
  const totalItems = watchlist.length + userLogsList.length;
  const estimatedKb = Math.max(1, Math.round((totalItems * 150) / 1024));
  const exportMessage = t('cancel') === 'Batal'
    ? `Data watchlist (${watchlist.length} item) dan daftar tontonan (${userLogsList.length} item) akan diekspor dalam format spreadsheet CSV (perkiraan ukuran ~${estimatedKb} KB). Kamu bisa membukanya di Microsoft Excel atau Google Sheets.`
    : `Watchlist data (${watchlist.length} items) and watched list (${userLogsList.length} items) will be exported in CSV spreadsheet format (estimated size ~${estimatedKb} KB). You can open it in Microsoft Excel or Google Sheets.`;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await signOut();
    router.replace('/auth/login');
  };

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    const err = await deleteAccount();
    setIsDeleting(false);
    if (!err) router.replace('/auth/login');
  };

  const handleExport = () => {
    setShowExportConfirm(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    exportWatchlistToCSV(
      watchlist,
      userLogsList,
      profile.data?.username ?? 'user',
    );
  };

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

      {isOwner && (
        <ProfileEditModal 
          visible={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={(data) => handleSaveProfile(data, t)}
          initialData={{
            username: profileData?.username || '',
            full_name: profileData?.full_name || '',
            bio: profileData?.bio || '',
            avatarUrl: profileData?.avatar_url || undefined
          }}
          onPickImage={handlePickImage}
          isSaving={isSaving}
          t={t}
        />
      )}

      <ImageCropModal 
        visible={showCropModal}
        imageUri={pickedImage || ''}
        onClose={() => setShowCropModal(false)}
        onSave={(uri) => handleUpdateAvatar(uri, t)}
      />

      {/* Settings Sheet */}
      <SettingsSheet 
        visible={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        onLanguagePress={() => {
          setShowSettingsSheet(false);
          setShowLangSheet(true);
        }}
        onNotificationsPress={() => router.push('/notifications')}
        onAboutPress={() => router.push('/about')}
        onExportPress={() => {
          setShowSettingsSheet(false);
          setShowExportConfirm(true);
        }}
        onPasswordPress={() => setShowPasswordModal(true)}
        onDeletePress={() => setShowDeleteConfirm(true)}
        onLogoutPress={() => setShowSignOutConfirm(true)}
      />

      {/* Language Sheet */}
      <LanguageSheet
        visible={showLangSheet}
        onClose={() => setShowLangSheet(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Export Watchlist Confirm Dialog */}
      <ConfirmDialog
        visible={showExportConfirm}
        title={t('exportWatchlist')}
        message={exportMessage}
        confirmLabel="Download CSV"
        cancelLabel={t('cancel')}
        variant="download"
        onConfirm={handleExport}
        onCancel={() => setShowExportConfirm(false)}
      />

      {/* Sign Out Confirm Dialog */}
      <ConfirmDialog
        visible={showSignOutConfirm}
        title={t('signOutConfirmTitle')}
        message={t('signOutConfirmMessage')}
        confirmLabel={t('signOut')}
        cancelLabel={t('cancel')}
        variant="logout"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* Delete Account Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title={t('deleteAccountConfirmTitle')}
        message={t('deleteAccountConfirmDesc')}
        confirmLabel={t('deleteAccountConfirmLabel')}
        cancelLabel={t('cancel')}
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Social List Sheet (Followers / Following) */}
      <SocialListSheet
        visible={socialModalVisible}
        onClose={() => setSocialModalVisible(false)}
        initialTab={socialModalTab}
        onTabChange={(tab) => {
          setSocialModalTab(tab);
          fetchSocialList(tab);
        }}
        data={socialUsers}
        loading={isSocialLoading}
        currentUserId={user?.id || ''}
        onUserPress={(clickedUserId) => {
          setSocialModalVisible(false);
          if (clickedUserId === user?.id) {
            router.push('/(tabs)/profile');
          } else {
            router.push({ pathname: '/user/[userId]', params: { userId: clickedUserId } } as any);
          }
        }}
        onFollowToggle={handleSocialFollowToggle}
      />

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
  tabContainer: { marginTop: Spacing.xl, paddingBottom: Spacing.sm },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' }
});
