import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from "expo-haptics";
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';

interface FilterChip {
  id: string;
  labelKey: string;
}

interface SearchFilterRowProps {
  filters: FilterChip[];
  activeFilter: string;
  onSelect: (id: string) => void;
  t: any;
}

export const SearchFilterRow: React.FC<SearchFilterRowProps> = ({ filters, activeFilter, onSelect, t }) => {
  return (
    <View style={{ flexGrow: 0, marginBottom: Spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map(c => (
          <TouchableOpacity 
            key={c.id} 
            activeOpacity={0.75}
            onPress={() => { 
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
              onSelect(c.id); 
            }}
            style={[styles.chip, activeFilter === c.id && styles.chipActive, cursorPointer]}
          >
            <Text style={[styles.chipTxt, activeFilter === c.id && styles.chipTxtActive]} maxFontSizeMultiplier={1.3}>
              {t(c.labelKey as any)}
            </Text>
            {activeFilter === c.id && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", paddingHorizontal: Spacing.xl, paddingVertical: 4, gap: 16, marginBottom: Spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 10, position: 'relative' },
  chipActive: {},
  chipTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  chipTxtActive: { color: Colors.white, fontWeight: FontWeight.bold },
  activeUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
