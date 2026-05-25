import React from 'react';
import ProfileEditModal from '@/components/profile/ProfileEditModal';
import LogModal from '@/components/movie/LogModal';
import ImageCropModal from '@/components/common/ImageCropModal';
import SettingsSheet from '@/components/settings/SettingsSheet';
import LanguageSheet from '@/components/settings/LanguageSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ChangePasswordModal from '@/components/common/ChangePasswordModal';
import SocialListSheet from '@/components/settings/SocialListSheet';
import { useProfileData } from '@/hooks/useProfileData';

interface ProfileModalsProps {
  readonly profileState: ReturnType<typeof useProfileData>;
}

export const ProfileModals: React.FC<ProfileModalsProps> = ({ profileState }) => {
  const {
    t,
    router,
    user,
    profileData,
    isOwner,
    isEditing,
    setIsEditing,
    isSaving,
    handleSaveProfile,
    handlePickImage,
    showCropModal,
    setShowCropModal,
    pickedImage,
    handleUpdateAvatar,
    showSettingsSheet,
    setShowSettingsSheet,
    setShowLangSheet,
    setShowExportConfirm,
    setShowPasswordModal,
    setShowDeleteConfirm,
    setShowSignOutConfirm,
    showLangSheet,
    showPasswordModal,
    showExportConfirm,
    exportMessage,
    handleExport,
    showSignOutConfirm,
    handleSignOut,
    showDeleteConfirm,
    handleDeleteAccount,
    socialModalVisible,
    setSocialModalVisible,
    socialModalTab,
    setSocialModalTab,
    fetchSocialList,
    socialUsers,
    isSocialLoading,
    handleSocialFollowToggle,
    logModalVisible,
    setLogModalVisible,
    selectedMovie,
    existingLog,
    setSelectedMovie,
    setExistingLog,
  } = profileState;

  return (
    <>
      {isOwner && (
        <ProfileEditModal 
          visible={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveProfile}
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
        onSave={handleUpdateAvatar}
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
          if (setSelectedMovie) setSelectedMovie(null);
          if (setExistingLog) setExistingLog(undefined);
        }}
        existingLog={existingLog}
      />
    </>
  );
};

export default ProfileModals;
