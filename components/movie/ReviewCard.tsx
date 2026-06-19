import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Star, Heart, MessageSquare, AlertTriangle, Eye, EyeOff } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { ReviewItem, CommentItem } from '@/types/review';
import { useSocial } from '@/context/SocialContext';
import { useReviews } from '@/context/ReviewContext';
import Avatar from '@/components/common/Avatar';

interface ReviewCardProps {
  review: ReviewItem;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { toggleLikeReview } = useSocial();
  const { getComments, addComment } = useReviews();
  const [isLiked, setIsLiked] = useState(review.is_liked_by_me);
  const [likesCount, setLikesCount] = useState(review.likes_count);
  const [showSpoiler, setShowSpoiler] = useState(!review.is_spoiler);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleToggleComments = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow) {
      setCommentsLoading(true);
      const list = await getComments(review.id);
      setComments(list);
      setCommentsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentInput.trim() || submitting) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await addComment(review.id, commentInput);
    if (success) {
      setCommentInput('');
      const list = await getComments(review.id);
      setComments(list);
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={s.card}>
      {/* User Header */}
      <View style={s.header}>
        <Avatar 
          uri={review.user?.avatar_url} 
          name={review.user?.username || 'Anonymous'}
          size={36}
          style={s.avatar}
        />
        <View style={s.headerText}>
          <Text style={s.username} maxFontSizeMultiplier={1.3}>
            {review.user?.username || 'Anonymous'}
          </Text>
          <Text style={s.date} maxFontSizeMultiplier={1.3}>
            {formatDate(review.created_at)}
          </Text>
        </View>
        <View style={s.ratingBadge}>
          <Star size={12} color={Colors.ratingGold} fill={Colors.ratingGold} />
          <Text style={s.ratingText} maxFontSizeMultiplier={1.3}>{review.rating}/10</Text>
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
            <AlertTriangle size={24} color={Colors.accent} style={s.spoilerIcon} />
            <Text style={s.spoilerTitle} maxFontSizeMultiplier={1.3}>Contains Spoilers</Text>
            <Text style={s.spoilerAction} maxFontSizeMultiplier={1.3}>Tap to reveal review</Text>
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

        <TouchableOpacity style={s.actionBtn} onPress={handleToggleComments} activeOpacity={0.7}>
          <MessageSquare size={18} color={showComments ? Colors.primary : Colors.text.secondary} />
          <Text style={[s.actionText, showComments && { color: Colors.primary }]}>
            {showComments ? 'Hide Replies' : 'Reply'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comment Tray */}
      {showComments && (
        <View style={s.commentsSection}>
          <Text style={s.commentsTitle} maxFontSizeMultiplier={1.3}>Replies</Text>
          
          {commentsLoading ? (
            <Text style={s.loadingText} maxFontSizeMultiplier={1.3}>Loading comments...</Text>
          ) : (
            <View style={s.commentsList}>
              {comments.length === 0 ? (
                <Text style={s.noCommentsText} maxFontSizeMultiplier={1.3}>No comments yet. Be the first to reply!</Text>
              ) : (
                comments.map(c => (
                  <View key={c.id} style={s.commentCard}>
                    <Avatar 
                      uri={c.user?.avatar_url} 
                      name={c.user?.username || 'Anonymous'} 
                      size={24} 
                      style={s.commentAvatar} 
                    />
                    <View style={s.commentContentWrapper}>
                      <View style={s.commentHeaderRow}>
                        <Text style={s.commentUsername} maxFontSizeMultiplier={1.3}>{c.user?.username || 'Anonymous'}</Text>
                        <Text style={s.commentDate} maxFontSizeMultiplier={1.3}>{formatDate(c.created_at)}</Text>
                      </View>
                      <Text style={s.commentContent} maxFontSizeMultiplier={1.3}>{c.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Comment Input */}
          <View style={s.inputRow}>
            <TextInput
              style={s.textInput}
              placeholder="Write a reply..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={commentInput}
              onChangeText={setCommentInput}
              multiline
              maxFontSizeMultiplier={1.3}
            />
            <TouchableOpacity 
              style={[s.sendBtn, (!commentInput.trim() || submitting) && s.sendBtnDisabled]}
              onPress={handleSendComment}
              disabled={!commentInput.trim() || submitting}
            >
              <Text style={s.sendBtnText} maxFontSizeMultiplier={1.3}>{submitting ? '...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    backgroundColor: `${Colors.accent}0D`, // 0.05 alpha
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
  },
  spoilerTitle: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  spoilerAction: {
    color: Colors.accent,
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
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  likedText: {
    color: Colors.white,
  },
  spoilerIcon: {
    marginBottom: 8,
  },
  commentsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  commentsTitle: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
  },
  commentsList: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  noCommentsText: {
    color: Colors.text.secondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentContentWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUsername: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  commentDate: {
    color: Colors.text.secondary,
    fontSize: FontSize.xxs,
  },
  commentContent: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: Colors.white,
    fontSize: FontSize.sm,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.overlay.light10,
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: Colors.secondary,
    borderLeftColor: Colors.accent,
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
