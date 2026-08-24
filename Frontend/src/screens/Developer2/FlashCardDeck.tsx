import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Svg, {Circle, Path, Rect} from 'react-native-svg';
import {generateFlashcardDeck, FlashcardItem} from '../../api/services';
import {FeatureIcon} from '../Developer1/FeatureIcons';

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const H_PAD = 20;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - H_PAD * 2, SCREEN_WIDTH - 40);
const CARD_HEIGHT = CARD_WIDTH * 1.15;

async function prefetchFlashcardImages(urls: string[]): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))];
  await Promise.all(
    unique.map(uri => Image.prefetch(uri).catch(() => undefined)),
  );
}

const imageSource = (uri: string) =>
  ({
    uri,
    cache: 'force-cache' as const,
  }) as const;

function IconCamera({color = '#FFFFFF', size = 18}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8h3l1.5-2h7L17 8h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="14" r="3.5" stroke={color} strokeWidth={1.75} />
    </Svg>
  );
}

function IconGallery({color = '#FFFFFF', size = 18}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth={1.75}
      />
      <Circle cx="8.5" cy="10" r="1.5" stroke={color} strokeWidth={1.75} />
      <Path
        d="M3 16l5-4 4 3 3-2 6 4"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconShuffle({color = '#1A2B4C', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3h5v5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 20l6-6 2.5 2.5L21 8"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 16v5h-5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 15l6 6"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 4l5 5"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconRestart({color = '#1A2B4C', size = 16}: {color?: string; size?: number}) {
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
        colors={['#FFF0F5', '#FFF8EC', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(250,112,154,0.2)', 'rgba(250,112,154,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(254,225,64,0.18)', 'rgba(254,225,64,0)']}
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
                colors={['#FA709A', '#FEE140']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Flashcard Generator
              </Text>
            </View>

            <TouchableOpacity
              onPress={onHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#FEE140', '#FA709A']}
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

const FlashcardScreen = () => {
  const navigation = useNavigation();

  const showHelp = () => {
    Alert.alert(
      'Flashcard Generator',
      'Upload a photo of text. We read it, pick keywords, and build image flashcards. Tap the card to flip.',
    );
  };

  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (cards.length < 2) return;
    const next = cards[currentIndex + 1];
    if (next?.image_url) {
      Image.prefetch(next.image_url).catch(() => undefined);
    }
  }, [cards, currentIndex]);

  const pickImage = async (source: 'gallery' | 'camera') => {
    try {
      let result;
      if (source === 'camera') {
        result = await launchCamera({
          mediaType: 'photo',
          quality: 0.8,
          includeBase64: true,
        });
      } else {
        result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 0.8,
          includeBase64: true,
        });
      }

      if (!result.assets || !result.assets[0]?.uri) return;

      setLoading(true);
      setLoadingMessage('Reading text from image...');
      setCards([]);
      setCurrentIndex(0);
      setFlipped(false);
      setExtractedText('');

      setTimeout(() => setLoadingMessage('Extracting keywords with AI...'), 10000);
      setTimeout(
        () => setLoadingMessage('Generating flashcard images...'),
        12000,
      );
      setTimeout(() => setLoadingMessage('Almost done...'), 15000);

      const data = await generateFlashcardDeck(result.assets[0]);

      if (data.error && data.flashcards.length === 0) {
        Alert.alert('Oops!', data.error);
        setLoading(false);
        return;
      }

      setExtractedText(data.extracted_text);
      setCards(data.flashcards);
      setCurrentIndex(0);
      setFlipped(false);

      if (data.flashcards.length > 0) {
        setLoadingMessage('Preparing images for smooth viewing...');
        await prefetchFlashcardImages(data.flashcards.map(c => c.image_url));
      }

      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }).start();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate flashcards');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const flipCard = useCallback(() => {
    const toValue = flipped ? 0 : 1;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(flipAnim, {
          toValue,
          friction: 8,
          tension: 10,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setFlipped(!flipped);
  }, [flipped, flipAnim, scaleAnim]);

  const goToCard = useCallback(
    (direction: 'next' | 'prev') => {
      const nextIndex =
        direction === 'next'
          ? Math.min(currentIndex + 1, cards.length - 1)
          : Math.max(currentIndex - 1, 0);

      if (nextIndex === currentIndex) return;

      flipAnim.setValue(0);
      setFlipped(false);

      const slideDirection = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: slideDirection,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      setCurrentIndex(nextIndex);

      Animated.timing(progressAnim, {
        toValue: nextIndex / (cards.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
    },
    [currentIndex, cards.length, flipAnim, slideAnim, fadeAnim, progressAnim],
  );

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
    progressAnim.setValue(0);
  };

  const resetAll = () => {
    setCards([]);
    setExtractedText('');
    setCurrentIndex(0);
    setFlipped(false);
    flipAnim.setValue(0);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shellProps = {
    onBack: () => navigation.goBack(),
    onHelp: showHelp,
  };

  if (cards.length === 0 && !loading) {
    return (
      <ScreenShell {...shellProps}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#FA709A', '#FEE140']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="flashcardGen" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Upload a photo of any text to create visual flashcards
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Upload</Text>
          <LinearGradient
                  colors={softBorderColors('#FA709A')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
            <View style={styles.uploadContainer}>
              <View style={styles.uploadIconArea}>
                <LinearGradient
                  colors={['#FA709A', '#FEE140']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.uploadIconChip}>
                  <FeatureIcon name="flashcardGen" color="#FFFFFF" size={28} />
                </LinearGradient>
                <Text style={styles.uploadTitle}>Upload an Image</Text>
                <Text style={styles.uploadHint}>
                  Take a photo of a passage, textbook page, or any text you want
                  to learn
                </Text>
              </View>

              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadBtnWrap}
                  onPress={() => pickImage('camera')}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#FA709A', '#FEE140']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.uploadBtn}>
                    <IconCamera color="#FFFFFF" size={18} />
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadBtnWrap}
                  onPress={() => pickImage('gallery')}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#FEE140', '#FA709A']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.uploadBtn}>
                    <IconGallery color="#FFFFFF" size={18} />
                    <Text style={styles.uploadBtnText}>Gallery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>How it works</Text>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
            style={styles.howItWorks}>
            {[
              'Upload a photo of text',
              'AI reads and extracts keywords',
              'Images are generated for each word',
              'Flip cards to learn & memorize!',
            ].map((text, i) => (
              <View key={text} style={styles.step}>
                <LinearGradient
                  colors={['#FA709A', '#FEE140']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </LinearGradient>
                <Text style={styles.stepText}>{text}</Text>
              </View>
            ))}
          </LinearGradient>
        </ScrollView>
      </ScreenShell>
    );
  }

  if (loading) {
    return (
      <ScreenShell {...shellProps}>
        <View style={styles.loadingContainer}>
          <LinearGradient
                  colors={softBorderColors('#FA709A')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.loadingCard}>
            <View style={styles.loadingInner}>
              <ActivityIndicator size="large" color="#FA709A" />
              <Text style={styles.loadingText}>{loadingMessage}</Text>
              <Text style={styles.loadingSubtext}>
                This may take 15-30 seconds...
              </Text>
              <View style={styles.dotsContainer}>
                {[0, 1, 2].map(i => (
                  <PulsingDot key={i} delay={i * 300} />
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScreenShell>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <ScreenShell {...shellProps}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentDeck}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={resetAll} style={styles.topBtn} activeOpacity={0.88}>
            <IconRestart color="#1A2B4C" size={15} />
            <Text style={styles.topBtnText}>New</Text>
          </TouchableOpacity>
          <LinearGradient
            colors={['#FA709A', '#FEE140']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.counterChip}>
            <Text style={styles.cardCounter}>
              {currentIndex + 1} / {cards.length}
            </Text>
          </LinearGradient>
          <TouchableOpacity
            onPress={shuffleCards}
            style={styles.topBtn}
            activeOpacity={0.88}>
            <IconShuffle color="#1A2B4C" size={15} />
            <Text style={styles.topBtnText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBarBg}>
          <Animated.View
            style={[styles.progressBarFill, {width: progressWidth}]}
          />
        </View>

        {extractedText ? (
          <LinearGradient
                  colors={softBorderColors('#FA709A')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.extractedBorder}>
            <View style={styles.extractedTextOuter}>
              <Text style={styles.extractedTextLabel}>Extracted Text</Text>
              <ScrollView
                nestedScrollEnabled
                style={styles.extractedTextScroll}
                showsVerticalScrollIndicator>
                <Text style={styles.extractedTextContent}>{extractedText}</Text>
              </ScrollView>
            </View>
          </LinearGradient>
        ) : null}

        <View style={styles.cardArea}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={flipCard}
            style={styles.cardTouchable}>
            <Animated.View
              style={[
                styles.cardWrapper,
                {
                  transform: [{translateX: slideAnim}, {scale: scaleAnim}],
                  opacity: fadeAnim,
                },
              ]}>
              <Animated.View
                style={[
                  styles.card,
                  styles.cardFront,
                  {transform: [{rotateY: frontInterpolate}]},
                ]}>
                <LinearGradient
                  colors={['#FA709A', '#FEE140']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardDecoTop}
                />
                <Text style={styles.cardWordLabel}>WORD</Text>
                <Text style={styles.cardWord}>{currentCard.word}</Text>
                <View style={styles.tapHintContainer}>
                  <Text style={styles.tapHint}>Tap to see image</Text>
                </View>
                <LinearGradient
                  colors={['#FEE140', '#FA709A']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.cardDecoBottom}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.card,
                  styles.cardBack,
                  {transform: [{rotateY: backInterpolate}]},
                ]}>
                <Image
                  source={imageSource(currentCard.image_url)}
                  style={[
                    styles.cardImage,
                    {backgroundColor: 'rgba(250,112,154,0.08)'},
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.cardImageLabel}>
                  <Text style={styles.cardImageWord}>{currentCard.word}</Text>
                </View>
                <View style={styles.tapHintContainerBack}>
                  <Text style={styles.tapHintBack}>Tap to see word</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.navContainer}>
          <TouchableOpacity
            style={[styles.navBtnWrap, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={() => goToCard('prev')}
            disabled={currentIndex === 0}
            activeOpacity={0.88}>
            <View style={styles.navBtnIdle}>
              <Text
                style={[
                  styles.navBtnText,
                  currentIndex === 0 && styles.navBtnTextDisabled,
                ]}>
                ◀ Prev
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dotsNav}>
            {cards.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.navBtnWrap,
              currentIndex === cards.length - 1 && styles.navBtnDisabled,
            ]}
            onPress={() => goToCard('next')}
            disabled={currentIndex === cards.length - 1}
            activeOpacity={0.88}>
            {currentIndex === cards.length - 1 ? (
              <View style={styles.navBtnIdle}>
                <Text style={[styles.navBtnText, styles.navBtnTextDisabled]}>
                  Next ▶
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#FA709A', '#FEE140']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.navBtnNext}>
                <Text style={styles.navBtnNextText}>Next ▶</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const PulsingDot = ({delay}: {delay: number}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, pulseAnim]);

  return <Animated.View style={[styles.pulsingDot, {opacity: pulseAnim}]} />;
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
    shadowColor: '#FA709A',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140,
  },
  scrollContentDeck: {
    paddingHorizontal: 0,
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
    marginBottom: 14,
  },
  uploadContainer: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 18,
  },
  uploadIconArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIconChip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#5A6D88',
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  uploadBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: FONT.semiBold,
  },
  howItWorks: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    gap: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  stepText: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#5A6D88',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    borderRadius: 22,
    padding: 1.5,
    width: '100%',
  },
  loadingInner: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONT.semiBold,
    color: '#1A2B4C',
    marginTop: 18,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#5A6D88',
    marginTop: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FA709A',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250,112,154,0.25)',
  },
  topBtnText: {
    fontSize: 14,
    fontFamily: FONT.semiBold,
    color: '#1A2B4C',
  },
  counterChip: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cardCounter: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(250,112,154,0.15)',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FA709A',
    borderRadius: 2,
  },
  extractedBorder: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    padding: 1.5,
  },
  extractedTextOuter: {
    maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    padding: 10,
  },
  extractedTextScroll: {
    maxHeight: 88,
  },
  extractedTextLabel: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#FA709A',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  extractedTextContent: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#5A6D88',
    lineHeight: 18,
  },
  cardArea: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardTouchable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardWrapper: {
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backfaceVisibility: 'hidden',
    elevation: 8,
    shadowColor: '#FA709A',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(250,112,154,0.35)',
  },
  cardDecoTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  cardDecoBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
  },
  cardWordLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#90A4AE',
    letterSpacing: 4,
    marginBottom: 12,
  },
  cardWord: {
    fontSize: 36,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  tapHintContainer: {
    position: 'absolute',
    bottom: 28,
  },
  tapHint: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#90A4AE',
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  cardImageLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cardImageWord: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: FONT.bold,
  },
  tapHintContainerBack: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250,112,154,0.25)',
  },
  tapHintBack: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#5A6D88',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  navBtnIdle: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(250,112,154,0.35)',
  },
  navBtnNext: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navBtnDisabled: {
    opacity: 0.55,
  },
  navBtnText: {
    fontSize: 14,
    fontFamily: FONT.semiBold,
    color: '#FA709A',
  },
  navBtnNextText: {
    fontSize: 14,
    fontFamily: FONT.semiBold,
    color: '#FFF',
  },
  navBtnTextDisabled: {
    color: '#90A4AE',
  },
  dotsNav: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(250,112,154,0.25)',
  },
  dotActive: {
    backgroundColor: '#FA709A',
    width: 20,
    borderRadius: 4,
  },
});

export default FlashcardScreen;
