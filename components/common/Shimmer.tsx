import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ShimmerProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height,
  borderRadius = 6,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    ).start();
  }, [animatedValue]);

  // Map animatedValue to translate the shimmer effect horizontally from -600 to 600
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-600, 600],
  });

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: '#161622',
          },
          style,
        ]}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '100%',
              backgroundImage: 'linear-gradient(90deg, #161622 0%, #1E1E30 25%, #242438 50%, #1E1E30 75%, #161622 100%)',
            } as any}
            {...({ className: 'shimmer-slider' } as any)}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      {/* Deep Dark Base Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#161622' }]} />

      {/* Sliding Highlight Gradient */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: 600,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#161622', '#1E1E30', '#242438', '#1E1E30', '#161622']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
});

export default Shimmer;
