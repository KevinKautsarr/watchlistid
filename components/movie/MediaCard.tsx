import React, { useCallback, useRef, useState } from 'react';
import { TouchableOpacity, Text, View, Animated, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { TMDB_IMAGE_SIZES, Radius, Colors, IconSize, FontSize, FontWeight } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { nativeDriver } from '@/utils/animation';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface BaseCardProps {
  poster_path?: string;
  vote_average?: number;
  onPress: () => void;
  width: number;
}

export interface MovieCardProps {
  title: string;
  name?: never;
}

export interface TVCardProps {
  name: string;
  title?: never;
}

export type MediaCardProps = BaseCardProps & (MovieCardProps | TVCardProps);

// ─── Component ───────────────────────────────────────────────────────────────
// Wrapped in React.memo so re-renders only happen when props actually change.
// This is the single most impactful optimization for long horizontal lists.
export const MediaCard = React.memo(function MediaCard({
  poster_path,
  title,
  name,
  vote_average,
  onPress,
  width,
}: MediaCardProps) {
  const height = Math.round(width * 1.5);
  // Micro-animation: subtle scale-down on press for tactile feel
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      ...nativeDriver,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...nativeDriver,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [scale]);

  const [isHovered, setIsHovered] = useState(false);

  // Web-specific hover events
  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return (
    <Animated.View style={{ transform: [{ scale }] }} {...hoverProps}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            width,
            height,
            boxShadow: (isHovered 
              ? `0 12px 30px ${Colors.danger}66` // Red-ish glow on hover
              : '0 8px 20px rgba(0,0,0,0.5)') as any,
          },
          cursorPointer
        ]}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Poster image — w185 is the sweet spot for ~130px card width */}
        <Image
          source={{ uri: `${TMDB_IMAGE_SIZES.small}${poster_path}` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority="low"
          accessibilityLabel={title || name || 'Movie poster'}
          alt={title || name || 'Movie poster'}
        />

        {/* Rich two-stop gradient for legible metadata overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.93)']}
          locations={[0.3, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Metadata bar */}
        <View style={styles.meta}>
          {/* Rating badge */}
          {!!vote_average && vote_average > 0 && (
            <View style={styles.ratingBadge}>
              <Star size={IconSize.xs * 0.8} color={Colors.ratingGold} fill={Colors.ratingGold} strokeWidth={0} />
              <Text style={styles.ratingText} allowFontScaling={false}>
                {vote_average.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text
            style={[styles.title, { fontSize: width >= 170 ? FontSize.sm : FontSize.xs }]}
            numberOfLines={2}
            allowFontScaling={false}
          >
            {title || name}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  meta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    gap: 3,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: Colors.ratingGold,
    fontSize: FontSize.xs * 0.8,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  title: {
    color: Colors.white,
    fontWeight: '600',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
});
