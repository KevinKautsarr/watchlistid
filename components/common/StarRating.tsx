import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star, StarHalf } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface StarRatingProps {
  rating: number; // 0 to 5
  size?: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
}

export default function StarRating({ 
  rating, 
  size = 24, 
  onRatingChange, 
  interactive = false 
}: StarRatingProps) {
  
  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFull = rating >= starValue;
    const isHalf = rating >= starValue - 0.5 && rating < starValue;

    const StarComponent = isHalf ? StarHalf : Star;
    const color = isFull || isHalf ? '#F5C518' : 'rgba(255,255,255,0.1)';
    const fillColor = isFull ? '#F5C518' : isHalf ? '#F5C518' : 'transparent';

    if (interactive && onRatingChange) {
      return (
        <View key={index} style={s.interactiveStarGroup}>
          {/* Left half touch area */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => onRatingChange(starValue - 0.5)}
            style={[s.halfTouch, { width: size / 2, height: size }]}
          />
          {/* Right half touch area */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => onRatingChange(starValue)}
            style={[s.halfTouch, { width: size / 2, height: size, left: size / 2 }]}
          />
          <StarComponent 
            size={size} 
            color={color} 
            fill={fillColor} 
          />
        </View>
      );
    }

    return (
      <View key={index}>
        <StarComponent 
          size={size} 
          color={color} 
          fill={fillColor} 
        />
      </View>
    );
  };

  return (
    <View style={s.container}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactiveStarGroup: {
    position: 'relative',
  },
  halfTouch: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
});
