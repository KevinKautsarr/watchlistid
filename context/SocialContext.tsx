import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, typedFrom } from '../supabase';
import { useAuth } from './AuthContext';
import { MovieLog, UserProfile } from '../types';
import { ReviewItem } from '../types/review';
import Toast from '../components/common/Toast';

interface SocialContextType {
  userLogs: MovieLog[];
  loadingLogs: boolean;
  addLog: (log: Omit<MovieLog, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => Promise<boolean>;
  getUserLogs: (userId: string) => Promise<MovieLog[]>;
  deleteLog: (logId: string) => Promise<boolean>;
  refreshLogs: () => Promise<void>;
  getReviews: (movieId: number) => Promise<ReviewItem[]>;
  addReview: (review: Omit<ReviewItem, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => Promise<boolean>;
  toggleLikeReview: (reviewId: string) => Promise<boolean>;
  
  // Social Engine
  searchUsers: (query: string) => Promise<UserProfile[]>;
  followUser: (targetId: string) => Promise<boolean>;
  unfollowUser: (targetId: string) => Promise<boolean>;
  getActivityFeed: () => Promise<MovieLog[]>;
  getFollowStatus: (targetId: string) => Promise<boolean>;
  getAverageRating: (movieId: number) => Promise<{ average: number; count: number }>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userLogs, setUserLogs] = useState<MovieLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; title?: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, title, message, type });
  };

  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const fetchMyLogs = useCallback(async () => {
    if (!user) {
      setUserLogs([]);
      return;
    }
    setLoadingLogs(true);
    const { data, error } = await typedFrom('movie_logs')
      .select('id,movie_id,movie_title,poster_path,watched_at,rating,review_text,is_spoiler,created_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUserLogs(data as MovieLog[]);
    }
    setLoadingLogs(false);
  }, [user]);

  useEffect(() => {
    fetchMyLogs();
  }, [fetchMyLogs]);

  const addLog = async (logData: Omit<MovieLog, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => {
    if (!user) {
      showToast('Error', 'You must be logged in to log a movie.', 'error');
      return false;
    }

    try {
      // Ensure watched_at is a valid ISO string for Postgres timestamp
      const formattedDate = new Date(logData.watched_at || new Date()).toISOString();

      // Destructure to separate media_type in case it's not in the DB schema
      const { media_type, ...otherLogData } = logData;

      const { error } = await typedFrom('movie_logs')
        .insert({
          user_id: user.id,
          ...otherLogData,
          watched_at: formattedDate,
        } as any);

      if (error) {
        console.error('Supabase Insert Error:', error);
        
        // If error is related to foreign key, user might not have a profile record
        if (error.code === '23503') {
          showToast('Profile Error', 'Your user profile is not fully set up. Please try again later.', 'error');
        } else {
          showToast('Failed', error.message || 'An error occurred while saving your log.', 'error');
        }
        return false;
      }

      showToast('Success', 'Movie log saved successfully!', 'success');
      fetchMyLogs(); // Refresh logs
      return true;
    } catch (err: any) {
      console.error('Logic Error adding log:', err);
      showToast('Error', err.message || 'Failed to process log data.', 'error');
      return false;
    }
  };

  const getUserLogs = async (userId: string): Promise<MovieLog[]> => {
    const { data, error } = await supabase
      .from('movie_logs')
      .select('id, movie_id, movie_title, poster_path, watched_at, rating, review_text, is_spoiler, created_at')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }
    return data as MovieLog[];
  };

  const deleteLog = async (logId: string) => {
    if (!user) return false;
      const { error } = await typedFrom('movie_logs').delete().eq('id', logId).eq('user_id', user.id);

    if (error) {
      showToast('Failed', 'Could not delete log.', 'error');
      return false;
    }
    
    showToast('Success', 'Log deleted successfully.', 'success');
    setUserLogs(prev => prev.filter(l => l.id !== logId));
    return true;
  };

  const getReviews = async (movieId: number): Promise<ReviewItem[]> => {
    const { data, error } = await typedFrom('reviews')
      .select(`
        *,
        user:profiles(username, avatar_url),
        likes_count:review_likes(count)
      `)
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    // Check if liked by me
    let likedByMeIds: string[] = [];
    if (user) {
      const { data: likes } = await typedFrom('review_likes')
        .select('review_id')
        .eq('user_id', user.id);
      likedByMeIds = likes?.map(l => l.review_id) || [];
    }

    return (data as any[]).map(r => ({
      ...r,
      likes_count: r.likes_count?.[0]?.count || 0,
      is_liked_by_me: likedByMeIds.includes(r.id)
    })) as ReviewItem[];
  };

  const addReview = async (reviewData: Omit<ReviewItem, 'id' | 'created_at' | 'user_id' | 'user' | 'likes_count' | 'is_liked_by_me'>) => {
    if (!user) return false;
    
    const { error } = await typedFrom('reviews').upsert({
      ...reviewData,
      user_id: user.id,
      created_at: new Date().toISOString()
    } as any);

    if (error) {
      console.error('Error saving review:', error);
      return false;
    }
    return true;
  };

  const toggleLikeReview = async (reviewId: string) => {
    if (!user) return false;

    // Check if already liked
    const { data: existingLike } = await typedFrom('review_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('review_id', reviewId)
      .single();

    if (existingLike) {
      const { error } = await typedFrom('review_likes')
        .delete()
        .eq('id', existingLike.id);
      return !error;
    } else {
      const { error } = await typedFrom('review_likes')
        .insert({
          user_id: user.id,
          review_id: reviewId
        } as any);
      return !error;
    }
  };

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query.trim()) return [];
    const { data, error } = await typedFrom('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }
    return data as UserProfile[];
  };

  const followUser = async (targetId: string) => {
    if (!user || user.id === targetId) return false;
    const { error } = await typedFrom('follows').insert({
      follower_id: user.id,
      following_id: targetId
    } as any);

    if (error) {
      console.error('Error following user:', error);
      return false;
    }
    return true;
  };

  const unfollowUser = async (targetId: string) => {
    if (!user) return false;
    const { error } = await typedFrom('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
    return true;
  };

  const getFollowStatus = async (targetId: string) => {
    if (!user) return false;
    const { data, error } = await typedFrom('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', targetId)
      .single();

    return !!data && !error;
  };

  const getActivityFeed = async (): Promise<MovieLog[]> => {
    if (!user) return [];

    // 1. Get list of followed user IDs
    const { data: following } = await typedFrom('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map(f => f.following_id) || [];
    if (followingIds.length === 0) return [];

    // 2. Get logs from those users
    const { data: logs, error } = await typedFrom('movie_logs')
      .select(`
        *,
        user:profiles(username, avatar_url)
      `)
      .in('user_id', followingIds)
      .order('watched_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
    return logs as unknown as MovieLog[];
  };

  const getAverageRating = async (movieId: number) => {
    const { data, error } = await typedFrom('reviews')
      .select('rating')
      .eq('movie_id', movieId);

    if (error || !data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const ratings = data.map(r => r.rating).filter((r): r is number => r !== null);
    if (ratings.length === 0) return { average: 0, count: 0 };

    const sum = ratings.reduce((acc, curr) => acc + curr, 0);
    const average = sum / ratings.length;

    return { average, count: ratings.length };
  };

  return (
    <SocialContext.Provider value={{
      userLogs,
      loadingLogs,
      addLog,
      getUserLogs,
      deleteLog,
      refreshLogs: fetchMyLogs,
      getReviews,
      addReview,
      toggleLikeReview,
      searchUsers,
      followUser,
      unfollowUser,
      getFollowStatus,
      getActivityFeed,
      getAverageRating
    }}>
      {children}
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={hideToast} 
      />
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (context === undefined) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
