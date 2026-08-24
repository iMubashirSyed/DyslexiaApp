import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import {SafeAreaView} from 'react-native-safe-area-context';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList, MainTabParamList} from '../../navigation/types';
import {getOpenAIKey} from '../../config/openai';
import {prepareVoiceStart, releaseVoiceModule} from '../../utils/voiceSession';
import {FeatureIcon} from './FeatureIcons';

type Props = {
  navigation: CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'SpeechCoach'>,
    BottomTabScreenProps<MainTabParamList, 'Home'>
  >['navigation'];
};

const MODEL = 'gpt-4o-mini';
const LOCALE = 'en-US';

const FONT = {
  regular: 'CarmenSans-Regular',
  medium: 'CarmenSans-Medium',
  semiBold: 'CarmenSans-SemiBold',
  bold: 'CarmenSans-Bold',
  extraBold: 'CarmenSans-ExtraBold',
} as const;

function IconMic({color = '#FFFFFF', size = 18}: {color?: string; size?: number}) {
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

function IconStop({color = '#FFFFFF', size = 16}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
    </Svg>
  );
}

function IconSpeaker({color = '#1A2B4C', size = 18}: {color?: string; size?: number}) {
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

function IconMute({color = '#1A2B4C', size = 18}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <Path d="M16 9l5 5M21 9l-5 5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
    </Svg>
  );
}

