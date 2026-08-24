import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {isRemoteImage} from './utils/modeConfig';

export type AnimalCardState = 'idle' | 'wrong' | 'correct';

type Props = {
  name: string;
  imageUrl: string;
  size: number;
  state: AnimalCardState;
  disabled: boolean;
  onPress: () => void;
};

const ORANGE = '#FF9F40';
const GREEN = '#43E97B';

export default function AnimalCard({
  name,
  imageUrl,
  size,
  state,
  disabled,
  onPress,
}: Props) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, {toValue: 1, duration: 50, useNativeDriver: true}),
        Animated.timing(shakeAnim, {toValue: -1, duration: 50, useNativeDriver: true}),
        Animated.timing(shakeAnim, {toValue: 1, duration: 50, useNativeDriver: true}),
        Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
      ]).start();
    }
  }, [state, shakeAnim]);

  useEffect(() => {
    if (state === 'correct') {
      Animated.sequence([
        Animated.timing(scaleAnim, {toValue: 1.1, duration: 140, useNativeDriver: true}),
        Animated.timing(scaleAnim, {toValue: 1, duration: 140, useNativeDriver: true}),
      ]).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [state, scaleAnim]);

  const translateX = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  const borderColor =
    state === 'correct' ? GREEN : state === 'wrong' ? '#E57373' : 'rgba(255,159,64,0.45)';

  return (
    <Animated.View
      style={{
        transform: [{translateX}, {scale: scaleAnim}],
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Animal card ${name}`}
        accessibilityState={{disabled, selected: state === 'correct'}}
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [
          styles.card,
          {
            width: size,
            height: size,
            borderColor,
            backgroundColor: state === 'correct' ? '#F1FFF3' : '#FFFFFF',
          },
          pressed && !disabled && styles.pressed,
        ]}>
        {isRemoteImage(imageUrl) ? (
          <Image
            source={{uri: imageUrl}}
            style={styles.image}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={[styles.emoji, {fontSize: size * 0.45}]}>{imageUrl}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
  emoji: {
    textAlign: 'center',
  },
  image: {
    width: '88%',
    height: '88%',
  },
});
