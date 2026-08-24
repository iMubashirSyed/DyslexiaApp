import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  letter: string;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

const TILE = 56;
const MIN_TOUCH = 48;

export default function ScrambledTile({
  letter,
  disabled,
  onPress,
  accessibilityLabel,
}: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 280, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, friction: 6, useNativeDriver: true}),
    ]).start();
  }, [letter, opacity, scale]);

  if (disabled) {
    return <View style={styles.placeholder} />;
  }

  return (
    <Animated.View style={{opacity, transform: [{scale}]}}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({pressed}) => [styles.tileWrap, pressed && styles.tilePressed]}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <LinearGradient
          colors={['#FA8A3E', '#FFB347']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.tile}>
          <Text style={styles.letter}>{letter}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tileWrap: {
    margin: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  tile: {
    minWidth: Math.max(TILE, MIN_TOUCH),
    minHeight: Math.max(TILE, MIN_TOUCH),
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  tilePressed: {
    opacity: 0.88,
  },
  letter: {
    fontSize: 26,
    fontFamily: 'CarmenSans-Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  placeholder: {
    width: TILE + 12,
    height: TILE + 12,
    margin: 6,
  },
});
