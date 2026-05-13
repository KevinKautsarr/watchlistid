import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, BookmarkPlus, BookmarkCheck, Star } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, IconSize } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface DetailActionsProps {
  featuredTrailer: any;
  inWatchlist: boolean;
  userRating: number | null;
  onPlay: () => void;
  onWatchlist: () => void;
  onRate: () => void;
  t: any;
}

export const DetailActions: React.FC<DetailActionsProps> = ({ 
  featuredTrailer, inWatchlist, userRating, onPlay, onWatchlist, onRate, t 
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
        <TouchableOpacity 
          style={[styles.btnWatchlist, !!inWatchlist && styles.btnWatchlistActive, cursorPointer]}
          onPress={onWatchlist}
        >
          {inWatchlist ? (
            <BookmarkCheck size={IconSize.md} color={Colors.white} fill={Colors.white} strokeWidth={0} />
          ) : (
            <BookmarkPlus size={IconSize.md} color={Colors.white} strokeWidth={2} />
          )}
          <Text style={[styles.btnWatchlistText, !!inWatchlist && styles.btnWatchlistTextActive]} allowFontScaling={false}>
            {inWatchlist ? t('inWatchlist') : t('addToWatchlist')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btnRate, !!userRating && styles.btnRateActive, cursorPointer]}
          onPress={onRate}
        >
          <Star size={IconSize.xs} color={userRating ? Colors.ratingGold : Colors.primary} fill={userRating ? Colors.ratingGold : "transparent"} strokeWidth={2} />
          <Text style={[styles.btnRateText, !!userRating && styles.btnRateTextActive]} allowFontScaling={false}>
            {userRating ? `${t('log')}ed` : t('log')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionRow: { paddingHorizontal: 24, paddingVertical: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10, gap: 16 },
  actionSubRow: { flexDirection: 'row', gap: 12 },
  btnPlay: { height: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  btnPlayText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  btnWatchlist: { flex: 2, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  btnWatchlistActive: { backgroundColor: Colors.primary },
  btnWatchlistText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  btnWatchlistTextActive: { color: Colors.white },
  btnRate: { flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: Colors.overlay.light10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnRateActive: { backgroundColor: `${Colors.ratingGold}26`, borderWidth: 1, borderColor: `${Colors.ratingGold}4D` },
  btnRateText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  btnRateTextActive: { color: Colors.ratingGold },
});
