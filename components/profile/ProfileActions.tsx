import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
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
    await Share.share({
      message: `Lihat profil ${username || 'User'} di WatchListID!`,
      url: `https://watchlistid.vercel.app/profile?userId=${userId || ''}`,
      title: `Profil ${username || 'User'} — WatchListID`,
    });
  };

  if (isOwner) {
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onEditPress}>
          <View style={styles.btnContent}>
            <Edit3 size={16} color={Colors.white} />
            <Text style={styles.secondaryBtnText} allowFontScaling={false}>{t('editProfile')}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
          <View style={styles.btnContent}>
            <Share2 size={16} color={Colors.accentBlue} />
            <Text style={styles.shareText} allowFontScaling={false}>Bagikan</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.actionRow}>
      <TouchableOpacity 
        style={[styles.primaryBtn, isFollowing && styles.followingBtn]} 
        onPress={onFollowPress}
        disabled={isFollowLoading}
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
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
        <View style={styles.btnContent}>
          <Share2 size={16} color={Colors.accentBlue} />
          <Text style={styles.shareText} allowFontScaling={false}>Bagikan</Text>
        </View>
      </TouchableOpacity>
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
