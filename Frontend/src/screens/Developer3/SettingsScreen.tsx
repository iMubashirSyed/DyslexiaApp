import React, {useContext} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  softBorderColors,
  SOFT_BORDER_END,
  SOFT_BORDER_START,
} from '../../utils/softBorder';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Rect} from 'react-native-svg';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {MainTabParamList, SettingsStackParamList} from '../../navigation/types';
import {AuthContext} from '../../context/AuthContext';

type SettingsScreenProps = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<SettingsStackParamList, 'Settings'>,
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

const SUPPORT_EMAILS = [
  'umairkhanpk2004@gmail.com',
  'syedmubashirali019@gmail.com',
  'am4403158@gmail.com',
  'a68660997@gmail.com',
];

async function openUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open', url);
    }
  } catch {
    Alert.alert('Unable to open', url);
  }
}

function HelpIcon({color = '#FFFFFF', size = 22}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
        stroke={color}
        strokeWidth={1.75}
      />
      <Path
        d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MailIcon({color = '#FFFFFF', size = 20}: {color?: string; size?: number}) {
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
      <Path
        d="M3 7l9 7 9-7"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronIcon({color = '#7A8BA3', size = 18}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function SettingsScreen({navigation}: SettingsScreenProps) {
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          if (!auth?.logout) {
            return;
          }
          void auth.logout().catch(() => {
            Alert.alert('Error', 'Could not log out. Please try again.');
          });
        },
      },
    ]);
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
              <Text style={styles.kicker}>Preferences</Text>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>
                Help, support, and app information
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.sectionLabel}>Support</Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Help')}
            style={styles.cardWrap}>
            <LinearGradient
                  colors={softBorderColors('#459fff')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.borderShell}>
              <View style={styles.menuCard}>
                <LinearGradient
                  colors={['#459fff', '#64B5F6']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.iconChip}>
                  <HelpIcon />
                </LinearGradient>
                <View style={styles.menuCopy}>
                  <Text style={styles.menuTitle}>Help & FAQ</Text>
                  <Text style={styles.menuHint}>
                    Step-by-step answers for each activity
                  </Text>
                </View>
                <ChevronIcon color="#459fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.sectionHint}>
            Email the team if you need help with the app.
          </Text>
          <LinearGradient
                  colors={softBorderColors('#FF8C42')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.borderShell}>
            <View style={styles.contactCard}>
              {SUPPORT_EMAILS.map((email, index) => (
                <TouchableOpacity
                  key={email}
                  activeOpacity={0.85}
                  onPress={() => openUrl(`mailto:${email}`)}
                  style={[
                    styles.contactRow,
                    index === SUPPORT_EMAILS.length - 1 && styles.contactRowLast,
                  ]}>
                  <LinearGradient
                    colors={['#FF8C42', '#FFB347']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.mailChip}>
                    <MailIcon size={16} />
                  </LinearGradient>
                  <View style={styles.contactCopy}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{email}</Text>
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>About</Text>
          <LinearGradient
                  colors={softBorderColors('#30CFD0')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.borderShell}>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutText}>
                This dyslexia learning app helps children practice reading,
                spelling, vocabulary, and listening through short, friendly
                activities.
              </Text>
              <Text style={styles.aboutText}>
                On Home you can open tools like Alphabet Matcher, Reading Coach,
                Letter Trace, Phrases Conversion, Phrase To Image, Flashcard
                Generator, Auditory Guided Visualization, and Voice Chatbot. You
                can also play Word Scramble, Flashcard Frenzy, and Animal Bingo.
              </Text>
              <Text style={styles.aboutText}>
                Many activities use pictures, sound, and speech so learning feels
                clearer and less stressful. Some features need internet and may
                ask for microphone or camera permission.
              </Text>
              <Text style={[styles.aboutText, styles.aboutTextLast]}>
                Use the Profile tab for your account, Settings for help and
                contact details, and Help & FAQ for step-by-step answers about
                each activity.
              </Text>
            </View>
          </LinearGradient>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.88}
            style={styles.logoutWrap}>
            <LinearGradient
              pointerEvents="none"
              colors={['#FF6B6B', '#FF8C42']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Log out</Text>
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
    bottom: 80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 22,
  },
  headerCard: {
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
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
    fontFamily: FONT.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    color: '#1A2B4C',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONT.extraBold,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6D88',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT.medium,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#7A8BA3',
    fontFamily: FONT.bold,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: '#5A6D88',
    marginBottom: 10,
    marginLeft: 4,
    lineHeight: 18,
    fontFamily: FONT.medium,
  },
  cardWrap: {
    marginBottom: 18,
  },
  borderShell: {
    borderRadius: 22,
    padding: 1.5,
    marginBottom: 18,
    shadowColor: '#1A2B4C',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCopy: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#1A2B4C',
    fontFamily: FONT.semiBold,
    marginBottom: 2,
  },
  menuHint: {
    fontSize: 12,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    lineHeight: 16,
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,140,66,0.12)',
  },
  contactRowLast: {
    borderBottomWidth: 0,
  },
  mailChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#7A8BA3',
    fontFamily: FONT.medium,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: '#1A2B4C',
    fontFamily: FONT.semiBold,
  },
  aboutCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 20,
    padding: 18,
  },
  aboutText: {
    fontSize: 14,
    color: '#5A6D88',
    lineHeight: 21,
    marginBottom: 12,
    fontFamily: FONT.regular,
  },
  aboutTextLast: {
    marginBottom: 0,
  },
  logoutWrap: {
    marginTop: 4,
    marginBottom: 8,
  },
  logoutBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONT.bold,
  },
});
