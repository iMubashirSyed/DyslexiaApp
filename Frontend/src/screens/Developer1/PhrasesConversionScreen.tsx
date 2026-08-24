import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Tts from 'react-native-tts';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import type {HomeStackParamList, MainTabParamList} from '../../navigation/types';
import {useSimplifyText} from '../../hooks/useSimplifyText';
import {
  SimplificationLevel,
  SimplifyResponse,
  VocabularyItem,
} from '../../types/simplify';
import {AuthContext} from '../../context/AuthContext';
import {
  deletePhraseConversion,
  fetchPhraseConversionHistory,
  savePhraseConversion,
  type PhraseConversionItem,
} from '../../api/services';
import {FeatureIcon} from './FeatureIcons';

type PhrasesConversionScreenProps = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'PhrasesConversion'>,
    BottomTabScreenProps<MainTabParamList, 'Home'>
  >['navigation'];
};

const LEVEL_MAP: Record<number, SimplificationLevel> = {
  0: 'veryBasic',
  1: 'basic',
  2: 'standard',
};

const LEVEL_LABEL_MAP: Record<SimplificationLevel, string> = {
  veryBasic: 'Very Basic',
  basic: 'Basic',
  standard: 'Standard',
};

const LEVEL_TO_SLIDER: Record<string, number> = {
  veryBasic: 0,
  basic: 1,
  standard: 2,
};

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const showHelp = () => {
  Alert.alert(
    'Phrases Conversion',
    'Simplify complex text for easier reading. Past conversions are saved to your history. Long-press a history card to delete it.',
  );
};

function toSimplifyResponse(item: PhraseConversionItem): SimplifyResponse {
  const raw = (item.result_json || {}) as Partial<SimplifyResponse>;
  return {
    original: raw.original || item.original,
    simplified: raw.simplified || item.simplified,
    readability: raw.readability || {
      beforeGrade: 0,
      afterGrade: 0,
      improvement: '',
    },
    entities: raw.entities || [],
    vocabulary: raw.vocabulary || [],
    actions: raw.actions || [],
    grammarInsights: raw.grammarInsights || {
      sentenceType: '',
      tense: '',
      wordCount: {before: 0, after: 0},
    },
    dyslexiaHelpers: raw.dyslexiaHelpers || {
      chunkedText: [],
      colorCoding: {nouns: [], verbs: [], adjectives: []},
    },
  };
}

