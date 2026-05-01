import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, TextInput, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Moon, Upload, Info, ChevronRight, Star, Film, Eye, LogOut, Edit2, Camera, Check, X } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { watchlist } = useWatchlist();
  const { user, profile, signOut } = useAuth();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editAvatar, setEditAvatar] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  // Derive display info from Supabase user and realtime profile
  const displayName = profile?.username
    ?? user?.user_metadata?.username
    ?? user?.email?.split('@')[0]
    ?? 'Movie Fan';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const memberYear   = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : 2024;

  React.useEffect(() => {
    setEditName(displayName);
    setEditAvatar(avatarUrl || '');
  }, [displayName, avatarUrl]);

  const handleCancelEdit = () => {
    setEditName(displayName);
    setEditAvatar(avatarUrl || '');
    setIsEditing(false);
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.1, // compress heavily for base64
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setEditAvatar(b64);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { username: editName, avatar_url: editAvatar }
      });
      await supabase.from('profiles').update({
        username: editName,
        avatar_url: editAvatar
      }).eq('id', user.id);
      setIsEditing(false);
    } catch (e) {
      console.log('Error saving profile:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login' as any);
  };

  const watched = watchlist.filter(m => m.watched).length;
  const total   = watchlist.length;
  const toWatch = total - watched;
  const avgRating = watchlist.length
    ? (watchlist.reduce((s, m) => s + (m.vote_average || 0), 0) / watchlist.length).toFixed(1)
    : '—';

  const STATS = [
    { value: total,     label: 'Total',    Icon: Film },
    { value: watched,   label: 'Watched',  Icon: Eye  },
    { value: toWatch,   label: 'To Watch', Icon: Star },
  ];

  const MENU = [
    { Icon: Bell,   label: 'Notifications',    sub: undefined,     arrow: true,  onPress: undefined },
    { Icon: Upload, label: 'Export Watchlist',  sub: undefined,     arrow: true,  onPress: undefined },
    { Icon: Info,   label: 'About WatchListID', sub: 'v1.0.0',      arrow: true,  onPress: undefined },
    { Icon: LogOut, label: 'Sign Out',          sub: undefined,     arrow: false, onPress: handleSignOut },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero gradient card ── */}
        <LinearGradient
          colors={['#8A050C', '#141414']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Edit / Save Button */}
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.heroCancel} onPress={handleCancelEdit} disabled={isSaving}>
                <X size={20} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroBell} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Check size={20} color="#fff" strokeWidth={2.5} />}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.heroBell} onPress={() => setIsEditing(true)}>
              <Edit2 size={18} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            </TouchableOpacity>
          )}

          {/* Avatar */}
          <TouchableOpacity 
            style={styles.avatar} 
            activeOpacity={isEditing ? 0.7 : 1}
            onPress={isEditing ? handlePickImage : undefined}
          >
            {isEditing && editAvatar ? (
              <Image source={{ uri: editAvatar }} style={styles.avatarImg} contentFit="cover" />
            ) : !isEditing && avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarText} allowFontScaling={false}>{avatarLetter}</Text>
            )}
            
            {isEditing && (
              <View style={styles.cameraOverlay}>
                <Camera size={20} color="#fff" strokeWidth={2} />
              </View>
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              style={styles.heroNameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your Name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.heroName} allowFontScaling={false}>{displayName}</Text>
          )}
          
          <Text style={styles.heroMember} allowFontScaling={false}>Member since {memberYear}</Text>

          {/* Avg rating chip */}
          <View style={styles.avgRatingChip}>
            <Star size={12} color="#F5C518" fill="#F5C518" strokeWidth={0} />
            <Text style={styles.avgRatingText} allowFontScaling={false}>{avgRating} avg rating</Text>
          </View>
        </LinearGradient>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {STATS.map(({ value, label, Icon }, i) => (
            <View key={i} style={styles.statCard}>
              <Icon size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.statValue} allowFontScaling={false}>{value}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Settings menu ── */}
        <Text style={styles.sectionTitle} allowFontScaling={false}>Settings</Text>
        <View style={styles.menuCard}>
          {MENU.map(({ Icon, label, sub, arrow, onPress }, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={onPress}
              style={[
                styles.menuRow,
                i < MENU.length - 1 && styles.menuRowBorder,
                label === 'Sign Out' && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.menuIconBox, label === 'Sign Out' && { backgroundColor: 'rgba(220,53,69,0.10)' }]}>
                <Icon size={18} color={label === 'Sign Out' ? '#DC3545' : Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, label === 'Sign Out' && { color: '#DC3545' }]} allowFontScaling={false}>{label}</Text>
                {sub && <Text style={styles.menuSub} allowFontScaling={false}>{sub}</Text>}
              </View>
              {arrow && <ChevronRight size={17} color={Colors.text.secondary} strokeWidth={2} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.version} allowFontScaling={false}>WatchListID v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },

  /* Hero */
  heroCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: Radius.xxl,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroBell: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroCancel: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: FontWeight.black, color: Colors.white },
  heroName:   { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, letterSpacing: 0.2 },
  heroNameInput: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    letterSpacing: 0.2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingBottom: 4,
    minWidth: 150,
    textAlign: 'center',
  },
  heroMember: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  avgRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  avgRatingText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semibold },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    gap: 10,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.text.primary, marginTop: 4 },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 0.5 },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },

  /* Menu */
  menuCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 15,
    gap: Spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay.light,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(63,114,175,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: { flex: 1 },
  menuLabel:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.text.primary },
  menuSub:     { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2, opacity: 0.75 },

  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
  },
});

export default ProfileScreen;
