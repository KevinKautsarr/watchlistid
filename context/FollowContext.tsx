import React, { createContext, useContext } from 'react';
import { typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, MovieLog } from '@/types';

interface FollowContextType {
  searchUsers: (query: string) => Promise<UserProfile[]>;
  followUser: (targetId: string) => Promise<boolean>;
  unfollowUser: (targetId: string) => Promise<boolean>;
  getFollowStatus: (targetId: string) => Promise<boolean>;
  getActivityFeed: () => Promise<MovieLog[]>;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const FollowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const searchUsers = async (query: string): Promise<UserProfile[]> => {
    if (!query.trim()) return [];
    const { data, error } = await typedFrom('profiles').select('id, username, avatar_url').ilike('username', `%${query}%`).limit(20);
    if (error) return [];
    return data as UserProfile[];
  };

  const followUser = async (targetId: string) => {
    if (!user || user.id === targetId) return false;
    const { error } = await typedFrom('follows').insert({ follower_id: user.id, following_id: targetId });
    return !error;
  };

  const unfollowUser = async (targetId: string) => {
    if (!user) return false;
    const { error } = await typedFrom('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    return !error;
  };

  const getFollowStatus = async (targetId: string) => {
    if (!user) return false;
    const { data, error } = await typedFrom('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle();
    return !!data && !error;
  };

  const getActivityFeed = async (): Promise<MovieLog[]> => {
    if (!user) return [];
    const { data: following } = await typedFrom('follows').select('following_id').eq('follower_id', user.id);
    const followingIds = following?.map(f => f.following_id) || [];
    if (followingIds.length === 0) return [];

    const { data, error } = await typedFrom('movie_logs')
      .select('*, user:profiles(username, avatar_url)')
      .in('user_id', followingIds)
      .order('watched_at', { ascending: false })
      .limit(30);

    if (error) return [];
    return data as unknown as MovieLog[];
  };

  return (
    <FollowContext.Provider value={{ searchUsers, followUser, unfollowUser, getFollowStatus, getActivityFeed }}>
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (context === undefined) throw new Error('useFollow must be used within a FollowProvider');
  return context;
};
