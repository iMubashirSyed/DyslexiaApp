export type SimplificationLevel = 'basic' | 'standard' | 'veryBasic';

export interface Readability {
  beforeGrade: number;
  afterGrade: number;
  improvement: string;
}

export interface EntityItem {
  original: string;
  simplified: string;
  type: 'person' | 'place' | 'object' | 'concept' | string;
  description: string;
  emoji: string;
}

export interface VocabularyItem {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  replacement: string;
  definition: string;
  examples: string[];
}

export interface ActionItem {
  original: string;
  simplified: string;
  type: string;
  explanation: string;
}

export interface GrammarInsights {
  sentenceType: string;
  tense: string;
  wordCount: {
    before: number;
    after: number;
  };
}

export interface DyslexiaHelpers {
  chunkedText: string[];
  colorCoding: {
    nouns: string[];
    verbs: string[];
    adjectives: string[];
  };
}

export interface SimplifyResponse {
  original: string;
  simplified: string;
  readability: Readability;
  entities: EntityItem[];
  vocabulary: VocabularyItem[];
  actions: ActionItem[];
  grammarInsights: GrammarInsights;
  dyslexiaHelpers: DyslexiaHelpers;
}

export interface SimplifyOptions {
  targetLevel?: SimplificationLevel;
  userId?: string;
}

export type SimplifyErrorCode =
  | 'EMPTY_TEXT'
  | 'TEXT_TOO_LONG'
  | 'TIMEOUT'
  | 'CONFIGURATION'
  | 'RATE_LIMIT'
  | 'NETWORK'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class SimplifyError extends Error {
  code: SimplifyErrorCode;

  constructor(code: SimplifyErrorCode, message: string) {
    super(message);
    this.name = 'SimplifyError';
    this.code = code;
  }
}
