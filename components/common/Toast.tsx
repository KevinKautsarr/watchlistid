import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, Platform } from 'react-native';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';
import { Colors, Radius, Spacing, FontSize, FontWeight, Shadow } from '../../constants/theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'info' | 'error';
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ visible, message, type = 'success', onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 2 seconds
      const timer = setTimeout(() => {
        hide();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : Info;
  const iconColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : Colors.primary;

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[
        styles.container,
        { opacity, transform: [{ translateY }] }
      ]}>
        <View style={styles.iconBox}>
          <Icon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
        <Text style={styles.text} allowFontScaling={false}>{message}</Text>
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
  },
});

export default Toast;
