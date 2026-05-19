import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Pressable,
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
import { exportWatchlistToCSV } from '@/utils/exportWatchlist';

// Components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActions from '@/components/profile/ProfileActions';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import DiaryCard from '@/components/movie/DiaryCard';
import MovieListItem from '@/components/movie/MovieListItem';
import { FlashList } from '@shopify/flash-list';
const TypedFlashList = FlashList as any;
import ImageCropModal from '@/components/common/ImageCropModal';
import SettingsSheet from '@/components/settings/SettingsSheet';
import LanguageSheet from '@/components/settings/LanguageSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import SocialListSheet from '@/components/settings/SocialListSheet';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

interface ProfileScreenProps {
  userId?: string;
}

export default function ProfileScreen({ userId: propUserId }: ProfileScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { signOut, deleteAccount, profile, user } = useAuth();
  const { watchlist, toggleWatched, removeFromWatchlist } = useWatchlist();
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
    // Social Modal Exports
    socialModalVisible, setSocialModalVisible,
    socialModalTab, setSocialModalTab,
    socialUsers,
    isSocialLoading,
    fetchSocialList,
    handleSocialFollowToggle
  } = useProfileData(userId);

  console.log('=== [ProfileScreen RENDER DIAGNOSTICS] ===');
  console.log('propUserId:', propUserId);
  console.log('routeUserId:', routeUserId);
  console.log('resolved userId:', userId);
  console.log('currentUser.id:', user?.id);
  console.log('isOwner:', isOwner);
  console.log('targetUserId:', targetUserId);
  console.log('targetProfile.status:', targetProfile.status);
  console.log('targetProfile.data.username:', targetProfile.data?.username);
  console.log('targetLogs.length:', targetLogs.length);
  console.log('targetWatchlist.length:', targetWatchlist.length);
  console.log('==========================================');

  const [activeTab, setActiveTab] = useState<ContentTab>('Diary');
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
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
  }, [navigation, isOwner, t, router, userId]);

  // ── Dialog state ────────────────────────────────────────────────────────
  const [showSignOutConfirm,  setShowSignOutConfirm]  = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [showLangSheet,       setShowLangSheet]       = useState(false);
  const [showExportConfirm,   setShowExportConfirm]   = useState(false);
  const [isDeleting,          setIsDeleting]          = useState(false);

  const profileData    = targetProfile.data;
  
  // Use context data for the owner (so it updates instantly), and fetched data for other users
  const userLogsList   = useMemo(() => isOwner ? userLogs : targetLogs, [isOwner, userLogs, targetLogs]);
  const watchedMovies  = useMemo(() => 
    isOwner ? watchlist.filter(m => m.status === 'completed') : targetWatchlist.filter(m => m.status === 'completed'), 
  [isOwner, watchlist, targetWatchlist]);
  const watchlistMovies = useMemo(() => 
    isOwner ? watchlist.filter(m => m.status === 'plan_to_watch') : targetWatchlist.filter(m => m.status === 'plan_to_watch'), 
  [isOwner, watchlist, targetWatchlist]);

  const listData = useMemo(() => {
    if (activeTab === 'Diary') return userLogsList;
    if (activeTab === 'Watched') return watchedMovies;
    if (activeTab === 'Watchlist') return watchlistMovies;
    return [];
  }, [activeTab, userLogsList, watchedMovies, watchlistMovies]);

  // Perhitungan dinamis estimasi ukuran file CSV
  const totalItems = watchlist.length + userLogsList.length;
  const estimatedKb = Math.max(1, Math.round((totalItems * 150) / 1024));
  const exportMessage = `Data watchlist (${watchlist.length} item) dan diary (${userLogsList.length} item) akan diekspor dalam format spreadsheet CSV (perkiraan ukuran ~${estimatedKb} KB). Kamu bisa membukanya di Microsoft Excel atau Google Sheets.`;

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
      
      <TypedFlashList
        data={listData}
        keyExtractor={(item: any) => item?.id?.toString() || Math.random().toString()}
        estimatedItemSize={120}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 60 }}>
            <ProfileHeader 
              displayName={profileData?.username || 'User'} 
              avatarUrl={profileData?.avatar_url}
              bio={profileData?.bio}
              isOwner={isOwner}
              userId={targetUserId}
            />

            <ProfileStats 
              followers={followers} 
              following={following} 
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

            <View style={styles.tabContainer}>
              <ProfileTabs 
                activeTab={activeTab}
                onTabPress={setActiveTab}
                counts={{
                  diary: userLogsList.length,
                  watched: watchedMovies.length,
                  watchlist: watchlistMovies.length
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          if (activeTab === 'Diary') {
            return (
              <DiaryCard 
                log={item} 
                onDelete={isOwner ? deleteLog : undefined}
                onPressPoster={(movieId, mediaType) => router.push({ pathname: '/movie/[id]', params: { id: movieId.toString(), type: mediaType } } as any)}
              />
            );
          }
          
          return (
            <MovieListItem 
              movie={item} 
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: item.id.toString(), type: item.mediaType || item.media_type || 'movie' } } as any)}
              showWatched={isOwner}
              watched={activeTab === 'Watched'}
              onToggleWatched={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                toggleWatched(item.id);
              }}
              onRemove={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                removeFromWatchlist(item.id);
              }}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {isOwner ? (
                activeTab === 'Diary' ? t('noLogsYet') : activeTab === 'Watched' ? t('noWatchedYet') : t('noWatchlistYet')
              ) : (
                activeTab === 'Diary' ? t('noLogsYetOthers') : activeTab === 'Watched' ? t('noWatchedYetOthers') : t('noWatchlistYetOthers')
              )}
            </Text>
          </View>
        }
      />

      {isOwner && (
        <ProfileEditModal 
          visible={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={(data) => handleSaveProfile(data, t)}
          initialData={{
            username: profileData?.username || '',
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
        title="Export Watchlist"
        message={exportMessage}
        confirmLabel="Download CSV"
        cancelLabel="Batal"
        variant="download"
        onConfirm={handleExport}
        onCancel={() => setShowExportConfirm(false)}
      />

      {/* Sign Out Confirm Dialog */}
      <ConfirmDialog
        visible={showSignOutConfirm}
        title="Sign Out?"
        message="Kamu akan keluar dari akunmu. Kamu bisa login kembali kapan saja."
        confirmLabel="Sign Out"
        cancelLabel="Batal"
        variant="logout"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* Delete Account Confirm Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Hapus Akun?"
        message="Tindakan ini tidak bisa dibatalkan. Semua data kamu termasuk watchlist dan diary akan dihapus permanen."
        confirmLabel="Hapus Akun"
        cancelLabel="Batal"
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
            router.replace({ pathname: '/user/[userId]', params: { userId: clickedUserId } } as any);
          }
        }}
        onFollowToggle={handleSocialFollowToggle}
      />
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
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' },
});
