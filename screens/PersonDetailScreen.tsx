import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { ChevronLeft, Calendar, Globe, TrendingUp } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow, TMDB_IMAGE_SIZES } from '../constants/theme';
import { usePersonDetails } from '../hooks/useMovies';
import PosterCard from '../components/common/PosterCard';

interface PersonDetailScreenProps {
  route: RouteProp<any, any>;
  navigation: NativeStackNavigationProp<any>;
}

const PersonDetailScreen: React.FC<PersonDetailScreenProps> = ({ route, navigation }): React.JSX.Element => {
  const { id } = route.params;
  const { data, isLoading: loading } = usePersonDetails(id);
  const person = data?.person;
  const credits = data?.credits?.cast || [];
  
  const [expandedBio, setExpandedBio] = useState(false);

  if (loading || !person) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.dark }} allowFontScaling={false}>Loading...</Text>
      </View>
    );
  }

  const knownFor = credits
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10);

  const filmography = [...credits].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateB - dateA;
  });

  const backdropUri = knownFor[0]?.backdrop_path 
    ? `${TMDB_IMAGE_SIZES.backdrop}${knownFor[0].backdrop_path}` 
    : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <TouchableOpacity 
        style={styles.backBtn} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.goBack();
        }}
      >
        <ChevronLeft size={24} color={Colors.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          {backdropUri ? (
            <Image source={{ uri: backdropUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark }]} />
          )}
          <View style={styles.backdropOverlay} />
          <View style={styles.profileFloat}>
            <Image 
              source={{ uri: `${TMDB_IMAGE_SIZES.medium}${person.profile_path}` }} 
              style={styles.profileImg} 
              contentFit="cover" 
            />
          </View>
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.nameText} allowFontScaling={false}>{person.name}</Text>
          <Text style={styles.departmentText} allowFontScaling={false}>{person.known_for_department}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Calendar size={18} color={Colors.primary} strokeWidth={2} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue} allowFontScaling={false}>{person.birthday ? person.birthday.substring(0,4) : 'N/A'}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Born</Text>
            </View>
            <View style={styles.statCard}>
              <Globe size={18} color={Colors.primary} strokeWidth={2} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue} numberOfLines={1} allowFontScaling={false}>{person.place_of_birth?.split(',').pop()?.trim() ?? 'N/A'}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Birthplace</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={18} color={Colors.primary} strokeWidth={2} style={{ marginBottom: 4 }} />
              <Text style={styles.statValue} allowFontScaling={false}>{person.popularity?.toFixed(0)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Popularity</Text>
            </View>
          </View>

          {person.biography ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Biography</Text>
              <Text style={styles.bioText} numberOfLines={expandedBio ? undefined : 3} allowFontScaling={false}>
                {person.biography}
              </Text>
              {person.biography.length > 150 && (
                <TouchableOpacity onPress={() => setExpandedBio(!expandedBio)}>
                  <Text style={styles.readMore} allowFontScaling={false}>{expandedBio ? "Read less" : "Read more"}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {knownFor.length > 0 && (
            <View style={styles.sectionNoPadding}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg }]} allowFontScaling={false}>Known For</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {knownFor.map(item => (
                  <PosterCard 
                    key={item.id} 
                    movie={item} 
                    onPress={() => navigation.push('MovieDetail', { id: item.id, title: item.title })} 
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {filmography.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: Spacing.lg }]} allowFontScaling={false}>Filmography</Text>
              {filmography.map((item, index) => (
                <TouchableOpacity 
                  key={`${item.id}-${index}`} 
                  style={styles.filmRow}
                  onPress={() => navigation.push('MovieDetail', { id: item.id, title: item.title })}
                >
                  <Text style={styles.filmYear} allowFontScaling={false}>{item.release_date ? item.release_date.substring(0,4) : '—'}</Text>
                  <View style={styles.filmMeta}>
                    <Text style={styles.filmTitle} allowFontScaling={false}>{item.title}</Text>
                    {item.character ? <Text style={styles.filmRole} allowFontScaling={false}>{item.character}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  backBtn: {
    position: 'absolute', top: 10, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlay.dark,
    justifyContent: 'center', alignItems: 'center'
  },
  heroWrap: { width: '100%', height: 200, position: 'relative' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,45,78,0.4)' },
  profileFloat: {
    position: 'absolute', bottom: -50, left: 20,
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.background,
    backgroundColor: Colors.surface, overflow: 'hidden'
  },
  profileImg: { width: '100%', height: '100%' },
  contentWrap: { paddingTop: 66 },
  nameText: { paddingHorizontal: Spacing.xl, fontSize: FontSize.h2, fontWeight: FontWeight.black, color: Colors.dark },
  departmentText: { paddingHorizontal: Spacing.xl, fontSize: FontSize.sm, color: Colors.primary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center', ...Shadow.sm },
  statValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.dark },
  statLabel: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2, fontWeight: FontWeight.bold },
  section: { paddingHorizontal: Spacing.xl, paddingTop: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light, paddingBottom: 24 },
  sectionNoPadding: { paddingTop: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light, paddingBottom: 24 },
  sectionTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.dark, marginBottom: 12 },
  bioText: { fontSize: FontSize.base, color: Colors.dark, lineHeight: 22, opacity: 0.85 },
  readMore: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 8 },
  hScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  filmRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: Colors.overlay.light },
  filmYear: { width: 50, fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.dark },
  filmMeta: { flex: 1 },
  filmTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.dark },
  filmRole: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 2 },
});

export default PersonDetailScreen;
