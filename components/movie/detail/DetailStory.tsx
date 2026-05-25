import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface DetailStoryProps {
  overview: string;
  keywords: any[];
  t: any;
}

export const DetailStory: React.FC<DetailStoryProps> = ({ overview, keywords, t }) => {
  const [expandedStory, setExpandedStory] = useState(false);
  
  const paragraphs = React.useMemo(() => {
    return overview ? overview.split('\n').filter(p => p.trim() !== '') : [];
  }, [overview]);

  return (
    <View style={styles.storySection}>
      <Text style={styles.sectionTitle} allowFontScaling={false}>{t('storyline')}</Text>
      
      {(!expandedStory && overview?.length > 100) ? (
        <Text 
          style={styles.overviewText} 
          numberOfLines={3}
          allowFontScaling={false}
        >
          {overview}
        </Text>
      ) : (
        <View>
          {paragraphs.map((p, idx) => (
            <Text 
              key={idx} 
              style={[styles.overviewText, idx < paragraphs.length - 1 && { marginBottom: 10 }]} 
              allowFontScaling={false}
            >
              {p}
            </Text>
          ))}
        </View>
      )}

      {overview?.length > 100 && (
        <TouchableOpacity onPress={() => setExpandedStory(!expandedStory)} style={cursorPointer}>
          <Text style={styles.readMore} allowFontScaling={false}>{expandedStory ? t('less') : t('readMore')}</Text>
        </TouchableOpacity>
      )}

      {keywords.length > 0 && (
        <View style={styles.keywordsRow}>
          {keywords.map((k: { id: number; name: string }) => (
            <View key={k.id} style={styles.keywordPill}>
              <Text style={styles.keywordText} allowFontScaling={false}>{k.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  storySection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderColor: Colors.overlay.light10 },
  sectionTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.white, marginBottom: 12 },
  overviewText: { fontSize: FontSize.base, color: Colors.overlay.light85, lineHeight: 26 },
  readMore: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 12 },
  keywordsRow: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  keywordPill: { backgroundColor: Colors.overlay.light10, borderRadius: Radius.sm, paddingHorizontal: 16, paddingVertical: 6 },
  keywordText: { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.medium },
});
