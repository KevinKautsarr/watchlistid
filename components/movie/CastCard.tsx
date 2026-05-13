import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, TMDB_IMAGE_SIZES } from '../../constants/theme';
import { cursorPointer } from '../../utils/webStyles';
import { CastMember } from '../../types';

interface CastCardProps {
  cast:     CastMember;
  onPress?: () => void;
}

const CastCard: React.FC<CastCardProps> = ({ 
  cast, 
  onPress 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, cursorPointer]}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${cast.name}`}
    >
      <View style={styles.avatarWrap}>
        {cast.profile_path ? (
          <Image
            source={{ uri: `${TMDB_IMAGE_SIZES.medium}${cast.profile_path}` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={`${cast.name} profile photo`}
          />
        ) : (
          <User size={IconSize.xl} color={Colors.text.secondary} strokeWidth={1.5} />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1} allowFontScaling={false}>
        {cast.name}
      </Text>
      <Text style={styles.character} numberOfLines={1} allowFontScaling={false}>
        {cast.character}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    marginRight: Spacing.md,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  character: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default CastCard;
