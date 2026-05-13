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
            <Text style={[styles.chipTxt, activeFilter === c.id && styles.chipTxtActive]} allowFontScaling={false}>
              {t(c.labelKey as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", paddingHorizontal: Spacing.xl, paddingVertical: 10, gap: Spacing.sm, marginBottom: Spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surface },
  chipActive: { backgroundColor: Colors.primary, ...Shadow.primary },
  chipTxt: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text.secondary },
  chipTxtActive: { color: Colors.white, fontWeight: FontWeight.bold },
});
