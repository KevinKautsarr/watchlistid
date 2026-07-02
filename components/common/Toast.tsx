import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { nativeDriver } from '@/utils/animation';
import { cursorPointer } from '@/utils/webStyles';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'error';
  onHide: () => void;
  /** Optional action button label (e.g. "Undo"). Requires onAction. */
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-hide delay in ms. Defaults to 2000, or 5000 when actionLabel is set
   * (undo needs more time to react to than a plain confirmation). */
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ visible, message, type = 'success', onHide, actionLabel, onAction, duration }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          ...nativeDriver,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          ...nativeDriver,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration ?? (actionLabel ? 5000 : 2000));

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        ...nativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 250,
        ...nativeDriver,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : Info;
  const iconColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : Colors.primary;

  return (
    // pointerEvents is 'box-none' here (not 'none') so the action button below
    // remains tappable — only the transparent root area passes touches through.
    <View style={[styles.root, { pointerEvents: 'box-none' }]}>
      <Animated.View style={[
        styles.container,
        { opacity, transform: [{ translateY }] }
      ]}>
        <View style={styles.iconBox}>
          <Icon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text style={styles.text} maxFontSizeMultiplier={1.3}>{message}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity
            onPress={() => { onAction(); hide(); }}
            style={[styles.actionBtn, cursorPointer]}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.actionText} maxFontSizeMultiplier={1.3}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadow.md,
    gap: 10,
    maxWidth: '85%',
  },
  iconBox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    flexShrink: 1,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 2,
  },
  actionText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
});

export default Toast;
