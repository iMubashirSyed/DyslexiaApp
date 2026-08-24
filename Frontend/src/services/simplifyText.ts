import AsyncStorage from '@react-native-async-storage/async-storage';
import {OPENAI_API_KEY} from '@env';
import {
  SimplifyError,
  SimplifyOptions,
  SimplifyResponse,
  SimplificationLevel,
  VocabularyItem,
} from '../types/simplify';
import {getOpenAIKey} from '../config/openai';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
/** Emulators + full JSON payloads often exceed 10s; OpenAI can take 20–40s under load */
const REQUEST_TIMEOUT_MS = 60_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const SYSTEM_PROMPT = `You are a text simplification expert for dyslexic readers. Your goal is to make text accessible at a Grade 4-6 reading level.
SIMPLIFICATION RULES:

Use common, everyday words (avoid jargon)
Keep sentences short (max 15 words)
Use active voice instead of passive
Break complex sentences into multiple simple ones
Replace difficult words with easier synonyms
Maintain the original meaning completely
Use concrete examples instead of abstract concepts

DYSLEXIA-FRIENDLY GUIDELINES:

Use clear, simple language
Avoid idioms and metaphors (or explain them)
Use consistent terminology
Break text into logical chunks
Prefer present tense when possible

RESPONSE FORMAT:
Return ONLY valid JSON matching this exact structure:
{
"original": "...",
"simplified": "...",
"readability": { "beforeGrade": X, "afterGrade": Y, "improvement": "Z% easier" },
"entities": [...],
"vocabulary": [...],
"actions": [...],
"grammarInsights": {...},
"dyslexiaHelpers": {...}
}
For each entity (person, place, object), provide:

The original word
A simpler alternative
Type (person/place/object/concept)
A clear description (1 sentence)
An appropriate emoji

For each difficult word in the "vocabulary" array, use these exact JSON keys:
word, difficulty (easy|medium|hard), replacement, definition, examples (string array).

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.
Cap entities, vocabulary, and actions at 10 items each (most important only) to keep the reply compact.`;

const defaultResponse = (text: string): SimplifyResponse => ({
  original: text,
  simplified: text,
  readability: {
    beforeGrade: 0,
    afterGrade: 0,
    improvement: '0% easier',
  },
  entities: [],
  vocabulary: [],
  actions: [],
  grammarInsights: {
    sentenceType: 'simple',
    tense: 'present',
    wordCount: {
      before: text.split(/\s+/).filter(Boolean).length,
      after: text.split(/\s+/).filter(Boolean).length,
    },
  },
  dyslexiaHelpers: {
    chunkedText: [text],
    colorCoding: {
      nouns: [],
      verbs: [],
      adjectives: [],
    },
  },
});

const createHash = (input: string) => {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
};

const normalizeText = (text: string) => text.trim().replace(/\s+/g, ' ');

const getCacheKey = (text: string, targetLevel: SimplificationLevel) =>
  `simplify:cache:${targetLevel}:${createHash(normalizeText(text).toLowerCase())}`;

const getRateKey = (userId: string) => `simplify:rate:${userId}`;

const getWordCount = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const ensureValidInput = (text: string) => {
  if (!text || !text.trim()) {
    throw new SimplifyError('EMPTY_TEXT', 'Please enter text to simplify');
  }

  if (getWordCount(text) > 2000) {
    throw new SimplifyError(
      'TEXT_TOO_LONG',
      'Text is too long. Please keep it under 2000 words',
    );
  }
};

const pickString = (o: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return String(v);
    }
  }
  return '';
};

const normalizeExamples = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.flatMap(entry =>
      typeof entry === 'string' && entry.trim() ? [entry.trim()] : [],
    );
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
};

/**
 * Models often return vocabulary with alternate keys (e.g. complex_word vs word).
 */
