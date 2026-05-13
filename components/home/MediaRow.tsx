import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { MediaItem } from '@/types';
import PosterCard from '@/components/common/PosterCard';

interface MediaRowProps {
  data: MediaItem[];
  type?: 'movie' | 'tv';
  cardWidth: number;
  pad: number;
  onPress: (id: number, t: 'movie' | 'tv') => void;
}

export const MediaRow: React.FC<MediaRowProps> = ({ data, type = 'movie', cardWidth, pad, onPress }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: pad, paddingRight: pad, paddingBottom: 4, gap: 10 }}>
      {data.map((item) => (
        <PosterCard 
          key={item.id} 
          movie={item} 
          width={cardWidth}
          onPress={() => onPress(item.id, type)} 
        />
      ))}
    </ScrollView>
  );
};
