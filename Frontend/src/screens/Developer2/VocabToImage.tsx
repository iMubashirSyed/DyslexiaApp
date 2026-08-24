import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {
  deleteVocabularyImage,
  fetchVocabularyImageHistory,
  generateImageVisual,
  type VocabularyImageItem,
  type VocabStylePreset,
} from '../../api/services';
import {
  prefetchRemoteImages,
  remoteImageSource,
} from '../../utils/remoteImage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {FeatureIcon} from '../Developer1/FeatureIcons';

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const PRESETS: {
  key: VocabStylePreset;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {key: 'cartoon', label: 'Cartoon', emoji: '🎨', description: 'Friendly & colorful'},
  {key: 'realistic', label: 'Realistic', emoji: '📷', description: 'Photo-like & detailed'},
  {key: 'watercolor', label: 'Watercolor', emoji: '🖌️', description: 'Soft & artistic'},
  {key: 'pixelart', label: 'Pixel Art', emoji: '👾', description: 'Retro game style'},
];

const STYLE_LABELS: Record<string, string> = {
  cartoon: 'Cartoon',
  realistic: 'Realistic',
  watercolor: 'Watercolor',
  pixelart: 'Pixel Art',
};

const VocabToImageScreen: React.FC = () => {
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<VocabStylePreset>('cartoon');
  const [history, setHistory] = useState<VocabularyImageItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await fetchVocabularyImageHistory();
      setHistory(rows);
      void prefetchRemoteImages(rows.map(r => r.image_url));
    } catch (err) {
      console.log('[VocabToImage] history failed', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleProcess = async () => {
    if (!text.trim()) {
      return;
    }
    setLoading(true);
    setImageUrl(null);
    Keyboard.dismiss();

    try {
      const saved = await generateImageVisual(text, selectedStyle);
      if (saved.image_url) {
        void prefetchRemoteImages([saved.image_url]);
        setImageLoading(true);
      }
      setImageUrl(saved.image_url);
      setHistory(prev => [saved, ...prev.filter(h => h.id !== saved.id)]);
    } catch {
      Alert.alert('Error', 'Could not generate image. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = (item: VocabularyImageItem) => {
    setText(item.word);
    setSelectedStyle(
      (PRESETS.some(p => p.key === item.style)
        ? item.style
        : 'cartoon') as VocabStylePreset,
    );
    if (item.image_url) {
      void prefetchRemoteImages([item.image_url]);
      setImageLoading(true);
    }
    setImageUrl(item.image_url);
  };

  const handleDeleteHistory = (id: number) => {
    Alert.alert('Delete', 'Remove this image from history?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteVocabularyImage(id);
              setHistory(prev => prev.filter(h => h.id !== id));
            } catch {
              Alert.alert('Error', 'Could not delete history item.');
            }
          })();
        },
      },
    ]);
  };

  const showHelp = () => {
    Alert.alert(
      'Phrase To Image',
      'Generate an image from a word or phrase. Past generations are saved to your history. Long-press a history card to delete it.',
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E8FFF6', '#F3FFFB', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(67,233,123,0.2)', 'rgba(67,233,123,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(56,249,215,0.16)', 'rgba(56,249,215,0)']}
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
                colors={['#43E97B', '#38F9D7']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Phrase To Image
              </Text>
            </View>

            <TouchableOpacity
              onPress={showHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#38F9D7', '#2e7d32']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>?</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#43E97B', '#38F9D7']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="phraseToImage" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Turn a word or phrase into a visual you can remember
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Your phrase</Text>
          <LinearGradient
                  colors={softBorderColors('#43E97B')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 'A rainy day in the forest'"
              placeholderTextColor="#7A8BA3"
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
            />
          </LinearGradient>

          <Text style={styles.sectionLabel}>Art style</Text>
          <View style={styles.presetRow}>
            {PRESETS.map(preset => {
              const isActive = selectedStyle === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  style={styles.presetShell}
                  onPress={() => setSelectedStyle(preset.key)}
                  activeOpacity={0.88}>
                  <LinearGradient
                  colors={
                      isActive
                        ? softBorderColors('#43E97B')
                        : ['rgba(67,233,123,0.35)', 'transparent']
                    }
                    start={SOFT_BORDER_START}
                    end={SOFT_BORDER_END}
                  style={styles.presetBorder}>
                    <View
                      style={[
                        styles.presetCard,
                        isActive && styles.presetCardActive,
                      ]}>
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text
                        style={[
                          styles.presetName,
                          isActive && styles.presetNameActive,
                        ]}>
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.presetDesc,
                          isActive && styles.presetDescActive,
                        ]}>
                        {preset.description}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.btnWrap, loading && styles.btnDisabled]}
            onPress={handleProcess}
            disabled={loading}
            activeOpacity={0.88}>
            <LinearGradient
              colors={['#43E97B', '#38F9D7']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.btn}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Generate Image</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Preview</Text>
          <LinearGradient
                  colors={softBorderColors('#43E97B')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <View style={styles.displayArea}>
              {loading && (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator size="large" color="#2e7d32" />
                  <Text style={styles.loadingCaption}>
                    AI is painting your image...
                  </Text>
                </View>
              )}

              {imageUrl ? (
                <View style={styles.imageWrap}>
                  {imageLoading ? (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator color="#2e7d32" />
                    </View>
                  ) : null}
                  <Image
                    key={imageUrl}
                    source={remoteImageSource(imageUrl)}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                </View>
              ) : !loading ? (
                <View style={styles.hintBlock}>
                  <FeatureIcon name="phraseToImage" color="#43E97B" size={28} />
                  <Text style={styles.hint}>
                    Your visualization will appear here
                  </Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>History</Text>
          {historyLoading ? (
            <ActivityIndicator color="#43E97B" style={styles.historyLoader} />
          ) : history.length === 0 ? (
            <Text style={styles.historyEmpty}>No saved images yet.</Text>
          ) : (
            history.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyShell}
                onPress={() => openHistoryItem(item)}
                onLongPress={() => handleDeleteHistory(item.id)}
                activeOpacity={0.85}>
                <LinearGradient
                  colors={softBorderColors('#43E97B')}
                  start={SOFT_BORDER_START}
                  end={SOFT_BORDER_END}
                  style={styles.historyBorder}>
                  <View style={styles.historyCard}>
                    {item.image_url ? (
                      <Image
                        source={remoteImageSource(item.image_url)}
                        style={styles.historyThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.historyThumb, styles.historyThumbEmpty]} />
                    )}
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyStyle}>
                        {STYLE_LABELS[item.style] || item.style}
                      </Text>
                      <Text style={styles.historyWord} numberOfLines={2}>
                        {item.word}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

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
    shadowColor: '#43E97B',
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 10,
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 12,
    fontSize: 16,
    fontFamily: FONT.regular,
    color: '#1A2B4C',
    minHeight: 80,
    lineHeight: 26,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 12,
  },
  presetShell: {
    width: '48%',
  },
  presetBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  presetCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  presetCardActive: {
    backgroundColor: 'rgba(232,255,246,0.95)',
  },
  presetEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#5A6D88',
  },
  presetNameActive: {
    color: '#1B5E20',
  },
  presetDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#90A4AE',
    marginTop: 2,
    textAlign: 'center',
  },
  presetDescActive: {
    color: '#5A6D88',
  },
  btnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONT.semiBold,
  },
  displayArea: {
    minHeight: 260,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingVertical: 12,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingCaption: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#5A6D88',
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 12,
  },
  imageWrap: {
    width: 260,
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(67,233,123,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(232, 255, 246, 0.75)',
  },
  hintBlock: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  hint: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#5A6D88',
    textAlign: 'center',
  },
  historyLoader: {
    marginVertical: 8,
  },
  historyEmpty: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#607d8b',
    marginBottom: 8,
  },
  historyShell: {
    marginBottom: 10,
  },
  historyBorder: {
    borderRadius: 14,
    padding: 1.5,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  historyThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: 'rgba(67,233,123,0.1)',
  },
  historyThumbEmpty: {
    borderWidth: 1,
    borderColor: 'rgba(67,233,123,0.25)',
  },
  historyMeta: {
    flex: 1,
  },
  historyStyle: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#2e7d32',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  historyWord: {
    fontSize: 15,
    fontFamily: FONT.medium,
    color: '#1A2B4C',
  },
});

export default VocabToImageScreen;
