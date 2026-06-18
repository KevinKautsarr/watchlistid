import React, { createContext, useContext, useState } from 'react';
import { supabase, typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ReviewItem, CommentItem } from '@/types/review';
import Toast from '@/components/common/Toast';

interface ReviewContextType {
  getReviews: (movieId: number) => Promise<ReviewItem[]>;
  addReview: (review: Omit<ReviewItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => Promise<boolean>;
  toggleLikeReview: (reviewId: string) => Promise<boolean>;
  getComments: (reviewId: string) => Promise<CommentItem[]>;
  addComment: (reviewId: string, content: string) => Promise<boolean>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({ visible: true, message, type });
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const getReviews = async (movieId: number): Promise<ReviewItem[]> => {
    const { data, error } = await typedFrom('reviews')
      .select('*, user:profiles(username, avatar_url), likes_count:review_likes(count)')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) return [];

    let likedByMeIds: string[] = [];
    if (user) {
      const { data: likes } = await typedFrom('review_likes').select('review_id').eq('user_id', user.id);
      likedByMeIds = likes?.map(l => l.review_id) || [];
    }

    return (data || []).map(r => {
      const row = r as any; // Temporary cast for nested join data which is complex for Supabase types
      return {
        ...row,
        likes_count: row.likes_count?.[0]?.count || 0,
        is_liked_by_me: likedByMeIds.includes(row.id)
      } as ReviewItem;
    });
  };

  const addReview = async (reviewData: Omit<ReviewItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => {
    if (!user) return false;
    const { error } = await typedFrom('reviews').upsert({
      movie_id: reviewData.movie_id,
      media_type: reviewData.media_type,
      content: reviewData.content,
      rating: reviewData.rating,
      is_spoiler: reviewData.is_spoiler,
      user_id: user.id,
      created_at: new Date().toISOString()
    });

    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    showToast(t('toastReviewAdded'), 'success');
    return true;
  };

  const toggleLikeReview = async (reviewId: string) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc('toggle_review_like', { p_review_id: reviewId });
    if (error) return false;
    return data as boolean;
  };

  const getComments = async (reviewId: string): Promise<CommentItem[]> => {
    const { data, error } = await supabase
      .from('review_comments')
      .select('*, user:profiles(username, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getComments error:', error);
      return [];
    }
    return (data || []) as CommentItem[];
  };

  const addComment = async (reviewId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('review_comments')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        content: content.trim()
      });

    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    showToast(t('toastCommentAdded'), 'success');
    return true;
  };

  return (
    <ReviewContext.Provider value={{ getReviews, addReview, toggleLikeReview, getComments, addComment }}>
      {children}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (context === undefined) throw new Error('useReviews must be used within a ReviewProvider');
  return context;
};