const normalizeVocabularyItem = (raw: unknown, index: number): VocabularyItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;

  let word = pickString(o, [
    'word',
    'complex_word',
    'complexWord',
    'term',
    'original',
    'difficult_word',
    'difficultWord',
    'text',
  ]);
  let replacement = pickString(o, [
    'replacement',
    'simpler_replacement',
    'simplerReplacement',
    'simple_word',
    'simpleWord',
    'synonym',
    'alternative',
    'simpler_alternative',
    'simple_alternative',
  ]);

  if (!word && replacement) {
    word = replacement;
  }
  if (!replacement && word) {
    replacement = word;
  }

  if (!word && !replacement) {
    return null;
  }

  const difficulty =
    pickString(o, ['difficulty', 'difficulty_level', 'level']) || 'medium';
  const definition = pickString(o, [
    'definition',
    'simple_definition',
    'meaning',
  ]);

  const examples = normalizeExamples(
    o.examples ?? o.synonyms ?? o.synonym_examples ?? o.example_synonyms,
  );

  return {
    word: word || `word-${index}`,
    replacement: replacement || word,
    difficulty,
    definition,
    examples,
  };
};

const normalizeVocabularyList = (raw: unknown): VocabularyItem[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry, index) => normalizeVocabularyItem(entry, index))
    .filter((item): item is VocabularyItem => item !== null);
};

const flattenVocabularyArrays = (parsed: Record<string, unknown>): unknown[] => {
  const keys = [
    'vocabulary',
    'difficult_words',
    'difficultWords',
    'vocab',
    'hard_words',
    'difficultWordsList',
  ];
  const chunks: unknown[] = [];
  for (const key of keys) {
    const v = parsed[key];
    if (Array.isArray(v)) {
      chunks.push(...v);
    }
  }
  return chunks;
};

