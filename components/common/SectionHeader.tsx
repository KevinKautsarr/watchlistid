import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

interface SectionHeaderProps {
  title:       string;
  actionLabel?: string;
  onAction?:   () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  actionLabel, 
  onAction 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling={false}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction?.();
          }}
          style={styles.actionRow}
        >
          <Text style={styles.action} allowFontScaling={false}>{actionLabel}</Text>
          <ChevronRight size={14} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  action: {
    fontSize: FontSize.md,
    color: Colors.text.accent,
    fontWeight: FontWeight.semibold,
  },
});

export default SectionHeader;
