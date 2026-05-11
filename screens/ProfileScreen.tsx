import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, TextInput, ActivityIndicator, Modal, Share, StatusBar,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase, typedFrom } from '../supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, FetchState } from '../types';
import {
  Bell, Globe, Share2, Info, ChevronRight, Star, Film, Eye,
  LogOut, Edit3, Camera, Check, X, BookOpen, Clock, Trash2, UserPlus, UserMinus,
  LayoutGrid, Play, Bookmark, Menu, Plus, ChevronDown, 
  Settings as SettingsIcon, AtSign, Search, ArrowLeft
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DiaryCard from '../components/movie/DiaryCard';
import MovieListItem from '../components/movie/MovieListItem';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import LanguageSheet from '../components/settings/LanguageSheet';
import SocialListSheet from '../components/settings/SocialListSheet';
import SettingsSheet from '../components/settings/SettingsSheet';
import ImageCropModal from '../components/common/ImageCropModal';
import Avatar from '../components/common/Avatar';

type ContentTab = 'Diary' | 'Watched' | 'Watchlist';

const { width } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  /* IG Style Top Bar */
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, height: 70 },
  topBarLeft: { width: 80, alignItems: 'flex-start' },
  topBarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  topBarRight: { width: 80, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  topBarTitle: { color: Colors.white, fontSize: 20, fontWeight: FontWeight.black, letterSpacing: -0.5 },
  topBarIcon: { padding: 4 },
  headerBadge: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.background },

  /* Hero Redesign */
  /* Hero Upgrade */
  heroContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'center' },
  heroEditCard: { backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: Radius.xxl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingVertical: Spacing.xl },
  avatarContainer: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  avatarEditGlow: { borderColor: Colors.primary, borderWidth: 2 },
  avatarImg: { width: '100%', height: '100%' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  
  identityBox: { alignItems: 'center', marginTop: 12, width: '100%' },
  editFields: { width: '100%', gap: 16, paddingHorizontal: Spacing.md },
  inputGroup: { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { color: Colors.primary, fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
  charCount: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: FontWeight.bold },
  
  displayName: { color: '#fff', fontSize: FontSize.xxl, fontWeight: FontWeight.black, letterSpacing: -0.5, textAlign: 'center' },
  nameInput: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingVertical: 8, textAlign: 'center' },
  
  bioText: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  bioInput: { color: 'rgba(255,255,255,0.9)', fontSize: FontSize.sm, lineHeight: 22, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, textAlign: 'center', minHeight: 44 },
  bioPlaceholder: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.sm, fontStyle: 'italic', marginTop: 6 },

  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 24, width: '100%' },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: FontWeight.bold, textTransform: 'uppercase' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24, width: '100%' },
  primaryBtn: { flex: 1, height: 36, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  secondaryBtn: { flex: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },

  /* Tabs */
  tabBar: { flexDirection: 'row', marginBottom: 2, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.white },
  tabLabel: { display: 'none' },
  tabLabelActive: {},
  tabIconWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, minWidth: 20, paddingVertical: 2, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(229,9,20,0.2)' },
  tabBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.6)' },
  tabBadgeTextActive: { color: Colors.primary },



  content: { paddingHorizontal: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.2 },
  sectionCount: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: FontWeight.bold },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalCard: { width: '100%', maxWidth: 320, backgroundColor: '#1C1C1E', borderRadius: Radius.xxl, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(220,53,69,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  btnSecondary: { flex: 1, height: 48, borderRadius: Radius.lg, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white },
  btnDanger: { flex: 1, height: 48, borderRadius: Radius.lg, backgroundColor: '#DC3545', justifyContent: 'center', alignItems: 'center' },
  btnDangerText: { fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white },

  socialUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  socialUserAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  socialUserName: { flex: 1, color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.medium },
});

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { watchlist, toggleWatched, removeFromWatchlist, userRatings, isLoading: loadingWatchlist } = useWatchlist();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { t } = useLanguage();
  const { userLogs, deleteLog, loadingLogs, followUser, unfollowUser, getFollowStatus } = useSocial();
  const { unreadCount } = useNotifications();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('Diary');
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [isSocialModalVisible, setIsSocialModalVisible] = useState(false);
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following'>('followers');
  const [socialList, setSocialList] = useState<FetchState<UserProfile[]>>({
    status: 'idle',
    data: [],
    error: null
  });

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;
  const [targetProfile, setTargetProfile] = useState<FetchState<UserProfile>>({
    status: 'idle',
    data: null,
    error: null
  });

  useEffect(() => {
    if (!targetUserId) return;
    const fetchData = async () => {
      setTargetProfile(prev => ({ ...prev, status: 'loading' }));
      if (!isOwner) {
        try {
          const { data, error } = await typedFrom('profiles').select('id, username, avatar_url, bio, followers_count, following_count').eq('id', targetUserId).single();
          if (data) setTargetProfile({ status: 'success', data: data as UserProfile, error: null });
          else if (error) setTargetProfile({ status: 'error', data: null, error: error.message });
        } catch (e) {
          setTargetProfile({ status: 'error', data: null, error: (e as Error).message });
        }
      } else {
        setTargetProfile({ status: 'success', data: profile as UserProfile, error: null });
      }
      fetchSocialStats();
    };
    fetchData();
  }, [targetUserId, isOwner, profile]);

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

  const fetchSocialList = async (type: 'followers' | 'following') => {
    if (!targetUserId) return;
    setSocialModalType(type);
    setIsSocialModalVisible(true);
    setSocialList(prev => ({ ...prev, status: 'loading', data: [] }));
    try {
      const column = type === 'followers' ? 'follower_id' : 'following_id';
      const filterColumn = type === 'followers' ? 'following_id' : 'follower_id';
      const { data, error } = await typedFrom('follows').select(`${column}, profiles:${column} (id, username, avatar_url, bio)`).eq(filterColumn, targetUserId);
      if (data) {
        let users = data.map((item: any) => item.profiles).filter((u): u is UserProfile => !!u);
        if (user) {
          const { data: myFollows } = await typedFrom('follows').select('following_id').eq('follower_id', user.id);
          const myFollowingIds = new Set((myFollows as { following_id: string }[])?.map(f => f.following_id) || []);
          users = users.map(u => ({ ...u, is_following: myFollowingIds.has(u.id) }));
        }
        setSocialList({ status: 'success', data: users, error: null });
      } else if (error) {
        setSocialList({ status: 'error', data: [], error: error.message });
      }
    } catch (err) {
      console.error('Fetch list error:', err);
      setSocialList({ status: 'error', data: [], error: (err as Error).message });
    }
  };

  const handleToggleFollowFromList = async (userId: string) => {
    if (!user || user.id === userId || !socialList.data) return;
    
    // Optimistic update
    setSocialList(prev => ({
      ...prev,
      data: prev.data?.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u) || []
    }));

    try {
      const isCurrentlyFollowing = socialList.data.find(u => u.id === userId)?.is_following;
      if (isCurrentlyFollowing) {
        await typedFrom('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      } else {
        await typedFrom('follows').insert({ follower_id: user.id, following_id: userId } as any);
      }
      fetchSocialStats();
    } catch (err) {
      // Rollback on error
      setSocialList(prev => ({
        ...prev,
        data: prev.data?.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u) || []
      }));
      console.error('Toggle follow list error:', err);
    }
  };

  const profileData = targetProfile.data;
  const displayName = profileData?.username || (isOwner ? (user?.user_metadata?.username || user?.email?.split('@')[0]) : 'User') || 'Movie Fan';
  const avatarUrl = profileData?.avatar_url || (isOwner ? user?.user_metadata?.avatar_url : null);
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const displayBio = profileData?.bio ?? '';

  const watched = watchlist.filter(m => m.status === 'completed').length;
  const total = watchlist.length;
  const toWatch = total - watched;

  useEffect(() => {
    // Only initialize fields when entering edit mode, not on every profile change
    // to avoid resetting user input while they are typing or cropping.
    if (!isEditing) {
      setEditName(displayName);
      setEditAvatar(avatarUrl || '');
      setEditBio(displayBio);
    }
  }, [displayName, avatarUrl, displayBio, isEditing]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, 
        quality: 1, 
      });
      
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPickedImage(result.assets[0].uri);
        setShowCropModal(true);
      }
    } catch (e) {
      console.error('Pick image error:', e);
    }
  };

  const handleCropSave = (croppedUri: string) => {
    setEditAvatar(croppedUri);
    setShowCropModal(false);
    setPickedImage(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setPickedImage(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const finalAvatar = editAvatar.trim() || null;
      await supabase.auth.updateUser({ data: { username: editName, avatar_url: finalAvatar } });
      await typedFrom('profiles').update({ username: editName, avatar_url: editAvatar, bio: editBio } as any).eq('id', user.id);
      
      // Instantly refresh the local context to update UI without reload
      await refreshProfile();
      
      setIsEditing(false);
    } finally { setIsSaving(false); }
  };

  const handleCancel = () => { setEditName(displayName); setEditAvatar(avatarUrl || ''); setEditBio(displayBio); setIsEditing(false); };
  const handleSignOut = async () => { await signOut(); router.replace('/auth/login' as any); };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({ message: `Check out my movie journey on WATCHLISTID! I've watched ${watched} films. 🎬`, title: 'My WATCHLISTID Profile' });
  };

  const handleExport = async () => {
    if (!isOwner || isSaving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // 1. Check if dependencies are loaded
      if (Platform.OS !== 'web' && (!FileSystem || !Sharing)) {
        alert('Storage components are not ready. Please restart the app.');
        return;
      }

      // 2. Prepare Professional CSV Structure
      let csvContent = `WATCHLISTID - PROFILE EXPORT\n`;
      csvContent += `Username: ${displayName}\n`;
      csvContent += `Export Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      csvContent += `\n`;
      csvContent += `--- STATISTICS ---\n`;
      csvContent += `Total Diary Entries: ${userLogs.length}\n`;
      csvContent += `Total Watchlist Items: ${watchlist.length}\n`;
      csvContent += `  - Watched: ${watched}\n`;
      csvContent += `  - To Watch: ${toWatch}\n`;
      csvContent += `\n`;
      csvContent += `--- MOVIE LIST ---\n`;
      csvContent += 'No,Category,Title,Year,Rating,Date,Media Type,Review\n';
      
      let rowNum = 1;

      // 3. Add Diary Logs (userLogs)
      if (userLogs && Array.isArray(userLogs)) {
        userLogs.forEach(log => {
          try {
            const title = String(log.movie_title || 'Unknown').replace(/"/g, '""');
            const review = String(log.review_text || '').replace(/"/g, '""').replace(/\n/g, ' ');
            const rating = log.rating ? `"${log.rating}/10"` : '""';
            const date = log.watched_at ? `"${new Date(log.watched_at).toLocaleDateString()}"` : '""';
            csvContent += `${rowNum++},Diary,"${title}",,${rating},${date},${log.media_type || 'movie'},"${review}"\n`;
          } catch (e) {
            console.warn('Skipping log entry:', e);
          }
        });
      }
      
      // 4. Add Watchlist/Watched Items
      if (watchlist && Array.isArray(watchlist)) {
        watchlist.forEach(item => {
          try {
            const itemTitle = item.mediaType === 'movie' ? item.title : item.name;
            const title = String(itemTitle || 'Unknown').replace(/"/g, '""');
            const status = item.status === 'completed' ? 'Watched' : 'To Watch';
            const releaseDate = item.mediaType === 'movie' ? item.release_date : item.first_air_date;
            const year = releaseDate ? releaseDate.substring(0, 4) : '""';
            const ratingValue = userRatings[item.id];
            const rating = ratingValue ? `"${ratingValue}/10"` : '""';
            const date = item.addedAt ? `"${new Date(item.addedAt).toLocaleDateString()}"` : '""';
            csvContent += `${rowNum++},${status},"${title}",${year},${rating},${date},${item.mediaType},""\n`;
          } catch (e) {
            console.warn('Skipping watchlist item:', e);
          }
        });
      }

      // 5. Create and Export File
      const fileName = `watchlistid_export_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        // WEB: Use Blob and hidden anchor element for download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // NATIVE: Use FileSystem and Sharing API
        const fileUri = ((FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '') + fileName;
        
        // Default encoding is UTF8
        await FileSystem.writeAsStringAsync(fileUri, csvContent);
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export your WatchlistID data',
            UTI: 'public.comma-separated-values-text'
          });
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (error: any) {
      console.error('Export error details:', error);
      alert(`Export failed: ${error.message || 'Unknown error'}`);
    }
  };

  const TABS: { id: ContentTab; label: string; Icon: any; count: number }[] = [
    { id: 'Diary', label: t('diary'), Icon: LayoutGrid, count: userLogs.length },
    { id: 'Watched', label: t('watched'), Icon: Play, count: watched },
    { id: 'Watchlist', label: t('toWatch'), Icon: Bookmark, count: toWatch },
  ];

  const currentAvatarUrl = isEditing ? editAvatar : avatarUrl;
  const activeTabInfo = TABS.find(t => t.id === activeTab);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={s.topBarLeft}>
            {!isOwner ? (
              <TouchableOpacity onPress={() => router.back()} style={s.topBarIcon}>
                <ArrowLeft size={24} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => router.push('/search-users' as any)} style={s.topBarIcon}>
                <Search size={24} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <View style={s.topBarCenter}>
            <Text style={s.topBarTitle} allowFontScaling={false}>
              {isOwner ? t('profile') : profileData?.username || t('profile')}
            </Text>
          </View>
          <View style={s.topBarRight}>
            {isOwner && (
              <TouchableOpacity style={s.topBarIcon} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettingsSheet(true); }}>
                <Menu size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[s.heroContainer, isEditing && s.heroEditCard]}>
          <TouchableOpacity 
            style={[s.avatarContainer, isEditing && s.avatarEditGlow]} 
            activeOpacity={isEditing ? 0.8 : 1} 
            onPress={isEditing ? handlePickImage : undefined}
          >
            <Avatar 
              uri={currentAvatarUrl} 
              name={displayName} 
              size={86} 
              style={s.avatarImg} 
              priority="high"
            />
            {isEditing && (
              <View style={s.cameraOverlay}>
                <Camera size={22} color="#fff" strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>

          <View style={s.identityBox}>
            {isEditing ? (
              <View style={s.editFields}>
                <View style={s.inputGroup}>
                  <Text style={s.fieldLabel}>{t('nameLabel') || 'USERNAME'}</Text>
                  <TextInput 
                    style={s.nameInput} 
                    value={editName} 
                    onChangeText={setEditName} 
                    placeholder={t('yourNamePlaceholder')} 
                    placeholderTextColor="rgba(255,255,255,0.2)" 
                    autoCorrect={false}
                  />
                </View>

                <View style={s.inputGroup}>
                  <View style={s.labelRow}>
                    <Text style={s.fieldLabel}>{t('bioLabel') || 'BIO / DESCRIPTION'}</Text>
                    <Text style={s.charCount}>{editBio.length}/80</Text>
                  </View>
                  <TextInput 
                    style={s.bioInput} 
                    value={editBio} 
                    onChangeText={v => setEditBio(v.slice(0, 80))} 
                    placeholder={t('shortBioPlaceholder')} 
                    placeholderTextColor="rgba(255,255,255,0.2)" 
                    multiline 
                    maxLength={80} 
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={s.displayName} allowFontScaling={false}>{displayName}</Text>
                {displayBio ? (
                  <Text style={s.bioText} allowFontScaling={false}>{displayBio}</Text>
                ) : isOwner ? (
                  <Text style={s.bioPlaceholder} allowFontScaling={false}>{t('tapToAddBio')}</Text>
                ) : null}
              </>
            )}
          </View>

          <View style={s.statsRow}>
            <TouchableOpacity style={s.statItem} onPress={() => fetchSocialList('followers')}>
              <Text style={s.statCount}>{followers}</Text>
              <Text style={s.statLabel}>{t('followers')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.statItem} onPress={() => fetchSocialList('following')}>
              <Text style={s.statCount}>{following}</Text>
              <Text style={s.statLabel}>{t('following')}</Text>
            </TouchableOpacity>
            
            <View style={s.statItem}>
              <Text style={s.statCount}>{userLogs.length}</Text>
              <Text style={s.statLabel}>{t('logs')}</Text>
            </View>
          </View>
          <View style={s.actionRow}>
            {isOwner ? (isEditing ? (<><TouchableOpacity style={[s.primaryBtn, { backgroundColor: Colors.primary }]} onPress={handleSave} disabled={isSaving}>{isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryBtnText}>{t('save')}</Text>}</TouchableOpacity><TouchableOpacity style={s.secondaryBtn} onPress={handleCancel}><Text style={s.secondaryBtnText}>{t('cancel')}</Text></TouchableOpacity></>) : (<><TouchableOpacity style={s.secondaryBtn} onPress={() => setIsEditing(true)}><Text style={s.secondaryBtnText}>{t('editProfile')}</Text></TouchableOpacity><TouchableOpacity style={s.secondaryBtn} onPress={handleShare}><Text style={s.secondaryBtnText}>{t('shareProfile')}</Text></TouchableOpacity></>)) : (<TouchableOpacity style={[s.primaryBtn, isFollowing && s.followingBtn]} onPress={handleFollow} disabled={isFollowLoading}>{isFollowLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[s.primaryBtnText, isFollowing && { color: Colors.white }]}>{isFollowing ? t('unfollow') : t('follow')}</Text>}</TouchableOpacity>)}
          </View>
        </View>

        <View style={s.tabBar}>
          {TABS.map(({ id, label, Icon, count }) => {
            const active = activeTab === id;
            return (
              <TouchableOpacity key={id} style={[s.tab, active && s.tabActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(id); }} activeOpacity={0.7}>
                <View style={s.tabIconWrapper}>
                  <Icon size={22} color={active ? Colors.primary : 'rgba(255,255,255,0.4)'} strokeWidth={active ? 2.5 : 2} />
                </View>
                <Text style={[s.tabLabel, active && s.tabLabelActive]} allowFontScaling={false}>{label}</Text>
              </TouchableOpacity>

            );
          })}
        </View>

        <View style={s.content}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{activeTabInfo?.label}</Text>
            <Text style={s.sectionCount}>{activeTabInfo?.count} {t('titles')}</Text>
          </View>
          {activeTab === 'Diary' && (
            loadingLogs ? (
              <View style={{ gap: 12 }}>{[1,2,3].map(i => <DiarySkeleton key={i} />)}</View>
            ) : userLogs.length === 0 ? (
              <EmptyState icon={<BookOpen size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyDiary')} />
            ) : (
              userLogs.map((log, index) => (
                <DiaryCard 
                  key={log.id} 
                  log={log} 
                  priority={index < 2 ? 'high' : 'normal'}
                  onDelete={isOwner ? (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLogToDelete(id); } : () => {}} 
                  onPressPoster={(id) => router.push(`/movie/${id}?type=${log.media_type || 'movie'}` as any)} 
                />
              ))
            )
          )}
          
          {activeTab === 'Watched' && (
            loadingWatchlist ? (
              <View style={{ gap: 0 }}>{[1,2,3,4].map(i => <MovieItemSkeleton key={i} />)}</View>
            ) : watchlist.filter(m => m.status === 'completed').length === 0 ? (
              <EmptyState icon={<Eye size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyWatched')} />
            ) : (
              watchlist.filter(m => m.status === 'completed').map(item => (
                <MovieListItem 
                  key={item.id} 
                  movie={item as any} 
                  onPress={() => router.push(`/movie/${item.id}?type=${item.mediaType}` as any)} 
                  showWatched={isOwner} 
                  watched={item.status === 'completed'} 
                  inWatchlist={isOwner} 
                  onToggleWatched={isOwner ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleWatched(item.id); } : () => {}} 
                  onRemove={isOwner ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); removeFromWatchlist(item.id); } : () => {}} 
                />
              ))
            )
          )}
          
          {activeTab === 'Watchlist' && (
            loadingWatchlist ? (
              <View style={{ gap: 0 }}>{[1,2,3,4].map(i => <MovieItemSkeleton key={i} />)}</View>
            ) : watchlist.filter(m => m.status !== 'completed').length === 0 ? (
              <EmptyState icon={<Star size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyToWatch')} />
            ) : (
              watchlist.filter(m => m.status !== 'completed').map(item => (
                <MovieListItem 
                  key={item.id} 
                  movie={item as any} 
                  onPress={() => router.push(`/movie/${item.id}?type=${item.mediaType}` as any)} 
                  showWatched={isOwner} 
                  watched={item.status === 'completed'} 
                  inWatchlist={isOwner} 
                  onToggleWatched={isOwner ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleWatched(item.id); } : () => {}} 
                  onRemove={isOwner ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); removeFromWatchlist(item.id); } : () => {}} 
                />
              ))
            )
          )}
        </View>
      </ScrollView>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconBox}><LogOut size={28} color="#DC3545" strokeWidth={2.5} /></View>
            <Text style={s.modalTitle} allowFontScaling={false}>{t('signOutConfirmTitle')}</Text>
            <Text style={s.modalSub} allowFontScaling={false}>{t('signOutConfirmDesc')}</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnSecondary} onPress={() => setShowLogoutModal(false)} activeOpacity={0.7}><Text style={s.btnSecondaryText} allowFontScaling={false}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={s.btnDanger} onPress={() => { setShowLogoutModal(false); handleSignOut(); }} activeOpacity={0.8}><Text style={s.btnDangerText} allowFontScaling={false}>{t('signOut')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SettingsSheet visible={showSettingsSheet} onClose={() => setShowSettingsSheet(false)} onLanguagePress={() => setShowLangModal(true)} onLogoutPress={() => setShowLogoutModal(true)} onNotificationsPress={() => router.push('/notifications' as any)} onAboutPress={() => router.push('/about' as any)} onExportPress={handleExport} />
      <LanguageSheet visible={showLangModal} onClose={() => setShowLangModal(false)} />
      <DeleteConfirmModal visible={!!logToDelete} onClose={() => setLogToDelete(null)} onConfirm={() => { if (logToDelete) deleteLog(logToDelete); }} title={t('deleteLogTitle')} message={t('deleteLogDesc')} />
      <SocialListSheet 
        visible={isSocialModalVisible} 
        onClose={() => setIsSocialModalVisible(false)} 
        initialTab={socialModalType} 
        data={socialList.data || []} 
        loading={socialList.status === 'loading'} 
        currentUserId={user?.id || ''} 
        onUserPress={(id) => { 
          setIsSocialModalVisible(false); 
          router.push({ pathname: '/(tabs)/profile', params: { userId: id } } as any); 
        }} 
        onFollowToggle={(id) => handleToggleFollowFromList(id)} 
      />
      {pickedImage && (
        <ImageCropModal 
          visible={showCropModal} 
          imageUri={pickedImage} 
          onClose={handleCropCancel} 
          onSave={handleCropSave} 
        />
      )}
    </View>
  );
};

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (<View style={s.emptyWrap}>{icon}<Text style={s.emptyText} allowFontScaling={false}>{text}</Text></View>);
}

