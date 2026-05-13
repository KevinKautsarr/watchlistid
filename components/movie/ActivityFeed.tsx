import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MessageSquare, Clock, Heart, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { MovieLog } from '../../types';
import { useSocial } from '../../context/SocialContext';
import Avatar from '../common/Avatar';

export default function ActivityFeed() {
  const router = useRouter();
  const { getActivityFeed } = useSocial();
  const [logs, setLogs] = useState<MovieLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeed = async () => {
    setIsLoading(true);
    const data = await getActivityFeed();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderItem = ({ item }: { item: MovieLog }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <TouchableOpacity 
          style={s.userRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/(tabs)/profile', params: { targetUserId: item.user_id } });
          }}
        >
          <Avatar uri={item.user?.avatar_url} name={item.user?.username || 'User'} size={32} />
          <View style={s.userInfo}>
            <Text style={s.username}>{item.user?.username || 'Unknown'}</Text>
            <View style={s.metaRow}>
              <Clock size={12} color={Colors.text.secondary} />
              <Text style={s.time}>{formatTime(item.watched_at)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={s.movieRow}
        onPress={() => router.push(`/movie/${item.movie_id}` as any)}
      >
        <Image 
          source={`https://image.tmdb.org/t/p/w200${item.poster_path}`} 
          style={s.poster}
          contentFit="cover"
        />
        <View style={s.movieInfo}>
          <Text style={s.watchedText}>
            Watched <Text style={s.movieTitle}>{item.movie_title}</Text>
          </Text>
          {item.rating && (
            <View style={s.ratingBadge}>
              <Heart size={12} color={Colors.white} fill={Colors.white} />
              <Text style={s.ratingText}>{item.rating}/10</Text>
            </View>
          )}
          {item.review_text && (
            <Text style={s.reviewText} numberOfLines={2}>
              "{item.review_text}"
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color={Colors.accentBlue} />
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={s.listContent}
      ListEmptyComponent={
        <View style={s.emptyContainer}>
          <User size={48} color="rgba(255,255,255,0.05)" />
          <Text style={s.emptyTitle}>Nothing to see here</Text>
          <Text style={s.emptySubtitle}>Follow your friends to see what they're watching!</Text>
          <TouchableOpacity 
            style={s.exploreBtn}
            onPress={() => router.push('/search-users' as any)}
          >
            <Text style={s.exploreText}>Find Friends</Text>
          </TouchableOpacity>
        </View>
      }
      scrollEnabled={false} // Since it's inside HomeScreen's ScrollView
      maxToRenderPerBatch={10}
      initialNumToRender={8}
    />
  );
}

const s = StyleSheet.create({
  listContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Shadow.sm,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  time: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
  },
  movieRow: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  poster: {
    width: 60,
    height: 90,
  },
  movieInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  watchedText: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
  },
  movieTitle: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  ratingText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reviewText: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  center: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    backgroundColor: Colors.overlay.light,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.overlay.light,
    borderStyle: 'dashed',
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 200,
  },
  exploreBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  exploreText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
});
