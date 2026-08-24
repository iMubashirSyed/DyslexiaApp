import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../../utils/softBorder';
import Svg, {Path} from 'react-native-svg';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {FeatureIcon} from '../../Developer1/FeatureIcons';
import ScrambledTile from './ScrambledTile';
import WordSlots from './WordSlots';
import {TOTAL_LEVELS, wordList} from './wordList';
import type {LetterTile} from './types';
import {
  buildTilesFromScramble,
  scrambleWord,
  shuffleArray,
} from './utils/scramble';

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

function IconClear({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <Path
        d="M8 6V4h8v2M19 6l-1 14H6L5 6"
        stroke={color}
        strokeWidth={1.75}
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

function createLevelState(word: string): {
  targetWord: string;
  slots: (string | null)[];
  slotTileIds: (string | null)[];
  tiles: LetterTile[];
} {
  const targetWord = word.toUpperCase();
  const scrambled = scrambleWord(targetWord);
  const tiles = buildTilesFromScramble(scrambled);
  return {
    targetWord,
    slots: Array(targetWord.length).fill(null),
    slotTileIds: Array(targetWord.length).fill(null),
    tiles,
  };
}

function ScreenShell({
  onBack,
  onHelp,
  children,
}: {
  onBack: () => void;
  onHelp: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FFF3E8', '#FFF8F0', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(250,138,62,0.22)', 'rgba(250,138,62,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(255,179,71,0.16)', 'rgba(255,179,71,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.headerPad}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
            style={styles.headerCard}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <LinearGradient
                colors={['#FA8A3E', '#FFB347']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Word Scramble
              </Text>
            </View>

            <TouchableOpacity
              onPress={onHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#FFB347', '#FA8A3E']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {children}
      </SafeAreaView>
    </View>
  );
}

export default function WordScrambleGame() {
  const navigation = useNavigation();
  const [sessionKey, setSessionKey] = useState(0);
  const [shuffledWords, setShuffledWords] = useState<string[]>(() =>
    shuffleArray(wordList),
  );
  const [levelIndex, setLevelIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [slotTileIds, setSlotTileIds] = useState<(string | null)[]>([]);
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'success' | 'complete'>('playing');
  const [errorTint, setErrorTint] = useState(false);
  const [successTint, setSuccessTint] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLevel = useCallback((words: string[], index: number) => {
    const word = words[index];
    if (!word) {
      setPhase('complete');
      return;
    }
    const level = createLevelState(word);
    setTargetWord(level.targetWord);
    setSlots(level.slots);
    setSlotTileIds(level.slotTileIds);
    setTiles(level.tiles);
    setPhase('playing');
    setErrorTint(false);
    setSuccessTint(false);
    setSuccessMessage(null);
  }, []);

  const startNewSession = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    const nextOrder = shuffleArray(wordList);
    setShuffledWords(nextOrder);
    setLevelIndex(0);
    setScore(0);
    setStreak(0);
    setSessionKey(k => k + 1);
    loadLevel(nextOrder, 0);
  }, [loadLevel]);

  useEffect(() => {
    startNewSession();
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial session only

  useEffect(() => {
    if (sessionKey > 0) {
      loadLevel(shuffledWords, levelIndex);
    }
  }, [sessionKey, levelIndex, shuffledWords, loadLevel]);

  const runShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 1, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -1, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 1, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  }, [shakeAnim]);

  const runSuccessBounce = useCallback(() => {
    bounceAnim.setValue(1);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.06,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim]);

  const evaluateAnswer = useCallback(
    (nextSlots: (string | null)[]) => {
      const filled = nextSlots.every(s => s !== null);
      if (!filled) return;

      const attempt = nextSlots.join('');
      if (attempt === targetWord) {
        setPhase('success');
        setSuccessTint(true);
        setSuccessMessage('Great job!');
        setScore(s => s + 1);
        setStreak(s => s + 1);
        runSuccessBounce();

        advanceTimer.current = setTimeout(() => {
          const next = levelIndex + 1;
          if (next >= shuffledWords.length) {
            setPhase('complete');
          } else {
            setLevelIndex(next);
          }
        }, 1200);
      } else {
        setStreak(0);
        setErrorTint(true);
        runShake();
        setTimeout(() => setErrorTint(false), 600);
      }
    },
    [targetWord, levelIndex, shuffledWords.length, runShake, runSuccessBounce],
  );

  const firstEmptyIndex = (current: (string | null)[]) =>
    current.findIndex(s => s === null);

  const handleTilePress = (tileId: string) => {
    if (phase !== 'playing') return;

    const tile = tiles.find(t => t.id === tileId);
    if (!tile || !tile.available) return;

    const emptyIdx = firstEmptyIndex(slots);
    if (emptyIdx === -1) return;

    const nextSlots = [...slots];
    nextSlots[emptyIdx] = tile.letter;
    const nextTileIds = [...slotTileIds];
    nextTileIds[emptyIdx] = tileId;

    setSlots(nextSlots);
    setSlotTileIds(nextTileIds);
    setTiles(prev =>
      prev.map(t => (t.id === tileId ? {...t, available: false} : t)),
    );

    evaluateAnswer(nextSlots);
  };

  const handleSlotPress = (index: number) => {
    if (phase === 'complete') return;

    const letter = slots[index];
    const tileId = slotTileIds[index];
    if (!letter || !tileId) return;

    const nextSlots = [...slots];
    nextSlots[index] = null;
    const nextTileIds = [...slotTileIds];
    nextTileIds[index] = null;

    setSlots(nextSlots);
    setSlotTileIds(nextTileIds);
    setTiles(prev =>
      prev.map(t => (t.id === tileId ? {...t, available: true} : t)),
    );
    setErrorTint(false);
  };

  const handleClear = () => {
    if (phase !== 'playing') return;

    setSlots(Array(targetWord.length).fill(null));
    setSlotTileIds(Array(targetWord.length).fill(null));
    setTiles(prev => prev.map(t => ({...t, available: true})));
    setErrorTint(false);
  };

  const progress = (levelIndex + (phase === 'complete' ? 1 : 0)) / TOTAL_LEVELS;
  const levelLabel =
    phase === 'complete'
      ? `Level ${TOTAL_LEVELS} / ${TOTAL_LEVELS}`
      : `Level ${levelIndex + 1} / ${TOTAL_LEVELS}`;

  const showHelp = () => {
    Alert.alert(
      'Word Scramble',
      'Tap letter tiles to spell the word. Clear resets the tiles. Finish all levels to complete the game.',
    );
  };

  const shellProps = {
    onBack: () => navigation.goBack(),
    onHelp: showHelp,
  };

  if (phase === 'complete') {
    return (
      <ScreenShell {...shellProps}>
        <View style={styles.centered}>
          <LinearGradient
                  colors={softBorderColors('#FA8A3E')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.completeBorder}>
            <View style={styles.completeCard}>
              <LinearGradient
                colors={['#FA8A3E', '#FFB347']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.completeIconChip}>
                <FeatureIcon name="wordScramble" color="#FFFFFF" size={28} />
              </LinearGradient>
              <Text style={styles.completeTitle}>You completed all words!</Text>
              <Text style={styles.completeSub}>
                Score: {score} · Best streak this run: {streak}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Play again"
                style={styles.primaryBtnWrap}
                onPress={startNewSession}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={['#FA8A3E', '#FFB347']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryButton}>
                  <IconRestart color="#FFFFFF" size={16} />
                  <Text style={styles.primaryButtonText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell {...shellProps}>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
          style={styles.introBanner}>
          <LinearGradient
            colors={['#FA8A3E', '#FFB347']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.introIconChip}>
            <FeatureIcon name="wordScramble" color="#FFFFFF" size={16} />
          </LinearGradient>
          <Text style={styles.introText}>
            Tap the tiles to unscramble and spell the word
          </Text>
        </LinearGradient>

        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
          style={styles.statsCard}>
          <Text style={styles.levelText}>{levelLabel}</Text>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FA8A3E', '#FFB347']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[
                styles.progressFill,
                {width: `${Math.min(100, progress * 100)}%`},
              ]}
            />
          </View>
          <Text style={styles.meta}>
            Score {score} · Streak {streak}
          </Text>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Answer slots</Text>
        <LinearGradient
                  colors={softBorderColors('#FA8A3E')}
          start={SOFT_BORDER_START}
          end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
          <View style={styles.slotsCard}>
            <Animated.View style={{transform: [{scale: bounceAnim}]}}>
              <WordSlots
                slots={slots}
                shakeAnim={shakeAnim}
                errorTint={errorTint}
                successTint={successTint}
                onSlotPress={handleSlotPress}
              />
            </Animated.View>
            {successMessage ? (
              <Text style={styles.successMsg} accessibilityLiveRegion="polite">
                {successMessage}
              </Text>
            ) : null}
          </View>
        </LinearGradient>

        <Text style={styles.sectionLabel}>Letter tiles</Text>
        <LinearGradient
                  colors={softBorderColors('#FA8A3E')}
          start={SOFT_BORDER_START}
          end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
          <View style={styles.tileCard}>
            <View style={styles.tileRow} key={`tiles-${sessionKey}-${levelIndex}`}>
              {tiles.map(tile => (
                <ScrambledTile
                  key={tile.id}
                  letter={tile.letter}
                  disabled={!tile.available}
                  onPress={() => handleTilePress(tile.id)}
                  accessibilityLabel={`Letter ${tile.letter}`}
                />
              ))}
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Clear all letters"
          style={styles.clearBtnWrap}
          onPress={handleClear}
          activeOpacity={0.88}>
          <LinearGradient
            colors={['#90A4AE', '#607d8b']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.clearButton}>
            <IconClear color="#FFFFFF" size={16} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
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
    shadowColor: '#FA8A3E',
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140,
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  introIconChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    lineHeight: 18,
  },
  statsCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  levelText: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(250,138,62,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: '#5A6D88',
    fontFamily: FONT.medium,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#5A6D88',
    fontFamily: FONT.semiBold,
    marginBottom: 6,
    marginLeft: 2,
  },
  shellBorder: {
    borderRadius: 18,
    padding: 1.5,
    marginBottom: 14,
  },
  slotsCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tileCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  clearBtnWrap: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONT.semiBold,
  },
  successMsg: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2e7d32',
    fontFamily: FONT.bold,
    marginTop: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completeBorder: {
    borderRadius: 22,
    padding: 1.5,
    width: '100%',
  },
  completeCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  completeIconChip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  completeTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
    textAlign: 'center',
    marginBottom: 8,
  },
  completeSub: {
    fontSize: 15,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    marginBottom: 24,
    textAlign: 'center',
  },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONT.bold,
  },
});
