import React, { useState } from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { X, Star, Calendar, AlertTriangle, Check, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { Colors, Spacing, Radius, FontSize, FontWeight, IconSize, Shadow } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import { useLanguage } from '@/context/LanguageContext';
import { useSocial } from '@/context/SocialContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { Movie, MovieLog } from '@/types';
import StarRating from '@/components/common/StarRating';

interface LogModalProps {
  visible: boolean;
  movie: Movie | null;
  onClose: () => void;
  existingLog?: MovieLog;
}

export default function LogModal({ visible, onClose, movie, existingLog }: LogModalProps) {
  const { t } = useLanguage();
  const { addLog, addReview } = useSocial();
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
    setIsLoading(true);

    try {
      const success = await addLog({
        movie_id: movie.id,
        media_type: movie.media_type || 'movie',
        movie_title: 'title' in movie ? movie.title : movie.name,
        poster_path: movie.poster_path || undefined,
        watched_at: watchedDate,
        rating: rating,
        review_text: reviewText.trim() || undefined,
        is_spoiler: isSpoiler,
      });

      if (success) {
        // Save to professional reviews table if there is content
        if (reviewText.trim()) {
          await addReview({
            movie_id: movie.id,
            media_type: movie.media_type || 'movie',
            content: reviewText.trim(),
            rating: rating,
            is_spoiler: isSpoiler,
          });
        }

        // Juga update rating di watchlist lokal agar sinkron
        setLocalRating(movie.id, rating);
        
        // Reset & Close
        setRating(0);
        setReviewText('');
        setIsSpoiler(false);
        onClose();
      } else {
        // Fallback alert because Toast might be hidden behind Modal
        Alert.alert('Error', 'Failed to save movie log. Please check your connection or profile.');
      }
    } catch (err) {
      const error = err as Error;
      console.error("Log Save Error:", error);
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
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
            <TouchableOpacity style={[s.closeBtn, cursorPointer]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close modal">
              <X size={IconSize.lg} color={Colors.white} />
            </TouchableOpacity>
            <Text style={s.title} allowFontScaling={false}>
              {movie.media_type === 'tv' ? t('logShow') : t('logMovie')}
            </Text>
            <TouchableOpacity 
              style={[s.saveBtn, (rating === 0 || isLoading) && s.saveBtnDisabled, cursorPointer]} 
              onPress={handleSave}
              disabled={rating === 0 || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Save review"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.saveText} allowFontScaling={false}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
            <Star size={IconSize.lg} color={Colors.primary} fill={Colors.primary} />
            <Text style={s.movieTitle} allowFontScaling={false}>{'title' in movie ? movie.title : movie.name}</Text>
            <Text style={s.movieYear} allowFontScaling={false}>{('release_date' in movie ? movie.release_date : movie.first_air_date)?.split('-')[0]}</Text>

            {/* Date Picker (Simplified) */}
            <View style={s.section}>
              <View style={s.labelRow}>
                <Calendar size={IconSize.sm} color={Colors.text.secondary} />
                <Text style={s.label} allowFontScaling={false}>{t('watchedOn')}</Text>
              </View>
              <View style={s.dateOptions}>
                <TouchableOpacity 
                  style={[s.dateBtn, watchedDate === today && s.dateBtnActive, cursorPointer]}
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

            <View style={s.section}>
              <Text style={s.label} allowFontScaling={false}>{t('yourRating')} <Text style={s.required}>*</Text></Text>
              <View style={s.starsContainer}>
                <StarRating 
                  rating={rating / 2} 
                  size={40} 
                  interactive={true} 
                  onRatingChange={(newRating) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRating(newRating * 2);
                  }}
                />
              </View>
              <Text style={s.ratingHint} allowFontScaling={false}>
                {rating > 0 ? `${rating / 2} / 5 stars` : t('ratingHintDefault')}
              </Text>
            </View>

            {/* Review Input */}
            <View style={s.section}>
              <View style={s.labelRow}>
                <Text style={s.label} allowFontScaling={false}>{t('reviewOptional')}</Text>
                <TouchableOpacity 
                  style={[s.previewToggle, cursorPointer]} 
                  onPress={() => setShowPreview(!showPreview)}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle markdown preview"
                >
                  <Eye size={14} color={showPreview ? Colors.primary : Colors.text.secondary} />
                  <Text style={[s.previewToggleTxt, showPreview && s.previewToggleTxtActive]}>Preview</Text>
                </TouchableOpacity>
              </View>
              
              {showPreview ? (
                <View style={s.previewArea}>
                  {reviewText.trim() ? (
                    <Markdown style={markdownStyles}>{reviewText}</Markdown>
                  ) : (
                    <Text style={s.previewPholder}>Type something to see preview...</Text>
                  )}
                </View>
              ) : (
                <TextInput
                  style={s.textArea}
                  placeholder={t('reviewPlaceholder')}
                  placeholderTextColor={Colors.overlay.light30}
                  multiline
                  textAlignVertical="top"
                  value={reviewText}
                  onChangeText={setReviewText}
                  allowFontScaling={false}
                />
              )}
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
                  {isSpoiler && <Check size={IconSize.xs} color={Colors.dark} strokeWidth={3} />}
                </View>
                <AlertTriangle size={IconSize.sm} color={isSpoiler ? Colors.primary : Colors.text.secondary} />
                <Text style={[s.spoilerText, isSpoiler && s.spoilerTextActive]} allowFontScaling={false}>
                  {t('containsSpoiler')}
                </Text>
              </TouchableOpacity>
              <Text style={s.spoilerDesc} allowFontScaling={false}>
                {t('spoilerDesc')}
              </Text>
            </View>

            <View style={s.bottomSpacer} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay.dark85,
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
    borderColor: Colors.overlay.light5,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  closeBtn: { padding: 4 },
  saveBtn: { 
    backgroundColor: Colors.accentBlue, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
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
    backgroundColor: Colors.overlay.light5, 
    borderRadius: Radius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 44,
  },
  dateBtnActive: { backgroundColor: Colors.overlay.light15, borderWidth: 1, borderColor: Colors.overlay.light30 },
  dateBtnText: { color: Colors.text.secondary, fontWeight: FontWeight.bold },
  dateBtnTextActive: { color: Colors.white },
  dateInput: { 
    flex: 1, 
    backgroundColor: Colors.overlay.light5, 
    borderRadius: Radius.md, 
    height: 44, 
    color: Colors.white, 
    paddingHorizontal: 16,
    textAlign: 'center',
  },

  starsContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingHint: { textAlign: 'center', color: Colors.text.secondary, fontSize: FontSize.sm, marginTop: 4 },

  textArea: {
    backgroundColor: Colors.overlay.light3,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.overlay.light8,
    padding: Spacing.lg,
    color: Colors.white,
    fontSize: FontSize.base,
    minHeight: 120,
  },

  spoilerSection: { marginTop: 4 },
  spoilerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.overlay.light20, alignItems: 'center', justifyContent: 'center' },
  spoilerText: { flex: 1, color: Colors.text.secondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  spoilerTextActive: { color: Colors.accentBlue },
  checkboxActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  spoilerDesc: { fontSize: FontSize.xs, color: Colors.overlay.light40, lineHeight: 16, marginLeft: 32 },

  previewToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  previewToggleTxt: { fontSize: FontSize.xs, color: Colors.text.secondary, fontWeight: FontWeight.bold },
  previewToggleTxtActive: { color: Colors.primary },
  previewArea: {
    backgroundColor: Colors.overlay.light3,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.overlay.light8,
    padding: Spacing.lg,
    minHeight: 120,
  },
  previewPholder: { color: Colors.overlay.light30, fontSize: FontSize.sm, fontStyle: 'italic' },
  required: { color: Colors.primary },
  bottomSpacer: { height: 40 },
});

const markdownStyles = {
  body: { color: Colors.white, fontSize: FontSize.base },
  heading1: { color: Colors.primary, fontWeight: FontWeight.black, marginVertical: 10 },
  heading2: { color: Colors.white, fontWeight: FontWeight.bold, marginVertical: 8 },
  code_inline: { backgroundColor: Colors.overlay.light10, padding: 4, borderRadius: 4, color: Colors.primary },
  blockquote: { borderLeftWidth: 4, borderLeftColor: Colors.primary, paddingLeft: 12, marginVertical: 10 },
};
