import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

interface RatingBadgeProps {
  rating:  number;
  size?:   'sm' | 'md' | 'lg';
  style?:  ViewStyle;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ 
  rating, 
  size = 'md',
  style 
}) => {
  const iconSize = size === 'sm' ? 10 : size === 'md' ? 12 : 14;

  return (
    <View style={[styles.container, style]}>
      <Star size={iconSize} color="#F5C518" fill="#F5C518" strokeWidth={0} />
      <Text style={[
        styles.rating,
        size === 'sm' && styles.textSmall,
        size === 'lg' && styles.textLarge
      ]} allowFontScaling={false}>
        {rating?.toFixed(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  star: {
    color: Colors.ratingGold,
    fontSize: FontSize.md,
  },
  starLarge: {
    fontSize: FontSize.xl,
  },
  rating: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
  },
  textSmall: {
    fontSize: FontSize.xs,
  },
  textLarge: {
    fontSize: FontSize.xl,
  },
});

export default RatingBadge;
