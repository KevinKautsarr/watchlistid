import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MessageSquare, Clock, Star, User, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TMDB_IMAGE_SIZES } from '@/constants/theme';
import { MovieLog } from '@/types';
import { useSocial } from '@/context/SocialContext';
import { useLanguage } from '@/context/LanguageContext';
import Avatar from '@/components/common/Avatar';
import { useAuth } from '@/context/AuthContext';
import { supabase, typedFrom } from '@/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (dateString: string, t: (k: any) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 60) return t('agoMin').replace('{n}', String(mins));
  if (hours < 24) return t('agoHour').replace('{n}', String(hours));
  return t('agoDay').replace('{n}', String(days));
};

const getMediaTypeBadge = (mediaType?: string) => {
  if (mediaType === 'tv') return { label: '📺 Series', color: '#2196F3' };
  return { label: '🎬 Film', color: Colors.danger };
};

// ─── Item Component ───────────────────────────────────────────────────────────

const ActivityFeedItem = React.memo(({ item, t }: { item: MovieLog; t: (k: any) => string }) => {
  const router = useRouter();
  const badge = getMediaTypeBadge(item.media_type);

  return (
    <View style={s.card}>
      {/* User header */}
      <View style={s.cardHeader}>
        <TouchableOpacity
          style={s.userRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/user/[userId]', params: { userId: item.user_id } } as any);
          }}
        >
          <Avatar uri={item.user?.avatar_url} name={item.user?.username || 'User'} size={34} />
          <View style={s.userInfo}>
            <Text style={s.username}>{item.user?.username || 'Unknown'}</Text>
            <View style={s.metaRow}>
              <Clock size={11} color={Colors.text.secondary} />
              <Text style={s.time}>{formatTime(item.watched_at, t)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Movie card */}
      <TouchableOpacity
        style={s.movieRow}
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Explicit guard — prevents fallback 'movie' from opening wrong TMDB content
          const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
          router.push({
            pathname: '/movie/[id]',
            params: { id: item.movie_id.toString(), type: mediaType },
          });
        }}
      >
        <Image
          source={
            item.poster_path
              ? { uri: `${TMDB_IMAGE_SIZES.small}${item.poster_path}` }
              : undefined
          }
          style={s.poster}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          priority="low"
        />
        <View style={s.movieInfo}>
          {/* Media type badge */}
          <View style={[s.typeBadge, { backgroundColor: `${badge.color}20`, borderColor: `${badge.color}40` }]}>
            <Text style={[s.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          <Text style={s.watchedLabel}>{t('watchedLabel')}</Text>
          <Text style={s.movieTitle} numberOfLines={2}>{item.movie_title}</Text>

          {/* Rating with star icon */}
          {item.rating && (
            <View style={s.ratingBadge}>
              <Star size={11} color={Colors.ratingGold} fill={Colors.ratingGold} />
              <Text style={s.ratingText}>{item.rating}/10</Text>
            </View>
          )}

          {/* Review snippet */}
          {item.review_text && (
            <View style={s.reviewRow}>
              <MessageSquare size={10} color={Colors.text.secondary} />
              <Text style={s.reviewText} numberOfLines={2}>
                "{item.review_text}"
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

ActivityFeedItem.displayName = 'ActivityFeedItem';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivityFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const { getActivityFeed } = useSocial();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<MovieLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    const data = await getActivityFeed();
    setLogs(data);
    setIsLoading(false);
  }, [getActivityFeed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const data = await getActivityFeed();
    setLogs(data);
    setRefreshing(false);
  }, [getActivityFeed]);

  // Reload every time the Following tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Realtime subscription for live updates
  useEffect(() => {
    if (!user?.id) return;

    let channel: any;

    const setupRealtimeSubscription = async () => {
      const { data: follows } = await typedFrom('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = new Set(follows?.map(f => f.following_id) || []);
      if (followingIds.size === 0) return;

      channel = supabase
        .channel('public:movie_logs:feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'movie_logs' },
          async (payload) => {
            const newLog = payload.new;
            if (followingIds.has(newLog.user_id)) {
              const { data: profile } = await typedFrom('profiles')
                .select('id, username, avatar_url')
                .eq('id', newLog.user_id)
                .single();

              const fullLog = { ...newLog, user: profile || null } as unknown as MovieLog;

              setLogs(prev => {
                if (prev.some(l => l.id === fullLog.id)) return prev;
                return [fullLog, ...prev];
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const renderItem = React.useCallback(
    ({ item }: { item: MovieLog }) => <ActivityFeedItem item={item} t={t} />,
    [t]
  );

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color={Colors.danger} />
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
          <UserPlus size={48} color="rgba(255,255,255,0.08)" />
          <Text style={s.emptyTitle}>{t('activityFeedEmpty')}</Text>
          <Text style={s.emptySubtitle}>{t('activityFeedEmptySub')}</Text>
          <TouchableOpacity
            style={s.exploreBtn}
            onPress={() => router.push('/search-users')}
          >
            <Text style={s.exploreText}>{t('findFriends')}</Text>
          </TouchableOpacity>
        </View>
      }
      scrollEnabled={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      maxToRenderPerBatch={10}
      initialNumToRender={8}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  listContent: {
    paddingTop: Spacing.lg,
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
    width: 80,
    height: 120,
  },
  movieInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
    gap: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  watchedLabel: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
  },
  movieTitle: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,193,7,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.2)',
  },
  ratingText: {
    color: Colors.ratingGold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  reviewText: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    flex: 1,
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
    borderColor: 'rgba(255,255,255,0.06)',
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
    maxWidth: 220,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.danger,
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
