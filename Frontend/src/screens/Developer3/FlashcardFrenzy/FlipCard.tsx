import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path, Rect} from 'react-native-svg';

import type {PlayableCard} from './types';

const ORANGE = '#FF9A56';
const NAVY = '#1A2B4C';
const MATCH_GREEN = '#43E97B';

type Props = {
  card: PlayableCard;
  size: number;
  disabled: boolean;
  onPress: () => void;
};

function IconCardBack({color = '#FFFFFF', size = 28}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="11" height="15" rx="2" stroke={color} strokeWidth={1.75} />
      <Path
        d="M15 7h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <Path d="M8 10h4M8 13h3" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

export default function FlipCard({card, size, disabled, onPress}: Props) {
  const flipAnim = useRef(new Animated.Value(card.isFlipped ? 1 : 0)).current;
  const matchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: card.isFlipped || card.isMatched ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [card.isFlipped, card.isMatched, flipAnim]);

  useEffect(() => {
    if (card.isMatched) {
      matchScale.setValue(1);
      Animated.sequence([
        Animated.timing(matchScale, {
          toValue: 1.08,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(matchScale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [card.isMatched, matchScale]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const mismatchBorder = card.showMismatch ? '#E57373' : ORANGE;

  const accessibilityLabel =
    card.isFlipped || card.isMatched
      ? card.kind === 'word'
        ? `Word card: ${card.word}`
        : `Picture card: ${card.image}`
      : card.kind === 'word'
        ? 'Hidden word card'
        : 'Hidden picture card';

  const cardStyle = {
    width: size,
    height: size,
    borderRadius: 14,
  };

  return (
    <Animated.View style={{transform: [{scale: matchScale}]}}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{disabled, selected: card.isMatched}}
        disabled={disabled}
        onPress={onPress}
        style={({pressed}) => [pressed && !disabled && styles.pressed]}>
        <View style={[styles.flipContainer, cardStyle]}>
          <Animated.View
            style={[
              styles.cardFace,
              cardStyle,
              {
                opacity: backOpacity,
                transform: [{rotateY: backRotate}],
              },
            ]}>
            <LinearGradient
              colors={['#FF9A56', '#FFB88C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.cardBack, cardStyle]}>
              <IconCardBack color="#FFFFFF" size={Math.max(22, size * 0.28)} />
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardFace,
              cardStyle,
              styles.cardFront,
              card.isMatched && styles.cardMatched,
              {
                opacity: frontOpacity,
                transform: [{rotateY: frontRotate}],
                borderColor: card.isMatched ? MATCH_GREEN : mismatchBorder,
              },
            ]}>
            {card.kind === 'word' ? (
              <Text style={[styles.wordText, {fontSize: size * 0.18}]}>
                {card.word}
              </Text>
            ) : (
              <Text style={[styles.emojiText, {fontSize: size * 0.42}]}>
                {card.image}
              </Text>
            )}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flipContainer: {
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9A56',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  cardBack: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
  },
  cardMatched: {
    backgroundColor: '#F1FFF3',
    shadowColor: MATCH_GREEN,
    shadowOpacity: 0.35,
  },
  wordText: {
    color: NAVY,
    fontFamily: 'CarmenSans-ExtraBold',
    letterSpacing: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  emojiText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
  },
});
