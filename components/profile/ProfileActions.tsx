import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { APP_URL } from '@/config';
import { UserPlus, UserMinus, Edit3, Share2, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

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
  const [copied, setCopied] = useState(false);

  const copyLink = async (link: string) => {
    try {
      await Clipboard.setStringAsync(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing more we can do
    }
  };

  const handleShareProfile = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = username || 'User';
    const url = `${APP_URL}/user/${userId || ''}`;
    const message = t('shareProfileMessage').replace('{username}', name).replace('{url}', url);

    // Desktop web frequently lacks the Web Share API → copy the link instead.
    const noWebShare = Platform.OS === 'web' && (typeof navigator === 'undefined' || !(navigator as any).share);
    if (noWebShare) { await copyLink(url); return; }

    try {
      await Share.share({ message, url, title: t('shareProfileTitle').replace('{username}', name) });
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // user dismissed the share sheet
      await copyLink(url);                  // share failed → fall back to clipboard
    }
  };

  if (isOwner) {
    return (
      <View style={styles.actionRow}>
        <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={onEditPress} accessibilityRole="button" accessibilityLabel="Edit profile">
          <View style={styles.btnContent}>
            <Edit3 size={16} color={Colors.white} />
            <Text style={styles.secondaryBtnText} maxFontSizeMultiplier={1.3}>{t('editProfile')}</Text>
          </View>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
          <View style={styles.btnContent}>
            {copied ? <Check size={16} color={Colors.accent} /> : <Share2 size={16} color={Colors.accent} />}
            <Text style={styles.shareText} maxFontSizeMultiplier={1.3}>{copied ? t('linkCopied') : t('share')}</Text>
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
                <Text style={styles.primaryBtnText} maxFontSizeMultiplier={1.3}>{t('unfollow')}</Text>
              </>
            ) : (
              <>
                <UserPlus size={18} color={Colors.white} />
                <Text style={styles.primaryBtnText} maxFontSizeMultiplier={1.3}>{t('follow')}</Text>
              </>
            )}
          </View>
        )}
      </Pressable>
      <Pressable style={({ pressed }) => [styles.shareButton, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]} onPress={handleShareProfile} accessibilityRole="button" accessibilityLabel="Bagikan profil">
        <View style={styles.btnContent}>
          {copied ? <Check size={16} color={Colors.accent} /> : <Share2 size={16} color={Colors.accent} />}
          <Text style={styles.shareText} maxFontSizeMultiplier={1.3}>{copied ? t('linkCopied') : t('share')}</Text>
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
  shareText: { color: Colors.accent, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default ProfileActions;
