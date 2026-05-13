import React from 'react';
import SkeletonCard, { SkeletonListItem } from '@/components/SkeletonCard';

interface MovieSkeletonProps {
  count?: number;
  layout?: 'grid' | 'list' | 'horizontal';
}

export const MovieSkeleton = ({ count = 4, layout = 'list' }: MovieSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        layout === 'list' 
          ? <SkeletonListItem key={i} /> 
          : <SkeletonCard key={i} />
      ))}
    </>
  );
};
