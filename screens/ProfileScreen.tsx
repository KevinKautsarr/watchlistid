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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '../supabase';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Globe, Share2, Info, ChevronRight, Star, Film, Eye,
  LogOut, Edit3, Camera, Check, X, BookOpen, Clock, Trash2, UserPlus, UserMinus,
  LayoutGrid, Play, Bookmark, Menu, Plus, ChevronDown, 
  Settings as SettingsIcon, AtSign
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
  heroContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'center' },
  heroCentered: { alignItems: 'center', gap: 16 },
  avatarContainer: { width: 86, height: 86, borderRadius: 43, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, backgroundColor: 'rgba(229,9,20,0.15)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 32, fontWeight: FontWeight.black, color: Colors.primary },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: 17, fontWeight: FontWeight.black, color: Colors.white, textAlign: 'center' },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2, textAlign: 'center' },

  identityBox: { marginTop: 16, gap: 4, alignItems: 'center' },
  displayName: { fontSize: 18, fontWeight: FontWeight.black, color: Colors.white, textAlign: 'center' },
  nameInput: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 2 },
  bioText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginTop: 1, textAlign: 'center' },
  bioPlaceholder: { fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
  bioInputWrap: { marginTop: 6, width: '100%' },
  bioInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md, padding: 12, fontSize: 14, color: Colors.white, minHeight: 60, textAlignVertical: 'top' },
  bioCounter: { fontSize: 11, color: Colors.primary, fontWeight: FontWeight.bold, textAlign: 'right', marginTop: 4, opacity: 0.8 },

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
  const { watchlist, toggleWatched, removeFromWatchlist } = useWatchlist();
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { userLogs, deleteLog } = useSocial();
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
  const [socialList, setSocialList] = useState<any[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  const targetUserId = userId || user?.id;
  const isOwner = !userId || userId === user?.id;
  const [targetProfile, setTargetProfile] = useState<any>(null);

  useEffect(() => {
    if (!targetUserId) return;
    const fetchData = async () => {
      if (!isOwner) {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
        if (data) setTargetProfile(data);
      } else {
        setTargetProfile(profile);
      }
      fetchSocialStats();
    };
    fetchData();
  }, [targetUserId, isOwner, profile]);

  const fetchSocialStats = async () => {
    if (!targetUserId) return;
    const { count: fers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
    setFollowers(fers || 0);
    const { count: fing } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
    setFollowing(fing || 0);
    if (!isOwner && user) {
      const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).single();
      setIsFollowing(!!data);
    }
  };

  const handleFollow = async () => {
    if (!user || !targetUserId || isOwner || isFollowLoading) return;
    setIsFollowLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
        setIsFollowing(false);
        setFollowers(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
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
    setIsListLoading(true);
    setSocialList([]);
    try {
      const column = type === 'followers' ? 'follower_id' : 'following_id';
      const filterColumn = type === 'followers' ? 'following_id' : 'follower_id';
      const { data } = await supabase.from('follows').select(`${column}, profiles:${column} (id, username, avatar_url, bio)`).eq(filterColumn, targetUserId);
      if (data) {
        let users = data.map((item: any) => item.profiles).filter(u => !!u);
        if (user) {
          const { data: myFollows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
          const myFollowingIds = new Set(myFollows?.map(f => f.following_id) || []);
          users = users.map(u => ({ ...u, is_following: myFollowingIds.has(u.id), full_name: u.username }));
        }
        setSocialList(users);
      }
    } catch (err) {
      console.error('Fetch list error:', err);
    } finally {
      setIsListLoading(false);
    }
  };

  const handleToggleFollowFromList = async (userId: string) => {
    if (!user || user.id === userId) return;
    setSocialList(prev => prev.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u));
    try {
      const isCurrentlyFollowing = socialList.find(u => u.id === userId)?.is_following;
      if (isCurrentlyFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      }
      fetchSocialStats();
    } catch (err) {
      setSocialList(prev => prev.map(u => u.id === userId ? { ...u, is_following: !u.is_following } : u));
      console.error('Toggle follow list error:', err);
    }
  };

  const displayName = targetProfile?.username ?? (isOwner ? (user?.user_metadata?.username ?? user?.email?.split('@')[0]) : 'User') ?? 'Movie Fan';
  const avatarUrl = targetProfile?.avatar_url ?? (isOwner ? user?.user_metadata?.avatar_url : null);
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const displayBio = targetProfile?.bio ?? '';

  const watched = watchlist.filter(m => m.watched).length;
  const total = watchlist.length;
  const toWatch = total - watched;

  useEffect(() => {
    setEditName(displayName);
    setEditAvatar(avatarUrl || '');
    setEditBio(displayBio);
  }, [displayName, avatarUrl, displayBio]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.1, base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setEditAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({ data: { username: editName, avatar_url: editAvatar } });
      await supabase.from('profiles').update({ username: editName, avatar_url: editAvatar, bio: editBio }).eq('id', user.id);
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
            const title = String(item.title || 'Unknown').replace(/"/g, '""');
            const status = item.watched ? 'Watched' : 'To Watch';
            const year = item.release_date ? item.release_date.substring(0, 4) : '""';
            const rating = item.userRating ? `"${item.userRating}/10"` : '""';
            const date = item.addedAt ? `"${new Date(item.addedAt).toLocaleDateString()}"` : '""';
            csvContent += `${rowNum++},${status},"${title}",${year},${rating},${date},${item.media_type || 'movie'},""\n`;
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
        const fileUri = FileSystem.cacheDirectory + fileName;
        
        // Default encoding is UTF8, so we can omit the explicit EncodingType object
        // if it's causing issues with undefined properties
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
            <Text style={s.topBarTitle} allowFontScaling={false}>Profil</Text>
          </View>
          <View style={s.topBarCenter} />
          <View style={s.topBarRight}>
            {isOwner && (
              <TouchableOpacity style={s.topBarIcon} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettingsSheet(true); }}>
                <Menu size={24} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={s.heroContainer}>
          <TouchableOpacity style={s.avatarContainer} activeOpacity={isEditing ? 0.7 : 1} onPress={isEditing ? handlePickImage : undefined}>
            {currentAvatarUrl ? <Image source={{ uri: currentAvatarUrl }} style={s.avatarImg} contentFit="cover" /> : <View style={s.avatarPlaceholder}><Text style={s.avatarLetter} allowFontScaling={false}>{avatarLetter}</Text></View>}
            {isEditing && <View style={s.cameraOverlay}><Camera size={18} color="#fff" strokeWidth={2} /></View>}
          </TouchableOpacity>
          <View style={s.identityBox}>
            {isEditing ? <TextInput style={s.nameInput} value={editName} onChangeText={setEditName} placeholder={t('yourNamePlaceholder')} placeholderTextColor="rgba(255,255,255,0.4)" autoCorrect={false} /> : <Text style={s.displayName} allowFontScaling={false}>{displayName}</Text>}
            {isEditing ? <View style={s.bioInputWrap}><TextInput style={s.bioInput} value={editBio} onChangeText={v => setEditBio(v.slice(0, 80))} placeholder={t('shortBioPlaceholder')} placeholderTextColor="rgba(255,255,255,0.3)" multiline maxLength={80} /><Text style={s.bioCounter} allowFontScaling={false}>{editBio.length}/80</Text></View> : displayBio ? <Text style={s.bioText} allowFontScaling={false}>{displayBio}</Text> : isOwner ? <Text style={s.bioPlaceholder} allowFontScaling={false}>{t('tapToAddBio')}</Text> : null}
          </View>
          <View style={s.statsRow}>
            <TouchableOpacity style={s.statItem} onPress={() => fetchSocialList('followers')}><Text style={s.statCount}>{followers}</Text><Text style={s.statLabel}>{t('followers')}</Text></TouchableOpacity>
            <TouchableOpacity style={s.statItem} onPress={() => fetchSocialList('following')}><Text style={s.statCount}>{following}</Text><Text style={s.statLabel}>{t('following')}</Text></TouchableOpacity>
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
          {activeTab === 'Diary' && (userLogs.length === 0 ? <EmptyState icon={<BookOpen size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyDiary')} /> : userLogs.map(log => <DiaryCard key={log.id} log={log} onDelete={isOwner ? (id) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLogToDelete(id); } : () => {}} onPressPoster={(id) => router.push(`/movie/${id}?type=${log.media_type || 'movie'}` as any)} />))}
          {activeTab === 'Watched' && (watchlist.filter(m => m.watched).length === 0 ? <EmptyState icon={<Eye size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyWatched')} /> : watchlist.filter(m => m.watched).map(item => <MovieListItem key={item.id} movie={item} onPress={() => router.push(`/movie/${item.id}?type=${item.media_type || 'movie'}`)} showWatched={isOwner} watched={item.watched} inWatchlist={isOwner} onToggleWatched={isOwner ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleWatched(item.id); } : () => {}} onRemove={isOwner ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); removeFromWatchlist(item.id); } : () => {}} />))}
          {activeTab === 'Watchlist' && (watchlist.filter(m => !m.watched).length === 0 ? <EmptyState icon={<Star size={44} color="rgba(255,255,255,0.12)" strokeWidth={1.5} />} text={t('emptyToWatch')} /> : watchlist.filter(m => !m.watched).map(item => <MovieListItem key={item.id} movie={item} onPress={() => router.push(`/movie/${item.id}?type=${item.media_type || 'movie'}`)} showWatched={isOwner} watched={item.watched} inWatchlist={isOwner} onToggleWatched={isOwner ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleWatched(item.id); } : () => {}} onRemove={isOwner ? () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); removeFromWatchlist(item.id); } : () => {}} />))}
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
      <SocialListSheet visible={isSocialModalVisible} onClose={() => setIsSocialModalVisible(false)} initialTab={socialModalType} data={socialList} loading={isListLoading} currentUserId={user?.id || ''} onUserPress={(id) => { setIsSocialModalVisible(false); router.push({ pathname: '/(tabs)/profile', params: { userId: id } }); }} onFollowToggle={(id) => handleToggleFollowFromList(id)} />
    </View>
  );
};

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (<View style={s.emptyWrap}>{icon}<Text style={s.emptyText} allowFontScaling={false}>{text}</Text></View>);
}

export default ProfileScreen;
