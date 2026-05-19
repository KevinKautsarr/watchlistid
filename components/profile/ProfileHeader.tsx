import React from 'react';
import { View, Text, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy } from 'lucide-react-native';
import { cursorPointer } from '@/utils/webStyles';

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  isOwner?: boolean;
  userId?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  avatarUrl,
  bio,
  userId,
}) => {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUrl} name={displayName} size={86} />
      </View>
      
      <View style={styles.identityBox}>
        <Text style={[styles.displayName, Platform.select({ web: { textWrap: 'balance' } as any })]} allowFontScaling={false} selectable={true}>{displayName}</Text>
        
        {!!userId && (
          <Pressable
            onPress={async () => {
              await Clipboard.setStringAsync(userId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sukses', 'ID disalin ke papan klip');
            }}
            style={({ pressed }) => [styles.idContainer, cursorPointer, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Salin ID pengguna"
          >
            <Text style={styles.idText} allowFontScaling={false} selectable={true}>#{userId.slice(0, 8).toUpperCase()}</Text>
            <Copy size={12} color={Colors.text.secondary} />
          </Pressable>
        )}

        {!!bio && (
          <Text style={styles.bioText} allowFontScaling={false} selectable={true}>{bio}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: { 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.xl, 
    paddingBottom: Spacing.sm, 
    alignItems: 'center' 
  },
  avatarContainer: { 
    width: 86, 
    height: 86, 
    borderRadius: 43, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    overflow: 'hidden' 
  },
  identityBox: { alignItems: 'center', marginTop: 12, width: '100%' },
  displayName: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.black, letterSpacing: -0.5, textAlign: 'center' },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: Colors.overlay.light10,
    marginTop: 6,
    marginBottom: 4,
  },
  idText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: 'bold',
  },
  bioText: { color: Colors.text.secondary, fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.xl },
});

export default ProfileHeader;
