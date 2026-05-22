import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Film, User, EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri?: string | null;
  fallbackType?: 'movie' | 'user' | 'generic';
  fallbackIconSize?: number;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  style,
  fallbackType = 'generic',
  fallbackIconSize = 24,
  contentFit = 'cover',
  onError,
  ...props
}) => {
  const [error, setError] = useState(false);

  const hasValidUri = uri && typeof uri === 'string' && uri.trim() !== '';

  if (error || !hasValidUri) {
    const Icon = fallbackType === 'movie' ? Film : fallbackType === 'user' ? User : EyeOff;
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Icon size={fallbackIconSize} color={Colors.text.secondary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      onError={(e) => {
        console.warn(`[SafeImage] Failed to load image. URL: "${uri}". Error:`, e?.error || e);
        setError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SafeImage;
