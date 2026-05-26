import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import SafeImage from '@/components/common/SafeImage';
import { Colors } from '@/constants/theme';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Professional Avatar component with automatic fallback to brand icon.
 * Handles empty strings and null values gracefully.
 */
const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style, textStyle, priority = 'normal' }) => {
  const hasValidUri = uri && typeof uri === 'string' && uri.trim() !== '';

  const containerStyle = [
    styles.container,
    { width: size, height: size, borderRadius: Math.round(size / 2) || 0 },
    style
  ];

  if (hasValidUri) {
    return (
      <View style={containerStyle}>
        <SafeImage
          uri={uri}
          fallbackType="user"
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority={priority}
          accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
          alt={name ? `${name}'s avatar` : 'User avatar'}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.placeholder]}>
      <EmptyStateIcon name="avatar" size={size * 0.7} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Avatar;