export default function PhrasesConversionScreen(
  _props: PhrasesConversionScreenProps,
) {
  const auth = useContext(AuthContext);
  const [inputText, setInputText] = useState('');
  const [sliderValue, setSliderValue] = useState(1);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [speakingSection, setSpeakingSection] = useState<
    'definition' | 'examples' | 'simplified' | null
  >(null);
  const [history, setHistory] = useState<PhraseConversionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyResult, setHistoryResult] = useState<SimplifyResponse | null>(
    null,
  );
  const navigation = useNavigation();
  const ttsOptions = useMemo(
    () =>
      ({
        iosVoiceId: 'com.apple.ttsbundle.default',
        rate: 0.48,
        androidParams: {
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_PAN: 0,
        },
      }) as const,
    [],
  );

  useEffect(() => {
    const onFinish = () => setSpeakingSection(null);
    const onCancel = () => setSpeakingSection(null);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);
    return () => {
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  useEffect(() => {
    if (!selectedWord) {
      return;
    }
    return () => {
      Tts.stop();
      setSpeakingSection(null);
    };
  }, [selectedWord?.word]);

  const closeVocabModal = useCallback(() => {
    Tts.stop();
    setSpeakingSection(null);
    setSelectedWord(null);
  }, []);

  const toggleSpeakDefinition = useCallback(() => {
    if (!selectedWord?.definition?.trim()) {
      return;
    }
    if (speakingSection === 'definition') {
      Tts.stop();
      setSpeakingSection(null);
      return;
    }
    Tts.stop();
    setSpeakingSection('definition');
    Tts.speak(selectedWord.definition.trim(), ttsOptions);
  }, [selectedWord, speakingSection, ttsOptions]);

  const toggleSpeakExamples = useCallback(() => {
    const raw = selectedWord?.examples ?? [];
    const text = raw.map(e => String(e).trim()).filter(Boolean).join('. ');
    if (!text) {
      return;
    }
    if (speakingSection === 'examples') {
      Tts.stop();
      setSpeakingSection(null);
      return;
    }
    Tts.stop();
    setSpeakingSection('examples');
    Tts.speak(text, ttsOptions);
  }, [selectedWord, speakingSection, ttsOptions]);

  const userId = auth?.user?.id ? String(auth.user.id) : 'anonymous';
  const {loading, error, result, runSimplification, clearResult} =
    useSimplifyText(userId);

  const displayResult = result ?? historyResult;

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await fetchPhraseConversionHistory();
      setHistory(rows);
    } catch (err) {
      console.log('[PhrasesConversion] history failed', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const targetLevel = useMemo(
    () => LEVEL_MAP[Math.round(sliderValue)] ?? 'basic',
    [sliderValue],
  );

  const handleSimplify = async () => {
    setHistoryResult(null);
    const simplified = await runSimplification(inputText, targetLevel).catch(
      () => null,
    );
    if (!simplified) {
      return;
    }
    try {
      const saved = await savePhraseConversion({
        original: simplified.original,
        simplified: simplified.simplified,
        target_level: targetLevel,
        result_json: simplified as unknown as Record<string, unknown>,
      });
      setHistory(prev => [saved, ...prev.filter(h => h.id !== saved.id)]);
    } catch (err) {
      console.log('[PhrasesConversion] save failed', err);
    }
  };

  const openHistoryItem = (item: PhraseConversionItem) => {
    Tts.stop();
    setSpeakingSection(null);
    setSelectedWord(null);
    clearResult();
    setHistoryResult(toSimplifyResponse(item));
    setInputText(item.original);
    setSliderValue(LEVEL_TO_SLIDER[item.target_level] ?? 1);
  };

  const handleDeleteHistory = (id: number) => {
    Alert.alert('Delete', 'Remove this conversion from history?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePhraseConversion(id);
              setHistory(prev => prev.filter(h => h.id !== id));
            } catch {
              Alert.alert('Error', 'Could not delete history item.');
            }
          })();
        },
      },
    ]);
  };

  const handleReadAloud = () => {
    if (!displayResult?.simplified) {
      return;
    }

    if (speakingSection === 'simplified') {
      Tts.stop();
      setSpeakingSection(null);
      return;
    }

    Tts.stop();
    setSpeakingSection('simplified');
    Tts.speak(displayResult.simplified, {
      iosVoiceId: 'com.apple.ttsbundle.default',
      rate: 0.5,
      androidParams: {
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_PAN: 0,
      },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E8F9FF', '#F0FBFF', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(79,172,254,0.22)', 'rgba(79,172,254,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(0,242,254,0.16)', 'rgba(0,242,254,0)']}
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
                colors={['#4FACFE', '#00F2FE']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Phrases Conversion
              </Text>
            </View>

            <TouchableOpacity
              onPress={showHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#00C6FB', '#005BEA']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#4FACFE', '#00F2FE']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="phrases" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Paste a hard phrase — get an easier version to read
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Your text</Text>
          <LinearGradient
                  colors={softBorderColors('#4FACFE')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <TextInput
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="Paste complex phrase or paragraph"
              placeholderTextColor="#7A8BA3"
              style={styles.input}
              textAlignVertical="top"
            />
          </LinearGradient>

          <Text style={styles.sectionLabel}>Simplification level</Text>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
            style={styles.sliderCard}>
            <View style={styles.levelPills}>
              {([0, 1, 2] as const).map(value => {
                const active = Math.round(sliderValue) === value;
                const label = LEVEL_LABEL_MAP[LEVEL_MAP[value]];
                return (
                  <TouchableOpacity
                    key={value}
                    activeOpacity={0.88}
                    onPress={() => setSliderValue(value)}
                    style={styles.levelPillWrap}>
                    {active ? (
                      <LinearGradient
                        colors={['#4FACFE', '#00F2FE']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={styles.levelPillActive}>
                        <Text style={styles.levelPillTextActive}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.levelPillIdle}>
                        <Text style={styles.levelPillTextIdle}>{label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Slider
              minimumValue={0}
              maximumValue={2}
              step={1}
              value={sliderValue}
              onValueChange={setSliderValue}
              minimumTrackTintColor="#4FACFE"
              maximumTrackTintColor="#D7EAF7"
              thumbTintColor="#00C6FB"
            />
          </LinearGradient>

          <TouchableOpacity
            onPress={handleSimplify}
            style={[styles.buttonWrap, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.88}>
            <LinearGradient
              colors={['#4FACFE', '#00F2FE']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.button}>
              <Text style={styles.buttonText}>Simplify Text</Text>
            </LinearGradient>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#4FACFE" />
              <Text style={styles.loadingText}>Simplifying text...</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {displayResult ? (
            <>
              <Text style={styles.sectionLabel}>Simplified text</Text>
              <LinearGradient
                  colors={softBorderColors('#43E97B')}
                start={SOFT_BORDER_START}
                end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
                <View style={styles.resultCard}>
                  <Text style={styles.simplifiedText}>
                    {displayResult.simplified}
                  </Text>

                  <TouchableOpacity
                    style={styles.readAloudWrap}
                    onPress={handleReadAloud}
                    activeOpacity={0.88}>
                    <LinearGradient
                      colors={
                        speakingSection === 'simplified'
                          ? ['#FF6B6B', '#c62828']
                          : ['#43E97B', '#2e7d32']
                      }
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.readAloudButton}>
                      <Text style={styles.readAloudText}>
                        {speakingSection === 'simplified'
                          ? 'Stop'
                          : 'Read Aloud'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.readabilityRow}>
                    <View style={styles.statChip}>
                      <Text style={styles.statLabel}>Before</Text>
                      <Text style={styles.statValue}>
                        {displayResult.readability.beforeGrade}
                      </Text>
                    </View>
                    <View style={styles.statChip}>
                      <Text style={styles.statLabel}>After</Text>
                      <Text style={styles.statValue}>
                        {displayResult.readability.afterGrade}
                      </Text>
                    </View>
                  </View>
                  {displayResult.readability.improvement ? (
                    <Text style={styles.infoText}>
                      {displayResult.readability.improvement}
                    </Text>
                  ) : null}

                  <Text style={styles.innerSectionTitle}>
                    Vocabulary (tap a word)
                  </Text>
                  {displayResult.vocabulary.length === 0 ? (
                    <Text style={styles.mutedText}>
                      No difficult words found.
                    </Text>
                  ) : (
                    <View style={styles.vocabList}>
                      {displayResult.vocabulary.map((item, index) => (
                        <TouchableOpacity
                          key={`vocab-${index}-${item.word}`}
                          style={styles.vocabChip}
                          onPress={() => setSelectedWord(item)}
                          activeOpacity={0.85}>
                          <Text style={styles.vocabChipText}>
                            {item.word}
                            {item.replacement && item.replacement !== item.word
                              ? ` → ${item.replacement}`
                              : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </LinearGradient>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>History</Text>
          {historyLoading ? (
            <ActivityIndicator color="#4FACFE" style={styles.historyLoader} />
          ) : history.length === 0 ? (
            <Text style={styles.mutedText}>No saved conversions yet.</Text>
          ) : (
            history.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => openHistoryItem(item)}
                onLongPress={() => handleDeleteHistory(item.id)}
                style={styles.historyShell}>
                <LinearGradient
                  colors={softBorderColors('#4FACFE')}
                  start={SOFT_BORDER_START}
                  end={SOFT_BORDER_END}
                  style={styles.historyBorder}>
                  <View style={styles.historyCard}>
                    <Text style={styles.historyLevel}>
                      {LEVEL_LABEL_MAP[
                        item.target_level as SimplificationLevel
                      ] || item.target_level}
                    </Text>
                    <Text style={styles.historyOriginal} numberOfLines={2}>
                      {item.original}
                    </Text>
                    <Text style={styles.historySimplified} numberOfLines={2}>
                      → {item.simplified}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal transparent visible={Boolean(selectedWord)} animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient
                  colors={softBorderColors('#4FACFE')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.modalBorder}>
            <View style={styles.modalCard}>
              {selectedWord ? (
                <>
                  <Text style={styles.modalTitle}>{selectedWord.word}</Text>
                  <Text style={styles.modalLine}>
                    Difficulty: {selectedWord.difficulty}
                  </Text>
                  <Text style={styles.modalLine}>
                    Replacement: {selectedWord.replacement}
                  </Text>

                  <View style={styles.modalBlock}>
                    <View style={styles.modalBlockHeader}>
                      <Text style={styles.modalBlockLabel}>Definition</Text>
                      <TouchableOpacity
                        style={styles.modalSpeakHit}
                        onPress={toggleSpeakDefinition}
                        disabled={!selectedWord.definition?.trim()}
                        accessibilityRole="button"
                        accessibilityLabel={
                          speakingSection === 'definition'
                            ? 'Stop speaking definition'
                            : 'Speak definition aloud'
                        }>
                        <Text style={styles.modalSpeakIcon}>
                          {speakingSection === 'definition' ? '⏹' : '🔊'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalBlockBody}>
                      {selectedWord.definition || '—'}
                    </Text>
                  </View>

                  <View style={styles.modalBlock}>
                    <View style={styles.modalBlockHeader}>
                      <Text style={styles.modalBlockLabel}>Examples</Text>
                      <TouchableOpacity
                        style={styles.modalSpeakHit}
                        onPress={toggleSpeakExamples}
                        disabled={
                          !(selectedWord.examples ?? []).some(e =>
                            String(e).trim(),
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          speakingSection === 'examples'
                            ? 'Stop speaking examples'
                            : 'Speak examples aloud'
                        }>
                        <Text style={styles.modalSpeakIcon}>
                          {speakingSection === 'examples' ? '⏹' : '🔊'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalBlockBody}>
                      {(selectedWord.examples ?? []).join(', ') || '—'}
                    </Text>
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.closeButtonWrap}
                onPress={closeVocabModal}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={['#4FACFE', '#00F2FE']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </LinearGradient>
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
    shadowColor: '#4FACFE',
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
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
    borderRadius: 16,
    padding: 1.5,
    marginBottom: 12,
  },
  input: {
    fontFamily: FONT.regular,
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    color: '#1A2B4C',
    lineHeight: 26,
    maxHeight: 180,
  },
  sliderCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  levelPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  levelPillWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  levelPillActive: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  levelPillIdle: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(79,172,254,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.2)',
  },
  levelPillTextActive: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  levelPillTextIdle: {
    color: '#5A6D88',
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  buttonWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontFamily: FONT.semiBold,
    color: '#fff',
    fontSize: 15,
  },
  loadingWrap: {
    marginTop: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONT.medium,
    marginTop: 8,
    color: '#5A6D88',
  },
  errorText: {
    fontFamily: FONT.medium,
    marginTop: 8,
    marginBottom: 8,
    color: '#c62828',
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  simplifiedText: {
    fontFamily: FONT.regular,
    fontSize: 17,
    color: '#1A2B4C',
    lineHeight: 26,
  },
  readAloudWrap: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  readAloudButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  readAloudText: {
    fontFamily: FONT.semiBold,
    color: '#fff',
    fontSize: 14,
  },
  readabilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(79,172,254,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.2)',
  },
  statLabel: {
    fontSize: 11,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    color: '#1A2B4C',
    fontFamily: FONT.extraBold,
  },
  innerSectionTitle: {
    fontFamily: FONT.bold,
    marginTop: 4,
    fontSize: 14,
    color: '#1A2B4C',
  },
  infoText: {
    fontFamily: FONT.regular,
    color: '#5A6D88',
    fontSize: 13,
    lineHeight: 18,
  },
  mutedText: {
    fontFamily: FONT.regular,
    color: '#607d8b',
    fontSize: 14,
    marginBottom: 8,
  },
  vocabList: {
    gap: 6,
  },
  vocabChip: {
    backgroundColor: 'rgba(79,172,254,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.25)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  vocabChipText: {
    fontFamily: FONT.medium,
    color: '#1A2B4C',
    fontSize: 14,
  },
  historyLoader: {
    marginVertical: 8,
  },
  historyShell: {
    marginBottom: 10,
  },
  historyBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  historyCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 12,
  },
  historyLevel: {
    fontFamily: FONT.semiBold,
    fontSize: 11,
    color: '#4FACFE',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  historyOriginal: {
    fontFamily: FONT.regular,
    fontSize: 13,
    color: '#5A6D88',
    marginBottom: 4,
  },
  historySimplified: {
    fontFamily: FONT.medium,
    fontSize: 14,
    color: '#1A2B4C',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 65, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontFamily: FONT.bold,
    fontSize: 20,
    color: '#1A2B4C',
    marginBottom: 8,
  },
  modalLine: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: '#5A6D88',
    marginBottom: 6,
  },
  modalBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79,172,254,0.2)',
  },
  modalBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalBlockLabel: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    color: '#1A2B4C',
  },
  modalSpeakHit: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(79,172,254,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79,172,254,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSpeakIcon: {
    fontSize: 20,
  },
  modalBlockBody: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: '#5A6D88',
    lineHeight: 22,
  },
  closeButtonWrap: {
    marginTop: 12,
    alignSelf: 'flex-end',
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontFamily: FONT.semiBold,
    color: '#fff',
    fontSize: 15,
  },
});
