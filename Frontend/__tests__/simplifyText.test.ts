import AsyncStorage from '@react-native-async-storage/async-storage';
import {simplifyText} from '../src/services/simplifyText';

jest.mock('../src/config/openai', () => ({
  getOpenAIKey: () => 'sk-test-key-12345678901234567890',
}));

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

describe('simplifyText', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
  });

  it('simplifies short text', async () => {
    const content = JSON.stringify({
      original: 'The automobile traversed the city.',
      simplified: 'The car drove through the city.',
      readability: {beforeGrade: 12.5, afterGrade: 4.2, improvement: '67% easier'},
      entities: [],
      vocabulary: [],
      actions: [],
      grammarInsights: {
        sentenceType: 'simple',
        tense: 'past',
        wordCount: {before: 5, after: 6},
      },
      dyslexiaHelpers: {
        chunkedText: ['The car', 'drove through', 'the city'],
        colorCoding: {nouns: ['car', 'city'], verbs: ['drove'], adjectives: []},
      },
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({choices: [{message: {content}}]}),
    } as never);

    const result = await simplifyText('The automobile traversed the city.', {
      targetLevel: 'basic',
      userId: 'user-1',
    });

    expect(result.simplified).toBe('The car drove through the city.');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('simplifies medium paragraph', async () => {
    const content = JSON.stringify({
      original:
        'Although the weather was inclement, the students proceeded to the institution.',
      simplified: 'The weather was bad. The students still went to school.',
      readability: {beforeGrade: 10, afterGrade: 4, improvement: '60% easier'},
      entities: [],
      vocabulary: [],
      actions: [],
      grammarInsights: {
        sentenceType: 'simple',
        tense: 'past',
        wordCount: {before: 11, after: 11},
      },
      dyslexiaHelpers: {
        chunkedText: ['The weather was bad.', 'The students still', 'went to school.'],
        colorCoding: {nouns: ['weather', 'students', 'school'], verbs: ['went'], adjectives: ['bad']},
      },
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({choices: [{message: {content}}]}),
    } as never);

    const result = await simplifyText(
      'Although the weather was inclement, the students proceeded to the institution.',
      {
        targetLevel: 'veryBasic',
        userId: 'user-2',
      },
    );

    expect(result.simplified).toContain('students');
  });

  it('normalizes vocabulary when the model uses alternate JSON keys', async () => {
    const content = JSON.stringify({
      original: 'Photosynthesis uses chlorophyll.',
      simplified: 'Plants use chlorophyll for food.',
      readability: {beforeGrade: 10, afterGrade: 4, improvement: '50% easier'},
      entities: [],
      vocabulary: [
        {
          complex_word: 'Photosynthesis',
          simpler_replacement: 'How plants make food',
          difficulty: 'hard',
          definition: 'Process by which plants use light.',
          examples: ['plant food making'],
        },
      ],
      actions: [],
      grammarInsights: {
        sentenceType: 'simple',
        tense: 'present',
        wordCount: {before: 3, after: 6},
      },
      dyslexiaHelpers: {
        chunkedText: [],
        colorCoding: {nouns: [], verbs: [], adjectives: []},
      },
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({choices: [{message: {content}}]}),
    } as never);

    const result = await simplifyText('Photosynthesis uses chlorophyll.', {
      userId: 'user-vocab-keys',
    });

    expect(result.vocabulary).toHaveLength(1);
    expect(result.vocabulary[0].word).toBe('Photosynthesis');
    expect(result.vocabulary[0].replacement).toBe('How plants make food');
    expect(result.vocabulary[0].examples).toEqual(['plant food making']);
  });

  it('rejects very long text over 2000 words', async () => {
    const longText = Array.from({length: 2001}, () => 'word').join(' ');

    await expect(simplifyText(longText)).rejects.toMatchObject({
      code: 'TEXT_TOO_LONG',
    });
  });

  it('rejects empty string', async () => {
    await expect(simplifyText('   ')).rejects.toMatchObject({
      code: 'EMPTY_TEXT',
    });
  });

  it('maps invalid API key/server auth to configuration error', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as never);

    await expect(simplifyText('Hello world')).rejects.toMatchObject({
      code: 'CONFIGURATION',
    });
  });

  it('maps network failure to no internet message', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network failed'));

    await expect(simplifyText('Hello world')).rejects.toMatchObject({
      code: 'NETWORK',
      message: 'No internet connection',
    });
  });

  it('maps timeout to timeout message', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    globalThis.fetch = jest.fn().mockRejectedValue(abortError);

    await expect(simplifyText('Hello world')).rejects.toMatchObject({
      code: 'TIMEOUT',
      message: 'Request took too long, please try again',
    });
  });

  it('retries once when API returns invalid JSON content', async () => {
    const validContent = JSON.stringify({
      original: 'Complicated sentence',
      simplified: 'Simple sentence',
      readability: {beforeGrade: 10, afterGrade: 4, improvement: '60% easier'},
      entities: [],
      vocabulary: [],
      actions: [],
      grammarInsights: {
        sentenceType: 'simple',
        tense: 'present',
        wordCount: {before: 2, after: 2},
      },
      dyslexiaHelpers: {
        chunkedText: ['Simple sentence'],
        colorCoding: {nouns: [], verbs: [], adjectives: []},
      },
    });

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({choices: [{message: {content: 'not json'}}]}),
      } as never)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({choices: [{message: {content: validContent}}]}),
      } as never);

    const result = await simplifyText('Complicated sentence', {
      userId: 'user-retry',
    });

    expect(result.simplified).toBe('Simple sentence');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('blocks more than 10 requests per user per minute', async () => {
    const now = Date.now();
    const timestamps = Array.from({length: 10}, () => now);
    await AsyncStorage.setItem('simplify:rate:user-limit', JSON.stringify(timestamps));

    await expect(
      simplifyText('Another request', {userId: 'user-limit'}),
    ).rejects.toMatchObject({
      code: 'RATE_LIMIT',
      message: 'Too many requests, please wait',
    });
  });
});
