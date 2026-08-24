import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import Svg, {Path} from 'react-native-svg';
import Sound from 'react-native-sound';
import Tts from 'react-native-tts';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../navigation/types';
import {
  createAuditoryVisualization,
  deleteAuditoryVisualization,
  fetchAuditoryVisualizationHistory,
  type AuditoryVisualizationItem,
} from '../../api/services';
import {
  prefetchRemoteImages,
  remoteImageSource,
} from '../../utils/remoteImage';
import {FeatureIcon} from './FeatureIcons';

type Props = NativeStackScreenProps<
  HomeStackParamList,
  'AuditoryGuidedVisualization'
>;

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

Sound.setCategory('Playback');

function IconSpeaker({color = '#FFFFFF', size = 18}: {color?: string; size?: number}) {
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
      <Path
        d="M18 6a7 7 0 0 1 0 12"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconTrash({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
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

function ScreenHeader({
  title,
  onBack,
  onRight,
  rightDanger,
}: {
  title: string;
  onBack: () => void;
  onRight?: () => void;
  rightDanger?: boolean;
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
            colors={['#30CFD0', '#2F80ED']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerBtnGrad}>
            <Text style={styles.headerBtnText}>‹</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {onRight ? (
          <TouchableOpacity
            onPress={onRight}
            style={styles.headerBtn}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={rightDanger ? 'Delete' : 'Help'}>
            <LinearGradient
              colors={
                rightDanger
                  ? ['#FF6B6B', '#c62828']
                  : ['#2F80ED', '#30CFD0']
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.headerBtnGrad}>
              {rightDanger ? (
                <IconTrash color="#FFFFFF" size={15} />
              ) : (
                <Text style={styles.headerBtnText}>?</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </LinearGradient>
    </View>
  );
}

export default function AuditoryGuidedVisualizationScreen({navigation}: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState<AuditoryVisualizationItem | null>(
    null,
  );
  const [history, setHistory] = useState<AuditoryVisualizationItem[]>([]);
  const [detailImageLoading, setDetailImageLoading] = useState(false);
  const soundRef = useRef<Sound | null>(null);

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

  const closeDetail = useCallback(() => {
    stopSound();
    void Tts.stop();
    setSelected(null);
  }, [stopSound]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await fetchAuditoryVisualizationHistory();
      setHistory(rows);
      void prefetchRemoteImages(rows.map(r => r.image_url));
    } catch (err: any) {
      console.log('[AuditoryViz] history failed', err?.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    return () => {
      stopSound();
      void Tts.stop();
    };
  }, [loadHistory, stopSound]);

  const playRemoteSound = (url: string | null, label: string) => {
    if (!url) {
      Alert.alert('Sound', 'No audio available for this effect.');
      return;
    }
    stopSound();
    const s = new Sound(url, '', error => {
      if (error) {
        console.log('[AuditoryViz] sound load error', error);
        Alert.alert(
          'Sound',
          `Could not play “${label}”. Check that the backend media URL is reachable from this device.`,
        );
        return;
      }
      s.play(success => {
        if (!success) {
          Alert.alert('Sound', 'Playback failed.');
        }
        s.release();
        if (soundRef.current === s) {
          soundRef.current = null;
        }
      });
    });
    soundRef.current = s;
  };

  const speakDescription = (text: string) => {
    if (!text.trim()) {
      return;
    }
    void Tts.stop();
    Tts.speak(text, {
      rate: 0.48,
      androidParams: {
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_PAN: 0,
      },
    });
  };

  const handleGenerate = async () => {
    const text = prompt.trim();
    if (!text) {
      Alert.alert('Enter a word', 'Type a word or short phrase first.');
      return;
    }
    Keyboard.dismiss();
    stopSound();
    setLoading(true);
    try {
      const item = await createAuditoryVisualization(text);
      setHistory(prev => [item, ...prev.filter(h => h.id !== item.id)]);
      setPrompt('');
      if (item.image_url) {
        void prefetchRemoteImages([item.image_url]);
        setDetailImageLoading(true);
      }
      setSelected(item);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Could not generate visualization.';
      Alert.alert('Generation failed', String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Remove this item from history?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteAuditoryVisualization(id);
              setHistory(prev => prev.filter(h => h.id !== id));
              if (selected?.id === id) {
                closeDetail();
              }
            } catch {
              Alert.alert('Error', 'Could not delete item.');
            }
          })();
        },
      },
    ]);
  };

  const showHelp = () => {
    Alert.alert(
      'Auditory-Guided Visualization',
      'Enter a word or phrase (e.g. “horse” or “fish swimming in the sea”).\n\n' +
        'The app generates:\n• 1 supporting image (OpenAI)\n• 2 related sound effects (ElevenLabs)\n• A short spoken description (device TTS)\n\n' +
        'Tap a history card to open full details.',
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E6FBFC', '#EEF7FF', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(48,207,208,0.22)', 'rgba(48,207,208,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(47,128,237,0.16)', 'rgba(47,128,237,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Auditory Visualization"
          onBack={() => navigation.goBack()}
          onRight={showHelp}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#30CFD0', '#2F80ED']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="auditory" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              See an image, hear sounds, and listen to a short description
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Word or phrase</Text>
          <LinearGradient
                  colors={softBorderColors('#30CFD0')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="e.g. horse · fish swimming in the sea"
                placeholderTextColor="#7A8BA3"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.primaryBtnWrap, loading && styles.btnDisabled]}
                onPress={() => void handleGenerate()}
                disabled={loading}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={['#30CFD0', '#2F80ED']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.primaryBtn}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Generate image + sounds
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              {loading ? (
                <Text style={styles.loadingHint}>
                  Creating 1 image and 2 sound effects… this can take up to a
                  minute.
                </Text>
              ) : null}
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>History</Text>
          {historyLoading ? (
            <ActivityIndicator color="#30CFD0" style={styles.historyLoader} />
          ) : history.length === 0 ? (
            <Text style={styles.empty}>No saved visualizations yet.</Text>
          ) : (
            <View style={styles.historyGrid}>
              {history.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyShell}
                  activeOpacity={0.85}
                  onPress={() => {
                    stopSound();
                    void Tts.stop();
                    if (item.image_url) {
                      void prefetchRemoteImages([item.image_url]);
                      setDetailImageLoading(true);
                    } else {
                      setDetailImageLoading(false);
                    }
                    setSelected(item);
                  }}>
                  <LinearGradient
                  colors={softBorderColors('#30CFD0')}
                    start={SOFT_BORDER_START}
                    end={SOFT_BORDER_END}
                  style={styles.historyBorder}>
                    <View style={styles.historyThumbCard}>
                      {item.image_url ? (
                        <Image
                          source={remoteImageSource(item.image_url)}
                          style={styles.historyThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.historyThumbImage,
                            styles.historyThumbPlaceholder,
                          ]}>
                          <FeatureIcon name="auditory" color="#30CFD0" size={28} />
                        </View>
                      )}
                      <Text style={styles.historyThumbTitle} numberOfLines={2}>
                        {item.prompt}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={selected != null}
        animationType="slide"
        onRequestClose={closeDetail}>
        <View style={styles.root}>
          <LinearGradient
            colors={['#E6FBFC', '#EEF7FF', '#F7FBFF']}
            locations={[0, 0.45, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScreenHeader
              title="Details"
              onBack={closeDetail}
              onRight={() => selected && handleDelete(selected.id)}
              rightDanger
            />

            {selected ? (
              <ScrollView
                contentContainerStyle={styles.detailScroll}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.resultPrompt}>{selected.prompt}</Text>
                {selected.description ? (
                  <Text style={styles.description}>{selected.description}</Text>
                ) : null}

                {selected.image_url ? (
                  <LinearGradient
                  colors={softBorderColors('#30CFD0')}
                    start={SOFT_BORDER_START}
                    end={SOFT_BORDER_END}
                  style={styles.imageBorder}>
                    <View style={styles.imageWrap}>
                      {detailImageLoading ? (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator color="#2F80ED" />
                        </View>
                      ) : null}
                      <Image
                        key={selected.image_url}
                        source={remoteImageSource(selected.image_url)}
                        style={styles.image}
                        resizeMode="cover"
                        onLoadStart={() => setDetailImageLoading(true)}
                        onLoad={() => setDetailImageLoading(false)}
                        onError={() => setDetailImageLoading(false)}
                      />
                    </View>
                  </LinearGradient>
                ) : null}

                <View style={styles.sfxRow}>
                  <TouchableOpacity
                    style={styles.sfxBtnWrap}
                    onPress={() =>
                      playRemoteSound(selected.sound1_url, selected.sound1_label)
                    }
                    activeOpacity={0.88}>
                    <LinearGradient
                      colors={['#30CFD0', '#2F80ED']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.sfxBtn}>
                      <IconSpeaker color="#FFFFFF" size={18} />
                      <Text style={styles.sfxBtnText} numberOfLines={2}>
                        {selected.sound1_label || 'Sound 1'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sfxBtnWrap}
                    onPress={() =>
                      playRemoteSound(selected.sound2_url, selected.sound2_label)
                    }
                    activeOpacity={0.88}>
                    <LinearGradient
                      colors={['#2F80ED', '#30CFD0']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.sfxBtn}>
                      <IconSpeaker color="#FFFFFF" size={18} />
                      <Text style={styles.sfxBtnText} numberOfLines={2}>
                        {selected.sound2_label || 'Sound 2'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.secondaryBtnWrap}
                  onPress={() => speakDescription(selected.description)}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#30CFD0', '#2F80ED']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.secondaryBtn}>
                    <IconSpeaker color="#FFFFFF" size={16} />
                    <Text style={styles.secondaryBtnText}>Listen description</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </SafeAreaView>
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
    shadowColor: '#30CFD0',
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
    paddingBottom: 120,
  },
  detailScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
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
    marginBottom: 14,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 14,
  },
  input: {
    minHeight: 80,
    borderRadius: 12,
    padding: 12,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: '#1A2B4C',
    backgroundColor: 'rgba(48,207,208,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(48,207,208,0.25)',
  },
  primaryBtnWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 15,
    color: '#fff',
  },
  loadingHint: {
    marginTop: 10,
    fontFamily: FONT.regular,
    fontSize: 13,
    color: '#5A6D88',
    lineHeight: 18,
  },
  historyLoader: {
    marginVertical: 8,
  },
  empty: {
    fontFamily: FONT.regular,
    color: '#607d8b',
    fontSize: 14,
    marginBottom: 8,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  historyShell: {
    width: '47%',
  },
  historyBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  historyThumbCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyThumbImage: {
    width: '100%',
    height: 110,
    backgroundColor: 'rgba(48,207,208,0.1)',
  },
  historyThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyThumbTitle: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    color: '#1A2B4C',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  resultPrompt: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: '#1A2B4C',
    marginBottom: 8,
  },
  description: {
    fontFamily: FONT.regular,
    fontSize: 15,
    color: '#5A6D88',
    lineHeight: 22,
    marginBottom: 14,
  },
  imageBorder: {
    borderRadius: 18,
    padding: 1.5,
    marginBottom: 14,
  },
  imageWrap: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(48,207,208,0.1)',
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(230, 251, 252, 0.75)',
  },
  sfxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  sfxBtnWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sfxBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  sfxBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
  },
  secondaryBtnWrap: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontFamily: FONT.semiBold,
    fontSize: 14,
    color: '#fff',
  },
});
