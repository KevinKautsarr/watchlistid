import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { supabase, typedFrom } from '@/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSocial } from '@/context/SocialContext';
import { FetchState, UserProfile } from '@/types';

// Inline base64 to ArrayBuffer decoder to replace missing dependency
function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const useProfileData = (userId: string | undefined) => {
  const { user, profile, refreshProfile } = useAuth();
  const { getFollowStatus, followUser, unfollowUser } = useSocial();

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;

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

  useEffect(() => {
    if (!targetUserId) return;
    const fetchData = async () => {
      if (!isOwner) {
        setTargetProfile(prev => ({ ...prev, status: 'loading' }));
        try {
          const { data, error } = await typedFrom('profiles').select('id, username, avatar_url, bio').eq('id', targetUserId).single();
          if (data) setTargetProfile({ status: 'success', data: { ...data, followers_count: 0, following_count: 0 } as UserProfile, error: null });
          else if (error) setTargetProfile({ status: 'error', data: null, error: error.message });
        } catch (e) {
          setTargetProfile({ status: 'error', data: null, error: (e as Error).message });
        }
      } else {
        setTargetProfile({ 
          status: profile.status, 
          data: profile.data ? { ...profile.data, id: user?.id || '' } as UserProfile : null, 
          error: profile.error 
        });
      }
      fetchSocialStats();
    };
    fetchData();
  }, [targetUserId, isOwner, profile.status, profile.data]);

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
    try {
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await typedFrom('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      setShowCropModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Avatar update error:', err);
      alert(t('avatarError'));
    } finally {
      setIsSaving(false);
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
    handleFollow,
    handlePickImage,
    handleSaveProfile,
    handleUpdateAvatar
  };
};
