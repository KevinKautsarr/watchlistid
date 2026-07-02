import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import EmptyStateIcon from '@/components/common/EmptyStateIcon';

interface GenreSuggestion {
  id: string;
  label: string;
}

interface SearchEmptyStateProps {
  title: string;
  subtitle?: string;
  t?: any;
  /** "No results for a typed query" case only — offers a way forward instead
   * of a dead end. Omit for the default/placeholder empty state. */
  genreSuggestions?: GenreSuggestion[];
  genreSuggestionsLabel?: string;
  onSelectGenre?: (genreId: string) => void;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  title, subtitle, genreSuggestions, genreSuggestionsLabel, onSelectGenre,
}) => {
  return (
    <View style={styles.empty}>
      <EmptyStateIcon name="search" size={96} style={{ marginBottom: Spacing.xl }} />
      <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>{title}</Text>
      {subtitle && <Text style={styles.emptySub} maxFontSizeMultiplier={1.3}>{subtitle}</Text>}

      {genreSuggestions && genreSuggestions.length > 0 && onSelectGenre && (
        <View style={styles.suggestions}>
          {genreSuggestionsLabel && (
            <Text style={styles.suggestionsLabel} maxFontSizeMultiplier={1.3}>{genreSuggestionsLabel}</Text>
          )}
          <View style={styles.chipRow}>
            {genreSuggestions.map(g => (
              <TouchableOpacity
                key={g.id}
                style={[styles.chip, cursorPointer]}
                onPress={() => onSelectGenre(g.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={g.label}
              >
                <Text style={styles.chipText} maxFontSizeMultiplier={1.3}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: { paddingTop: 72, alignItems: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.base, color: Colors.text.secondary, textAlign: "center", lineHeight: 22 },
  suggestions: { marginTop: Spacing.xxl, width: '100%', alignItems: 'center' },
  suggestionsLabel: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text.primary },
});
