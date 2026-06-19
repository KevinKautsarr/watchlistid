import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

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

  // Reset the error flag when the source changes so a recycled <SafeImage>
  // (e.g. inside a FlashList) doesn't keep showing the previous item's fallback.
  useEffect(() => { setError(false); }, [uri]);

  const hasValidUri = uri && typeof uri === 'string' && uri.trim() !== '';

  if (error || !hasValidUri) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        {fallbackType === 'movie' ? (
          <EmptyStateIcon name="default-poster" size={fallbackIconSize * 3} />
        ) : fallbackType === 'user' ? (
          <EmptyStateIcon name="avatar" size={fallbackIconSize * 2.5} />
        ) : (
          <EyeOff size={fallbackIconSize} color={Colors.text.secondary} />
        )}
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
