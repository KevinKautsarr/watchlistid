import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import SafeImage from '@/components/common/SafeImage';
import { Colors, FontWeight } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Professional Avatar component with automatic fallback to initials.
 * Handles empty strings and null values gracefully.
 */
const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style, textStyle, priority = 'normal' }) => {
  const initial = (name || 'U').charAt(0).toUpperCase();
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
      <Text 
        style={[styles.initial, { fontSize: size * 0.4 }, textStyle]} 
        allowFontScaling={false}
      >
        {initial}
      </Text>
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
  initial: {
    color: Colors.white,
    fontWeight: FontWeight.black,
  },
});

export default Avatar;
