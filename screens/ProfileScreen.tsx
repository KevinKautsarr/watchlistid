import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Moon, Upload, Info, ChevronRight, Star, Film, Eye } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';

const ProfileScreen: React.FC = () => {
  const { watchlist } = useWatchlist();

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

  const BADGES = [
    { emoji: '🎬', name: 'First Film',     unlocked: total >= 1 },
    { emoji: '📋', name: 'Collector',      unlocked: total >= 5 },
    { emoji: '✅', name: 'Completionist',  unlocked: watched >= 3 },
    { emoji: '⭐', name: 'Critic',         unlocked: watchlist.some(m => (m.vote_average || 0) >= 9) },
    { emoji: '🌍', name: 'Explorer',       unlocked: total >= 10 },
  ];

  const MENU = [
    { Icon: Bell,   label: 'Notifications',       sub: undefined,       arrow: true },
    { Icon: Moon,   label: 'Dark Mode',            sub: 'Coming soon',   arrow: false },
    { Icon: Upload, label: 'Export Watchlist',     sub: undefined,       arrow: true },
    { Icon: Info,   label: 'About WatchListID',    sub: 'v1.0.0',        arrow: true },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero gradient card ── */}
        <LinearGradient
          colors={['#112D4E', '#3F72AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Bell */}
          <TouchableOpacity style={styles.heroBell} activeOpacity={0.75}>
            <Bell size={20} color="rgba(255,255,255,0.85)" strokeWidth={2} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText} allowFontScaling={false}>M</Text>
          </View>
          <Text style={styles.heroName} allowFontScaling={false}>Movie Fan</Text>
          <Text style={styles.heroMember} allowFontScaling={false}>Member since 2024</Text>

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

        {/* ── Achievements ── */}
        <Text style={styles.sectionTitle} allowFontScaling={false}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
          {BADGES.map((b, i) => (
            <View key={i} style={[styles.badgeCard, !b.unlocked && styles.badgeCardLocked]}>
              <Text style={[styles.badgeEmoji, !b.unlocked && { opacity: 0.25 }]} allowFontScaling={false}>
                {b.emoji}
              </Text>
              {b.unlocked && (
                <View style={styles.badgeTick}>
                  <Text style={styles.badgeTickText} allowFontScaling={false}>✓</Text>
                </View>
              )}
              <Text style={[styles.badgeName, !b.unlocked && { opacity: 0.3 }]} allowFontScaling={false} numberOfLines={2}>
                {b.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Settings menu ── */}
        <Text style={styles.sectionTitle} allowFontScaling={false}>Settings</Text>
        <View style={styles.menuCard}>
          {MENU.map(({ Icon, label, sub, arrow }, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              style={[styles.menuRow, i < MENU.length - 1 && styles.menuRowBorder]}
            >
              <View style={styles.menuIconBox}>
                <Icon size={18} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel} allowFontScaling={false}>{label}</Text>
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: FontWeight.black, color: Colors.white },
  heroName:   { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, letterSpacing: 0.2 },
  heroMember: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
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
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.dark, marginTop: 4 },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 0.5 },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.dark,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },

  /* Badges */
  badgesRow: {
    paddingHorizontal: Spacing.xl,
    gap: 12,
    marginBottom: Spacing.xxl,
  },
  badgeCard: {
    width: 76,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 4,
    position: 'relative',
    ...Shadow.sm,
  },
  badgeCardLocked: { opacity: 0.6 },
  badgeEmoji: { fontSize: 34 },
  badgeTick: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTickText: { fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold },
  badgeName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.dark,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },

  /* Menu */
  menuCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
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
  menuLabel:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.dark },
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
