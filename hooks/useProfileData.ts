import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { supabase, typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { FetchState, UserProfile } from '@/types';
import { decodeBase64ToArrayBuffer } from '@/utils/base64';

export const useProfileData = (userId: string | undefined) => {
  const { user, profile, refreshProfile } = useAuth();
  const { getFollowStatus, followUser, unfollowUser } = useSocial();

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;

  const [targetLogs, setTargetLogs] = useState<any[]>([]);
  const [targetWatchlist, setTargetWatchlist] = useState<any[]>([]);
  const [targetReviews, setTargetReviews] = useState<any[]>([]);

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
    setTargetReviews([]);
    
    const fetchData = async () => {
      if (!isOwner) {
        setTargetProfile(prev => ({ ...prev, status: 'loading' }));
        try {
          const { data, error } = await typedFrom('profiles').select('id, username, full_name, avatar_url, bio').eq('id', targetUserId).single();
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



  const fetchUserContent = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const { data: logsData, error: logsError } = await typedFrom('movie_logs').select('*').eq('user_id', targetUserId).order('watched_at', { ascending: false });

      if (logsError) {
        console.error('movie_logs fetch error:', logsError);
      }

      if (logsData) {
        const uniqueLogs: any[] = [];
        const seen = new Set<number>();
        for (const item of logsData) {
          if (!seen.has(item.movie_id)) {
            seen.add(item.movie_id);
            uniqueLogs.push(item);
          }
        }
        setTargetLogs(uniqueLogs);
      }

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

      // Fetch target user's reviews
      const { data: reviewsData, error: reviewsError } = await typedFrom('reviews')
        .select('*, user:profiles(username, avatar_url)')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('reviews fetch error:', reviewsError);
      } else if (reviewsData) {
        // Map each review to find its movie title and poster from logs
        const mappedReviews = reviewsData.map((r: any) => {
          const matchingLog = logsData?.find(l => l.movie_id === r.movie_id);
          const matchingWl = wlData?.find(w => w.movie_id === r.movie_id);
          return {
            ...r,
            movie_title: matchingLog?.movie_title || matchingWl?.title || `Movie #${r.movie_id}`,
            poster_path: matchingLog?.poster_path || matchingWl?.poster_path || null,
            review_text: r.content,
            watched_at: matchingLog?.watched_at || r.created_at,
          };
        });
        setTargetReviews(mappedReviews);
      }
    } catch (e) {
      console.error('Error fetching user content:', e);
    }
  }, [targetUserId]);

  const fetchSocialStats = useCallback(async () => {
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
  }, [targetUserId, isOwner, user, getFollowStatus]);

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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPickedImage(result.assets[0].uri);
      setShowCropModal(true);
    }
  };

  const handleSaveProfile = async (data: { username: string; full_name: string; bio: string }, t: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await typedFrom('profiles').update({
        username: data.username,
        full_name: data.full_name || null,
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
      // 2. Baca data file secara universal sebagai Blob di Web dan ArrayBuffer di Native (menghindari bug Blob di React Native)
      let fileData: Blob | ArrayBuffer;
      let contentType = 'image/jpeg';
      const MAX_SIZE = 5 * 1024 * 1024; // 5 Megabytes

      if (Platform.OS === 'web') {
        const response = await fetch(manipResult.uri);
        fileData = await response.blob();
        contentType = 'image/jpeg';
      } else {
        const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
          encoding: 'base64',
        });
        fileData = decodeBase64ToArrayBuffer(base64);
        
        // Deteksi tipe konten dari uri manipulasi jika memungkinkan
        if (manipResult.uri.toLowerCase().endsWith('.png')) {
          contentType = 'image/png';
        }
      }

      // 3. Validasi batas ukuran file
      const fileSize = Platform.OS === 'web' ? (fileData as Blob).size : (fileData as ArrayBuffer).byteLength;
      if (fileSize > MAX_SIZE) {
        throw new Error('Ukuran gambar terlalu besar (maksimal 5MB).');
      }

      // 4. Deteksi ekstensi file secara dinamis
      const fileExt = contentType === 'image/png' ? 'png' : 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('--- Submitting Upload to Supabase Storage ---');
      console.log('File Name:', fileName);
      console.log('File Size (bytes):', fileSize);
      console.log('Content Type:', contentType);
      console.log('Platform:', Platform.OS);
      console.log('File Data Instance:', fileData?.constructor?.name);

      // 5. Upload ke Supabase Storage dengan memantau progress
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileData, {
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
      console.error('Avatar update error detail:', JSON.stringify(err, null, 2));
      console.error('Avatar update error object:', err);
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
    targetReviews,
    fetchUserContent,
    fetchSocialStats,
    // Social Modal Exports
    socialModalVisible, setSocialModalVisible,
    socialModalTab, setSocialModalTab,
    socialUsers,
    isSocialLoading,
    fetchSocialList,
    handleSocialFollowToggle
  };
};