function DiarySkeleton() {
  return (
    <View style={{ paddingHorizontal: Spacing.xl, paddingVertical: 12, flexDirection: 'row', gap: 12, opacity: 0.15 }}>
      <View style={{ width: 70, height: 105, backgroundColor: Colors.white, borderRadius: Radius.sm }} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <View style={{ width: '60%', height: 14, backgroundColor: Colors.white, borderRadius: 4 }} />
        <View style={{ width: '40%', height: 10, backgroundColor: Colors.white, borderRadius: 4 }} />
        <View style={{ width: '80%', height: 10, backgroundColor: Colors.white, borderRadius: 4, marginTop: 8 }} />
      </View>
    </View>
  );
}

function MovieItemSkeleton() {
  return (
    <View style={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, flexDirection: 'row', gap: Spacing.lg, opacity: 0.1 }}>
      <View style={{ width: 60, height: 88, backgroundColor: Colors.white, borderRadius: Radius.sm }} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <View style={{ width: '70%', height: 16, backgroundColor: Colors.white, borderRadius: 4 }} />
        <View style={{ width: '30%', height: 12, backgroundColor: Colors.white, borderRadius: 4 }} />
        <View style={{ width: '90%', height: 12, backgroundColor: Colors.white, borderRadius: 4, marginTop: 10 }} />
      </View>
    </View>
  );
}

export default ProfileScreen;
