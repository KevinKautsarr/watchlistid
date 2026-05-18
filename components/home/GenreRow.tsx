import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface GenreRowProps {
  genres: ReadonlyArray<{
    id: number;
    nameKey: string;
    image: string;
  }>;
  onPress: (id: number) => void;
  pad: number;
  t: any;
  isDesktop: boolean;
  isTablet: boolean;
}

export const GenreRow: React.FC<GenreRowProps> = ({ genres, onPress, pad, t, isDesktop, isTablet }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={{ paddingLeft: pad, paddingRight: pad, paddingBottom: 4, gap: 10 }}
    >
      {genres.map(g => {
        const gW = isDesktop ? 160 : isTablet ? 140 : 120;
        const gH = Math.round(gW * 0.62);
        return (
          <TouchableOpacity 
            key={g.id} 
            style={[{ width: gW, height: gH, borderRadius: Radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, cursorPointer]} 
            activeOpacity={0.82} 
            onPress={() => onPress(g.id)}
          >
            <Image 
              source={{ uri: `${TMDB_IMAGE_SIZES.thumb}${g.image}` }} 
              style={StyleSheet.absoluteFill} 
              contentFit="cover" 
              cachePolicy="memory-disk"
              transition={200}
              priority="low"
            />
            <LinearGradient 
              colors={[Colors.overlay.light10, Colors.overlay.dark70]} 
              style={StyleSheet.absoluteFill} 
            />
            <Text style={styles.genreName} allowFontScaling={false}>{t(g.nameKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  genreName: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: Colors.white, 
    letterSpacing: 0.4 
  },
});
