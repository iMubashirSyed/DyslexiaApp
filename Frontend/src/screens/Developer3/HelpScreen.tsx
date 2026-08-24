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
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {MainTabParamList, SettingsStackParamList} from '../../navigation/types';

type HelpScreenProps = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<SettingsStackParamList, 'Help'>,
    BottomTabScreenProps<MainTabParamList, 'Settings'>
  >['navigation'];
};

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  bold: 'CarmenSans-Bold',
  semiBold: 'CarmenSans-SemiBold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const FAQS: {question: string; answer: string}[] = [
  {
    question: 'How do I open a learning activity?',
    answer:
      'From the Home tab, tap any activity card (for example Reading Coach, Alphabet Matcher, or Animal Bingo). Use the header back button to return to Home.',
  },
  {
    question: 'What is Alphabet Matcher?',
    answer:
      'Match letters to build recognition skills. Your current level is saved so you can continue where you left off.',
  },
  {
    question: 'What is Phrases Conversion?',
    answer:
      'Paste or type a hard sentence and the app simplifies it into easier wording for dyslexia-friendly reading practice.',
  },
  {
    question: 'What is Phrase To Image?',
    answer:
      'Type a word or short phrase and the app creates a clear picture to help you remember vocabulary.',
  },
  {
    question: 'How does Flashcard Generator work?',
    answer:
      'Take a photo or pick an image of text. The app reads the image, picks important words, and builds picture flashcards you can flip through.',
  },
  {
    question: 'How do I use Reading Coach?',
    answer:
      'Generate a short story, listen to it, then tap Start Reading and read aloud. Words highlight as you speak. Tap Stop for a score and feedback. Allow microphone permission when asked.',
  },
  {
    question: 'What is Letter Trace?',
    answer:
      'Trace letters on the screen with your finger to practice letter shapes and handwriting.',
  },
  {
    question: 'What is Auditory Guided Visualization?',
    answer:
      'Enter a scene or idea. The app creates a picture plus two related sounds so you can see and hear the concept together.',
  },
  {
    question: 'How do I chat with Voice Chatbot?',
    answer:
      'Open Voice Chatbot from Home. Ask simple school or reading questions. Keep messages short — Bright Buddy replies in clear, child-friendly language.',
  },
  {
    question: 'How do I play Word Scramble?',
    answer:
      'Unscramble the letters to spell the target word. Use the tiles to build the word, then continue to the next round.',
  },
  {
    question: 'How do I play Flashcard Frenzy?',
    answer:
      'Choose Little Explorers, Growing Readers, or Challenge Mode. Match each picture to its word. When you finish, use Play Again or Back to Modes. The header back button returns you to Home.',
  },
  {
    question: 'How do I play Animal Bingo?',
    answer:
      'Pick a level, listen to the animal prompt, then tap the matching animal on the grid. Keep going until you find them all. Microphone permission is needed for speech checks.',
  },
  {
    question: 'Where do I change app preferences?',
    answer:
      'Open the Settings tab (bottom bar). You can adjust preferences and open Help & FAQ from there. Profile is also on the bottom bar.',
  },
  {
    question: 'Why do some features need internet?',
    answer:
      'AI features (stories, images, chat, flashcards from photos, bingo speech checks) need a network connection to reach the server. Games like Word Scramble and Flashcard Frenzy work more locally once loaded.',
  },
  {
    question: 'The mic or camera is not working. What should I do?',
    answer:
      'Allow microphone (and camera, for Flashcard Generator) in your phone settings for this app, then reopen the activity. Reading Coach and Animal Bingo need the mic; Flashcard Generator needs camera or photo access.',
  },
];

function BackIcon({color = '#FFFFFF', size = 20}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function HelpScreen({navigation}: HelpScreenProps) {
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
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Back to Settings">
              <LinearGradient
                colors={['#459fff', '#64B5F6']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.backBtn}>
                <BackIcon />
              </LinearGradient>
            </TouchableOpacity>
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255,255,255,0.72)']}
              style={styles.headerCard}>
              <Text style={styles.headerTitle}>Help & FAQ</Text>
            </LinearGradient>
            <View style={styles.backBtnSpacer} />
          </View>

          <Text style={styles.intro}>
            Answers about Bright Buddy learning activities
          </Text>

          {FAQS.map((item, index) => (
            <LinearGradient
                  key={item.question}
              colors={
                index % 2 === 0
                  ? softBorderColors('#459fff')
                  : softBorderColors('#FF8C42')
              }
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.borderShell}>
              <View style={styles.faqCard}>
                <Text style={styles.question}>{item.question}</Text>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            </LinearGradient>
          ))}

          <LinearGradient
                  colors={softBorderColors('#30CFD0')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.borderShell}>
            <View style={styles.contactBox}>
              <Text style={styles.contactTitle}>Need more help?</Text>
              <Text style={styles.contactText}>
                Ask a parent, teacher, or caregiver to help you with the app. You
                can also try Voice Chatbot for simple learning questions.
              </Text>
            </View>
          </LinearGradient>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnSpacer: {
    width: 44,
  },
  headerCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#459fff',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    color: '#1A2B4C',
    textAlign: 'center',
    fontFamily: FONT.extraBold,
  },
  intro: {
    fontSize: 14,
    color: '#5A6D88',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
    fontFamily: FONT.medium,
  },
  borderShell: {
    borderRadius: 20,
    padding: 1.5,
    marginBottom: 12,
    shadowColor: '#1A2B4C',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  faqCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 16,
  },
  question: {
    fontSize: 15,
    color: '#1A2B4C',
    fontFamily: FONT.semiBold,
    marginBottom: 8,
    lineHeight: 20,
  },
  answer: {
    fontSize: 14,
    color: '#5A6D88',
    lineHeight: 20,
    fontFamily: FONT.regular,
  },
  contactBox: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 18,
  },
  contactTitle: {
    fontSize: 16,
    color: '#1A2B4C',
    fontFamily: FONT.bold,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#5A6D88',
    lineHeight: 20,
    fontFamily: FONT.regular,
  },
});
