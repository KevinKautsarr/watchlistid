import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SearchX } from 'lucide-react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface SearchEmptyStateProps {
  title: string;
  subtitle?: string;
  t?: any;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <SearchX size={36} color={Colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle} allowFontScaling={false}>{title}</Text>
      {subtitle && <Text style={styles.emptySub} allowFontScaling={false}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { paddingTop: 72, alignItems: "center", paddingHorizontal: 40 },
  emptyIcon: { 
    width: 76, height: 76, borderRadius: 38, 
    backgroundColor: "rgba(63,114,175,0.10)", 
    alignItems: "center", justifyContent: "center", 
    marginBottom: Spacing.xl 
  },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
});
