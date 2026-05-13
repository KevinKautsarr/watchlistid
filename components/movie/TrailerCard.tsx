import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Play, Film, Eye, Scissors, Video as VideoIcon, Camera } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '../../constants/theme';
import { cursorPointer, webHover } from '../../utils/webStyles';
import { Video } from '../../types';

interface TrailerCardProps {
  video:    Video;
  onPress?: () => void;
  featured?: boolean;
}

const THUMB_HEIGHT_FEATURED = 220;
const THUMB_HEIGHT_STANDARD = 140;

// On web, YouTube thumbnails from img.youtube.com are blocked by CORS.
// We use i3.ytimg.com as a CORS-friendly mirror that serves identical content.
function getThumbUrl(key: string): string {
  if (Platform.OS === 'web') {
    // i3.ytimg.com is the same CDN but served with permissive CORS headers
    return `https://i3.ytimg.com/vi/${key}/hqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconProps = { size: 10, color: Colors.white };
  switch (type) {
    case 'Trailer':        return <Film {...iconProps} />;
    case 'Teaser':         return <Eye {...iconProps} />;
    case 'Clip':           return <Scissors {...iconProps} />;
    case 'Featurette':     return <VideoIcon {...iconProps} />;
    case 'Behind the Scenes': return <Camera {...iconProps} />;
    default:               return null;
  }
};

const TrailerCard: React.FC<TrailerCardProps> = ({ video, onPress, featured }) => {
  const [imgError, setImgError] = useState(false);
  const thumbHeight = featured ? THUMB_HEIGHT_FEATURED : THUMB_HEIGHT_STANDARD;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        featured ? styles.featuredContainer : styles.standardContainer,
        cursorPointer,
        webHover
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.type}: ${video.name}`}
    >
      <View style={[styles.thumbnailWrap, { height: thumbHeight }]}>
        {/* Thumbnail image — CORS-safe URL for web, default for native */}
        {!imgError ? (
          <Image
            source={{ uri: getThumbUrl(video.key) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            priority={featured ? 'high' : 'normal'}
            onError={() => setImgError(true)}
            cachePolicy="memory-disk"
          />
        ) : (
          /* Fallback: dark placeholder with YouTube red accent when image fails */
          <View style={[StyleSheet.absoluteFill, styles.fallbackBg]}>
            <Play size={IconSize.lg} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          </View>
        )}

        {/* Semi-transparent play overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Play size={IconSize.md} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          </View>
        </View>

        {/* Video type badge */}
        <View style={styles.typeBadge}>
          <TypeIcon type={video.type} />
          <Text style={styles.typeText} allowFontScaling={false}>{video.type}</Text>
        </View>
      </View>

      {/* Title shown only on non-featured cards */}
      {!featured && (
        <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
          {video.name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  featuredContainer: {
    width: '100%',
    height: THUMB_HEIGHT_FEATURED,
    marginBottom: Spacing.xl,
  },
  standardContainer: {
    width: 220,
  },
  thumbnailWrap: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  fallbackBg: {
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.overlay.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});

export default TrailerCard;
