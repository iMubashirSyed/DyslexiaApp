import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../../utils/softBorder';
import Svg, {Circle, Path} from 'react-native-svg';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FeatureIcon} from '../../Developer1/FeatureIcons';
import FlipCard from './FlipCard';
import type {FlashcardGameProps, PlayableCard} from './types';
import {
  createShuffledDeck,
  isMatchingPair,
  MODE_CONFIG,
} from './utils/modeConfig';

const FONT = {
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function IconClock({color = '#FF9A56', size = 14}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.75} />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconRestart({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 3-6.7"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 4v5h5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CelebrationBurst() {
  const dots = useRef(Array.from({length: 8}, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = dots.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.stagger(40, animations).start();
  }, [dots]);

  const positions = [
    {top: '8%', left: '12%'},
    {top: '5%', right: '15%'},
    {top: '18%', left: '45%'},
    {top: '12%', right: '8%'},
    {bottom: '35%', left: '10%'},
    {bottom: '38%', right: '12%'},
    {bottom: '28%', left: '40%'},
    {top: '25%', left: '22%'},
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.burstDot,
            positions[i] as object,
            {
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1.4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function FlashcardGame({navigation, route}: FlashcardGameProps) {
  const {mode} = route.params;
  const config = MODE_CONFIG[mode];
  const {width: screenWidth} = useWindowDimensions();

  const [cards, setCards] = useState<PlayableCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(config.pairCount);
  const [isResolving, setIsResolving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const flippedIdsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const horizontalPadding = 20;
  const availableWidth =
    screenWidth - horizontalPadding * 2 - config.cardGap * (config.gridColumns - 1);
  const computedCardSize = Math.floor(availableWidth / config.gridColumns);
  const cardSize = Math.min(config.cardSize, computedCardSize);

  const startRound = useCallback(() => {
    flippedIdsRef.current = [];
    setIsResolving(false);
    setIsComplete(false);
    setShowCelebration(false);
    setMoves(0);
    setMatchedPairs(0);
    setElapsedSeconds(0);

    const deck = createShuffledDeck(mode);
    setCards(deck.cards);
    setTotalPairs(deck.totalPairs);
  }, [mode]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  useEffect(() => {
    navigation.setOptions({
      title: config.label,
    });
  }, [navigation, config.label]);

  useEffect(() => {
    if (!config.showTimer || isComplete) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [config.showTimer, isComplete]);

  const handleCardPress = useCallback(
    (card: PlayableCard) => {
      if (isResolving || isComplete || card.isMatched || card.isFlipped) {
        return;
      }
      if (flippedIdsRef.current.length >= 2) {
        return;
      }

      const nextFlipped = [...flippedIdsRef.current, card.cardId];
      flippedIdsRef.current = nextFlipped;

      setCards(prev =>
        prev.map(c =>
          c.cardId === card.cardId ? {...c, isFlipped: true} : c,
        ),
      );

      if (nextFlipped.length < 2) {
        return;
      }

      setMoves(m => m + 1);
      setIsResolving(true);

      setCards(prev => {
        const first = prev.find(c => c.cardId === nextFlipped[0]);
        const second = prev.find(c => c.cardId === nextFlipped[1]);
        if (!first || !second) {
          flippedIdsRef.current = [];
          setIsResolving(false);
          return prev;
        }

        if (isMatchingPair(first, second)) {
          flippedIdsRef.current = [];
          setIsResolving(false);

          setMatchedPairs(mp => {
            const next = mp + 1;
            if (next >= totalPairs) {
              setTimeout(() => {
                setIsComplete(true);
                setShowCelebration(true);
              }, 400);
            }
            return next;
          });

          return prev.map(c =>
            c.cardId === first.cardId || c.cardId === second.cardId
              ? {...c, isMatched: true, isFlipped: true}
              : c,
          );
        }

        setTimeout(() => {
          setCards(current =>
            current.map(c =>
              c.cardId === first.cardId || c.cardId === second.cardId
                ? {...c, isFlipped: false, showMismatch: false}
                : c,
            ),
          );
          flippedIdsRef.current = [];
          setIsResolving(false);
        }, config.flipBackDelayMs);

        return prev.map(c =>
          c.cardId === first.cardId || c.cardId === second.cardId
            ? {...c, showMismatch: true}
            : c,
        );
      });
    },
    [config.flipBackDelayMs, isComplete, isResolving, totalPairs],
  );

  const showHelp = () => {
    Alert.alert(
      'Flashcard Frenzy',
      'Tap two cards to flip them. Match each picture with its word. Finish all pairs to win.',
    );
  };

  const renderCard = ({item}: {item: PlayableCard}) => (
    <View
      style={[
        styles.gridItem,
        {
          width: `${100 / config.gridColumns}%` as `${number}%`,
          marginBottom: config.cardGap,
        },
      ]}>
      <FlipCard
        card={item}
        size={cardSize}
        disabled={isResolving || item.isMatched}
        onPress={() => handleCardPress(item)}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FFF3EB', '#FFF8F3', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,154,86,0.22)', 'rgba(255,154,86,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(255,184,140,0.16)', 'rgba(255,184,140,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.headerPad}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
            style={styles.headerCard}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <LinearGradient
                colors={['#FF9A56', '#FFB88C']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Flashcard Frenzy
              </Text>
            </View>

            <TouchableOpacity
              onPress={showHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#FFB88C', '#FF9A56']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
          style={styles.statsCard}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Pairs</Text>
            <Text style={styles.statValue}>
              {matchedPairs}/{totalPairs}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>Moves</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
          {config.showTimer ? (
            <View style={styles.statChip}>
              <View style={styles.timerRow}>
                <IconClock color="#FF9A56" size={14} />
                <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        <FlatList
          data={cards}
          key={`grid-${mode}-${cards.length}`}
          keyExtractor={item => item.cardId}
          numColumns={config.gridColumns}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.grid,
            {
              paddingHorizontal: horizontalPadding,
              gap: config.cardGap,
              paddingBottom: 120,
            },
          ]}
          columnWrapperStyle={
            config.gridColumns > 1 ? styles.columnWrap : undefined
          }
          renderItem={renderCard}
        />
      </SafeAreaView>

      <Modal visible={isComplete} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          {showCelebration ? <CelebrationBurst /> : null}
          <LinearGradient
                  colors={softBorderColors('#FF9A56')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.modalBorder}>
            <View style={styles.modalCard}>
              <LinearGradient
                colors={['#FF9A56', '#FFB88C']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.modalIconChip}>
                <FeatureIcon name="flashcardFrenzy" color="#FFFFFF" size={26} />
              </LinearGradient>
              <Text style={styles.modalTitle}>You matched them all!</Text>
              <Text style={styles.modalBody}>
                Moves: {moves}
                {config.showTimer ? `\nTime: ${formatTime(elapsedSeconds)}` : ''}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Play again"
                style={styles.primaryBtnWrap}
                onPress={startRound}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={['#FF9A56', '#FFB88C']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryButton}>
                  <IconRestart color="#FFFFFF" size={16} />
                  <Text style={styles.primaryButtonText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to modes"
                style={styles.secondaryButton}
                activeOpacity={0.88}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('FlashcardModeSelect');
                  }
                }}>
                <Text style={styles.secondaryButtonText}>Back to Modes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  safe: {
    flex: 1,
  },
  blobTop: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  blobBottom: {
    position: 'absolute',
    bottom: 100,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#FF9A56',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONT.bold,
    lineHeight: 22,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    color: '#1A2B4C',
    fontFamily: FONT.extraBold,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  statChip: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grid: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  columnWrap: {
    justifyContent: 'center',
    gap: 10,
  },
  gridItem: {
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 76, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBorder: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    padding: 1.5,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#1A2B4C',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 15,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    minWidth: 200,
    minHeight: 48,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,154,86,0.45)',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#FF9A56',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  burstDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9A56',
  },
});
