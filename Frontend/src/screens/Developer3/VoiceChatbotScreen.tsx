import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
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
import Svg, {Path, Rect} from 'react-native-svg';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList, MainTabParamList} from '../../navigation/types';
import {
  ChatMessage,
  fetchChildPreferences,
  sendChatMessage,
} from '../../api/services';
import {prepareVoiceStart, releaseVoiceModule} from '../../utils/voiceSession';
import {FeatureIcon} from '../Developer1/FeatureIcons';

type Props = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'VoiceChatbot'>,
    BottomTabScreenProps<MainTabParamList, 'Home'>
  >['navigation'];
};

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! I am Bright Buddy. Tap Talk, ask me a question, then tap Send.',
};

const LOCALE = 'en-US';

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
      <Path d="M8 22h8" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

function IconStop({color = '#FFFFFF', size = 14}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
    </Svg>
  );
}

function IconSend({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 2L15 22l-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconSpeaker({color = '#FF8C42', size = 14}: {color?: string; size?: number}) {
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

export default function VoiceChatbotScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, e => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(Math.max(0, e.endCoordinates.height - insets.bottom));
      }
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      });
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [insets.bottom]);

  const readAloud = useCallback(
    (text: string) => {
      if (!soundEnabled) {
        return;
      }
      Tts.stop();
      Tts.setDefaultRate(0.45);
      Tts.speak(text);
    },
    [soundEnabled],
  );

  const sendQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || isSending) {
        return;
      }
      if (trimmed.length > 500) {
        Alert.alert(
          'Shorter question please',
          'Please keep your question under 500 characters.',
        );
        return;
      }

      const nextMessages: ChatMessage[] = [
        ...messages,
        {role: 'user', content: trimmed},
      ];
      setMessages(nextMessages);
      setDraft('');
      setIsSending(true);

      try {
        const reply = await sendChatMessage(nextMessages.slice(-8));
        setMessages(current => [...current, {role: 'assistant', content: reply}]);
        readAloud(reply);
      } catch (error: any) {
        const message =
          error.response?.data?.error ||
          'I could not connect right now. Please try again.';
        setMessages(current => [
          ...current,
          {role: 'assistant', content: message},
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, messages, readAloud],
  );

  useEffect(() => {
    let cancelled = false;

    fetchChildPreferences()
      .then(prefs => {
        if (!cancelled) {
          setSoundEnabled(prefs.sound_enabled);
        }
      })
      .catch(() => {});

    const setupVoiceHandlers = () => {
      if (!Voice) {
        return;
      }

      Voice.onSpeechResults = event => {
        const words = event.value?.[0];
        if (words) {
          setDraft(words);
        }
        setIsListening(false);
      };

      Voice.onSpeechPartialResults = event => {
        const words = event.value?.[0];
        if (words) {
          setDraft(words);
        }
      };

      Voice.onSpeechError = () => {
        setIsListening(false);
      };

      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };
    };

    const bootVoice = async () => {
      await releaseVoiceModule();
      if (cancelled) {
        return;
      }
      setupVoiceHandlers();
      try {
        if (typeof Voice?.isAvailable !== 'function') {
          setVoiceReady(false);
          return;
        }
        const supported: boolean | number = await Voice.isAvailable();
        if (!cancelled) {
          setVoiceReady(Boolean(supported));
        }
      } catch {
        if (!cancelled) {
          setVoiceReady(false);
        }
      }
    };

    void bootVoice();

    return () => {
      cancelled = true;
      void releaseVoiceModule();
      void Tts.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({animated: true});
  }, [messages, isSending]);

  const ensureMicPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return permission === PermissionsAndroid.RESULTS.GRANTED;
  };

  const toggleListening = async () => {
    if (isSending) {
      return;
    }

    if (isListening) {
      try {
        if (typeof Voice?.stop === 'function') {
          await Voice.stop();
        }
      } catch {
        /* ignore */
      }
      setIsListening(false);
      return;
    }

    if (voiceReady === false) {
      Alert.alert(
        'Voice input unavailable',
        'Please type your question instead.',
      );
      return;
    }

    try {
      const allowed = await ensureMicPermission();
      if (!allowed) {
        Alert.alert(
          'Microphone needed',
          'Please allow microphone access to speak to Bright Buddy.',
        );
        return;
      }

      if (typeof Voice?.start !== 'function') {
        throw new Error('Voice SDK unavailable');
      }

      Voice.onSpeechResults = event => {
        const words = event.value?.[0];
        if (words) {
          setDraft(words);
        }
        setIsListening(false);
      };
      Voice.onSpeechPartialResults = event => {
        const words = event.value?.[0];
        if (words) {
          setDraft(words);
        }
      };
      Voice.onSpeechError = () => {
        setIsListening(false);
      };
      Voice.onSpeechEnd = () => {
        setIsListening(false);
      };

      await prepareVoiceStart();
      setIsListening(true);
      await Voice.start(LOCALE);
    } catch (error) {
      console.log('❌ Voice recognition failed:', error);
      setIsListening(false);
      Alert.alert(
        'Voice input unavailable',
        'Please try again or type your question instead.',
      );
    }
  };

  const showHelp = () => {
    Alert.alert(
      'Voice Chatbot',
      'Tap Talk to speak, or type a question, then tap Send. Bright Buddy answers in short, clear sentences.',
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FFF0E8', '#FFF5F3', '#F7FBFF']}
        locations={[0, 0.45, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,140,66,0.2)', 'rgba(255,140,66,0)']}
        style={styles.blobTop}
      />
      <LinearGradient
        colors={['rgba(248,171,171,0.18)', 'rgba(248,171,171,0)']}
        style={styles.blobBottom}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
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
                  colors={['#FF8C42', '#F8ABAB']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.headerBtnGrad}>
                  <Text style={styles.headerBtnText}>‹</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Voice Chatbot
                </Text>
              </View>

              <TouchableOpacity
                onPress={showHelp}
                style={styles.headerBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Help">
                <LinearGradient
                  colors={['#F8ABAB', '#FF8C42']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.headerBtnGrad}>
                  <Text style={styles.headerBtnText}>?</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.75)']}
            style={styles.introBanner}>
            <LinearGradient
              colors={['#FF8C42', '#F8ABAB']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="voiceChat" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Your reading and learning helper — talk or type a question
            </Text>
          </LinearGradient>

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[
              styles.messages,
              {paddingBottom: 160 + Math.max(insets.bottom, 8)},
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
            {messages.map((message, index) => (
              <View
                key={`${message.role}-${index}`}
                style={[
                  styles.bubbleShell,
                  message.role === 'user'
                    ? styles.userBubbleShell
                    : styles.botBubbleShell,
                ]}>
                {message.role === 'user' ? (
                  <LinearGradient
                    colors={['#FF8C42', '#F8ABAB']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.userBubble}>
                    <Text style={[styles.bubbleText, styles.userText]}>
                      {message.content}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.botBubble}>
                    <Text style={styles.bubbleText}>{message.content}</Text>
                    {index > 0 ? (
                      <TouchableOpacity
                        style={styles.listenRow}
                        onPress={() => readAloud(message.content)}
                        activeOpacity={0.85}>
                        <IconSpeaker color="#FF8C42" size={14} />
                        <Text style={styles.listenText}>Read aloud</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
            {isSending ? (
              <View style={styles.botBubbleShell}>
                <View style={[styles.botBubble, styles.loadingBubble]}>
                  <ActivityIndicator color="#FF8C42" size="small" />
                  <Text style={styles.thinkingText}>
                    Bright Buddy is thinking...
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.96)']}
            style={[
              styles.composer,
              {
                paddingBottom: Math.max(insets.bottom, 12) + 10,
                marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
              },
            ]}>
            <LinearGradient
              colors={softBorderColors('#FF8C42')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
              style={styles.inputBorder}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollToEnd({animated: true});
                  }, 100);
                }}
                placeholder="Ask a question..."
                placeholderTextColor="#7A8BA3"
                style={styles.input}
                multiline
                maxLength={500}
                editable={!isSending}
              />
            </LinearGradient>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtnWrap}
                onPress={toggleListening}
                disabled={isSending}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={
                    isListening
                      ? ['#FF6B6B', '#c62828']
                      : ['#FF8C42', '#F8ABAB']
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={[
                    styles.actionBtn,
                    isSending && styles.actionBtnDisabled,
                  ]}>
                  {isListening ? (
                    <IconStop color="#FFFFFF" size={14} />
                  ) : (
                    <IconMic color="#FFFFFF" size={16} />
                  )}
                  <Text style={styles.actionBtnText}>
                    {isListening
                      ? 'Stop'
                      : voiceReady === false
                        ? 'Mic off'
                        : 'Talk'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnWrap}
                onPress={() => sendQuestion(draft)}
                disabled={!draft.trim() || isSending}
                activeOpacity={0.88}>
                <LinearGradient
                  colors={
                    !draft.trim() || isSending
                      ? ['#F8C9B0', '#F5D0D0']
                      : ['#FF8C42', '#F8ABAB']
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.actionBtn}>
                  <IconSend color="#FFFFFF" size={15} />
                  <Text style={styles.actionBtnText}>Send</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
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
  flex: {
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
    bottom: 120,
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
    shadowColor: '#FF8C42',
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
  introBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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
  messages: {
    padding: 16,
    flexGrow: 1,
  },
  bubbleShell: {
    marginBottom: 12,
    maxWidth: '84%',
  },
  userBubbleShell: {
    alignSelf: 'flex-end',
  },
  botBubbleShell: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 14,
  },
  botBubble: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,140,66,0.2)',
  },
  bubbleText: {
    color: '#1A2B4C',
    fontFamily: FONT.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  listenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 9,
  },
  listenText: {
    color: '#FF8C42',
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingText: {
    color: '#5A6D88',
    fontFamily: FONT.medium,
    fontSize: 14,
    marginLeft: 9,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,140,66,0.15)',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  inputBorder: {
    borderRadius: 16,
    padding: 1.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    color: '#1A2B4C',
    fontFamily: FONT.regular,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  actionBtnDisabled: {
    opacity: 0.65,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT.bold,
    fontSize: 15,
  },
});
