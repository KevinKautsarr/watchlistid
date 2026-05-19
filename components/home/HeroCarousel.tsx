import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Bookmark, Plus, ChevronLeft, ChevronRight, Star } from 'lucide-react-native';
import { Colors, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES, IconSize } from '@/constants/theme';
import { MediaItem } from '@/types';
import { textShadow, cursorPointer } from '@/utils/webStyles';


interface HeroCarouselProps {
  data: MediaItem[];
  width: number;
  height: number;
  onPressItem: (id: number, type: 'movie' | 'tv') => void;
  onToggleWL?: (movie: MediaItem) => void;
  isInWatchlist?: (id: number) => boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ 
  data, width, height, onPressItem, onToggleWL, isInWatchlist 
}) => {
  const [idx, setIdx] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const ref = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slides = data.slice(0, 10);

  useEffect(() => {
    const readyTimer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(readyTimer);
  }, []);

  const scrollTo = useCallback((i: number) => {
    let c = i;
    if (c < 0) c = slides.length - 1;
    else if (c >= slides.length) c = 0;
    setIdx(c);
    ref.current?.scrollTo({ x: c * width, animated: true });
  }, [slides.length, width]);

  const startAuto = useCallback(() => {
    timer.current = setInterval(() => {
      setIdx(prev => {
        const next = (prev + 1) % slides.length;
        ref.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 7000);
  }, [slides.length, width]);

  useEffect(() => {
    if (!isReady) return;
    startAuto();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startAuto, isReady]);

  const resetAuto = () => { if (timer.current) clearInterval(timer.current); startAuto(); };

  if (!slides.length) return null;
  const cur = slides[idx];
  const inWL = isInWatchlist ? isInWatchlist(cur?.id) : false;

  return (
    <View style={{ width, height, minHeight: height }}>
      {!isReady ? (
        <View style={{ width, height }}>
          <Image
            source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${slides[0].backdrop_path}` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            priority="high"
            accessibilityLabel="Hero banner backdrop loading"
            alt="Hero banner backdrop loading"
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,11,0.35)', 'rgba(10,10,11,0.80)', '#0A0A0B']}
            locations={[0, 0.4, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : (
        <ScrollView ref={ref} horizontal pagingEnabled scrollEnabled={false} showsHorizontalScrollIndicator={false}>
          {slides.map((m, i) => (
            <View key={m.id} style={{ width, height }}>
              <Image
                source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${m.backdrop_path}` }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                priority={i === 0 ? 'high' : 'low'}
                accessibilityLabel={`Hero banner backdrop ${'title' in m ? m.title : 'name' in m ? m.name : ''}`}
                alt={`Hero banner backdrop ${'title' in m ? m.title : 'name' in m ? m.name : ''}`}
              />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,11,0.35)', 'rgba(10,10,11,0.80)', '#0A0A0B']}
                locations={[0, 0.4, 0.7, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Overlay content */}
      <View style={s.heroContent}>
        <Text style={s.heroTitle} numberOfLines={2} allowFontScaling={false}>
          {cur ? ('title' in cur ? cur.title : 'name' in cur ? cur.name : '') : ''}
        </Text>
        <View style={s.heroMeta}>
          <View style={s.ratingPill}>
            <Star size={IconSize.xs} color={Colors.ratingGold} fill={Colors.ratingGold} strokeWidth={0} />
            <Text style={s.ratingScore} allowFontScaling={false}>{cur?.vote_average?.toFixed(1)}</Text>
          </View>
          <Text style={s.heroYear} allowFontScaling={false}>
            {cur ? ('release_date' in cur ? cur.release_date : 'first_air_date' in cur ? cur.first_air_date : '')?.split('-')[0] : ''}
          </Text>
        </View>
        <View style={s.heroButtons}>
          <TouchableOpacity 
            style={[s.playBtn, cursorPointer]} 
            activeOpacity={0.85} 
            onPress={() => onPressItem(cur.id, cur.media_type)}
          >
            <Play size={IconSize.sm} color={Colors.dark} fill={Colors.dark} strokeWidth={0} />
            <Text style={s.playBtnText} allowFontScaling={false}>Watch Now</Text>
          </TouchableOpacity>
          {onToggleWL && (
            <TouchableOpacity 
              style={[s.wlBtn, inWL && s.wlBtnActive, cursorPointer]} 
              activeOpacity={0.85} 
              onPress={() => onToggleWL(cur)}
            >
              {inWL ? <Bookmark size={IconSize.sm} color={Colors.white} fill={Colors.white} strokeWidth={0} /> : <Plus size={IconSize.lg} color={Colors.white} strokeWidth={2.5} />}
              <Text style={s.wlBtnText} allowFontScaling={false}>My List</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => { scrollTo(i); resetAuto(); }}>
              <View style={[s.dot, i === idx && s.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[s.arrow, { left: 14 }, cursorPointer]} onPress={() => { scrollTo(idx - 1); resetAuto(); }} activeOpacity={0.75}>
        <ChevronLeft size={IconSize.lg} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity style={[s.arrow, { right: 14 }, cursorPointer]} onPress={() => { scrollTo(idx + 1); resetAuto(); }} activeOpacity={0.75}>
        <ChevronRight size={IconSize.lg} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center',
  },
  heroTitle: {
    fontSize: FontSize.h1 * 1.1, fontWeight: FontWeight.black, color: Colors.white,
    letterSpacing: -0.5, lineHeight: 42, marginBottom: 8, textAlign: 'center',
    ...textShadow(Colors.overlay.dark, 0, 2, 12),
  },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,197,24,0.18)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  ratingScore: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.ratingGold },
  heroYear: { fontSize: FontSize.sm, color: Colors.text.secondary },
  heroButtons: { flexDirection: 'row', gap: 10, width: '100%', justifyContent: 'center', marginBottom: 16 },
  playBtn: { flex: 1, maxWidth: 165, height: 46, backgroundColor: Colors.white, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  playBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.dark },
  wlBtn: { flex: 1, maxWidth: 150, height: 46, backgroundColor: 'rgba(40,40,40,0.85)', borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  wlBtnActive: { backgroundColor: Colors.primary + 'D9' },
  wlBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.overlay.light50 },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  arrow: {
    position: 'absolute', top: '42%',
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.overlay.dark50, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.overlay.light20,
  },
});
