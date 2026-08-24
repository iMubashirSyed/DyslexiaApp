import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  LayoutChangeEvent,
  PanResponder,
  Platform,
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
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path, Polyline} from 'react-native-svg';
import Tts from 'react-native-tts';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../navigation/types';
import {
  densifyLetter,
  getLetterStrokes,
  type Point,
} from '../../data/letterStrokeGuides';
import {
  pickRandomWord,
  TRACE_WORD_COUNT,
  type TraceDifficulty,
} from '../../data/traceWordDictionary';
import {
  hitThresholdForLetter,
  isTracePass,
  scoreTraceCoverage,
  type Stroke,
} from '../../utils/traceScore';
import {FeatureIcon} from './FeatureIcons';

type Props = NativeStackScreenProps<HomeStackParamList, 'LetterTrace'>;

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const THEME = {
  guide: '#94a3b8',
  ink: '#FF7E5F',
  covered: '#43a047',
} as const;

type LaidOutGuide = {
  screenPoints: Point[];
  strokesScreen: Point[][];
};

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

function IconCheck({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconNext({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <Path
        d="M13 5l7 7-7 7"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function layoutWordGuides(
  word: string,
  canvasW: number,
  canvasH: number,
): LaidOutGuide {
  const letters = word.toLowerCase().split('');
  const n = Math.max(1, letters.length);
  const padX = 16;
  const padY = 16;
  const gap = Math.min(14, canvasW / (n * 8));
  const usableW = canvasW - padX * 2 - gap * (n - 1);
  const letterW = Math.max(36, usableW / n);
  const letterH = Math.min(canvasH - padY * 2, letterW * 1.35);
  const totalW = letterW * n + gap * (n - 1);
  const startX = (canvasW - totalW) / 2;
  const startY = (canvasH - letterH) / 2;

  const screenPoints: Point[] = [];
  const strokesScreen: Point[][] = [];

  letters.forEach((ch, i) => {
    const strokes = getLetterStrokes(ch);
    if (!strokes) {
      return;
    }
    const ox = startX + i * (letterW + gap);
    const oy = startY;
    const mapPt = (p: Point): Point => ({
      x: ox + (p.x / 100) * letterW,
      y: oy + (p.y / 100) * letterH,
    });
    strokes.forEach(stroke => {
      const mapped = stroke.map(mapPt);
      strokesScreen.push(mapped);
    });
    densifyLetter(strokes, 5).forEach(p => screenPoints.push(mapPt(p)));
  });

  return {screenPoints, strokesScreen};
}

function pointsToSvg(points: Point[]): string {
  return points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

export default function LetterTraceScreen({navigation}: Props) {
  const [difficulty, setDifficulty] = useState<TraceDifficulty>('easy');
  const [word, setWord] = useState(() => pickRandomWord('easy'));
  const [canvasSize, setCanvasSize] = useState({w: 0, h: 220});
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [liveStroke, setLiveStroke] = useState<Stroke>([]);
  const [celebrated, setCelebrated] = useState(false);

  const strokesRef = useRef<Stroke[]>([]);
  const liveRef = useRef<Stroke>([]);
  const ttsReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Tts.getInitStatus();
        if (cancelled) {
          return;
        }
        await Tts.setDefaultLanguage('en-US');
        await Tts.setDefaultRate(Platform.OS === 'ios' ? 0.45 : 0.5);
        ttsReadyRef.current = true;
      } catch (err) {
        console.log('[LetterTrace] TTS init failed:', err);
        ttsReadyRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
      void Tts.stop();
    };
  }, []);

  const guides = useMemo(
    () => layoutWordGuides(word, canvasSize.w || 320, canvasSize.h || 220),
    [word, canvasSize.w, canvasSize.h],
  );

  const coverage = useMemo(() => {
    const ink = [...strokes, liveStroke].filter(s => s.length);
    const letterSize = Math.max(36, (canvasSize.w || 320) / Math.max(word.length, 1));
    const threshold = hitThresholdForLetter(letterSize);
    return scoreTraceCoverage(guides.screenPoints, ink, threshold);
  }, [strokes, liveStroke, guides.screenPoints, canvasSize.w, word.length]);

  const resetDrawing = useCallback(() => {
    strokesRef.current = [];
    liveRef.current = [];
    setStrokes([]);
    setLiveStroke([]);
    setCelebrated(false);
  }, []);

  const nextWord = useCallback(() => {
    setWord(prev => pickRandomWord(difficulty, prev));
    resetDrawing();
  }, [difficulty, resetDrawing]);

  const onDifficulty = (d: TraceDifficulty) => {
    setDifficulty(d);
    setWord(pickRandomWord(d));
    resetDrawing();
  };

  const checkTrace = useCallback(() => {
    if (strokesRef.current.length === 0 && liveRef.current.length === 0) {
      Alert.alert('Trace first', 'Draw on the dashed letters, then tap Check.');
      return;
    }
    const letterSize = Math.max(36, (canvasSize.w || 320) / Math.max(word.length, 1));
    const threshold = hitThresholdForLetter(letterSize);
    const result = scoreTraceCoverage(
      guides.screenPoints,
      strokesRef.current,
      threshold,
    );
    const ok = isTracePass(result.percent);
    setCelebrated(ok);
    if (ok) {
      Alert.alert(
        'Great tracing!',
        `Accuracy ${result.percent}% for “${word}”.\n(on-track ${result.precisionPercent}% · guide ${result.coveragePercent}%)`,
        [
          {text: 'Again', onPress: resetDrawing},
          {text: 'Next word', onPress: nextWord},
        ],
      );
    } else {
      Alert.alert(
        'Keep practicing',
        `Accuracy ${result.percent}% — stay closer to the dashed lines (need about 82%).\n(on-track ${result.precisionPercent}% · guide ${result.coveragePercent}%)`,
      );
    }
  }, [canvasSize.w, word, guides.screenPoints, resetDrawing, nextWord]);

  const speakWord = useCallback(async () => {
    const text = word.toLowerCase().trim();
    if (!text) {
      return;
    }
    try {
      if (!ttsReadyRef.current) {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage('en-US');
        ttsReadyRef.current = true;
      }
      await Tts.stop();
      await new Promise<void>(resolve => setTimeout(resolve, 120));
      if (Platform.OS === 'ios') {
        Tts.speak(text, {
          iosVoiceId: 'com.apple.ttsbundle.Samantha',
          rate: 0.45,
        });
      } else {
        Tts.speak(text, {
          rate: 0.5,
          androidParams: {
            KEY_PARAM_STREAM: 'STREAM_MUSIC',
            KEY_PARAM_VOLUME: 1.0,
            KEY_PARAM_PAN: 0,
          },
        });
      }
    } catch (err) {
      console.log('[LetterTrace] speak failed:', err);
      Alert.alert(
        'Speech',
        'Could not speak the word. Check that Text-to-speech is enabled on this device.',
      );
    }
  }, [word]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          const {locationX, locationY} = evt.nativeEvent;
          const stroke = [{x: locationX, y: locationY}];
          liveRef.current = stroke;
          setLiveStroke(stroke);
        },
        onPanResponderMove: evt => {
          const {locationX, locationY} = evt.nativeEvent;
          const next = [...liveRef.current, {x: locationX, y: locationY}];
          liveRef.current = next;
          setLiveStroke(next);
        },
        onPanResponderRelease: () => {
          if (liveRef.current.length > 1) {
            strokesRef.current = [...strokesRef.current, liveRef.current];
            setStrokes([...strokesRef.current]);
          }
          liveRef.current = [];
          setLiveStroke([]);
        },
        onPanResponderTerminate: () => {
          liveRef.current = [];
          setLiveStroke([]);
        },
      }),
    [],
  );

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasSize({w: width, h: height});
    }
  };

  const showHelp = () => {
    Alert.alert(
      'Letter Trace',
      `Trace directly on the dashed lowercase letters, then tap Check.\n\nStay on the lines — drawing nearby will not pass.\nYou need about 82% accuracy.\n\nDictionary: ${TRACE_WORD_COUNT} local words (offline).`,
    );
  };

  const difficulties: TraceDifficulty[] = ['easy', 'medium', 'hard', 'any'];

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
        colors={['rgba(255,126,95,0.16)', 'rgba(255,126,95,0)']}
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
                colors={['#FF9A56', '#FF7E5F']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Letter Trace
              </Text>
            </View>

            <TouchableOpacity
              onPress={showHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#FF7E5F', '#FF9A56']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#FF9A56', '#FF7E5F']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="letterTrace" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Trace the dashed letters — stay on the lines to pass
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Trace this word</Text>
          <LinearGradient
                  colors={softBorderColors('#FF9A56')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <View style={styles.card}>
              <Text style={styles.targetWord}>{word.toLowerCase()}</Text>
              <Text style={styles.meta}>
                {TRACE_WORD_COUNT.toLocaleString()} words in local dictionary
              </Text>

              <View style={styles.diffRow}>
                {difficulties.map(d => {
                  const active = difficulty === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={styles.diffChipWrap}
                      onPress={() => onDifficulty(d)}
                      activeOpacity={0.88}>
                      {active ? (
                        <LinearGradient
                          colors={['#FF9A56', '#FF7E5F']}
                          start={{x: 0, y: 0}}
                          end={{x: 1, y: 1}}
                          style={styles.diffChipOn}>
                          <Text style={styles.diffChipTextOn}>{d}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.diffChip}>
                          <Text style={styles.diffChipText}>{d}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Canvas</Text>
          <LinearGradient
                  colors={softBorderColors('#FF9A56')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <View style={styles.canvasCard}>
              <View
                style={styles.canvas}
                onLayout={onCanvasLayout}
                {...panResponder.panHandlers}>
                {canvasSize.w > 0 ? (
                  <Svg width={canvasSize.w} height={canvasSize.h}>
                    {guides.strokesScreen.map((stroke, i) => (
                      <Polyline
                        key={`g-${i}`}
                        points={pointsToSvg(stroke)}
                        fill="none"
                        stroke={THEME.guide}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="10 8"
                      />
                    ))}
                    {coverage.coveredFlags.map((ok, i) =>
                      ok ? (
                        <Circle
                          key={`c-${i}`}
                          cx={guides.screenPoints[i].x}
                          cy={guides.screenPoints[i].y}
                          r={3}
                          fill={THEME.covered}
                          opacity={0.55}
                        />
                      ) : null,
                    )}
                    {[...strokes, liveStroke].map((stroke, i) =>
                      stroke.length > 1 ? (
                        <Polyline
                          key={`s-${i}`}
                          points={pointsToSvg(stroke)}
                          fill="none"
                          stroke={THEME.ink}
                          strokeWidth={6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : null,
                    )}
                  </Svg>
                ) : null}
              </View>
              <Text style={styles.hint}>
                Accuracy: {coverage.percent}% (on-track {coverage.precisionPercent}% ·
                guide {coverage.coveragePercent}%)
                {celebrated ? ' · Done' : ' · Stay on the dashed lines'}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnWrap}
              onPress={() => void speakWord()}
              activeOpacity={0.88}>
              <LinearGradient
                colors={['#FFB88C', '#FF9A56']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.btnSecondary}>
                <IconSpeaker color="#FFFFFF" size={16} />
                <Text style={styles.btnSecondaryText}>Listen</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnWrap}
              onPress={resetDrawing}
              activeOpacity={0.88}>
              <LinearGradient
                colors={['#90A4AE', '#607d8b']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.btnSecondary}>
                <IconClear color="#FFFFFF" size={16} />
                <Text style={styles.btnSecondaryText}>Clear</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnWrap}
              onPress={checkTrace}
              activeOpacity={0.88}>
              <LinearGradient
                colors={['#FF9A56', '#FF7E5F']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.btnPrimary}>
                <IconCheck color="#FFFFFF" size={16} />
                <Text style={styles.btnPrimaryText}>Check</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.nextBtnWrap}
            onPress={nextWord}
            activeOpacity={0.88}>
            <LinearGradient
              colors={['#43E97B', '#2e7d32']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.nextBtn}>
              <IconNext color="#FFFFFF" size={16} />
              <Text style={styles.nextBtnText}>Next random word</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
  scroll: {
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
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 16,
  },
  targetWord: {
    fontFamily: FONT.extraBold,
    fontSize: 36,
    color: '#1A2B4C',
    letterSpacing: 2,
  },
  meta: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: '#5A6D88',
    marginTop: 4,
  },
  diffRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  diffChipWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  diffChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,154,86,0.3)',
    backgroundColor: 'rgba(255,154,86,0.08)',
  },
  diffChipOn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  diffChipText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    color: '#5A6D88',
    textTransform: 'capitalize',
  },
  diffChipTextOn: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    color: '#fff',
    textTransform: 'capitalize',
  },
  canvasCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 12,
  },
  canvas: {
    height: 220,
    borderRadius: 12,
    backgroundColor: '#FFFCFA',
    borderWidth: 1,
    borderColor: 'rgba(255,154,86,0.25)',
    overflow: 'hidden',
  },
  hint: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: '#5A6D88',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  btnWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnSecondaryText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    color: '#fff',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnPrimaryText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    color: '#fff',
  },
  nextBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  nextBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    color: '#fff',
  },
});
