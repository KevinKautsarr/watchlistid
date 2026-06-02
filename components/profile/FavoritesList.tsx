/**
 * FavoritesList.tsx
 *
 * Tampilan daftar favorit di profil user.
 * - Mobile  : DraggableFlatList horizontal; long-press untuk drag reorder
 * - Web/Desktop : ScrollView horizontal + tombol ↑↓ saat mode edit milik sendiri
 * - Badge #N di pojok kiri atas setiap poster
 * - Tombol ❌ di pojok kanan atas saat edit mode (hanya pemilik profil)
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react-native';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TMDB_IMAGE_SIZES } from '@/constants/theme';
import SafeImage from '@/components/common/SafeImage';
import { useFavorites, FavoriteItem } from '@/context/FavoritesContext';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cursorPointer } from '@/utils/webStyles';
import { useLanguage } from '@/context/LanguageContext';

// ── Conditional drag import (mobile only) ─────────────────────────────────
let DraggableFlatList: any = null;
let RenderItemParams: any = null;
if (Platform.OS !== 'web') {
  try {
    const mod = require('react-native-draggable-flatlist');
    DraggableFlatList = mod.default;
  } catch {}
}

// ── Constants ─────────────────────────────────────────────────────────────
const POSTER_W = 110;
const POSTER_H = 162;

// ── Poster card inside FavoritesList ──────────────────────────────────────
interface FavPosterProps {
  item: FavoriteItem;
  isOwner: boolean;
  editMode: boolean;
  onRemove: (movieId: number) => void;
  onMoveUp?: (movieId: number) => void;
  onMoveDown?: (movieId: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  dragActivator?: any; // for mobile drag handle
}

function FavPoster({
  item,
  isOwner,
  editMode,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  dragActivator,
}: FavPosterProps) {
  const imageUri = item.poster_path
    ? `${TMDB_IMAGE_SIZES.small}${item.poster_path}`
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.posterWrap}
      onPress={() => {
        if (!editMode) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/movie/[id]',
            params: { id: item.movie_id.toString(), type: item.media_type },
          } as any);
        }
      }}
    >
      {/* Poster image */}
      <View style={styles.imageContainer}>
        <SafeImage
          uri={imageUri}
          fallbackType="movie"
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          accessibilityLabel={`${item.title} poster`}
        />

        {/* #N badge */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText} allowFontScaling={false}>#{item.position}</Text>
        </View>

        {/* Remove button (edit mode, owner) */}
        {isOwner && editMode && (
          <TouchableOpacity
            style={[styles.removeBadge, cursorPointer]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRemove(item.movie_id);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={12} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}

        {/* Drag handle (mobile edit mode) */}
        {isOwner && editMode && Platform.OS !== 'web' && dragActivator && (
          <View {...dragActivator} style={styles.dragHandle}>
            <GripVertical size={16} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </View>

      {/* Web edit mode: ↑↓ buttons */}
      {isOwner && editMode && Platform.OS === 'web' && (
        <View style={styles.reorderRow}>
          <TouchableOpacity
            style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled, cursorPointer]}
            onPress={() => !isFirst && onMoveUp?.(item.movie_id)}
            disabled={isFirst}
          >
            <ChevronLeft size={14} color={isFirst ? 'rgba(255,255,255,0.2)' : Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled, cursorPointer]}
            onPress={() => !isLast && onMoveDown?.(item.movie_id)}
            disabled={isLast}
          >
            <ChevronRight size={14} color={isLast ? 'rgba(255,255,255,0.2)' : Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Title */}
      <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
interface FavoritesListProps {
  /** userId of the profile being viewed */
  userId: string;
  /** Is this the current user's own profile? */
  isOwner: boolean;
  /** Pre-fetched favorites for non-owner profiles */
  data?: FavoriteItem[];
}

export default function FavoritesList({ userId, isOwner, data }: FavoritesListProps) {
  const {
    favorites: ownFavorites,
    isLoading,
    removeFavorite,
    moveUp,
    moveDown,
    reorderFavorites,
  } = useFavorites();

  const bp = useBreakpoint();
  const { t } = useLanguage();
  const scrollRef = useRef<ScrollView>(null);
  const [editMode, setEditMode] = useState(false);

  // Decide which data to show
  const items: FavoriteItem[] = isOwner ? ownFavorites : (data || []);

  if (isLoading && isOwner) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!isLoading && items.length === 0) {
    if (!isOwner) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText} allowFontScaling={false}>
          {t('favoritesEmpty')}
        </Text>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>
          {t('favoritesSection')}
          {'  '}
          <Text style={styles.sectionCount}>({items.length})</Text>
        </Text>

        {isOwner && (
          <TouchableOpacity
            style={[styles.editBtn, cursorPointer]}
            onPress={() => setEditMode(e => !e)}
          >
            <Text style={styles.editBtnText} allowFontScaling={false}>
              {editMode ? t('favoritesDone') : t('favoritesEdit')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mobile — DraggableFlatList */}
      {Platform.OS !== 'web' && DraggableFlatList && editMode && isOwner ? (
        <DraggableFlatList
          data={items}
          horizontal
          keyExtractor={(item: FavoriteItem) => item.movie_id.toString()}
          contentContainerStyle={styles.scrollContent}
          showsHorizontalScrollIndicator={false}
          onDragEnd={({ data: reordered }: { data: FavoriteItem[] }) => {
            reorderFavorites(reordered.map(f => f.movie_id));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          renderItem={({ item, drag, isActive }: any) => (
            <View style={{ opacity: isActive ? 0.8 : 1 }}>
              <FavPoster
                item={item}
                isOwner={isOwner}
                editMode={editMode}
                onRemove={removeFavorite}
                dragActivator={{ onLongPress: drag }}
              />
            </View>
          )}
        />
      ) : (
        // Web + mobile non-edit: plain ScrollView
        <View style={styles.scrollWrapperRow}>
          {bp.isLarge && (
            <TouchableOpacity
              style={[styles.navArrowButton, cursorPointer]}
              onPress={() => scrollRef.current?.scrollTo({ x: -300, animated: true })}
            >
              <View style={styles.navArrowInner}>
                <ChevronLeft size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
          )}

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollFlex}
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((item, index) => (
              <FavPoster
                key={item.movie_id}
                item={item}
                isOwner={isOwner}
                editMode={editMode}
                onRemove={removeFavorite}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            ))}
          </ScrollView>

          {bp.isLarge && (
            <TouchableOpacity
              style={[styles.navArrowButton, cursorPointer]}
              onPress={() => scrollRef.current?.scrollTo({ x: 300, animated: true })}
            >
              <View style={styles.navArrowInner}>
                <ChevronRight size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg, // 18px (Clean & cohesive sub-heading size)
    fontWeight: FontWeight.black,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: FontSize.sm, // 14px (Sleek secondary count indicator)
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  scrollWrapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  navArrowButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  navArrowInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  posterWrap: {
    width: POSTER_W,
  },
  imageContainer: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  rankBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    zIndex: 5,
  },
  rankText: {
    color: Colors.white,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.black,
    letterSpacing: 0.3,
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  dragHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.sm,
    padding: 4,
    zIndex: 5,
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: 6,
  },
  arrowBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.sm,
    padding: 4,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  title: {
    color: Colors.text.primary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.sm,
    lineHeight: 16,
  },
  loadingWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingBottom: Spacing.xl,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
