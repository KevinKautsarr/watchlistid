import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { supabase, typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { FetchState, UserProfile } from '@/types';

export const useProfileData = (userId: string | undefined) => {
  const { user, profile, refreshProfile } = useAuth();
  const { getFollowStatus, followUser, unfollowUser } = useSocial();

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;

  const [targetLogs, setTargetLogs] = useState<any[]>([]);
  const [targetWatchlist, setTargetWatchlist] = useState<any[]>([]);

  const [targetProfile, setTargetProfile] = useState<FetchState<UserProfile>>({
    status: 'idle',
    data: null,
    error: null
  });

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Social list states (Followers & Following list view)
  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [socialModalTab, setSocialModalTab] = useState<'followers' | 'following'>('followers');
  const [socialUsers, setSocialUsers] = useState<any[]>([]);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Fetch target user's data when viewing another user (runs once per targetUserId/isOwner change)
  useEffect(() => {
    if (!targetUserId) return;
    
    // Clear old data when user changes to prevent displaying stale content
    setTargetLogs([]);
    setTargetWatchlist([]);
    
    const fetchData = async () => {
      if (!isOwner) {
        setTargetProfile(prev => ({ ...prev, status: 'loading' }));
        try {
          const { data, error } = await typedFrom('profiles').select('id, username, avatar_url, bio').eq('id', targetUserId).single();
          if (data) {
            setTargetProfile({ 
              status: 'success', 
              data: { ...data, followers_count: 0, following_count: 0 } as UserProfile, 
              error: null 
            });
          } else if (error) {
            setTargetProfile({ status: 'error', data: null, error: error.message });
          }
        } catch (e) {
          setTargetProfile({ status: 'error', data: null, error: (e as Error).message });
        }
        fetchSocialStats();
        fetchUserContent();
      }
    };
    fetchData();
  }, [targetUserId, isOwner]);

  // Sync profile data when viewing own profile
  useEffect(() => {
    if (isOwner) {
      setTargetProfile({ 
        status: profile.status, 
        data: profile.data ? { ...profile.data, id: user?.id || '' } as UserProfile : null, 
        error: profile.error 
      });
      fetchSocialStats();
      fetchUserContent();
    }
  }, [isOwner, profile.status, profile.data, user?.id]);



  const fetchUserContent = async () => {
    if (!targetUserId) {
      console.log('[DEBUG useProfileData] No targetUserId provided to fetchUserContent');
      return;
    }
    try {
      console.log('[DEBUG useProfileData] fetchUserContent called with targetUserId:', targetUserId);
      const { data: logsData, error: logsError } = await typedFrom('movie_logs').select('*').eq('user_id', targetUserId).order('watched_at', { ascending: false });
      
      if (logsError) {
        console.error('[DEBUG useProfileData] movie_logs fetch error:', logsError);
      } else {
        console.log('[DEBUG useProfileData] movie_logs fetched successfully. Row count:', logsData?.length);
      }
      
      if (logsData) setTargetLogs(logsData);

      const { data: wlData, error: wlError } = await typedFrom('watchlist').select('*').eq('user_id', targetUserId).order('added_at', { ascending: false });
      if (wlError) console.error('Watchlist fetch error:', wlError);
      if (wlData) {
        // Map db format to app format temporarily for ProfileScreen
        const mappedWl = wlData.map((row: any) => ({
          id: row.movie_id,
          title: row.title,
          name: row.title,
          poster_path: row.poster_path,
          mediaType: row.media_type || 'movie',
          status: row.watched ? 'completed' : 'plan_to_watch',
          addedAt: row.added_at,
          vote_average: row.vote_average || 0
        }));
        setTargetWatchlist(mappedWl);
      }
    } catch (e) {
      console.error('Error fetching user content:', e);
    }
  };

  const fetchSocialStats = async () => {
    if (!targetUserId) return;
    try {
      const { count: fers } = await typedFrom('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
      setFollowers(fers || 0);
      const { count: fing } = await typedFrom('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
      setFollowing(fing || 0);
      if (!isOwner && user) {
        const status = await getFollowStatus(targetUserId);
        setIsFollowing(status);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchSocialList = async (tab: 'followers' | 'following') => {
    if (!targetUserId) return;
    setIsSocialLoading(true);
    try {
      let myFollowingIds: string[] = [];
      if (user) {
        const { data: myFollowing } = await typedFrom('follows').select('following_id').eq('follower_id', user.id);
        myFollowingIds = myFollowing?.map(f => f.following_id) || [];
      }

      if (tab === 'followers') {
        const { data: followsData, error: followsError } = await typedFrom('follows')
          .select('follower_id')
          .eq('following_id', targetUserId);
        
        if (followsError) {
          console.error('Followers query error:', followsError);
          setSocialUsers([]);
          return;
        }

        if (followsData && followsData.length > 0) {
          const followerIds = followsData.map(r => r.follower_id);
          const { data: profilesData, error: profilesError } = await typedFrom('profiles')
            .select('id, username, avatar_url')
            .in('id', followerIds);

          if (profilesError) {
            console.error('Profiles query error:', profilesError);
            setSocialUsers([]);
            return;
          }

          if (profilesData) {
            const mapped = profilesData.map((p: any) => ({
              id: p.id,
              username: p.username,
              avatar_url: p.avatar_url,
              is_following: myFollowingIds.includes(p.id)
            }));
            setSocialUsers(mapped);
          }
        } else {
          setSocialUsers([]);
        }
      } else {
        const { data: followsData, error: followsError } = await typedFrom('follows')
          .select('following_id')
          .eq('follower_id', targetUserId);

        if (followsError) {
          console.error('Following query error:', followsError);
          setSocialUsers([]);
          return;
        }

        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map(r => r.following_id);
          const { data: profilesData, error: profilesError } = await typedFrom('profiles')
            .select('id, username, avatar_url')
            .in('id', followingIds);

          if (profilesError) {
            console.error('Profiles query error:', profilesError);
            setSocialUsers([]);
            return;
          }

          if (profilesData) {
            const mapped = profilesData.map((p: any) => ({
              id: p.id,
              username: p.username,
              avatar_url: p.avatar_url,
              is_following: myFollowingIds.includes(p.id)
            }));
            setSocialUsers(mapped);
          }
        } else {
          setSocialUsers([]);
        }
      }
    } catch (e) {
      console.error('Error fetching social list:', e);
      setSocialUsers([]);
    } finally {
      setIsSocialLoading(false);
    }
  };

  const handleSocialFollowToggle = async (userIdToToggle: string) => {
    if (!user) return;
    const isCurrentlyFollowing = socialUsers.find(u => u.id === userIdToToggle)?.is_following;
    
    let success = false;
    if (isCurrentlyFollowing) {
      success = await unfollowUser(userIdToToggle);
    } else {
      success = await followUser(userIdToToggle);
    }

    if (success) {
      setSocialUsers(prev => prev.map(u => {
        if (u.id === userIdToToggle) {
          return { ...u, is_following: !isCurrentlyFollowing };
        }
        return u;
      }));
      fetchSocialStats();
    }
  };

  const handleFollow = async () => {
    if (!user || !targetUserId || isOwner || isFollowLoading) return;
    setIsFollowLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (isFollowing) {
        const success = await unfollowUser(targetUserId);
        if (success) {
          setIsFollowing(false);
          setFollowers(prev => Math.max(0, prev - 1));
        }
      } else {
        const success = await followUser(targetUserId);
        if (success) {
          setIsFollowing(true);
          setFollowers(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setShowCropModal(true);
    }
  };

  const handleSaveProfile = async (data: { username: string; bio: string }, t: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await typedFrom('profiles').update({
        username: data.username,
        bio: data.bio,
      }).eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Save error:', err);
      alert(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAvatar = async (uri: string, t: any) => {
    if (!user) return;
    setIsSaving(true);
    setUploadProgress(0);
    try {
      // 1. Kompres gambar menggunakan expo-image-manipulator (Universal Web/Native)
      // Kita ubah ukurannya menjadi max 400x400 untuk optimalisasi avatar & format JPEG/PNG
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. Baca file secara universal menjadi Blob menggunakan Fetch API
      const response = await fetch(manipResult.uri);
      const fileBlob = await response.blob();

      // 3. Validasi batas ukuran file (maksimal 5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5 Megabytes
      if (fileBlob.size > MAX_SIZE) {
        throw new Error('Ukuran gambar terlalu besar (maksimal 5MB).');
      }

      // 4. Deteksi Content-Type dan ekstensi file secara dinamis
      const contentType = fileBlob.type || 'image/jpeg';
      const fileExt = contentType === 'image/png' ? 'png' : 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // 5. Upload ke Supabase Storage dengan memantau progress
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBlob, {
          contentType,
          upsert: true,
          onUploadProgress: (progress: any) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percentage));
          }
        } as any);

      if (uploadError) throw uploadError;

      // 6. Dapatkan URL publik baru dan perbarui tabel profil
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await typedFrom('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      setShowCropModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Avatar update error:', err);
      alert(err.message || t('avatarError'));
    } finally {
      setIsSaving(false);
      setUploadProgress(100);
    }
  };

  return {
    isOwner,
    targetUserId,
    targetProfile,
    followers,
    following,
    isFollowing,
    isFollowLoading,
    isEditing, setIsEditing,
    isSaving,
    pickedImage, setPickedImage,
    showCropModal, setShowCropModal,
    showSettingsSheet, setShowSettingsSheet,
    uploadProgress,
    handleFollow,
    handlePickImage,
    handleSaveProfile,
    handleUpdateAvatar,
    targetLogs,
    targetWatchlist,
    // Social Modal Exports
    socialModalVisible, setSocialModalVisible,
    socialModalTab, setSocialModalTab,
    socialUsers,
    isSocialLoading,
    fetchSocialList,
    handleSocialFollowToggle
  };
};