function IconEdit({color = '#1A2B4C', size = 17}: {color?: string; size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <Path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function wordsFromStory(text: string): string[] {
  const m = text.toLowerCase().match(/[a-z0-9']+/g);
  return m ?? [];
}

const LEADING_OPTIONAL_WORDS = new Set(['the', 'a', 'an']);
const STT_FILLERS = new Set([
  'um',
  'uh',
  'erm',
  'ah',
  'eh',
  'hmm',
  'like',
  'okay',
  'ok',
  'yeah',
  'yes',
]);

function editDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  const m = a.length;
  const n = b.length;
  if (!m) {
    return n;
  }
  if (!n) {
    return m;
  }
  const prev = new Array(n + 1);
  const cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = cur[j];
    }
  }
  return prev[n];
}

/** Tolerant STT match: exact, prefix, or small edit distance. */
function wordsSimilar(storyWord: string, spokenWord: string): boolean {
  if (!storyWord || !spokenWord) {
    return false;
  }
  if (storyWord === spokenWord) {
    return true;
  }
  // Short words: allow 1-char typos (the/teh, on/an) for faster highlight.
  if (storyWord.length <= 3 && spokenWord.length <= 3) {
    return editDistance(storyWord, spokenWord) <= 1;
  }
  if (
    storyWord.length >= 3 &&
    spokenWord.length >= 3 &&
    (storyWord.startsWith(spokenWord) || spokenWord.startsWith(storyWord))
  ) {
    return true;
  }
  const maxDist = Math.max(storyWord.length, spokenWord.length) <= 5 ? 1 : 2;
  return editDistance(storyWord, spokenWord) <= maxDist;
}

/**
 * Advance story index by matching spoken words in order.
 * Allows STT fillers, and skips up to 2 missed story words (common after pauses).
 */
function matchStorySubsequence(
  o: string[],
  s: string[],
  startO: number,
): number {
  let i = startO;
  for (let j = 0; j < s.length && i < o.length; j++) {
    if (wordsSimilar(o[i], s[j])) {
      i++;
    } else if (i + 1 < o.length && wordsSimilar(o[i + 1], s[j])) {
      i += 2;
    } else if (i + 2 < o.length && wordsSimilar(o[i + 2], s[j])) {
      i += 3;
    }
    // else: skip spoken word (filler / mishear) and keep story cursor
  }
  return i;
}

/**
 * How many leading story words to highlight. Uses strict prefix OR ordered
 * subsequence (STT often drops words or adds "um"). Optional credit when the
 * reader skips a leading article but continues ("cat sat" vs "The cat sat").
 * `floor` keeps progress after Android pause/restart when the new segment is messy.
 */
function countStoryWordsHighlighted(
  original: string,
  spoken: string,
  floor = 0,
): number {
  const o = wordsFromStory(original);
  const s = wordsFromStory(spoken).filter(w => !STT_FILLERS.has(w));
  if (!o.length) {
    return 0;
  }
  if (!s.length) {
    return Math.min(Math.max(0, floor), o.length);
  }

  let strict = 0;
  for (let k = 0; k < o.length && k < s.length; k++) {
    if (wordsSimilar(o[k], s[k])) {
      strict++;
    } else {
      break;
    }
  }

  const endAfterSub = matchStorySubsequence(o, s, 0);
  let best = Math.max(strict, endAfterSub, floor);

  if (o.length > 1 && LEADING_OPTIONAL_WORDS.has(o[0])) {
    const endFromSecond = matchStorySubsequence(o, s, 1);
    best = Math.max(best, endFromSecond);
  }

  // After a pause, Android often returns only the new segment. Match the
  // trailing spoken words against the story starting at the current floor.
  if (floor > 0 && floor < o.length) {
    const trail = s.slice(-Math.min(s.length, 16));
    best = Math.max(best, matchStorySubsequence(o, trail, floor));
    // Also try matching the whole spoken list from the floor (new segment only).
    best = Math.max(best, matchStorySubsequence(o, s, floor));
  }

  return Math.min(best, o.length);
}

function HighlightedStory({
  text,
  matchedCount,
}: {
  text: string;
  matchedCount: number;
}) {
  const parts = text.match(/[a-zA-Z0-9']+|[^a-zA-Z0-9']+/g) ?? [];
  let wordIdx = 0;
  return (
    <Text style={styles.storyBody}>
      {parts.map((part, i) => {
        if (/^[a-zA-Z0-9']+$/.test(part)) {
          const hl = wordIdx < matchedCount;
          wordIdx++;
          return (
            <Text key={i} style={hl ? styles.wordHighlighted : undefined}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

async function openaiChat(
  apiKey: string,
  messages: {role: string; content: string}[],
  jsonMode?: boolean,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    max_tokens: 500,
  };
  if (jsonMode) {
    body.response_format = {type: 'json_object'};
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    choices?: {message?: {content?: string}}[];
    error?: {message?: string};
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `API error ${res.status}`);
  }
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('Empty response from AI');
  }
  return content;
}

async function generateStoryText(apiKey: string): Promise<string> {
  const text = await openaiChat(apiKey, [
    {
      role: 'system',
      content:
        'You write very short, simple stories for early readers. Reply with the story text only: 2 to 4 short sentences, friendly tone, no title line.',
    },
    {role: 'user', content: 'Write a new short simple story for reading practice.'},
  ]);
  return text.replace(/^["']|["']$/g, '').trim();
}

type EvalResult = {
  accuracyPercent: number;
  correctWordCount: number;
  totalWordCount: number;
  wrongWords: string[];
};

async function evaluateWithAi(
  apiKey: string,
  original: string,
  spoken: string,
): Promise<EvalResult> {
  const raw = await openaiChat(
    apiKey,
    [
      {
        role: 'system',
        content:
          'Compare the spoken reading to the original. Reply with JSON only: {"accuracyPercent": number 0-100, "correctWordCount": number, "totalWordCount": number, "wrongWords": string[]}. wrongWords = words from the original that were wrong, skipped, or mispronounced (use the original spelling).',
      },
      {
        role: 'user',
        content: `Original text:\n${original}\n\nSpeech-to-text transcript:\n${spoken}`,
      },
    ],
    true,
  );
  const parsed = JSON.parse(raw) as EvalResult;
  return {
    accuracyPercent: Math.min(100, Math.max(0, Number(parsed.accuracyPercent) || 0)),
    correctWordCount: Number(parsed.correctWordCount) || 0,
    totalWordCount: Number(parsed.totalWordCount) || wordsFromStory(original).length,
    wrongWords: Array.isArray(parsed.wrongWords) ? parsed.wrongWords : [],
  };
}

async function ensureMicPermission(): Promise<boolean> {
  console.log('[SpeechCoach] ensureMicPermission: Platform.OS =', Platform.OS);
  if (Platform.OS !== 'android') {
    console.log(
      '[SpeechCoach] ensureMicPermission: iOS — skipping PermissionsAndroid (returns true; use Info.plist + system prompt)',
    );
    return true;
  }
  console.log(
    '[SpeechCoach] ensureMicPermission: requesting RECORD_AUDIO…',
  );
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  console.log('[SpeechCoach] ensureMicPermission: result =', granted, {
    GRANTED: PermissionsAndroid.RESULTS.GRANTED,
    DENIED: PermissionsAndroid.RESULTS.DENIED,
    NEVER_ASK_AGAIN: PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
  });
  const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
  console.log('[SpeechCoach] ensureMicPermission: granted =', ok);
  return ok;
}

/** True if two word lists are similar enough to count as an overlap. */
function wordListsOverlap(aWords: string[], pWords: string[], k: number): boolean {
  for (let i = 0; i < k; i++) {
    const aw = aWords[aWords.length - k + i];
    const pw = pWords[i];
    if (aw === pw || wordsSimilar(aw, pw)) {
      continue;
    }
    return false;
  }
  return true;
}

/** Merge text before pause with a new STT segment (handles cumulative vs incremental). */
function mergeAnchor(anchor: string, piece: string): string {
  const a = anchor.trim();
  const p = piece.trim();
  if (!p) {
    return a;
  }
  if (!a) {
    return p;
  }
  const al = a.toLowerCase();
  const pl = p.toLowerCase();
  if (pl.startsWith(al) || pl === al) {
    return p;
  }
  // Overlap: end of anchor matches start of new piece (common after restart).
  const aWords = al.split(/\s+/).filter(Boolean);
  const pWords = pl.split(/\s+/).filter(Boolean);
  let overlap = 0;
  const max = Math.min(aWords.length, pWords.length, 8);
  for (let k = max; k >= 1; k--) {
    if (wordListsOverlap(aWords, pWords, k)) {
      overlap = k;
      break;
    }
  }
  if (overlap > 0) {
    const rest = pWords.slice(overlap).join(' ');
    return rest ? `${a} ${rest}`.trim() : a;
  }
  return `${a} ${p}`.trim();
}

export default function SpeechCoach({navigation}: Props) {
  const apiKey = getOpenAIKey();

  const [storyText, setStoryText] = useState('');
  const [loadingStory, setLoadingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const [transcript, setTranscript] = useState('');
  /** Transcript committed before current listen segment (pause snapshot or last final). */
  const anchorRef = useRef('');
  /** Always mirrors transcript for handlers that must not close over stale state. */
  const transcriptRef = useRef('');
  /** Never move the highlight backwards during one reading session (pause/STT glitches). */
  const peakMatchedRef = useRef(0);

  const [isListening, setIsListening] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState('');

  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);

  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const ttsActiveRef = useRef(false);

  const markTtsOff = useCallback(() => {
    ttsActiveRef.current = false;
    setIsTtsSpeaking(false);
  }, []);

  const markTtsOn = useCallback(() => {
    ttsActiveRef.current = true;
    setIsTtsSpeaking(true);
  }, []);

  const matchedCount = useMemo(() => {
    const raw = countStoryWordsHighlighted(
      storyText,
      transcript,
      peakMatchedRef.current,
    );
    if (raw > peakMatchedRef.current) {
      peakMatchedRef.current = raw;
    }
    // While listening (or after a pause mid-session), keep peak so highlight
    // does not jump backward when Android restarts STT with a messy segment.
    return Math.max(raw, peakMatchedRef.current);
  }, [storyText, transcript]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  /**
   * User chose Start Reading. Android SpeechRecognizer is NOT continuous —
   * it ends after each silence/utterance. Restart carefully: never stop/start
   * while a previous teardown is still running (Error 5 / native crashes).
   */
  const keepListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartInFlightRef = useRef(false);
  const listeningSessionIdRef = useRef(0);
  /** True only between onSpeechStart and onSpeechEnd/error teardown. */
  const recognizerActiveRef = useRef(false);
  /** Ignore Error 5 for a short window right after Voice.start succeeds. */
  const startGraceUntilRef = useRef(0);
  const mountedRef = useRef(true);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const safeStopVoice = useCallback(async () => {
    // Prefer stop() so Android can deliver final results; cancel() drops them.
    try {
      await Voice.stop();
    } catch {
      try {
        if (typeof (Voice as any).cancel === 'function') {
          await (Voice as any).cancel();
        }
      } catch {
        /* ignore */
      }
    }
    recognizerActiveRef.current = false;
  }, []);

  /**
   * Keep Android options minimal. Custom silence extras caused Error 11 /
   * immediate end with no transcript on many physical devices.
   */
  const voiceStartOptions = useMemo(
    () =>
      Platform.OS === 'android'
        ? {
            EXTRA_PARTIAL_RESULTS: true,
            REQUEST_PERMISSIONS_AUTO: true,
          }
        : {},
    [],
  );

  const startVoiceSession = useCallback(async () => {
    // Only stop if we still believe a recognizer is active. Calling stop/cancel
    // on an already-ended session causes Error 5 and crashes on some devices.
    if (recognizerActiveRef.current) {
      try {
        await safeStopVoice();
      } catch {
        /* ignore */
      }
      await new Promise<void>(resolve => setTimeout(resolve, 600));
    } else {
      await new Promise<void>(resolve => setTimeout(resolve, 350));
    }
    if (!keepListeningRef.current || !mountedRef.current) {
      return;
    }
    await Voice.start(LOCALE, voiceStartOptions);
    startGraceUntilRef.current = Date.now() + 1200;
    recognizerActiveRef.current = true;
    if (keepListeningRef.current && mountedRef.current) {
      setIsListening(true);
    }
  }, [safeStopVoice, voiceStartOptions]);

  const scheduleRestartListening = useCallback(
    (reason: string, delayMs = 1200) => {
      if (!keepListeningRef.current) {
        return;
      }
      // Coalesce end + error (Android often fires both for one utterance).
      if (restartInFlightRef.current || restartTimerRef.current) {
        console.log('[SpeechCoach] restart already queued; skip', reason);
        return;
      }
      const sessionId = listeningSessionIdRef.current;
      console.log('[SpeechCoach] schedule restart:', reason, `in ${delayMs}ms`);
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (
          !keepListeningRef.current ||
          sessionId !== listeningSessionIdRef.current ||
          !mountedRef.current
        ) {
          return;
        }
        restartInFlightRef.current = true;
        if (mountedRef.current) {
          setIsListening(true);
        }

        void (async () => {
          try {
            await startVoiceSession();
          } catch (err) {
            console.log('[SpeechCoach] restart Voice.start failed:', err);
            if (!keepListeningRef.current || !mountedRef.current) {
              return;
            }
            await new Promise<void>(r => setTimeout(r, 1500));
            if (
              !keepListeningRef.current ||
              sessionId !== listeningSessionIdRef.current ||
              !mountedRef.current
            ) {
              return;
            }
            try {
              await startVoiceSession();
            } catch (err2) {
              console.log('[SpeechCoach] restart retry failed:', err2);
              keepListeningRef.current = false;
              recognizerActiveRef.current = false;
              if (mountedRef.current) {
                setIsListening(false);
              }
            }
          } finally {
            restartInFlightRef.current = false;
          }
        })();
      }, delayMs);
    },
    [startVoiceSession],
  );

  const loadStory = useCallback(async () => {
    if (!apiKey) {
      setStoryError('Missing OPENAI_API_KEY in .env');
      setLoadingStory(false);
      return;
    }
    setLoadingStory(true);
    setStoryError(null);
    void Tts.stop();
    markTtsOff();
    setTranscript('');
    anchorRef.current = '';
    transcriptRef.current = '';
    peakMatchedRef.current = 0;
    setSessionFinished(false);
    setEvalResult(null);
    setEvalLoading(false);
    try {
      const s = await generateStoryText(apiKey);
      setStoryText(s);
    } catch (e) {
      setStoryError(e instanceof Error ? e.message : 'Could not load story');
      setStoryText('');
    } finally {
      setLoadingStory(false);
    }
  }, [apiKey, markTtsOff]);

  useEffect(() => {
    // RN 0.83 NativeEventEmitter has no removeListener(); use subscription.remove().
    const subs = [
      Tts.addListener('tts-start', markTtsOn),
      Tts.addListener('tts-finish', markTtsOff),
      Tts.addListener('tts-cancel', markTtsOff),
      Tts.addListener('tts-error', markTtsOff),
    ];
    return () => {
      subs.forEach(s => {
        try {
          s.remove();
        } catch {
          /* ignore */
        }
      });
      void Tts.stop();
      markTtsOff();
    };
  }, [markTtsOff, markTtsOn]);

  const scheduleRestartListeningRef = useRef(scheduleRestartListening);
  scheduleRestartListeningRef.current = scheduleRestartListening;

  useEffect(() => {
    mountedRef.current = true;
    Voice.isAvailable()
      .then(v => {
        console.log('[SpeechCoach] Voice.isAvailable() resolved:', v, '(1 = available)');
        // Some devices return boolean true; Android package historically returned 1.
        const available = v as unknown;
        setVoiceReady(available === 1 || available === true);
      })
      .catch(err => {
        console.log('[SpeechCoach] Voice.isAvailable() rejected:', err);
        setVoiceReady(false);
      });

    const commitTranscriptToAnchor = () => {
      const latest = transcriptRef.current.trim();
      if (latest) {
        anchorRef.current = latest;
      }
    };

    Voice.onSpeechPartialResults = e => {
      if (!mountedRef.current) {
        return;
      }
      const piece = e.value?.[0] ?? '';
      if (!piece) {
        return;
      }
      console.log('[SpeechCoach] partial:', piece);
      const full = mergeAnchor(anchorRef.current, piece);
      transcriptRef.current = full;
      setTranscript(full);
    };
    Voice.onSpeechResults = e => {
      if (!mountedRef.current) {
        return;
      }
      const piece = e.value?.[0] ?? '';
      if (!piece) {
        return;
      }
      console.log('[SpeechCoach] final:', piece);
      const full = mergeAnchor(anchorRef.current, piece);
      anchorRef.current = full;
      transcriptRef.current = full;
      setTranscript(full);
    };
    Voice.onSpeechStart = () => {
      recognizerActiveRef.current = true;
      if (keepListeningRef.current && mountedRef.current) {
        setIsListening(true);
      }
    };
    Voice.onSpeechEnd = () => {
      console.log('[SpeechCoach] onSpeechEnd');
      recognizerActiveRef.current = false;
      // Android often ends without a final onSpeechResults — commit partials
      // so the next segment appends instead of replacing the transcript.
      commitTranscriptToAnchor();
      // Give the mic/service time to fully release before restarting.
      scheduleRestartListeningRef.current('speech-end', 1500);
    };
    Voice.onSpeechError = e => {
      const errObj =
        e && typeof e === 'object' && 'error' in e
          ? (e as {error?: {code?: string; message?: string}}).error
          : undefined;
      const codeStr = errObj?.code != null ? String(errObj.code) : '';
      const recoverable =
        Platform.OS === 'android' &&
        (codeStr === '5' ||
          codeStr === '6' ||
          codeStr === '7' ||
          codeStr === '8' ||
          codeStr === '11');

      console.log('[SpeechCoach] onSpeechError:', {
        raw: e,
        code: errObj?.code,
        message: errObj?.message,
        recoverable,
        keepListening: keepListeningRef.current,
      });

      recognizerActiveRef.current = false;
      commitTranscriptToAnchor();

      if (
        codeStr === '5' &&
        Date.now() < startGraceUntilRef.current &&
        keepListeningRef.current
      ) {
        console.log('[SpeechCoach] ignoring Error 5 during start grace window');
        scheduleRestartListeningRef.current('error-5-grace', 1600);
        return;
      }

      if (keepListeningRef.current && recoverable) {
        // 11 = server disconnect / no match — wait longer before restart.
        const delay =
          codeStr === '8' ? 1800 : codeStr === '11' || codeStr === '7' ? 2000 : 1400;
        scheduleRestartListeningRef.current(`error-${codeStr}`, delay);
        return;
      }

      keepListeningRef.current = false;
      clearRestartTimer();
      restartInFlightRef.current = false;
      if (mountedRef.current) {
        setIsListening(false);
      }
    };

    const noop = () => {};

    return () => {
      mountedRef.current = false;
      keepListeningRef.current = false;
      listeningSessionIdRef.current += 1;
      clearRestartTimer();
      restartInFlightRef.current = false;
      recognizerActiveRef.current = false;
      Voice.onSpeechPartialResults = noop;
      Voice.onSpeechResults = noop;
      Voice.onSpeechStart = noop;
      Voice.onSpeechError = noop;
      Voice.onSpeechEnd = noop;
      // Fully release the shared Voice singleton so Bright Buddy / Bingo can start cleanly.
      void releaseVoiceModule();
    };
    // Bind once; restart logic is read via ref so listener identity stays stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearRestartTimer]);

  const startReading = async () => {
    console.log('[SpeechCoach] startReading: tap', {
      hasStory: Boolean(storyText),
      storyLen: storyText?.length ?? 0,
      loadingStory,
      sessionFinished,
      voiceReady,
      locale: LOCALE,
    });
    if (!storyText || loadingStory || sessionFinished) {
      console.log('[SpeechCoach] startReading: aborted (guard)');
      return;
    }
    const ok = await ensureMicPermission();
    if (!ok) {
      console.log('[SpeechCoach] startReading: mic permission denied');
      Alert.alert('Microphone', 'Microphone permission is required.');
      return;
    }
    try {
      // TTS holds the audio focus on Android and will interrupt STT mid-session.
      void Tts.stop();
      markTtsOff();
      clearRestartTimer();
      listeningSessionIdRef.current += 1;
      keepListeningRef.current = true;
      // Block end/error handlers from queuing a restart while we start.
      restartInFlightRef.current = true;
      recognizerActiveRef.current = false;
      // Drop any leftover session from Bright Buddy / Bingo before starting.
      await prepareVoiceStart();
      console.log('[SpeechCoach] startReading: calling Voice.start(', LOCALE, ')…');
      await startVoiceSession();
      console.log('[SpeechCoach] startReading: Voice.start resolved OK');
      setIsListening(true);
      setSessionFinished(false);
    } catch (err) {
      keepListeningRef.current = false;
      clearRestartTimer();
      recognizerActiveRef.current = false;
      setIsListening(false);
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.log('[SpeechCoach] startReading: Voice.start threw:', {
        message,
        stack,
        err,
      });
      Alert.alert('Voice', 'Could not start listening.');
    } finally {
      restartInFlightRef.current = false;
    }
  };

  const pauseReading = async () => {
    keepListeningRef.current = false;
    listeningSessionIdRef.current += 1;
    clearRestartTimer();
    restartInFlightRef.current = false;
    anchorRef.current = transcript;
    await safeStopVoice();
    await new Promise<void>(r => setTimeout(r, 150));
    setIsListening(false);
  };

  const stopReading = async () => {
    keepListeningRef.current = false;
    listeningSessionIdRef.current += 1;
    clearRestartTimer();
    restartInFlightRef.current = false;
    await safeStopVoice();
    await new Promise<void>(r => setTimeout(r, 200));
    setIsListening(false);
    setSessionFinished(true);
    setEvalLoading(true);
    if (!apiKey || !storyText) {
      setEvalLoading(false);
      return;
    }
    try {
      const r = await evaluateWithAi(apiKey, storyText, transcript);
      setEvalResult(r);
    } catch {
      const total = wordsFromStory(storyText).length;
      const correct = matchedCount;
      const pct = total ? Math.round((correct / total) * 100) : 0;
      setEvalResult({
        accuracyPercent: pct,
        correctWordCount: correct,
        totalWordCount: total,
        wrongWords: [],
      });
    } finally {
      setEvalLoading(false);
    }
  };

  const tryAgain = async () => {
    keepListeningRef.current = false;
    listeningSessionIdRef.current += 1;
    clearRestartTimer();
    restartInFlightRef.current = false;
    void Tts.stop();
    markTtsOff();
    await safeStopVoice();
    setIsListening(false);
    setTranscript('');
    anchorRef.current = '';
    transcriptRef.current = '';
    peakMatchedRef.current = 0;
    setSessionFinished(false);
    setEvalResult(null);
    setEvalLoading(false);
  };

  const nextText = async () => {
    keepListeningRef.current = false;
    listeningSessionIdRef.current += 1;
    clearRestartTimer();
    restartInFlightRef.current = false;
    void Tts.stop();
    markTtsOff();
    await safeStopVoice();
    setIsListening(false);
    await loadStory();
  };

  const speakStory = () => {
    if (!storyText) {
      return;
    }
    if (ttsActiveRef.current) {
      void Tts.stop();
      markTtsOff();
      return;
    }
    if (keepListeningRef.current) {
      Alert.alert(
        'Listening',
        'Stop or pause reading before playing the story aloud — TTS interferes with the microphone.',
      );
      return;
    }
    void Tts.stop();
    Tts.speak(storyText, {
      iosVoiceId: 'com.apple.ttsbundle.default',
      rate: 0.48,
      androidParams: {
        KEY_PARAM_STREAM: 'STREAM_MUSIC',
        KEY_PARAM_VOLUME: 1.0,
        KEY_PARAM_PAN: 0,
      },
    });
    markTtsOn();
  };

  const openEdit = () => {
    setEditDraft(storyText);
    setEditOpen(true);
  };

  const saveEdit = () => {
    void Tts.stop();
    markTtsOff();
    setStoryText(editDraft.trim());
    setEditOpen(false);
    setTranscript('');
    anchorRef.current = '';
    transcriptRef.current = '';
    peakMatchedRef.current = 0;
    setSessionFinished(false);
    setEvalResult(null);
  };

  const showHelp = () => {
    Alert.alert(
      'Reading Coach',
      'Listen to the story, then read it aloud. Words highlight as you go. Tap Stop when done to see accuracy, or Try again / New text anytime.',
    );
  };

  const hasStory = storyText.trim().length > 0;
  const micLabel = voiceReady === false ? 'Mic unavailable' : isListening ? 'Recording…' : 'Mic ready';
  const micDot = isListening ? styles.dotRed : voiceReady === false ? styles.dotGray : styles.dotGreen;

  const primaryDisabled = !hasStory || loadingStory || sessionFinished;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#E8F4FF', '#F0F7FF', '#F7FBFF']}
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
        colors={['rgba(100,181,246,0.16)', 'rgba(100,181,246,0)']}
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
                colors={['#459fff', '#64B5F6']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerBtnGrad}>
                <Text style={styles.headerBtnText}>‹</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Reading Coach
              </Text>
            </View>

            <TouchableOpacity
              onPress={showHelp}
              style={styles.headerBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Help">
              <LinearGradient
                colors={['#64B5F6', '#2f80ed']}
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
              colors={['#459fff', '#64B5F6']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.introIconChip}>
              <FeatureIcon name="readingCoach" color="#FFFFFF" size={16} />
            </LinearGradient>
            <Text style={styles.introText}>
              Listen, then read aloud — words light up as you go
            </Text>
          </LinearGradient>

          {!hasStory && !loadingStory && !storyError ? (
            <LinearGradient
                  colors={softBorderColors('#459fff')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
              <View style={styles.loadingCard}>
                <Text style={styles.loadingTitle}>Ready to practice</Text>
                <Text style={styles.loadingSub}>
                  Tap the button to generate a short story, then read it aloud.
                </Text>
                <TouchableOpacity
                  style={styles.retryBtnWrap}
                  onPress={loadStory}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#459fff', '#64B5F6']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Generate Story</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : loadingStory ? (
            <LinearGradient
                  colors={softBorderColors('#459fff')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
              <View style={styles.loadingCard}>
                <Text style={styles.loadingTitle}>AI Generating Story…</Text>
                <Text style={styles.loadingSub}>
                  Creating a personalized story for your reading practice
                </Text>
                <ActivityIndicator style={{marginTop: 16}} color="#459fff" />
              </View>
            </LinearGradient>
          ) : storyError ? (
            <LinearGradient
                  colors={softBorderColors('#FF6B6B')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
              <View style={styles.loadingCard}>
                <Text style={styles.errText}>{storyError}</Text>
                <TouchableOpacity
                  style={styles.retryBtnWrap}
                  onPress={loadStory}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#459fff', '#64B5F6']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.retryBtn}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Text to read</Text>
              <LinearGradient
                  colors={softBorderColors('#459fff')}
                start={SOFT_BORDER_START}
                end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
                <View style={styles.storyCard}>
                  <View style={styles.storyCardTop}>
                    <Text style={styles.storyLabel}>Follow the highlight</Text>
                    <View style={styles.storyActions}>
                      <TouchableOpacity
                        onPress={openEdit}
                        hitSlop={8}
                        style={styles.iconHit}
                        accessibilityLabel="Edit text">
                        <IconEdit color="#459fff" size={17} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={speakStory}
                        hitSlop={8}
                        style={styles.iconHit}
                        accessibilityLabel={
                          isTtsSpeaking ? 'Stop speaking' : 'Hear story'
                        }>
                        {isTtsSpeaking ? (
                          <IconMute color="#459fff" size={18} />
                        ) : (
                          <IconSpeaker color="#459fff" size={18} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  <HighlightedStory text={storyText} matchedCount={matchedCount} />
                </View>
              </LinearGradient>
            </>
          )}

          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
            style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View style={[styles.dot, micDot]} />
              <Text style={styles.statusText}>{micLabel}</Text>
            </View>
            {sessionFinished && evalResult ? (
              <Text style={styles.accuracyInline}>
                Accuracy: {evalResult.accuracyPercent}%
              </Text>
            ) : null}
          </LinearGradient>

          {hasStory && !sessionFinished ? (
            <TouchableOpacity
              style={[
                styles.primaryBtnWrap,
                primaryDisabled && styles.primaryBtnDisabled,
              ]}
              disabled={primaryDisabled}
              onPress={isListening ? stopReading : startReading}
              activeOpacity={0.85}>
              <LinearGradient
                colors={
                  primaryDisabled
                    ? ['#CFD8DC', '#B0BEC5']
                    : isListening
                      ? ['#FF6B6B', '#c62828']
                      : ['#459fff', '#64B5F6']
                }
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.primaryBtn}>
                {isListening ? (
                  <IconStop color="#FFFFFF" size={16} />
                ) : (
                  <IconMic
                    color={primaryDisabled ? '#78909c' : '#FFFFFF'}
                    size={18}
                  />
                )}
                <Text
                  style={[
                    styles.primaryBtnText,
                    primaryDisabled && styles.primaryBtnTextDisabled,
                  ]}>
                  {loadingStory
                    ? 'Microphone Not Ready'
                    : isListening
                      ? 'Stop Reading'
                      : 'Start Reading'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {hasStory && !loadingStory && !sessionFinished ? (
            isListening ? (
              <View style={styles.grid2}>
                <TouchableOpacity
                  style={styles.btnStopWrap}
                  onPress={stopReading}
                  activeOpacity={0.88}>
                  <LinearGradient
                    colors={['#FF6B6B', '#c62828']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.btnStop}>
                    <IconStop color="#FFFFFF" size={14} />
                    <Text style={styles.btnStopText}>Stop</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={pauseReading}
                  activeOpacity={0.88}>
                  <Text style={styles.btnOutlineText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={tryAgain}
                  activeOpacity={0.88}>
                  <Text style={styles.btnOutlineText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={nextText}
                  activeOpacity={0.88}>
                  <Text style={styles.btnOutlineText}>New Text</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.rowPair}>
                <TouchableOpacity
                  style={[styles.btnOutline, styles.half]}
                  onPress={tryAgain}
                  activeOpacity={0.88}>
                  <Text style={styles.btnOutlineText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnOutline, styles.half]}
                  onPress={nextText}
                  activeOpacity={0.88}>
                  <Text style={styles.btnOutlineText}>New Text</Text>
                </TouchableOpacity>
              </View>
            )
          ) : null}

          {sessionFinished ? (
            <LinearGradient
                  colors={softBorderColors('#459fff')}
              start={SOFT_BORDER_START}
              end={SOFT_BORDER_END}
                  style={styles.shellBorder}>
              <View style={styles.results}>
                {evalLoading ? (
                  <ActivityIndicator color="#459fff" />
                ) : evalResult ? (
                  <>
                    <Text style={styles.resultTitle}>Your progress</Text>
                    <Text style={styles.resultLine}>
                      Reading accuracy:{' '}
                      <Text style={styles.resultEm}>
                        {evalResult.accuracyPercent}%
                      </Text>
                    </Text>
                    <Text style={styles.resultLine}>
                      Correct words:{' '}
                      <Text style={styles.resultEm}>
                        {evalResult.correctWordCount} / {evalResult.totalWordCount}
                      </Text>
                    </Text>
                    <Text style={styles.resultLine}>
                      Words to practice:{' '}
                      {evalResult.wrongWords.length
                        ? evalResult.wrongWords.join(', ')
                        : '—'}
                    </Text>
                    <View style={styles.afterFinishRow}>
                      <TouchableOpacity
                        style={[styles.btnOutline, styles.half]}
                        onPress={tryAgain}
                        activeOpacity={0.88}>
                        <Text style={styles.btnOutlineText}>Try Again</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnOutline, styles.half]}
                        onPress={nextText}
                        activeOpacity={0.88}>
                        <Text style={styles.btnOutlineText}>New Text</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            </LinearGradient>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={editOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient
                  colors={softBorderColors('#459fff')}
            start={SOFT_BORDER_START}
            end={SOFT_BORDER_END}
                  style={styles.modalBorder}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Edit text</Text>
              <TextInput
                style={styles.modalInput}
                multiline
                value={editDraft}
                onChangeText={setEditDraft}
                placeholderTextColor="#999"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveEdit}>
                  <Text style={styles.modalSave}>Save</Text>
                </TouchableOpacity>
              </View>
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
    shadowColor: '#459fff',
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
    paddingBottom: 150,
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
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 17,
    color: '#1A2B4C',
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  loadingSub: {
    marginTop: 8,
    fontSize: 14,
    color: '#5A6D88',
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  errText: {
    color: '#c62828',
    fontFamily: FONT.medium,
    textAlign: 'center',
  },
  retryBtnWrap: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#fff',
    fontFamily: FONT.semiBold,
  },
  storyCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
  },
  storyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storyLabel: {
    fontSize: 12,
    color: '#5A6D88',
    fontFamily: FONT.medium,
  },
  storyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconHit: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(69,159,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(69,159,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBody: {
    fontSize: 17,
    lineHeight: 26,
    color: '#1A2B4C',
    fontFamily: FONT.regular,
  },
  wordHighlighted: {
    backgroundColor: '#FFE082',
    borderRadius: 3,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {backgroundColor: '#43a047'},
  dotRed: {backgroundColor: '#e53935'},
  dotGray: {backgroundColor: '#9e9e9e'},
  statusText: {
    fontSize: 14,
    color: '#37474f',
    fontFamily: FONT.medium,
  },
  accuracyInline: {
    fontSize: 13,
    color: '#459fff',
    fontFamily: FONT.semiBold,
  },
  primaryBtnWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    fontSize: 17,
    color: '#fff',
    fontFamily: FONT.bold,
  },
  primaryBtnTextDisabled: {
    color: '#78909c',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    justifyContent: 'space-between',
  },
  rowPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  half: {
    width: '48%',
  },
  btnStopWrap: {
    width: '48%',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnStopText: {
    color: '#fff',
    fontFamily: FONT.bold,
    fontSize: 14,
  },
  btnOutline: {
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(69,159,255,0.35)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  btnOutlineText: {
    color: '#1A2B4C',
    fontFamily: FONT.semiBold,
    fontSize: 14,
  },
  results: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: 16,
  },
  resultTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#1A2B4C',
    marginBottom: 10,
  },
  resultLine: {
    fontSize: 15,
    color: '#5A6D88',
    fontFamily: FONT.regular,
    marginBottom: 8,
    lineHeight: 22,
  },
  resultEm: {
    fontFamily: FONT.bold,
    color: '#459fff',
  },
  afterFinishRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    justifyContent: 'space-between',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(27, 42, 65, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBorder: {
    borderRadius: 18,
    padding: 1.5,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    marginBottom: 10,
    color: '#1A2B4C',
  },
  modalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(69,159,255,0.3)',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: FONT.regular,
    color: '#1A2B4C',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 14,
  },
  modalCancel: {
    fontSize: 16,
    color: '#78909c',
    fontFamily: FONT.medium,
  },
  modalSave: {
    fontSize: 16,
    color: '#459fff',
    fontFamily: FONT.bold,
  },
});
