import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Animated } from 'react-native';
import { MediaItem } from '@/types';
import PosterCard from '@/components/common/PosterCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MediaRowProps {
  data: MediaItem[];
  type?: 'movie' | 'tv';
  cardWidth: number;
  pad: number;
  onPress: (id: number, t: 'movie' | 'tv') => void;
}

export const MediaRow: React.FC<MediaRowProps> = ({ data, type = 'movie', cardWidth, pad, onPress }) => {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (data.length === 0) return;

    if (reducedMotion) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data.length, reducedMotion]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: pad, paddingRight: pad, paddingBottom: 4, gap: 10 }}>
        {data.map((item) => {
          // Safe type extraction
          const itemType = (item as any).media_type || (item as any).mediaType || type;
          return (
            <PosterCard 
              key={item.id} 
              movie={item} 
              width={cardWidth}
              onPress={() => onPress(item.id, itemType as 'movie' | 'tv')} 
            />
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};
