import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';

interface GenrePillProps {
  label:    string;
  active?:  boolean;
  onPress?: () => void;
  size?:    'sm' | 'md';
}

const GenrePill: React.FC<GenrePillProps> = ({ 
  label, 
  active, 
  onPress, 
  size = 'md' 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        active && styles.activeContainer,
        size === 'sm' && styles.smallContainer
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        active && styles.activeText,
        size === 'sm' && styles.smallText
      ]} allowFontScaling={false}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  activeContainer: {
    backgroundColor: Colors.primary,
  },
  smallContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  text: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text.accent,
  },
  activeText: {
    color: Colors.white,
  },
  smallText: {
    fontSize: FontSize.xs,
  },
});

export default GenrePill;
