import React from 'react';
import {
  Alert,
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
import Svg, {Circle, Path} from 'react-native-svg';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FeatureIcon} from '../../Developer1/FeatureIcons';
import type {FlashcardFrenzyMode, FlashcardModeSelectProps} from './types';
import {MODE_CONFIG} from './utils/modeConfig';

const FONT = {
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const MODES: FlashcardFrenzyMode[] = ['little', 'growing', 'challenge'];

function ModeGlyph({
  mode,
  color = '#FFFFFF',
  size = 22,
}: {
  mode: FlashcardFrenzyMode;
  color?: string;
  size?: number;
}) {
  if (mode === 'little') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3v3M12 18v3M3 12h3M18 12h3"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.75} />
      </Svg>
    );
  }
  if (mode === 'growing') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 19a2 2 0 0 0 2 2h12"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
        <Path
          d="M6 21V7a2 2 0 0 1 2-2h9v14"
          stroke={color}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />
        <Path
          d="M10 10h5M10 13h4"
          stroke={color}
          strokeWidth={1.75}
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function FlashcardModeSelect({
  navigation,
}: FlashcardModeSelectProps) {
  const showHelp = () => {
    Alert.alert(
      'Flashcard Frenzy',
      'Pick a level, then match each picture to its word. Tap two cards to flip them.',
    );
  };

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

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#FF9A56', '#FFB88C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="flashcardFrenzy" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Match each picture to its word — pick a level that feels right
            </Text>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Pick your level</Text>

          {MODES.map(mode => {
            const config = MODE_CONFIG[mode];
            return (
              <TouchableOpacity
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`${config.label}, ${config.ageRange}. ${config.description}`}
                style={styles.modeShell}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('FlashcardGame', {mode})}>
                <LinearGradient
                  colors={softBorderColors('#FF9A56')}
                  start={SOFT_BORDER_START}
                  end={SOFT_BORDER_END}
                  style={styles.modeBorder}>
                  <View style={styles.modeCard}>
                    <LinearGradient
                      colors={['#FF9A56', '#FFB88C']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 1}}
                      style={styles.modeIconChip}>
                      <ModeGlyph mode={mode} color="#FFFFFF" size={22} />
                    </LinearGradient>
                    <View style={styles.modeTextBlock}>
                      <Text style={styles.modeTitle}>{config.label}</Text>
                      <Text style={styles.modeAge}>{config.ageRange}</Text>
                      <Text style={styles.modeDesc}>{config.description}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
    marginBottom: 14,
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
    marginBottom: 8,
    marginLeft: 2,
  },
  modeShell: {
    marginBottom: 12,
  },
  modeBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 14,
    minHeight: 88,
  },
  modeIconChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeTextBlock: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#1A2B4C',
  },
  modeAge: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#FF9A56',
    marginTop: 2,
  },
  modeDesc: {
    fontSize: 13,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    marginTop: 4,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 26,
    color: '#FF9A56',
    fontFamily: FONT.medium,
    marginLeft: 6,
  },
});
