import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  Platform, StatusBar, Modal, Animated, Share
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { router } from 'expo-router';

import { 
  ChevronLeft, BookmarkPlus, BookmarkCheck, Share2, Star, TrendingUp, Calendar, Clock, Globe, Info, Play
} from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, TMDB_IMAGE_SIZES, Shadow } from '../constants/theme';
import { useWatchlist } from '../context/WatchlistContext';
import { useMovieDetails } from '../hooks/useMovies';
import TrailerCard from '../components/movie/TrailerCard';
import CastCard from '../components/movie/CastCard';
import MovieDetailTable from '../components/movie/MovieDetailTable';
import PosterCard from '../components/common/PosterCard';
import RatingBadge from '../components/common/RatingBadge';

const { width } = Dimensions.get('window');

interface MovieDetailScreenProps {
  route: RouteProp<any, any>;
  navigation: NativeStackNavigationProp<any>;
}

import { useLocalSearchParams } from 'expo-router';

const MovieDetailScreen: React.FC<MovieDetailScreenProps> = ({ route, navigation }): React.JSX.Element => {
  const params = useLocalSearchParams();
  const actualId = params.id || params.movieId;
  const insets = useSafeAreaInsets();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getRating, setRating, addToRecentlyViewed } = useWatchlist();
  
  const { data, isLoading: loading } = useMovieDetails(Number(actualId));
  const movie = data?.details;
  const credits = data?.credits?.cast?.slice(0, 15) || [];
  const videos = data?.videos?.results?.filter(v => v.site === 'YouTube') || [];
  const reviews = data?.reviews?.results?.slice(0, 2) || [];
  const similar = data?.similar?.results?.slice(0, 10) || [];
  const releaseDates = data?.releaseDates?.results || [];
  const keywords = data?.keywords?.keywords?.slice(0, 10) || [];
  
  const [expandedStory, setExpandedStory] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (actualId) {
      addToRecentlyViewed(Number(actualId));
    }
  }, [actualId]);

  if (loading || !movie) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.dark }} allowFontScaling={false}>Loading...</Text>
      </View>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);
  const userRating = getRating(movie.id);

  let ageRating = 'NR';
  if (releaseDates) {
    const usRelease = releaseDates.find((r: any) => r.iso_3166_1 === 'US');
    if (usRelease && usRelease.release_dates.length > 0) {
      const rating = usRelease.release_dates.find((r: any) => r.certification !== '');
      if (rating) ageRating = rating.certification;
    }
  }

  const handleWatchlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (inWatchlist) removeFromWatchlist(movie.id);
    else addToWatchlist(movie);
  };

  const openTrailer = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${key}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out "${movie.title}" on CineList! ⭐ ${movie.vote_average?.toFixed(1)}/10`,
        title: movie.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const featuredTrailer = videos.find(v => v.type === "Trailer");

  const submitRating = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRating(movie.id, tempRating);
    setShowRatingModal(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <TouchableOpacity 
        style={[styles.backBtn, { top: insets.top + 10 }]} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}
        activeOpacity={0.8}
      >
        <ChevronLeft size={24} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.shareBtn, { top: insets.top + 10 }]} 
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Share2 size={20} color={Colors.white} strokeWidth={2} />
      </TouchableOpacity>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={styles.heroWrap}>
          <Image 
            source={{ uri: `${TMDB_IMAGE_SIZES.backdrop}${movie.backdrop_path}` }} 
            style={styles.backdrop} 
            contentFit="cover" 
          />
          <LinearGradient
            colors={['transparent', 'transparent', Colors.background]}
            locations={[0, 0.4, 1]}
            style={styles.backdropOverlay}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.movieTitle} allowFontScaling={false}>{movie.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} allowFontScaling={false}>{movie.release_date?.substring(0,4)}</Text>
            <View style={styles.agePill}><Text style={styles.agePillText} allowFontScaling={false}>{ageRating}</Text></View>
            <Text style={styles.metaText} allowFontScaling={false}>{movie.runtime ? `${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m` : 'N/A'}</Text>
          </View>
          {movie.tagline ? <Text style={styles.tagline} allowFontScaling={false}>{movie.tagline}</Text> : null}
        </View>

        <View style={styles.ratingBlock}>
          <View style={styles.ratingCol}>
            <Text style={styles.ratingLabel} allowFontScaling={false}>IMDB RATING</Text>
            <View style={styles.scoreRow}>
              <Star size={28} color="#F5C518" fill="#F5C518" strokeWidth={0} />
              <Text style={styles.scoreVal} allowFontScaling={false}>{movie.vote_average?.toFixed(1)}</Text>
              <Text style={styles.scoreMax} allowFontScaling={false}>/10</Text>
            </View>
            <Text style={styles.voteCount} allowFontScaling={false}>{movie.vote_count?.toLocaleString()} votes</Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.ratingCol}>
            <Text style={styles.ratingLabel} allowFontScaling={false}>POPULARITY</Text>
            <TrendingUp size={24} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.popScore} allowFontScaling={false}>{movie.popularity?.toFixed(0)}</Text>
          </View>
          <View style={styles.vDivider} />
          <TouchableOpacity 
            style={styles.ratingCol} 
            activeOpacity={0.7}
            onPress={() => {
              setTempRating(userRating || 0);
              setShowRatingModal(true);
            }}
          >
            <Text style={styles.ratingLabel} allowFontScaling={false}>YOUR RATING</Text>
            {userRating ? (
              <>
                <Star size={24} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
                <Text style={styles.userRateScore} allowFontScaling={false}>{userRating}/10</Text>
              </>
            ) : (
              <>
                <Star size={24} color={Colors.surface} strokeWidth={1.5} />
                <Text style={styles.rateTextAction} allowFontScaling={false}>Rate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          {featuredTrailer && (
            <TouchableOpacity 
              style={styles.btnPlay}
              onPress={() => openTrailer(featuredTrailer.key)}
              activeOpacity={0.8}
            >
              <Play size={22} color={Colors.white} fill={Colors.white} strokeWidth={0} />
              <Text style={styles.btnPlayText} allowFontScaling={false}>Play Trailer</Text>
            </TouchableOpacity>
          )}
          <View style={styles.actionSubRow}>
            <TouchableOpacity 
              style={[styles.btnWatchlist, inWatchlist && styles.btnWatchlistActive]}
            onPress={handleWatchlist}
          >
            {inWatchlist ? (
              <BookmarkCheck size={22} color={Colors.white} fill={Colors.white} strokeWidth={0} />
            ) : (
              <BookmarkPlus size={22} color={Colors.white} strokeWidth={2} />
            )}
            <Text style={[styles.btnWatchlistText, inWatchlist && styles.btnWatchlistTextActive]} allowFontScaling={false}>
              {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.btnRate}
            onPress={() => {
              setTempRating(userRating || 0);
              setShowRatingModal(true);
            }}
          >
            <Star size={16} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.btnRateText} allowFontScaling={false}>Rate</Text>
          </TouchableOpacity>
          </View>
        </View>

        {videos.length > 0 && (
          <View style={styles.trailerSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle} allowFontScaling={false}>Videos</Text>
                <Text style={styles.sectionSubtitle} allowFontScaling={false}>{videos.length} videos</Text>
              </View>
            </View>

            {featuredTrailer && (
              <TrailerCard 
                video={featuredTrailer} 
                featured 
                onPress={() => openTrailer(featuredTrailer.key)} 
              />
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {videos.filter(v => v.id !== featuredTrailer?.id).map(video => (
                <TrailerCard 
                  key={video.id} 
                  video={video} 
                  onPress={() => openTrailer(video.key)} 
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.storySection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Storyline</Text>
          <Text 
            style={styles.overviewText} 
            numberOfLines={expandedStory ? undefined : 3}
            allowFontScaling={false}
          >
            {movie.overview}
          </Text>
          {movie.overview?.length > 100 && (
            <TouchableOpacity onPress={() => setExpandedStory(!expandedStory)}>
              <Text style={styles.readMore} allowFontScaling={false}>{expandedStory ? "Less" : "Read more"}</Text>
            </TouchableOpacity>
          )}

          {keywords.length > 0 && (
            <View style={styles.keywordsRow}>
              {keywords.map(k => (
                <View key={k.id} style={styles.keywordPill}>
                  <Text style={styles.keywordText} allowFontScaling={false}>{k.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {credits.length > 0 && (
          <View style={styles.castSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }]} allowFontScaling={false}>Top Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {credits.map(actor => (
                <CastCard 
                  key={actor.id} 
                  cast={actor} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/person/[id]', params: { id: actor.id, name: actor.name } });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.detailsSection}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.lg }]} allowFontScaling={false}>Details</Text>
          <MovieDetailTable movie={movie} />
        </View>

        {reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { marginBottom: Spacing.lg }]} allowFontScaling={false}>User Reviews</Text>
            {reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText} allowFontScaling={false}>{review.author.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewAuthor} allowFontScaling={false}>{review.author}</Text>
                    <Text style={styles.reviewDate} allowFontScaling={false}>{new Date(review.created_at).toLocaleDateString()}</Text>
                  </View>
                  {review.author_details?.rating && (
                    <RatingBadge rating={review.author_details.rating} size="sm" />
                  )}
                </View>
                <Text style={styles.reviewText} numberOfLines={4} allowFontScaling={false}>{review.content}</Text>
              </View>
            ))}
          </View>
        )}

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }]} allowFontScaling={false}>More Like This</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {similar.map(item => (
                <PosterCard 
                  key={item.id} 
                  movie={item} 
                  onPress={() => navigation.push('MovieDetail', { id: item.id, title: item.title })} 
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle} allowFontScaling={false}>Rate This</Text>
            <Text style={styles.modalSub} allowFontScaling={false}>{movie.title}</Text>
            
            <View style={styles.starRow}>
              {[1,2,3,4,5,6,7,8,9,10].map(star => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTempRating(star);
                  }}
                >
                  <Star 
                    size={24} 
                    color="#F5C518" 
                    fill={star <= tempRating ? Colors.ratingGold : "transparent"} 
                    strokeWidth={1.5} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingLabelText} allowFontScaling={false}>
              {tempRating === 0 ? "Tap to rate" :
               tempRating <= 2 ? "Awful" :
               tempRating <= 4 ? "Bad" :
               tempRating <= 6 ? "OK" :
               tempRating <= 8 ? "Good" :
               tempRating === 9 ? "Great" : "Masterpiece"}
            </Text>

            <TouchableOpacity 
              style={[styles.confirmBtn, tempRating === 0 && { opacity: 0.5 }]} 
              disabled={tempRating === 0}
              onPress={submitRating}
            >
              <Text style={styles.confirmBtnText} allowFontScaling={false}>Rate {tempRating}/10</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRatingModal(false)}>
              <Text style={styles.cancelBtnText} allowFontScaling={false}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center'
  },
  shareBtn: {
    position: 'absolute', right: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center'
  },
  heroWrap: { width: '100%', height: 400, position: 'relative' },
  backdrop: { width: '100%', height: '100%' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject },
  titleBlock: { backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  movieTitle: { fontSize: 32, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 8 },
  metaText: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.7)' },
  agePill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  agePillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.white },
  tagline: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.primary, fontStyle: 'italic' },
  ratingBlock: {
    backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    flexDirection: 'row', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  ratingCol: { flex: 1, alignItems: 'center' },
  ratingLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  scoreVal: { fontSize: FontSize.xxxl + 4, fontWeight: FontWeight.extrabold, color: Colors.white },
  scoreMax: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  voteCount: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  vDivider: { width: 1, height: 60, backgroundColor: 'rgba(255,255,255,0.1)' },
  popScore: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white },
  userRateScore: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: 4 },
  rateTextAction: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: 4 },
  actionRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: Spacing.md },
  actionSubRow: { flexDirection: 'row', gap: Spacing.sm },
  btnPlay: { height: 48, borderRadius: Radius.md, backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  btnPlayText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  btnWatchlist: { flex: 2, height: 44, borderRadius: Radius.md, backgroundColor: Colors.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  btnWatchlistActive: { backgroundColor: Colors.primary },
  btnWatchlistText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  btnWatchlistTextActive: { color: Colors.white },
  btnRate: { flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnRateText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  trailerSection: { paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionHeader: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white },
  sectionSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  hScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  storySection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  overviewText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },
  readMore: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: Spacing.sm },
  keywordsRow: { marginTop: Spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  keywordPill: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  keywordText: { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
  castSection: { paddingTop: Spacing.xl, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingBottom: Spacing.xl },
  detailsSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingBottom: Spacing.lg },
  reviewsSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingBottom: Spacing.lg },
  reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: FontWeight.bold },
  reviewAuthor: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  reviewDate: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  reviewText: { marginTop: Spacing.md, fontSize: FontSize.md, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  similarSection: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { width: 340, backgroundColor: Colors.surface, borderRadius: Radius.xxl, padding: 28, ...Shadow.lg },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, textAlign: 'center', marginBottom: Spacing.sm },
  modalSub: { fontSize: FontSize.base, color: Colors.primary, textAlign: 'center', marginBottom: Spacing.xl },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  ratingLabelText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white, textAlign: 'center', marginTop: Spacing.lg },
  confirmBtn: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, height: 50, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: FontSize.lg, color: Colors.white, fontWeight: FontWeight.bold },
  cancelBtn: { marginTop: Spacing.md, justifyContent: 'center', alignItems: 'center', height: 40 },
  cancelBtnText: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)' }
});

export default MovieDetailScreen;
