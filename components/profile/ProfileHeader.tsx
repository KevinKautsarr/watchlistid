import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from '@/components/common/Avatar';
import { Colors, Spacing, FontSize, FontWeight } from '@/constants/theme';

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  isOwner?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  displayName,
  avatarUrl,
  bio,
}) => {
  return (
    <View style={styles.heroContainer}>
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUrl} name={displayName} size={86} />
      </View>
      
      <View style={styles.identityBox}>
        <Text style={styles.displayName} allowFontScaling={false}>{displayName}</Text>
        {!!bio && (
          <Text style={styles.bioText} allowFontScaling={false}>{bio}</Text>
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
  bioText: { color: Colors.text.secondary, fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.xl },
});

export default ProfileHeader;
