import React, { useState } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  Dimensions, Platform, ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { 
  GestureHandlerRootView, 
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Check, RotateCcw } from 'lucide-react-native';
import { Colors, Radius, FontWeight } from '@/constants/theme';

const IS_WEB = Platform.OS === 'web';
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_CROP_WIDTH = IS_WEB ? 400 : SCREEN_WIDTH;
const CROP_SIZE = IS_WEB ? 280 : SCREEN_WIDTH * 0.8;

interface ImageCropModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSave: (croppedUri: string) => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ visible, imageUri, onClose, onSave }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Reanimated values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // New Gesture API (Reanimated 3/4 compatible)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleCrop = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1000 } }, 
        ],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      onSave(result.uri);
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalRoot}>
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.title}>Sesuaikan Foto</Text>
            <TouchableOpacity onPress={handleCrop} style={styles.iconBtn} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color={Colors.primary} size="small" /> : <Check color={Colors.primary} size={24} />}
            </TouchableOpacity>
          </View>

          <View style={styles.cropperArea}>
            <View style={styles.imageContainer}>
              <GestureDetector gesture={composedGesture}>
                <Animated.View style={[{ flex: 1 }, animatedStyle]}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.image} 
                    contentFit="contain"
                  />
                </Animated.View>
              </GestureDetector>
            </View>

            {/* Circle Mask Overlay */}
            <View pointerEvents="none" style={styles.maskContainer}>
              <View style={styles.maskOutside} />
              <View style={styles.maskRow}>
                <View style={styles.maskOutside} />
                <View style={styles.maskCircle} />
                <View style={styles.maskOutside} />
              </View>
              <View style={styles.maskOutside} />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <RotateCcw size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.resetText}>Reset Posisi</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Gunakan dua jari untuk zoom, geser untuk memindahkan</Text>
          </View>
        </GestureHandlerRootView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: IS_WEB ? 'center' : 'stretch',
  },
  container: {
    flex: IS_WEB ? undefined : 1,
    width: IS_WEB ? Math.min(SCREEN_WIDTH * 0.9, 500) : '100%',
    height: IS_WEB ? 600 : '100%',
    backgroundColor: '#000',
    borderRadius: IS_WEB ? Radius.xxl : 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: IS_WEB ? 20 : (Platform.OS === 'ios' ? 60 : 40),
    paddingBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  iconBtn: {
    padding: 8,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  cropperArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
  },
  imageContainer: {
    width: MAX_CROP_WIDTH,
    height: MAX_CROP_WIDTH,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  maskContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskOutside: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  maskRow: {
    flexDirection: 'row',
    height: CROP_SIZE,
  },
  maskCircle: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
  },
  footer: {
    paddingBottom: IS_WEB ? 20 : (Platform.OS === 'ios' ? 60 : 40),
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 15,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginBottom: 10,
    ...Platform.select({
      web: { cursor: 'pointer' }
    })
  },
  resetText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: FontWeight.bold,
  },
  hint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ImageCropModal;
