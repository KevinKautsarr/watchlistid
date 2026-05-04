import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Star, Film, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { MovieLog } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface DiaryCardProps {
  log: MovieLog;
  onDelete: (id: string) => void;
  onPressPoster: (movieId: number) => void;
  rank?: number;
}

const DiaryCard: React.FC<DiaryCardProps> = ({ log, onDelete, onPressPoster, rank }) => {
  const { t } = useLanguage();
  const [isRevealed, setIsRevealed] = useState(!log.is_spoiler);

  const handleToggleSpoiler = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date} allowFontScaling={false}>
            {new Date(log.watched_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        
        <View style={styles.headerCenter}>
          {rank != null && (
            <Text style={styles.rankText} allowFontScaling={false}>#{rank}</Text>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => onDelete(log.id)} 
            style={styles.deleteBtn}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Trash2 size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.posterContainer}
          activeOpacity={0.8}
          onPress={() => onPressPoster(log.movie_id)}
        >
          {log.poster_path ? (
            <Image 
              source={{ uri: `https://image.tmdb.org/t/p/w200${log.poster_path}` }} 
              style={styles.poster} 
              contentFit="cover" 
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Film size={24} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.title} allowFontScaling={false}>{log.movie_title}</Text>
          
          {log.rating ? (
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  color="#F5C518" 
                  fill={i < Math.floor(log.rating! / 2) ? "#F5C518" : "transparent"} 
                />
              ))}
            </View>
          ) : null}
          {log.review_text && (
            <View style={styles.reviewWrapper}>
              {!isRevealed ? (
                <TouchableOpacity 
                  style={styles.spoilerOverlay} 
                  onPress={handleToggleSpoiler}
                  activeOpacity={0.9}
                >
                  <EyeOff size={16} color={Colors.primary} style={{ marginBottom: 4 }} />
                  <Text style={styles.spoilerText} allowFontScaling={false}>
                    {t('clickToReveal')}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.review} numberOfLines={isRevealed ? undefined : 3} allowFontScaling={false}>
                    {log.review_text}
                  </Text>
                  {log.is_spoiler && (
                    <TouchableOpacity onPress={handleToggleSpoiler} style={styles.hideBtn}>
                      <Text style={styles.hideBtnText}>{t('hideSpoilers')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  rankText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.black,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  posterContainer: {
    width: 70,
    height: 105,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reviewWrapper: {
    marginTop: 4,
  },
  review: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  spoilerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.sm,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  spoilerText: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  hideBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  hideBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  }
});

export default DiaryCard;
