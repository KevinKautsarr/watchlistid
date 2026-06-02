import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Plus, BookmarkCheck, Check, Edit3, Star, MessageSquare, Heart } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface DetailActionsProps {
  featuredTrailer: any;
  movieStatus: 'not_added' | 'plan_to_watch' | 'watched' | 'reviewed';
  isFavorite: boolean;
  onPlay: () => void;
  onWatchlist: () => void;
  onMarkWatched: () => void;
  onWriteReview: () => void;
  onEditReview: () => void;
  onToggleFavorite: () => void;
  t: any;
}

export const DetailActions: React.FC<DetailActionsProps> = ({ 
  featuredTrailer, movieStatus, isFavorite, onPlay, onWatchlist, onMarkWatched, onWriteReview, onEditReview, onToggleFavorite, t 
}) => {
  return (
    <View style={styles.actionRow}>
      {featuredTrailer && (
        <TouchableOpacity 
          style={[styles.btnPlay, cursorPointer]}
          onPress={onPlay}
          activeOpacity={0.8}
        >
          <Play size={IconSize.md} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          <Text style={styles.btnPlayText} allowFontScaling={false}>{t('playTrailer')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actionSubRow}>
        {movieStatus === 'not_added' && (
          <TouchableOpacity 
            style={[styles.btnProminent, { flex: 1 }, cursorPointer]}
            onPress={onWatchlist}
            activeOpacity={0.8}
          >
            <Plus size={IconSize.md} color={Colors.white} strokeWidth={2.5} />
            <Text style={styles.btnText} allowFontScaling={false}>
              {t('addToWatchlist')}
            </Text>
          </TouchableOpacity>
        )}

        {movieStatus === 'plan_to_watch' && (
          <>
            <TouchableOpacity 
              style={[styles.btnDisabled, cursorPointer]}
              onPress={onWatchlist}
              activeOpacity={0.8}
            >
              <BookmarkCheck size={IconSize.sm} color="rgba(255,255,255,0.4)" strokeWidth={2} />
              <Text style={styles.btnDisabledText} allowFontScaling={false}>
                Watchlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnProminent, cursorPointer]}
              onPress={onMarkWatched}
              activeOpacity={0.8}
            >
              <Check size={IconSize.md} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.btnText} allowFontScaling={false}>
                {t('markWatched')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {movieStatus === 'watched' && (
          <>
            <TouchableOpacity 
              style={[styles.btnDisabled, { flex: 1 }]}
              disabled={true}
            >
              <Check size={IconSize.sm} color="rgba(255,255,255,0.4)" strokeWidth={2.5} />
              <Text style={styles.btnDisabledText} allowFontScaling={false}>
                {t('diary')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnProminent, { flex: 1.5 }, cursorPointer]}
              onPress={onWriteReview}
              activeOpacity={0.8}
            >
              <MessageSquare size={IconSize.sm} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.btnText} allowFontScaling={false}>
                {t('writeReview')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {movieStatus === 'reviewed' && (
          <>
            <View style={[styles.badgeGold, { flex: 1 }]}>
              <Star size={14} color={Colors.ratingGold} fill={Colors.ratingGold} />
              <Text style={styles.badgeGoldText} allowFontScaling={false}>
                {t('reviewed')}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.btnProminent, { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }, cursorPointer]}
              onPress={onEditReview}
              activeOpacity={0.8}
            >
              <Edit3 size={IconSize.sm} color={Colors.white} strokeWidth={2} />
              <Text style={styles.btnText} allowFontScaling={false}>
                {t('editReview')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Favorite Button */}
        <TouchableOpacity 
          style={[styles.btnFavorite, isFavorite && styles.btnFavoriteActive, cursorPointer]}
          onPress={onToggleFavorite}
          activeOpacity={0.8}
        >
          <Heart 
            size={20} 
            color={isFavorite ? Colors.white : 'rgba(255,255,255,0.7)'} 
            fill={isFavorite ? Colors.white : 'transparent'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: { paddingHorizontal: 24, paddingVertical: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10, gap: 16 },
  actionSubRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btnPlay: { height: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  btnPlayText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  
  btnProminent: { flex: 2, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSecondary: { flex: 1.2, height: 44, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnDisabled: { flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  
  btnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  btnSecondaryText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  btnDisabledText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.4)' },
  
  badgeGold: { height: 44, borderRadius: Radius.md, backgroundColor: `${Colors.ratingGold}1F`, borderWidth: 1, borderColor: `${Colors.ratingGold}4D`, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  badgeGoldText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.ratingGold },
  btnFavorite: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnFavoriteActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

export default DetailActions;
