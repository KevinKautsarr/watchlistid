import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

interface SearchEmptyStateProps {
  title: string;
  subtitle?: string;
  t?: any;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ title, subtitle }) => {
  return (
    <View style={styles.empty}>
      <EmptyStateIcon name="search" size={96} style={{ marginBottom: Spacing.xl }} />
      <Text style={styles.emptyTitle} allowFontScaling={false}>{title}</Text>
      {subtitle && <Text style={styles.emptySub} allowFontScaling={false}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { paddingTop: 72, alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
});
