import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '@/constants/theme';
import TrailerCard from '@/components/movie/TrailerCard';
import { Video } from '@/types';

interface DetailTrailersProps {
  videos: Video[];
  featuredTrailer: Video | undefined;
  onOpenTrailer: (key: string) => void;
  t: any;
}

export const DetailTrailers: React.FC<DetailTrailersProps> = ({ videos, featuredTrailer, onOpenTrailer, t }) => {
  if (videos.length === 0) return null;

  return (
    <View style={styles.trailerSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>{t('videos')}</Text>
          <Text style={styles.sectionSubtitle} maxFontSizeMultiplier={1.3}>{t('videosCount').replace('{count}', videos.length.toString())}</Text>
        </View>
      </View>

      {featuredTrailer && (
        <TrailerCard 
          video={featuredTrailer} 
          featured 
          onPress={() => onOpenTrailer(featuredTrailer.key)} 
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {videos.filter((v) => v.id !== featuredTrailer?.id).map((video) => (
          <TrailerCard 
            key={video.id} 
            video={video} 
            onPress={() => onOpenTrailer(video.key)} 
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  trailerSection: { paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white },
  sectionSubtitle: { fontSize: FontSize.sm, color: Colors.overlay.light60, marginTop: 2 },
  hScroll: { paddingHorizontal: 24, gap: 16 },
});
