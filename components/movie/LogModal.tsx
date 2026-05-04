import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { X, Star, Calendar, AlertTriangle, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useSocial } from '../../context/SocialContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { Movie } from '../../types';

interface LogModalProps {
  visible: boolean;
  movie: Movie | null;
  onClose: () => void;
  existingLog?: any;
}

export default function LogModal({ visible, onClose, movie, existingLog }: LogModalProps) {
  const { t } = useLanguage();
  const { addLog } = useSocial();
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);

  // Simplified date handling for cross-platform
  const today = new Date().toISOString().split('T')[0];
  const [watchedDate, setWatchedDate] = useState(today);

  const { setRating: setLocalRating } = useWatchlist();

  if (!movie) return null;

  const handleSave = async () => {
    if (rating === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return; 
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const success = await addLog({
        movie_id: movie.id,
        media_type: movie.media_type || 'movie',
        movie_title: movie.title || (movie as any).name,
        poster_path: movie.poster_path || undefined,
        watched_at: watchedDate,
        rating: rating,
        review_text: reviewText.trim() || undefined,
        is_spoiler: isSpoiler,
      });

      if (success) {
        // Juga update rating di watchlist lokal agar sinkron
        setLocalRating(movie.id, rating);
        
        // Reset & Close
        setRating(0);
        setReviewText('');
        setIsSpoiler(false);
        onClose();
      }
    } catch (err) {
      console.error("Log Save Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        style={s.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.container}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={s.title} allowFontScaling={false}>
              {movie.media_type === 'tv' ? t('logShow') : t('logMovie')}
            </Text>
            <TouchableOpacity 
              style={[s.saveBtn, (rating === 0 || loading) && s.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={rating === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveText} allowFontScaling={false}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            {/* Movie Info */}
            <Text style={s.movieTitle} allowFontScaling={false}>{movie.title || (movie as any).name}</Text>
            <Text style={s.movieYear} allowFontScaling={false}>{movie.release_date?.split('-')[0]}</Text>

            {/* Date Picker (Simplified) */}
            <View style={s.section}>
              <View style={s.labelRow}>
                <Calendar size={16} color={Colors.text.secondary} />
                <Text style={s.label} allowFontScaling={false}>{t('watchedOn')}</Text>
              </View>
              <View style={s.dateOptions}>
                <TouchableOpacity 
                  style={[s.dateBtn, watchedDate === today && s.dateBtnActive]}
                  onPress={() => setWatchedDate(today)}
                >
                  <Text style={[s.dateBtnText, watchedDate === today && s.dateBtnTextActive]}>Today</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.dateInput}
                  value={watchedDate}
                  onChangeText={setWatchedDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.text.secondary}
                />
              </View>
            </View>

            {/* Rating */}
            <View style={s.section}>
              <Text style={s.label} allowFontScaling={false}>{t('yourRating')} <Text style={{color: Colors.primary}}>*</Text></Text>
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRating(star);
                    }}
                    style={s.starBtn}
                  >
                    <Star 
                      size={28} 
                      color={star <= rating ? '#F5C518' : 'rgba(255,255,255,0.1)'} 
                      fill={star <= rating ? '#F5C518' : 'transparent'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.ratingHint} allowFontScaling={false}>
                {rating > 0 ? `${rating} / 10` : t('ratingHintDefault')}
              </Text>
            </View>

            {/* Review Input */}
            <View style={s.section}>
              <Text style={s.label} allowFontScaling={false}>{t('reviewOptional')}</Text>
              <TextInput
                style={s.textArea}
                placeholder={t('reviewPlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                textAlignVertical="top"
                value={reviewText}
                onChangeText={setReviewText}
                allowFontScaling={false}
              />
            </View>

            {/* Spoiler Toggle */}
            <View style={s.spoilerSection}>
              <TouchableOpacity 
                style={s.spoilerBtn} 
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSpoiler(!isSpoiler);
                }}
              >
                <View style={[s.checkbox, isSpoiler && s.checkboxActive]}>
                  {isSpoiler && <Check size={14} color="#000" strokeWidth={3} />}
                </View>
                <AlertTriangle size={16} color={isSpoiler ? Colors.primary : Colors.text.secondary} />
                <Text style={[s.spoilerText, isSpoiler && s.spoilerTextActive]} allowFontScaling={false}>
                  {t('containsSpoiler')}
                </Text>
              </TouchableOpacity>
              <Text style={s.spoilerDesc} allowFontScaling={false}>
                {t('spoilerDesc')}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    height: '85%',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  closeBtn: { padding: 4 },
  saveBtn: { 
    backgroundColor: Colors.primary, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: Radius.full 
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  
  content: { padding: Spacing.xl },
  movieTitle: { fontSize: 24, fontWeight: FontWeight.black, color: Colors.white, marginBottom: 2 },
  movieYear: { fontSize: FontSize.base, color: Colors.text.secondary, marginBottom: Spacing.xl },
  
  section: { marginBottom: Spacing.xl },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: 10 },
  
  dateOptions: { flexDirection: 'row', gap: 10 },
  dateBtn: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: Radius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 44,
  },
  dateBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  dateBtnText: { color: Colors.text.secondary, fontWeight: FontWeight.bold },
  dateBtnTextActive: { color: Colors.white },
  dateInput: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: Radius.md, 
    height: 44, 
    color: Colors.white, 
    paddingHorizontal: 16,
    textAlign: 'center',
  },

  starsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  starBtn: { padding: 2 },
  ratingHint: { textAlign: 'center', color: Colors.text.secondary, fontSize: FontSize.sm },

  textArea: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: Spacing.lg,
    color: Colors.white,
    fontSize: FontSize.base,
    minHeight: 120,
  },

  spoilerSection: { marginTop: 4 },
  spoilerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  spoilerText: { flex: 1, color: Colors.text.secondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  spoilerTextActive: { color: Colors.primary },
  spoilerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 16, marginLeft: 32 },
});
