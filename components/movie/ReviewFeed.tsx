import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { MessageSquare, SortAsc, SortDesc, Filter } from 'lucide-react-native';

import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import { ReviewItem, FetchState } from '@/types/review';
import { useSocial } from '@/context/SocialContext';
import ReviewCard from './ReviewCard';

interface ReviewFeedProps {
  movieId: number;
}

export default function ReviewFeed({ movieId }: ReviewFeedProps) {
  const { getReviews } = useSocial();
  const [state, setState] = useState<FetchState<ReviewItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  });

  const loadReviews = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await getReviews(movieId);
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({ data: [], isLoading: false, error: 'Failed to load reviews' });
    }
  };

  useEffect(() => {
    loadReviews();
  }, [movieId]);

  if (state.isLoading && state.data.length === 0) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>{state.error}</Text>
        <TouchableOpacity onPress={loadReviews} style={s.retryBtn}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={s.title}>Reviews</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{state.data.length}</Text>
          </View>
        </View>
        
        <View style={s.filters}>
          <TouchableOpacity style={s.filterBtn}>
            <SortDesc size={16} color={Colors.text.secondary} />
            <Text style={s.filterText}>Newest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.filterBtn}>
            <Filter size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {state.data.length === 0 ? (
        <View style={s.emptyState}>
          <MessageSquare size={48} color="rgba(255,255,255,0.05)" />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySubtitle}>Be the first to share your thoughts on this movie!</Text>
        </View>
      ) : (
        <View style={s.feed}>
          {state.data.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl,
  },
  center: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
  },
  badge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  filterText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  feed: {
    gap: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  error: {
    color: Colors.primary,
    fontSize: FontSize.base,
    marginBottom: Spacing.md,
  },
  retryBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  retryText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
