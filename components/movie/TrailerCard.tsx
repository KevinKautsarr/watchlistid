import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Play, Film, Eye, Scissors, Video as VideoIcon, Camera } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { Video } from '../../types';

interface TrailerCardProps {
  video:    Video;
  onPress?: () => void;
  featured?: boolean;
}

const TrailerCard: React.FC<TrailerCardProps> = ({ 
  video, 
  onPress, 
  featured 
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        featured ? styles.featuredContainer : styles.standardContainer
      ]}
    >
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Play size={20} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          </View>
        </View>
        <View style={styles.typeBadge}>
          {video.type === 'Trailer' && <Film size={10} color={Colors.white} />}
          {video.type === 'Teaser' && <Eye size={10} color={Colors.white} />}
          {video.type === 'Clip' && <Scissors size={10} color={Colors.white} />}
          {video.type === 'Featurette' && <VideoIcon size={10} color={Colors.white} />}
          {video.type === 'Behind the Scenes' && <Camera size={10} color={Colors.white} />}
          <Text style={styles.typeText} allowFontScaling={false}>{video.type}</Text>
        </View>
      </View>
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
    height: 220,
    marginBottom: Spacing.xl,
  },
  standardContainer: {
    width: 220,
  },
  thumbnailWrap: {
    flex: 1,
    height: 140,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: Colors.white,
    fontSize: FontSize.lg,
    marginLeft: 3,
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
