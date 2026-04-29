import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface SkeletonProps {
  width?:        number | string;
  height?:       number;
  borderRadius?: number;
}

const SkeletonCard: React.FC<SkeletonProps> = ({ 
  width = 140, 
  height = 275, 
  borderRadius = Radius.md 
}) => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { width, height, borderRadius, opacity: shimmerAnim } as any
      ]} 
    />
  );
};

export const SkeletonListItem: React.FC<SkeletonProps> = ({ 
  height = 100, 
  borderRadius = Radius.md 
}) => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.skeletonList, 
        { height, borderRadius, opacity: shimmerAnim } as any
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surface,
    marginRight: 14,
  },
  skeletonList: {
    backgroundColor: Colors.surface,
    width: '100%',
    marginBottom: 12,
  }
});

export default SkeletonCard;
