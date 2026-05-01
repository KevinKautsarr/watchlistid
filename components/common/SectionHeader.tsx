import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

interface SectionHeaderProps {
  title:        string;
  Icon?:        React.ComponentType<any>;
  iconColor?:   string;
  textColor?:   string;
  actionLabel?: string;
  onAction?:    () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  Icon,
  iconColor = Colors.primary,
  textColor,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {Icon && (
          <View style={[styles.iconBox, { backgroundColor: iconColor + '22' }]}>
            <Icon size={14} color={iconColor} strokeWidth={2.5} />
          </View>
        )}
        <Text
          style={[
            styles.title, 
            Icon ? styles.titleWithIcon : styles.titlePlain,
            textColor ? { color: textColor } : {}
          ]}
          allowFontScaling={false}
        >
          {title}
        </Text>
      </View>

      {actionLabel && (
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction?.();
          }}
        >
          <Text style={[styles.action, textColor ? { color: textColor } : {}]} allowFontScaling={false}>
            {actionLabel}
          </Text>
          <ChevronRight size={14} color={textColor || Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: Spacing.xl,
    marginBottom:   Spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  iconBox: {
    width:          28,
    height:         28,
    borderRadius:   8,
    alignItems:     'center',
    justifyContent: 'center',
  },
  /** Used when Icon is provided (section inside scroll) */
  titleWithIcon: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.black,
    color:         Colors.dark,
    letterSpacing: -0.2,
  },
  /** Used when no Icon (standalone section title) */
  titlePlain: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.text.primary,
  },
  // kept for TS: merged into titleWithIcon / titlePlain above
  title: {},
  actionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
  },
  action: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.text.accent,
  },
});

export default SectionHeader;
