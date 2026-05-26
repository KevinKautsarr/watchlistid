import React from 'react';
import { Radius } from '@/constants/theme';
import Shimmer from '@/components/common/Shimmer';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export const SkeletonCard: React.FC<SkeletonProps> = ({ 
  width = 140, 
  height = 275, 
  borderRadius = Radius.md 
}) => {
  return (
    <Shimmer
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={{ marginRight: 14 }}
    />
  );
};

export const SkeletonListItem: React.FC<SkeletonProps> = ({ 
  height = 100, 
  borderRadius = Radius.md 
}) => {
  return (
    <Shimmer
      width="100%"
      height={height}
      borderRadius={borderRadius}
      style={{ marginBottom: 12 }}
    />
  );
};

export default SkeletonCard;
