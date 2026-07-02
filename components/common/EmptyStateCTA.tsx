import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { cursorPointer } from '@/utils/webStyles';
import EmptyStateIcon, { EmptyStateIconName } from '@/components/common/EmptyStateIcon';

interface EmptyStateCTAProps {
  icon: EmptyStateIconName;
  title: string;
  subtitle?: string;
  /** Action button label. Omit for empty states with no useful next action
   * (e.g. notifications — "you're all caught up" needs no CTA). */
  actionLabel?: string;
  onAction?: () => void;
  size?: number;
}

/**
 * Empty state with an optional action button that answers "what do I do
 * now?" — e.g. "Explore popular movies" on an empty watchlist. Every empty
 * state that has a meaningful next step should use this instead of a bare
 * icon + text.
 */
const EmptyStateCTA: React.FC<EmptyStateCTAProps> = ({ icon, title, subtitle, actionLabel, onAction, size = 96 }) => {
  return (
    <View style={styles.container}>
      <EmptyStateIcon name={icon} size={size} style={{ marginBottom: Spacing.xl }} />
      <Text style={styles.title} maxFontSizeMultiplier={1.3}>{title}</Text>
      {subtitle && (
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, cursorPointer]}
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>{actionLabel}</Text>
          <ArrowRight size={16} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 72,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: Radius.full,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 6 },
      web: { boxShadow: `0 4px 16px ${Colors.primary}66` } as unknown as ViewStyle,
    }),
  },
  actionText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

export default EmptyStateCTA;
