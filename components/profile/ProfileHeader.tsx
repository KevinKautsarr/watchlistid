import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ProfileHeaderProps {
  /** The user's display / full name shown as the primary bold heading */
  displayName: string;
  /** The user's unique @handle (without the @ prefix) */
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string;
  isOwner?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  username,
  avatarUrl,
  bio,
}) => {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUrl} name={displayName} size={86} />
      </View>
      
      <View style={styles.identityBox}>
        {/* Primary bold display name */}
        <Text
          style={[styles.displayName, Platform.select({ web: { textWrap: 'balance' } as any })]}
          maxFontSizeMultiplier={1.3}
          selectable={true}
        >
          {displayName}
        </Text>

        {/* @username handle — only shown when username is set */}
        {!!username && (
          <Text style={styles.usernameHandle} maxFontSizeMultiplier={1.3} selectable={true}>
            @{username}
          </Text>
        )}

        {!!bio && (
          <Text style={styles.bioText} maxFontSizeMultiplier={1.3} selectable={true}>{bio}</Text>
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
  displayName: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  usernameHandle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  bioText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
});

export default ProfileHeader;
