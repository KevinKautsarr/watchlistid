import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, ActivityIndicator, Platform, Pressable, LayoutChangeEvent,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { supabase } from '@/supabase';
import { Colors, Spacing, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES } from '@/constants/theme';
import SafeImage from '@/components/common/SafeImage';
import { cursorPointer } from '@/utils/webStyles';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLogs } from '@/context/LogContext';

// ── Constants ──────────────────────────────────────────────────────────────
const GAP         = 4;
const CELL_MAX    = Platform.OS === 'web' ? 16 : 14;
const CELL_MIN    = 8;
const DAY_COL_W   = 30; // fixed width for day-of-week label column

const LEVEL_COLORS = [
  'rgba(199,31,55, 0.08)', // 0 film  — hampir transparan
  'rgba(199,31,55, 0.35)', // 1–2     — merah muda redup
  'rgba(199,31,55, 0.65)', // 3–4     — merah sedang
  'rgba(199,31,55, 1.00)', // 5+      — merah penuh (brand primary)
];

const getLevel = (n: number) => n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : 3;

type Range = '1M' | '3M' | '6M' | '1Y';
const MONTHS_MAP: Record<Range, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };

// Mon-Sun labels (all 7, skip visually alternating for space)
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// ── Helpers ─────────────────────────────────────────────────────────────────
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const formatDisplay = (s: string, locale: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

function buildGrid(range: Range, locale: string) {
  const today = new Date(); today.setHours(23,59,59,999);
  const start = new Date(); start.setMonth(start.getMonth() - MONTHS_MAP[range]); start.setHours(0,0,0,0);

  // Snap back to nearest Monday
  const dow = start.getDay();
  const snap = new Date(start);
  snap.setDate(snap.getDate() - (dow === 0 ? 6 : dow - 1));

  const weeks: (string|null)[][] = [];
  const monthLabels: { name: string; count: number }[] = [];
  const cur = new Date(snap);
  let lastMonth = ''; let mCount = 0;

  while (cur <= today) {
    const week: (string|null)[] = [];
    const wMonth = new Date(cur).toLocaleDateString(locale, { month: 'short' });

    for (let d = 0; d < 7; d++) {
      const cell = new Date(cur); cell.setDate(cell.getDate() + d);
      week.push(cell < start || cell > today ? null : toDateStr(cell));
    }
    weeks.push(week);

    if (wMonth !== lastMonth) {
      if (lastMonth) monthLabels.push({ name: lastMonth, count: mCount });
      lastMonth = wMonth; mCount = 1;
    } else { mCount++; }

    cur.setDate(cur.getDate() + 7);
  }
  if (lastMonth) monthLabels.push({ name: lastMonth, count: mCount });
  return { weeks, monthLabels };
}

// ── Day Detail Modal ─────────────────────────────────────────────────────────
interface DayLog { movie_id: number; movie_title: string; poster_path: string|null; rating: number|null; media_type: string; }

function DayDetailModal({ visible, date, logs, loading, onClose, locale }: {
  visible: boolean; date: string|null; logs: DayLog[]; loading: boolean; onClose: () => void; locale: string;
}) {
  const isWeb = Platform.OS === 'web';
  const { t } = useLanguage();
  const body = (
    <View style={isWeb ? s.webModal : s.bottomSheet}>
      {!isWeb && <View style={s.handle} />}
      <View style={s.modalHeader}>
        <Text style={s.modalDate}>{date ? formatDisplay(date, locale) : ''}</Text>
        <TouchableOpacity onPress={onClose} style={[s.closeBtn, cursorPointer]} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <X size={18} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 32 }} />
      ) : logs.length === 0 ? (
        <View style={s.emptyDay}>
          <Text style={s.emptyDayText}>{t('activityNoLogs')}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: isWeb ? 340 : 420 }}>
          <Text style={s.logCountText}>{logs.length} {t('activityFilmsWatched')}</Text>
          {logs.map((log, i) => (
            <TouchableOpacity key={i} style={[s.logItem, cursorPointer]} activeOpacity={0.75}
              onPress={() => { onClose(); setTimeout(() => router.push({ pathname: '/movie/[id]', params: { id: log.movie_id.toString(), type: log.media_type } } as any), 300); }}>
              <View style={s.logPoster}>
                <SafeImage uri={log.poster_path ? `${TMDB_IMAGE_SIZES.small}${log.poster_path}` : null}
                  fallbackType="movie" style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              </View>
              <View style={s.logInfo}>
                <Text style={s.logTitle} numberOfLines={2}>{log.movie_title}</Text>
                {log.rating != null && <Text style={s.logRating}>⭐ {log.rating}/10</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType={isWeb ? 'fade' : 'slide'}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={isWeb ? undefined : s.bsAnchor} onPress={e => e.stopPropagation()}>
          {body}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Legend with Tooltip ──────────────────────────────────────────────────────
const LEVEL_LABELS = ['0', '1–2', '3–4', '5+'];

function LegendWithTooltip({ cellColors, t }: { cellColors: string[]; t: (k: any) => string }) {
  const [visible, setVisible] = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, 2500);
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 6, duration: 160, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    visible ? hide() : show();
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <View style={s.legendWrapper}>
      {/* Tooltip that slides up above the legend */}
      {visible && (
        <Animated.View style={[s.tooltip, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.tooltipRow}>
            {cellColors.map((c, i) => (
              <View key={i} style={s.tooltipItem}>
                <View style={[s.tooltipSwatch, { backgroundColor: c }]} />
                <Text style={s.tooltipLabel}>{LEVEL_LABELS[i]}</Text>
              </View>
            ))}
          </View>
          <View style={s.tooltipArrow} />
        </Animated.View>
      )}

      {/* Tappable legend row */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={s.legend}
        accessibilityRole="button"
        accessibilityLabel="Tap to see activity level ranges"
      >
        <Text style={s.legendTxt}>{t('activityFew')}</Text>
        {cellColors.map((c, i) => (
          <View key={i} style={[s.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={s.legendTxt}>{t('activityMany')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ActivityHeatmap({ userId }: { userId: string }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { userLogs } = useLogs();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  // Day-of-week labels based on language
  const DAY_LABELS_LOC = language === 'id'
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [range, setRange]         = useState<Range>('6M');
  const [dayMap, setDayMap]       = useState<Record<string,number>>({});
  const [loading, setLoading]     = useState(true);
  const [gridWidth, setGridWidth] = useState(0); // inner grid width (excluding day-label col)

  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedDate, setSelectedDate]   = useState<string|null>(null);
  const [dayLogs, setDayLogs]             = useState<DayLog[]>([]);
  const [dayLogsLoading, setDayLogsLoading] = useState(false);

  const fetchHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date();
      from.setMonth(from.getMonth() - MONTHS_MAP[range]);
      const { data, error } = await supabase
        .from('movie_logs').select('watched_at')
        .eq('user_id', userId).gte('watched_at', from.toISOString());
      if (error) throw error;
      const map: Record<string,number> = {};
      (data||[]).forEach(row => {
        if (row.watched_at) { const d = row.watched_at.split('T')[0]; map[d] = (map[d]||0)+1; }
      });
      setDayMap(map);
    } catch(e) { console.error('ActivityHeatmap:', e); }
    finally { setLoading(false); }
  }, [userId, range]);

  useEffect(() => {
    if (userId) fetchHeatmap();
  }, [fetchHeatmap, userId, userId === user?.id ? userLogs : null]);

  const fetchDayLogs = async (date: string) => {
    setDayLogsLoading(true); setDayLogs([]);
    try {
      const { data, error } = await supabase.from('movie_logs')
        .select('movie_id, movie_title, poster_path, rating, media_type')
        .eq('user_id', userId)
        .gte('watched_at', `${date}T00:00:00`).lte('watched_at', `${date}T23:59:59`)
        .order('watched_at', { ascending: true });
      if (error) throw error;
      setDayLogs((data as any[] || []) as DayLog[]);
    } catch(e) { console.error('DayLogs:', e); }
    finally { setDayLogsLoading(false); }
  };

  const handleCellPress = (date: string, count: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date); setDayLogs([]); setModalVisible(true);
    if (count > 0) fetchDayLogs(date);
  };

  const { weeks, monthLabels } = buildGrid(range, locale);
  const numWeeks = weeks.length;

  // Auto-fit cell size: fill available width, capped between CELL_MIN and CELL_MAX
  const cellSize = gridWidth > 0
    ? Math.min(CELL_MAX, Math.max(CELL_MIN, Math.floor((gridWidth - (numWeeks - 1) * GAP) / numWeeks)))
    : CELL_MAX;

  // If even at CELL_MIN the grid would overflow, enable scroll
  const minGridNeeded = numWeeks * (CELL_MIN + GAP);
  const needsScroll   = gridWidth > 0 && minGridNeeded > gridWidth;

  const hasActivity = Object.values(dayMap).some(v => v > 0);

  if (loading) return <View style={s.loadWrap}><ActivityIndicator size="small" color={Colors.primary} /></View>;
  if (!hasActivity) return null;

  const gridBody = (
    <View>
      {/* Month labels — horizontal, one per month */}
      <View style={{ flexDirection: 'row', paddingLeft: DAY_COL_W, marginBottom: 4 }}>
        {monthLabels.map((ml, i) => {
          const w = ml.count * (cellSize + GAP);
          return (
            <View key={i} style={{ width: w, overflow: 'hidden', paddingRight: 2 }}>
              <Text style={s.monthLabel} numberOfLines={1}>{ml.name}</Text>
            </View>
          );
        })}
      </View>

      {/* Day labels + week columns */}
      <View style={{ flexDirection: 'row' }}>
        {/* Day-of-week column */}
        <View style={{ width: DAY_COL_W }}>
          {DAY_LABELS_LOC.map((label, i) => (
            <View key={i} style={{ height: cellSize + GAP, justifyContent: 'center' }}>
              {/* Show every other label to avoid clutter when cells are small */}
              {(i % 2 === 0) && <Text style={s.dayLabel}>{label}</Text>}
            </View>
          ))}
        </View>

        {/* Week columns */}
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {week.map((day, di) =>
                !day ? (
                  <View key={di} style={{ width: cellSize, height: cellSize }} />
                ) : (
                  <TouchableOpacity
                    key={day}
                    activeOpacity={0.75}
                    style={{ width: cellSize, height: cellSize, borderRadius: 2, backgroundColor: LEVEL_COLORS[getLevel(dayMap[day]||0)] }}
                    onPress={() => handleCellPress(day, dayMap[day]||0)}
                  />
                )
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Title + filter bar */}
      <View style={s.topRow}>
        <Text style={s.title}>{t('activityTitle')}</Text>
        <View style={s.filters}>
          {(['1M','3M','6M','1Y'] as Range[]).map(r => (
            <TouchableOpacity key={r} style={[s.fBtn, range===r && s.fBtnOn, cursorPointer]} onPress={() => setRange(r)}>
              <Text style={[s.fBtnTxt, range===r && s.fBtnTxtOn]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Measure available grid width — render always with opacity so onLayout fires immediately */}
      <View
        onLayout={(e: LayoutChangeEvent) => setGridWidth(e.nativeEvent.layout.width - DAY_COL_W)}
        style={{ width: '100%' }}
      >
        <View style={{ opacity: gridWidth > 0 ? 1 : 0 }}>
          {needsScroll ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>{gridBody}</ScrollView>
          ) : (
            gridBody
          )}
        </View>
      </View>

      {/* Legend */}
      <LegendWithTooltip cellColors={LEVEL_COLORS} t={t} />

      <DayDetailModal
        visible={modalVisible} date={selectedDate} logs={dayLogs} locale={locale}
        loading={dayLogsLoading} onClose={() => { setModalVisible(false); setDayLogs([]); }}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md, marginBottom: Spacing.lg },
  loadWrap:  { paddingVertical: Spacing.xl, alignItems: 'center' },

  topRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:   { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold, letterSpacing: -0.2 },
  filters: { flexDirection: 'row', gap: 4 },
  fBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  fBtnOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fBtnTxt: { color: 'rgba(255,255,255,0.62)', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  fBtnTxtOn: { color: Colors.white },

  monthLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: FontWeight.semibold },
  dayLabel:   { color: 'rgba(255,255,255,0.3)', fontSize: 9 },

  legend:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, justifyContent: 'flex-end' },
  legendCell: { borderRadius: 2, width: 12, height: 12 },
  legendTxt:  { color: 'rgba(255,255,255,0.3)', fontSize: 10 },

  // Legend tooltip
  legendWrapper: { position: 'relative', alignItems: 'flex-end', marginTop: Spacing.sm },
  tooltip: {
    position: 'absolute',
    bottom: 28,
    right: 0,
    backgroundColor: 'rgba(26,16,24,0.96)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(199,31,55,0.25)',
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.4)' } as any,
      default: {},
    }),
  },
  tooltipRow:   { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tooltipItem:  { alignItems: 'center', gap: 4 },
  tooltipSwatch:{ width: 12, height: 12, borderRadius: 2 },
  tooltipLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600' as const },
  tooltipArrow: {
    position: 'absolute',
    bottom: -5,
    right: 20,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(26,16,24,0.96)',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(199,31,55,0.25)',
    transform: [{ rotate: '45deg' }],
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? 'rgba(5, 4, 6, 0.65)' : 'rgba(0,0,0,0.72)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      } as any,
    }),
  },
  bsAnchor: { width: '100%' },
  bottomSheet: { backgroundColor: '#1A1018', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing.xl, paddingBottom: 44, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: Spacing.md },
  webModal: {
    backgroundColor: 'rgba(26, 16, 24, 0.94)',
    borderRadius: 20,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    width: 420,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      } as any,
    }),
  },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, gap: 8 },
  modalDate:   { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.black, flex: 1, letterSpacing: -0.2 },
  closeBtn:    { padding: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyDay:    { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyDayText:{ color: 'rgba(255,255,255,0.62)', fontSize: FontSize.sm, fontStyle: 'italic' },

  logCountText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: Spacing.md, letterSpacing: 0.8, textTransform: 'uppercase' },
  logItem:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    padding: 8,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logPoster:{ width: 40, height: 60, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0 },
  logInfo:  { flex: 1, gap: 2 },
  logTitle: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },
  logRating:{ color: Colors.ratingGold, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
