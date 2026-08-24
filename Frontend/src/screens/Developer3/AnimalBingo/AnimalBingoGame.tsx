import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
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
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {SafeAreaView} from 'react-native-safe-area-context';
import Voice from '@react-native-voice/voice';
import Sound from 'react-native-sound';
import Tts from 'react-native-tts';

import {FeatureIcon} from '../../Developer1/FeatureIcons';
import AnimalCard, {AnimalCardState} from './AnimalCard';
import type {AnimalBingoGameProps} from './types';
import {
  buildPromptText,
  MODE_CONFIG,
  TOTAL_ROUNDS,
} from './utils/modeConfig';
import type {BingoAnimalWord} from '../../../api/services';
import {
  fetchBingoRound,
  verifyBingoSpeechText,
} from '../../../api/services';
import {prepareVoiceStart, releaseVoiceModule} from '../../../utils/voiceSession';

Sound.setCategory('Playback');

const FONT = {
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const VOICE_LOCALE = 'en-US';

function IconSpeaker({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 8.5a4 4 0 0 1 0 7"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMic({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={1.75} />
      <Path
        d="M5 11a7 7 0 0 0 14 0"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <Path d="M12 18v4" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

function IconClock({color = '#FF9F40', size = 14}: {color?: string; size?: number}) {
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
    Animated.stagger(
      50,
      dots.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [dots]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.burstDot,
            {
              top: `${8 + (i % 4) * 12}%` as `${number}%`,
              left: `${10 + (i % 3) * 28}%` as `${number}%`,
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1.3],
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

function ScreenHeader({
  onBack,
  onHelp,
}: {
  onBack: () => void;
  onHelp?: () => void;
}) {
  return (
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
            colors={['#FF9F40', '#FFB347']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerBtnGrad}>
            <Text style={styles.headerBtnText}>‹</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Animal Bingo
          </Text>
        </View>

        {onHelp ? (
          <TouchableOpacity
            onPress={onHelp}
            style={styles.headerBtn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Help">
            <LinearGradient
              colors={['#FFB347', '#FF9F40']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.headerBtnGrad}>
              <Text style={styles.headerBtnText}>?</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </LinearGradient>
    </View>
  );
}

export default function AnimalBingoGame({navigation, route}: AnimalBingoGameProps) {
  const {mode} = route.params;
  const config = MODE_CONFIG[mode];
  const {width: screenWidth} = useWindowDimensions();

  const [roundNumber, setRoundNumber] = useState(1);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [target, setTarget] = useState<BingoAnimalWord | null>(null);
  const [grid, setGrid] = useState<BingoAnimalWord[]>([]);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardStates, setCardStates] = useState<Record<number, AnimalCardState>>(
    {},
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState('');

  const soundRef = useRef<Sound | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceResultRef = useRef('');

  const padding = 20;
  const gap = 10;
  const cardSize = Math.floor((screenWidth - padding * 2 - gap * 2) / 3);

  const stopSound = useCallback(() => {
    if (soundRef.current) {
      try {
        soundRef.current.stop();
        soundRef.current.release();
      } catch {
        /* ignore */
      }
      soundRef.current = null;
    }
  }, []);

  const playPrompt = useCallback(
    (animal: BingoAnimalWord) => {
      const phrase = buildPromptText(animal.name);
      setPromptText(phrase);
      stopSound();
      void Tts.stop();

      if (animal.audio_url) {
        const player = new Sound(animal.audio_url, '', error => {
          if (error) {
            console.log('[AnimalBingo] audio load failed, using TTS', error);
            Tts.speak(phrase, {
              iosVoiceId: 'com.apple.ttsbundle.default',
              rate: 0.48,
              androidParams: {
                KEY_PARAM_STREAM: 'STREAM_MUSIC',
                KEY_PARAM_VOLUME: 1.0,
                KEY_PARAM_PAN: 0,
              },
            });
            return;
          }
          player.play(success => {
            if (!success) {
              Tts.speak(phrase, {
                iosVoiceId: 'com.apple.ttsbundle.default',
                rate: 0.48,
                androidParams: {
                  KEY_PARAM_STREAM: 'STREAM_MUSIC',
                  KEY_PARAM_VOLUME: 1.0,
                  KEY_PARAM_PAN: 0,
                },
              });
            }
            player.release();
            if (soundRef.current === player) {
              soundRef.current = null;
            }
          });
        });
        soundRef.current = player;
        return;
      }

      Tts.speak(phrase, {
        iosVoiceId: 'com.apple.ttsbundle.default',
        rate: 0.48,
        androidParams: {
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_PAN: 0,
        },
      });
    },
    [stopSound],
  );

  const loadRound = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setCardStates({});
    setFeedback(null);
    setIsResolving(false);

    try {
      const round = await fetchBingoRound(config.ageGroup);
      setTargetId(round.target_id);
      setTarget(round.target);
      setGrid(round.grid);
      playPrompt(round.target);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not load a new round.';
      setLoadError(String(msg));
    } finally {
      setIsLoading(false);
    }
  }, [config.ageGroup, playPrompt]);

  const startSession = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setRoundNumber(1);
    setRoundsCompleted(0);
    setWrongAttempts(0);
    setStreak(0);
    setElapsedSeconds(0);
    setIsComplete(false);
    void loadRound();
  }, [loadRound]);

  useEffect(() => {
    navigation.setOptions({title: config.label});
    startSession();
    return () => {
      stopSound();
      void Tts.stop();
      void releaseVoiceModule();
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
      }
    };
  }, [navigation, config.label, startSession, stopSound]);

  useEffect(() => {
    if (!config.showTimer || isComplete) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [config.showTimer, isComplete]);

  useEffect(() => {
    Voice.onSpeechResults = (event: {value?: string[]}) => {
      const text = event.value?.[0] ?? '';
      voiceResultRef.current = text;
      setVoiceDraft(text);
    };
    Voice.onSpeechError = () => {
      setIsListening(false);
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };
    return () => {
      void releaseVoiceModule();
    };
  }, []);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const handleCorrect = useCallback(() => {
    setIsResolving(true);
    setFeedback('Great job!');
    setStreak(s => s + 1);

    setRoundsCompleted(prev => {
      const nextCompleted = prev + 1;
      if (nextCompleted >= TOTAL_ROUNDS) {
        advanceTimer.current = setTimeout(() => {
          setIsComplete(true);
          setIsResolving(false);
        }, 900);
      } else {
        advanceTimer.current = setTimeout(() => {
          setRoundNumber(r => r + 1);
          setIsResolving(false);
          void loadRound();
        }, 1000);
      }
      return nextCompleted;
    });
  }, [loadRound]);

  const handleCardPress = (animal: BingoAnimalWord, slotIndex: number) => {
    if (isResolving || isLoading || isComplete || !targetId) {
      return;
    }

    if (animal.id === targetId) {
      setCardStates({[slotIndex]: 'correct'});
      handleCorrect();
      return;
    }

    setWrongAttempts(w => w + 1);
    setStreak(0);
    setCardStates(prev => ({...prev, [slotIndex]: 'wrong'}));
    setFeedback('Not quite — try again!');
    setTimeout(() => {
      setCardStates(prev => {
        const next = {...prev};
        delete next[slotIndex];
        return next;
      });
      setFeedback(null);
    }, 700);
  };

  const startVoiceAnswer = async () => {
    if (!target || isResolving || isLoading) {
      return;
    }
    const ok = await requestMicPermission();
    if (!ok) {
      setFeedback('Microphone permission is needed for voice answers.');
      return;
    }
    try {
      voiceResultRef.current = '';
      setVoiceDraft('');
      setIsListening(true);
      await prepareVoiceStart();
      await Voice.start(VOICE_LOCALE);
    } catch {
      setIsListening(false);
      setFeedback('Could not start voice recognition.');
    }
  };

  const submitVoiceAnswer = async () => {
    if (!target || isResolving) {
      return;
    }
    await Voice.stop();
    setIsListening(false);

    const spoken = (voiceResultRef.current || voiceDraft).trim();
    if (!spoken) {
      setFeedback('I did not hear anything. Try again.');
      return;
    }

    setIsResolving(true);
    try {
      const result = await verifyBingoSpeechText(spoken, target.name);
      if (result.match) {
        setCardStates(() => {
          const next: Record<number, AnimalCardState> = {};
          grid.forEach((item, index) => {
            if (item.id === target.id) {
              next[index] = 'correct';
            }
          });
          return next;
        });
        handleCorrect();
      } else {
        setWrongAttempts(w => w + 1);
        setStreak(0);
        setFeedback(
          `Heard "${result.transcribed_text}" — try saying ${target.name}.`,
        );
        setIsResolving(false);
      }
    } catch {
      setFeedback('Could not verify speech. Try tapping the picture instead.');
      setIsResolving(false);
    }
  };

  const progress = roundsCompleted / TOTAL_ROUNDS;

  const showHelp = () => {
    Alert.alert(
      'Animal Bingo',
      'Listen to the prompt, then tap the matching animal. Use Replay to hear it again. Some modes let you Say It with your voice.',
    );
  };

  const shellBg = (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FFF4E8', '#FFF8F0', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,159,64,0.22)', 'rgba(255,159,64,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(255,179,71,0.16)', 'rgba(255,179,71,0)']}
        style={styles.blobBottom}
      />
    </>
  );

  if (isLoading && grid.length === 0 && !loadError) {
    return (
      <View style={styles.root}>
        {shellBg}
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ScreenHeader onBack={() => navigation.goBack()} />
          <View style={styles.centeredBody}>
            <ActivityIndicator size="large" color="#FF9F40" />
            <Text style={styles.loadingText}>Loading animals…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (loadError && grid.length === 0) {
    return (
      <View style={styles.root}>
        {shellBg}
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ScreenHeader onBack={() => navigation.goBack()} />
          <View style={styles.centeredBody}>
            <Text style={styles.errorTitle}>Could not start the game</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <TouchableOpacity
              style={styles.primaryBtnWrap}
              onPress={() => void loadRound()}
              activeOpacity={0.88}>
              <LinearGradient
                colors={['#FF9F40', '#FFB347']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.88}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {shellBg}
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader onBack={() => navigation.goBack()} onHelp={showHelp} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
            style={styles.statsCard}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Round</Text>
              <Text style={styles.statValue}>
                {Math.min(roundNumber, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
              </Text>
            </View>
            {config.showStreak ? (
              <View style={styles.statChip}>
                <Text style={styles.statLabel}>Streak</Text>
                <Text style={styles.statValue}>{streak}</Text>
              </View>
            ) : null}
            {config.showTimer ? (
              <View style={styles.statChip}>
                <View style={styles.timerRow}>
                  <IconClock color="#FF9F40" size={14} />
                  <Text style={styles.statValue}>{elapsedSeconds}s</Text>
                </View>
              </View>
            ) : null}
          </LinearGradient>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FF9F40', '#FFB347']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.progressFill, {width: `${progress * 100}%`}]}
            />
          </View>

          <LinearGradient
            colors={softBorderColors('#FF9F40')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
            style={styles.promptBorder}>
            <View style={styles.promptBox}>
              <Text style={styles.promptText} accessibilityLiveRegion="polite">
                {promptText ||
                  (target ? buildPromptText(target.name) : 'Listen…')}
              </Text>
              {target ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Replay audio prompt"
                  style={styles.replayBtnWrap}
                  onPress={() => playPrompt(target)}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#FF9F40', '#FFB347']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.replayBtn}>
                    <IconSpeaker color="#FFFFFF" size={15} />
                    <Text style={styles.replayBtnText}>Replay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          <View style={[styles.grid, {paddingHorizontal: padding, gap}]}>
            {grid.map((animal, index) => (
              <AnimalCard
                key={`${roundNumber}-slot-${index}`}
                name={animal.name}
                imageUrl={animal.image_url}
                size={Math.min(config.imageSize, cardSize)}
                state={cardStates[index] ?? 'idle'}
                disabled={isResolving || isLoading}
                onPress={() => handleCardPress(animal, index)}
              />
            ))}
          </View>

          {config.voiceEnabled ? (
            <View style={styles.voiceRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  isListening ? 'Stop listening' : 'Say the animal name'
                }
                style={styles.voiceBtnWrap}
                activeOpacity={0.88}
                onPress={() =>
                  isListening
                    ? void submitVoiceAnswer()
                    : void startVoiceAnswer()
                }>
                <LinearGradient
                  colors={
                    isListening
                      ? ['#FF6B6B', '#c62828']
                      : ['#FF9F40', '#FFB347']
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.voiceBtn}>
                  <IconMic color="#FFFFFF" size={16} />
                  <Text style={styles.voiceBtnText}>
                    {isListening ? 'Stop & Check' : 'Say It'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {voiceDraft ? (
                <Text style={styles.voiceDraft} numberOfLines={1}>
                  Heard: {voiceDraft}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.mistakes}>
            Mistakes this game: {wrongAttempts}
          </Text>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={isComplete} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <CelebrationBurst />
          <LinearGradient
                  colors={softBorderColors('#FF9F40')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.modalBorder}>
            <View style={styles.modalCard}>
              <LinearGradient
                colors={['#FF9F40', '#FFB347']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.modalIconChip}>
                <FeatureIcon name="animalBingo" color="#FFFFFF" size={26} />
              </LinearGradient>
              <Text style={styles.modalTitle}>You found them all!</Text>
              <Text style={styles.modalBody}>
                Mistakes: {wrongAttempts}
                {config.showTimer ? `\nTime: ${elapsedSeconds}s` : ''}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Play again"
                style={styles.primaryBtnWrap}
                onPress={startSession}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={['#FF9F40', '#FFB347']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryBtn}>
                  <IconRestart color="#FFFFFF" size={16} />
                  <Text style={styles.primaryBtnText}>Play Again</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to modes"
                style={styles.secondaryBtn}
                activeOpacity={0.88}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('AnimalBingoModeSelect');
                  }
                }}>
                <Text style={styles.secondaryBtnText}>Back to Modes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F7FBFF'},
  safe: {flex: 1},
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
    shadowColor: '#FF9F40',
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
  scrollContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  centeredBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#1A2B4C',
    fontSize: 16,
    fontFamily: FONT.medium,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#1A2B4C',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    textAlign: 'center',
    marginBottom: 20,
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
  statChip: {alignItems: 'center'},
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
  progressTrack: {
    height: 8,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,159,64,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', borderRadius: 4},
  promptBorder: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 1.5,
  },
  promptBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  promptText: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#1A2B4C',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  replayBtnWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  replayBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT.bold,
    fontSize: 14,
  },
  feedback: {
    textAlign: 'center',
    marginTop: 8,
    color: '#5A6D88',
    fontSize: 14,
    fontFamily: FONT.semiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  voiceRow: {alignItems: 'center', marginTop: 14, paddingHorizontal: 20},
  voiceBtnWrap: {borderRadius: 14, overflow: 'hidden'},
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  voiceBtnText: {
    color: '#FFF',
    fontFamily: FONT.bold,
    fontSize: 16,
  },
  voiceDraft: {
    marginTop: 6,
    color: '#1A2B4C',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  mistakes: {
    textAlign: 'center',
    marginTop: 10,
    color: '#7A8AA0',
    fontSize: 13,
    fontFamily: FONT.medium,
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
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 48,
  },
  primaryBtnText: {
    color: '#FFF',
    fontFamily: FONT.bold,
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    minWidth: 200,
    minHeight: 48,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,159,64,0.45)',
    width: '100%',
  },
  secondaryBtnText: {
    color: '#FF9F40',
    fontFamily: FONT.bold,
    fontSize: 15,
  },
  burstDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9F40',
  },
});
