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
    const trimmed = query.trim().toLowerCase();

    // Guard: no DB hit for very short queries
    if (trimmed.length < 2) return [];

    // Run both queries in parallel:
    //   username → prefix match only (fast, uses index)
    //   full_name → contains match (names need anywhere-match)
    const [byUsername, byFullName] = await Promise.all([
      typedFrom('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `${trimmed}%`)
        .order('username', { ascending: true })
        .limit(15),
      typedFrom('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('full_name', `%${trimmed}%`)
        .order('full_name', { ascending: true })
        .limit(10),
    ]);

    // Merge and deduplicate by id
    const combined = [
      ...(byUsername.data || []),
      ...(byFullName.data || []),
    ];
    const seen = new Set<string>();
    const unique = combined.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Rank results:
    //   Priority 1 → username starts exactly with query  (most relevant)
    //   Priority 2 → username contains query anywhere
    //   Priority 3 → only full_name matches
    //   Within each group → alphabetical by username
    const ranked = unique.sort((a, b) => {
      const ua = (a.username || '').toLowerCase();
      const ub = (b.username || '').toLowerCase();

      const rankA = ua.startsWith(trimmed) ? 0 : ua.includes(trimmed) ? 1 : 2;
      const rankB = ub.startsWith(trimmed) ? 0 : ub.includes(trimmed) ? 1 : 2;

      if (rankA !== rankB) return rankA - rankB;
      return ua.localeCompare(ub);
    });

    // Cap at 20 results
    return ranked.slice(0, 20) as UserProfile[];
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

    const { data: logs, error: logsError } = await typedFrom('movie_logs')
      .select('*')
      .in('user_id', followingIds)
      .order('watched_at', { ascending: false })
      .limit(30);

    if (logsError || !logs || logs.length === 0) return [];

    const userIds = Array.from(new Set(logs.map(l => l.user_id).filter((id): id is string => !!id)));
    const { data: profiles, error: profilesError } = await typedFrom('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (profilesError || !profiles) {
      return logs.map(l => ({ ...l, user: null })) as unknown as MovieLog[];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    return logs.map(l => {
      const uId = l.user_id;
      return {
        ...l,
        user: uId ? (profileMap.get(uId) || null) : null
      };
    }) as unknown as MovieLog[];
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
