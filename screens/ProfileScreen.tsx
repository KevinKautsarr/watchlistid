import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';


// Inline base64 to ArrayBuffer decoder to replace missing dependency
function decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

import { supabase, typedFrom } from '../supabase';
import { UserProfile, FetchState } from '../types';

import {
  ArrowLeft, SearchX, Settings as SettingsIcon,
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cursorPointer } from '../utils/webStyles';
import DiaryCard from '../components/movie/DiaryCard';
import MovieListItem from '../components/movie/MovieListItem';
import ImageCropModal from '../components/common/ImageCropModal';
import SettingsSheet from '../components/settings/SettingsSheet';

// New specialized components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileActions from '../components/profile/ProfileActions';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileEditModal from '../components/profile/ProfileEditModal';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 70 },
  topBarLeft: { width: 80, alignItems: 'flex-start' },
  topBarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  topBarRight: { width: 80, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.lg },
  topBarTitle: { color: Colors.white, fontSize: FontSize.xxl, fontWeight: FontWeight.black, letterSpacing: -0.5 },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black, marginTop: 20 },
  errorSub: { color: Colors.text.secondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  retryBtn: { marginTop: 30, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: Colors.overlay.light30, textAlign: 'center' },
});

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user, profile, refreshProfile, signOut } = useAuth();

  const { watchlist } = useWatchlist();
  const { 
    userLogs, getFollowStatus, followUser, unfollowUser, 
  } = useSocial();

  
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;
  const [targetProfile, setTargetProfile] = useState<FetchState<UserProfile>>({
    status: 'idle',
    data: null,
    error: null
  });

  const [activeTab, setActiveTab] = useState<ContentTab>('Diary');

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
    const { count: fers } = await typedFrom('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
    setFollowers(fers || 0);
    const { count: fing } = await typedFrom('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
    setFollowing(fing || 0);
    if (!isOwner && user) {
      const status = await getFollowStatus(targetUserId);
      setIsFollowing(status);
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

  const handleSaveProfile = async (data: { username: string; bio: string }) => {
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

  const handleUpdateAvatar = async (uri: string) => {
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

  if (targetProfile.status === 'error') {
    return (
      <View style={s.errorContainer}>
        <SearchX size={48} color={Colors.primary} />
        <Text style={s.errorTitle}>{t('profileNotFound')}</Text>
        <Text style={s.errorSub}>{t('profileNotFoundDesc')}</Text>
        <TouchableOpacity style={[s.retryBtn, cursorPointer]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('goBack')}>
          <Text style={s.retryBtnText}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileData = targetProfile.data;
  const userLogsList = userLogs.filter((l: any) => l.user_id === targetUserId);
  const watchedMovies = watchlist.filter(m => m.status === 'completed');
  const watchlistMovies = watchlist.filter(m => m.status === 'plan_to_watch');


  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <View style={[s.topBar, { paddingTop: insets.top }]}>
        <View style={s.topBarLeft}>
          {!isOwner && (
            <TouchableOpacity onPress={() => router.back()} style={cursorPointer} accessibilityRole="button" accessibilityLabel="Go back">
              <ArrowLeft color={Colors.white} size={IconSize.md} />
            </TouchableOpacity>
          )}
        </View>
        <View style={s.topBarCenter}>
          <Text style={s.topBarTitle} allowFontScaling={false}>
            {isOwner ? t('profile') : profileData?.username}
          </Text>
        </View>

        <View style={s.topBarRight}>
          {isOwner && (
            <TouchableOpacity onPress={() => setShowSettingsSheet(true)} style={cursorPointer} accessibilityRole="button" accessibilityLabel="Open settings">
              <SettingsIcon color={Colors.white} size={IconSize.md} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader 
          displayName={profileData?.username || 'User'} 
          avatarUrl={profileData?.avatar_url}
          bio={profileData?.bio}
          isOwner={isOwner}
        />

        <ProfileStats 
          followers={followers} 
          following={following} 
          watched={watchedMovies.length}
          onFollowersPress={() => {}}
          onFollowingPress={() => {}}
          t={t}
        />

        <ProfileActions 
          isOwner={isOwner}
          isFollowing={isFollowing}
          isFollowLoading={isFollowLoading}
          onFollowPress={handleFollow}
          onEditPress={() => setIsEditing(true)}
          t={t}
        />

        <View style={{ marginTop: Spacing.xl }}>
          <ProfileTabs 
            activeTab={activeTab}
            onTabPress={setActiveTab}
            counts={{
              diary: userLogsList.length,
              watched: watchedMovies.length,
              watchlist: watchlistMovies.length
            }}

          />
        </View>

        {/* Content Lists based on Active Tab */}
        <View style={{ paddingVertical: Spacing.lg }}>
          {activeTab === 'Diary' && (
            userLogsList.length > 0 ? (
              userLogsList.map((log: any) => <DiaryCard key={log.id} log={log} />)
            ) : (
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>{t('noLogsYet')}</Text>
              </View>
            )
          )}

          {activeTab === 'Watched' && (
            watchedMovies.length > 0 ? (
              watchedMovies.map(movie => (
                <MovieListItem 
                  key={movie.id} 
                  movie={movie} 
                  onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id.toString(), type: movie.mediaType } } as any)}

                />
              ))
            ) : (
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>{t('noWatchedYet')}</Text>
              </View>
            )
          )}
          {activeTab === 'Watchlist' && (
            watchlistMovies.length > 0 ? (
              watchlistMovies.map(movie => (
                <MovieListItem 
                  key={movie.id} 
                  movie={movie} 
                  onPress={() => router.push({ pathname: '/movie/[id]', params: { id: movie.id.toString(), type: movie.mediaType } } as any)}

                />
              ))
            ) : (
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>{t('noWatchlistYet')}</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {isOwner && (
        <ProfileEditModal 
          visible={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveProfile}
          initialData={{
            username: profileData?.username || '',
            bio: profileData?.bio || '',
            avatarUrl: profileData?.avatar_url || undefined
          }}
          onPickImage={handlePickImage}

          isSaving={isSaving}
          t={t}
        />
      )}

      <ImageCropModal 
        visible={showCropModal}
        imageUri={pickedImage || ''}
        onClose={() => setShowCropModal(false)}
        onSave={handleUpdateAvatar}
      />


      <SettingsSheet 
        visible={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        onLanguagePress={() => {
          // Language selection could be implemented here
          setShowSettingsSheet(false);
        }}
        onLogoutPress={async () => {
          await signOut();
          setShowSettingsSheet(false);
          router.replace('/auth/login');
        }}
      />


    </View>
  );
}