const parseResponseContent = (text: string, original: string): SimplifyResponse => {
  try {
    const parsed = JSON.parse(text) as Partial<SimplifyResponse> & Record<string, unknown>;

    if (typeof parsed.original !== 'string' || typeof parsed.simplified !== 'string') {
      throw new Error('Invalid shape');
    }

    const vocabularyRaw = flattenVocabularyArrays(parsed);

    return {
      ...defaultResponse(original),
      ...parsed,
      readability: {
        ...defaultResponse(original).readability,
        ...(parsed.readability || {}),
      },
      grammarInsights: {
        ...defaultResponse(original).grammarInsights,
        ...(parsed.grammarInsights || {}),
        wordCount: {
          ...defaultResponse(original).grammarInsights.wordCount,
          ...(parsed.grammarInsights?.wordCount || {}),
        },
      },
      dyslexiaHelpers: {
        ...defaultResponse(original).dyslexiaHelpers,
        ...(parsed.dyslexiaHelpers || {}),
        colorCoding: {
          ...defaultResponse(original).dyslexiaHelpers.colorCoding,
          ...(parsed.dyslexiaHelpers?.colorCoding || {}),
        },
      },
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      vocabulary: normalizeVocabularyList(
        vocabularyRaw.length ? vocabularyRaw : parsed.vocabulary,
      ),
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  } catch {
    throw new SimplifyError('INVALID_RESPONSE', 'Invalid response format');
  }
};

const readCache = async (
  text: string,
  targetLevel: SimplificationLevel,
): Promise<SimplifyResponse | null> => {
  const cacheKey = getCacheKey(text, targetLevel);
  const cachedRaw = await AsyncStorage.getItem(cacheKey);

  if (!cachedRaw) {
    return null;
  }

  try {
    const cached = JSON.parse(cachedRaw) as {
      expiresAt: number;
      data: SimplifyResponse;
    };

    if (Date.now() > cached.expiresAt) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return cached.data;
  } catch {
    await AsyncStorage.removeItem(cacheKey);
    return null;
  }
};

const writeCache = async (
  text: string,
  targetLevel: SimplificationLevel,
  data: SimplifyResponse,
) => {
  const cacheKey = getCacheKey(text, targetLevel);
  const payload = JSON.stringify({
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
  await AsyncStorage.setItem(cacheKey, payload);
};

const enforceRateLimit = async (userId: string) => {
  const key = getRateKey(userId);
  const raw = await AsyncStorage.getItem(key);

  let timestamps: number[] = [];
  if (raw) {
    try {
      timestamps = JSON.parse(raw) as number[];
    } catch {
      timestamps = [];
    }
  }

  const now = Date.now();
  const inWindow = timestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (inWindow.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new SimplifyError('RATE_LIMIT', 'Too many requests, please wait');
  }

  inWindow.push(now);
  await AsyncStorage.setItem(key, JSON.stringify(inWindow));
};

const requestWithTimeout = async (payload: object, apiKey: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SimplifyError('TIMEOUT', 'Request took too long, please try again');
    }

    throw new SimplifyError('NETWORK', 'No internet connection');
  } finally {
    clearTimeout(timeout);
  }
};

const buildUserPrompt = (text: string, targetLevel: SimplificationLevel) =>
  `Target simplification level: ${targetLevel}.\nSimplify this text:\n${text}`;

const isRetryableError = (error: unknown) => {
  if (!(error instanceof SimplifyError)) {
    return false;
  }

  return (
    error.code === 'NETWORK' ||
    error.code === 'TIMEOUT' ||
    error.code === 'INVALID_RESPONSE' ||
    error.code === 'UNKNOWN'
  );
};

const makeApiRequest = async (
  text: string,
  targetLevel: SimplificationLevel,
): Promise<SimplifyResponse> => {
  const apiKey = (getOpenAIKey() || OPENAI_API_KEY || '').trim();

  if (!apiKey || apiKey.length < 20) {
    throw new SimplifyError(
      'CONFIGURATION',
      'OpenAI API key is missing or too short. Set OPENAI_API_KEY in Frontend/dyslexia/.env, ensure no conflicting OPENAI_API_KEY in Windows environment variables, then stop Metro, run: npx react-native start --reset-cache, and rebuild the app.',
    );
  }

  const payload = {
    model: MODEL,
    response_format: {type: 'json_object'},
    messages: [
      {role: 'system', content: SYSTEM_PROMPT},
      {role: 'user', content: buildUserPrompt(text, targetLevel)},
    ],
    temperature: 0.2,
  };

  const response = await requestWithTimeout(payload, apiKey);

  if (response.status === 401) {
    throw new SimplifyError(
      'CONFIGURATION',
      'OpenAI rejected this API key (401). Create a new secret key in the OpenAI dashboard, update OPENAI_API_KEY in .env, reset Metro cache, and rebuild.',
    );
  }

  if (response.status === 429) {
    throw new SimplifyError('RATE_LIMIT', 'Too many requests, please wait');
  }

  if (!response.ok) {
    throw new SimplifyError('UNKNOWN', 'Something went wrong. Please try again');
  }

  const json = (await response.json()) as {
    choices?: Array<{message?: {content?: string}}>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new SimplifyError('INVALID_RESPONSE', 'Invalid response format');
  }

  return parseResponseContent(content, text);
};

/**
 * Simplifies complex text into dyslexia-friendly language using GPT-4o Mini.
 */
export async function simplifyText(
  text: string,
  options: SimplifyOptions = {},
): Promise<SimplifyResponse> {
  ensureValidInput(text);

  const targetLevel = options.targetLevel ?? 'basic';
  const userId = options.userId ?? 'anonymous';

  await enforceRateLimit(userId);

  const cached = await readCache(text, targetLevel);
  if (cached) {
    return cached;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await makeApiRequest(text, targetLevel);
      await writeCache(text, targetLevel, result);
      return result;
    } catch (error) {
      lastError = error;

      if (attempt === 1 || !isRetryableError(error)) {
        break;
      }
    }
  }

  if (lastError instanceof SimplifyError) {
    throw lastError;
  }

  throw new SimplifyError('UNKNOWN', 'Something went wrong. Please try again');
}
