import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../navigation/types';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {FeatureIcon, type FeatureIconKey} from './FeatureIcons';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'>;
};

type FeatureNavLink = Exclude<keyof HomeStackParamList, 'Home' | 'Details'>;

type FeatureItem = {
  id: number;
  title: string;
  subtitle?: string;
  icon: FeatureIconKey;
  /** Gradient used for border + icon chip */
  colors: [string, string];
  link: FeatureNavLink;
};

const features: FeatureItem[] = [
  {
    id: 1,
    title: 'Alphabet Matcher',
    icon: 'alphabet',
    colors: ['#FF8C42', '#FF6B6B'],
    link: 'AlphabetMatcher',
  },
  {
    id: 3,
    title: 'Phrases Conversion',
    icon: 'phrases',
    colors: ['#4FACFE', '#00F2FE'],
    link: 'PhrasesConversion',
  },
  {
    id: 6,
    title: 'Phrase To Image',
    icon: 'phraseToImage',
    colors: ['#43E97B', '#38F9D7'],
    link: 'PhraseToImageConverter',
  },
  {
    id: 7,
    title: 'Flashcard Generator',
    icon: 'flashcardGen',
    colors: ['#FA709A', '#FEE140'],
    link: 'FlashcardGenerator',
  },
  {
    id: 8,
    title: 'Reading Coach',
    icon: 'readingCoach',
    colors: ['#459fff', '#64B5F6'],
    link: 'SpeechCoach',
  },
  {
    id: 5,
    title: 'Letter Trace',
    icon: 'letterTrace',
    colors: ['#FF9A56', '#FF7E5F'],
    link: 'LetterTrace',
  },
  {
    id: 2,
    title: 'Auditory Guided Visualization',
    icon: 'auditory',
    colors: ['#30CFD0', '#2F80ED'],
    link: 'AuditoryGuidedVisualization',
  },
  {
    id: 4,
    title: 'Voice Chatbot',
    icon: 'voiceChat',
    colors: ['#FF8C42', '#F8ABAB'],
    link: 'VoiceChatbot',
  },
  {
    id: 9,
    title: 'Word Scramble',
    icon: 'wordScramble',
    colors: ['#FA8A3E', '#FFB347'],
    link: 'WordScramble',
  },
  {
    id: 10,
    title: 'Flashcard Frenzy',
    icon: 'flashcardFrenzy',
    colors: ['#FF9A56', '#FFB88C'],
    link: 'FlashcardModeSelect',
  },
  {
    id: 11,
    title: 'Animal Bingo',
    icon: 'animalBingo',
    colors: ['#FF9F40', '#FFB347'],
    link: 'AnimalBingoModeSelect',
  },
];

export default function HomeScreen({navigation}: HomeScreenProps) {
  const openFeature = (link: FeatureNavLink) => {
    const parentNavigator = navigation.getParent?.();

    if (parentNavigator) {
      parentNavigator.navigate('Home', {screen: link} as never);
      return;
    }

    navigation.navigate(link as never);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E8F4FF', '#FFF5EB', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft accent blobs */}
      <LinearGradient
        colors={['rgba(69,159,255,0.22)', 'rgba(69,159,255,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(255,140,66,0.18)', 'rgba(255,140,66,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
              style={styles.headerCard}>
              <Text style={styles.kicker}>Learning Hub</Text>
              <Text style={styles.title}>Dyslexia Tools</Text>
              <Text style={styles.subtitle}>
                Explore features to improve your reading skills
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.featuresGrid}>
            {features.map(feature => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCardWrapper}
                onPress={() => openFeature(feature.link)}
                activeOpacity={0.88}>
                {/* Soft L→R fade border */}
                <LinearGradient
                  colors={softBorderColors(feature.colors[0])}
                  start={SOFT_BORDER_START}
                  end={SOFT_BORDER_END}
                  style={styles.borderShell}>
                  <View style={styles.innerCard}>
                    <LinearGradient
                      colors={feature.colors}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.iconChip}>
                      <FeatureIcon name={feature.icon} color="#FFFFFF" size={26} />
                    </LinearGradient>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    {feature.subtitle ? (
                      <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                    ) : null}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
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
    bottom: 80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 22,
  },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#459fff',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#459fff',
    fontFamily: 'CarmenSans-Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    color: '#1A2B4C',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'CarmenSans-ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6D88',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'CarmenSans-Medium',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCardWrapper: {
    width: '48%',
  },
  borderShell: {
    borderRadius: 22,
    padding: 1.5,
    shadowColor: '#1A2B4C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  innerCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChip: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 13,
    color: '#1A2B4C',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'CarmenSans-SemiBold',
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#5A6D88',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    fontFamily: 'CarmenSans-Medium',
  },
});
