import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { APP_URL } from '@/config';
import { UserPlus, UserMinus, Edit3, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ProfileActionsProps {
  isOwner: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onFollowPress: () => void;
  onEditPress: () => void;
  t: (key: any) => string;
  userId?: string;
  username?: string;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwner,
  isFollowing,
  isFollowLoading,
  onFollowPress,
  onEditPress,
  t,
  userId,
  username
}) => {
  const handleShareProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = username || 'User';
    const url = `${APP_URL}/user/${userId || ''}`;
    await Share.share({
      message: t('shareProfileMessage').replace('{username}', name).replace('{url}', url),
      url, // iOS attaches this as a rich link
      title: t('shareProfileTitle').replace('{username}', name),
    });
  };

  if (isOwner) {
    return (
      <View style={styles.actionRow}>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={onEditPress} accessibilityRole="button" accessibilityLabel="Edit profile">
          <View style={styles.btnContent}>
            <Edit3 size={16} color={Colors.white} />
            <Text style={styles.secondaryBtnText} allowFontScaling={false}>{t('editProfile')}</Text>
          </View>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
          <View style={styles.btnContent}>
            <Share2 size={16} color={Colors.accentBlue} />
            <Text style={styles.shareText} allowFontScaling={false}>{t('share')}</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.actionRow}>
      <Pressable 
        style={({ pressed }) => [styles.primaryBtn, isFollowing && styles.followingBtn, pressed && !isFollowLoading && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} 
        onPress={onFollowPress}
        disabled={isFollowLoading}
        accessibilityRole="button"
        accessibilityLabel={isFollowing ? t('unfollow') : t('follow')}
      >
        {isFollowLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <View style={styles.btnContent}>
            {isFollowing ? (
              <>
                <UserMinus size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText} allowFontScaling={false}>{t('unfollow')}</Text>
              </>
            ) : (
              <>
                <UserPlus size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText} allowFontScaling={false}>{t('follow')}</Text>
              </>
            )}
          </View>
        )}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
        <View style={styles.btnContent}>
          <Share2 size={16} color={Colors.accentBlue} />
          <Text style={styles.shareText} allowFontScaling={false}>{t('share')}</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl, width: '100%', paddingHorizontal: Spacing.xl },
  primaryBtn: { flex: 1, height: 42, backgroundColor: Colors.primary, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  secondaryBtn: { flex: 1, height: 42, backgroundColor: Colors.overlay.light, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  shareButton: { flex: 1, height: 42, backgroundColor: 'rgba(63, 114, 175, 0.15)', borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(63, 114, 175, 0.3)' },
  shareText: { color: Colors.accentBlue, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default ProfileActions;
