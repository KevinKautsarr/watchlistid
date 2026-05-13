import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star, Heart, MessageSquare, AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { ReviewItem } from '@/types/review';
import { useSocial } from '@/context/SocialContext';

interface ReviewCardProps {
  review: ReviewItem;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { toggleLikeReview } = useSocial();
  const [isLiked, setIsLiked] = useState(review.is_liked_by_me);
  const [likesCount, setLikesCount] = useState(review.likes_count);
  const [showSpoiler, setShowSpoiler] = useState(!review.is_spoiler);

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    
    const success = await toggleLikeReview(review.id);
    if (!success) {
      // Revert if failed
      setIsLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={s.card}>
      {/* User Header */}
      <View style={s.header}>
        <Image 
          source={review.user?.avatar_url || 'https://via.placeholder.com/40'} 
          style={s.avatar}
          contentFit="cover"
        />
        <View style={s.headerText}>
          <Text style={s.username} allowFontScaling={false}>
            {review.user?.username || 'Anonymous'}
          </Text>
          <Text style={s.date} allowFontScaling={false}>
            {formatDate(review.created_at)}
          </Text>
        </View>
        <View style={s.ratingBadge}>
          <Star size={12} color={Colors.ratingGold} fill={Colors.ratingGold} />
          <Text style={s.ratingText} allowFontScaling={false}>{review.rating}/10</Text>
        </View>
      </View>

      {/* Review Content */}
      <View style={s.contentContainer}>
        {review.is_spoiler && !showSpoiler ? (
          <TouchableOpacity 
            style={s.spoilerPlaceholder} 
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowSpoiler(true);
            }}
          >
            <AlertTriangle size={24} color={Colors.accentBlue} style={{ marginBottom: 8 }} />
            <Text style={s.spoilerTitle} allowFontScaling={false}>Contains Spoilers</Text>
            <Text style={s.spoilerAction} allowFontScaling={false}>Tap to reveal review</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.markdownContainer}>
            {review.is_spoiler && (
              <TouchableOpacity 
                style={s.hideSpoilerBtn} 
                onPress={() => setShowSpoiler(false)}
              >
                <EyeOff size={14} color={Colors.text.secondary} />
                <Text style={s.hideSpoilerText}>Hide Spoilers</Text>
              </TouchableOpacity>
            )}
            <Markdown style={markdownStyles}>
              {review.content}
            </Markdown>
          </View>
        )}
      </View>

      {/* Footer / Actions */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={[s.actionBtn, isLiked && s.likedBtn]} 
          onPress={handleLike}
          activeOpacity={0.7}
        >
          <Heart 
            size={18} 
            color={isLiked ? Colors.white : Colors.text.secondary} 
            fill={isLiked ? Colors.white : 'transparent'} 
          />
          <Text style={[s.actionText, isLiked && s.likedText]}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <MessageSquare size={18} color={Colors.text.secondary} />
          <Text style={s.actionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.md,
    backgroundColor: Colors.secondary,
  },
  headerText: {
    flex: 1,
  },
  username: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  date: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.ratingGold}1A`, // 0.1 alpha
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  ratingText: {
    color: Colors.ratingGold,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  contentContainer: {
    marginVertical: Spacing.sm,
  },
  spoilerPlaceholder: {
    backgroundColor: `${Colors.accentBlue}0D`, // 0.05 alpha
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.accentBlue,
  },
  spoilerTitle: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  spoilerAction: {
    color: Colors.accentBlue,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  markdownContainer: {
    position: 'relative',
  },
  hideSpoilerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  hideSpoilerText: {
    color: Colors.text.secondary,
    fontSize: FontSize.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  likedBtn: {
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  likedText: {
    color: Colors.white,
  },
});

const markdownStyles = {
  body: {
    color: Colors.text.primary,
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  strong: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: Colors.accentBlue,
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: Colors.secondary,
    borderLeftColor: Colors.accentBlue,
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: Colors.white,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
} as const;
