import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';
import { UserPlus, UserMinus, Edit3 } from 'lucide-react-native';

interface ProfileActionsProps {
  isOwner: boolean;
  isFollowing: boolean;
  isFollowLoading: boolean;
  onFollowPress: () => void;
  onEditPress: () => void;
  t: (key: any) => string;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  isOwner,
  isFollowing,
  isFollowLoading,
  onFollowPress,
  onEditPress,
  t
}) => {
  if (isOwner) {
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onEditPress}>
          <View style={styles.btnContent}>
            <Edit3 size={16} color={Colors.white} />
            <Text style={styles.secondaryBtnText} allowFontScaling={false}>{t('editProfile')}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl, width: '100%', paddingHorizontal: Spacing.xl },
  primaryBtn: { flex: 1, height: 42, backgroundColor: Colors.primary, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  secondaryBtn: { flex: 1, height: 42, backgroundColor: Colors.overlay.light, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default ProfileActions;
