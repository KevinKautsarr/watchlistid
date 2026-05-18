import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, SearchX, Settings as SettingsIcon } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
import { ProfileContentList } from '@/components/profile/ProfileContentList';
import ImageCropModal from '@/components/common/ImageCropModal';
import SettingsSheet from '@/components/settings/SettingsSheet';
import LanguageSheet from '@/components/settings/LanguageSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { signOut, deleteAccount, profile } = useAuth();
  const { watchlist, toggleWatched, removeFromWatchlist } = useWatchlist();
  const { userLogs, deleteLog } = useSocial();
  const { userId } = useLocalSearchParams<{ userId: string }>();

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
    handleUpdateAvatar
  } = useProfileData(userId);

  const [activeTab, setActiveTab] = useState<ContentTab>('Diary');

  // ── Dialog state ────────────────────────────────────────────────────────
  const [showSignOutConfirm,  setShowSignOutConfirm]  = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showPasswordModal,   setShowPasswordModal]   = useState(false);
  const [showLangSheet,       setShowLangSheet]       = useState(false);
  const [showExportConfirm,   setShowExportConfirm]   = useState(false);
  const [isDeleting,          setIsDeleting]          = useState(false);

  const profileData    = targetProfile.data;
  const userLogsList   = useMemo(() => userLogs.filter((l: any) => l.user_id === targetUserId), [userLogs, targetUserId]);
  const watchedMovies  = useMemo(() => watchlist.filter(m => m.status === 'completed'), [watchlist]);
  const watchlistMovies = useMemo(() => watchlist.filter(m => m.status === 'plan_to_watch'), [watchlist]);

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
      
      {/* Header Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarLeft}>
          {!isOwner && (
            <TouchableOpacity onPress={() => router.back()} style={cursorPointer}>
              <ArrowLeft color={Colors.white} size={IconSize.md} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} allowFontScaling={false}>
            {isOwner ? t('profile') : profileData?.username}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          {isOwner && (
            <TouchableOpacity onPress={() => setShowSettingsSheet(true)} style={cursorPointer}>
              <SettingsIcon color={Colors.white} size={IconSize.md} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader 
          displayName={profileData?.username || 'User'} 
          avatarUrl={profileData?.avatar_url}
          bio={profileData?.bio}
          isOwner={isOwner}
        />

        <ProfileStats 
          followers={followers} 
          following={following} 
          watched={watchedMovies.length}
          t={t}
        />

        <ProfileActions 
          isOwner={isOwner}
          isFollowing={isFollowing}
          isFollowLoading={isFollowLoading}
          onFollowPress={handleFollow}
          onEditPress={() => setIsEditing(true)}
          t={t}
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

        <ProfileContentList 
          activeTab={activeTab}
          userLogsList={userLogsList}
          watchedMovies={watchedMovies as unknown as MediaItem[]}
          watchlistMovies={watchlistMovies as unknown as MediaItem[]}
          t={t as any}
          isOwner={isOwner}
          onToggleWatched={(id) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleWatched(id);
          }}
          onRemove={(id) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeFromWatchlist(id);
          }}
          onDeleteLog={(id) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteLog(id);
          }}
        />
      </ScrollView>

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
        variant="warning"
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 70 + 20 },
  topBarLeft: { width: 80, alignItems: 'flex-start' },
  topBarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  topBarRight: { width: 80, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' },
  topBarTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.black, letterSpacing: -0.5 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 20 },
  errorSub: { color: Colors.text.secondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  tabContainer: { marginTop: Spacing.xl },
});
