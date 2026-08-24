import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../../navigation/types';

export type FlashcardFrenzyMode = 'little' | 'growing' | 'challenge';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Source data for each picture/word pair in the local bank */
export interface CardBankEntry {
  id: number;
  word: string;
  /** Emoji string or local require() path — emoji used for offline simplicity */
  image: string;
  difficulty: Difficulty;
}

export type CardKind = 'word' | 'image';

/** One playable card in the grid (word side or image side of a pair) */
export interface PlayableCard {
  cardId: string;
  bankId: number;
  kind: CardKind;
  word: string;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  /** Brief red border pulse before flipping back on mismatch */
  showMismatch: boolean;
}

export interface ModeConfig {
  label: string;
  ageRange: string;
  description: string;
  icon: string;
  pairCount: number;
  gridColumns: number;
  difficulties: Difficulty[];
  flipBackDelayMs: number;
  cardSize: number;
  cardGap: number;
  showTimer: boolean;
}

export interface FlashcardGameState {
  cards: PlayableCard[];
  moves: number;
  matchedPairs: number;
  totalPairs: number;
  isResolving: boolean;
  isComplete: boolean;
  elapsedSeconds: number;
}

export type FlashcardModeSelectProps = NativeStackScreenProps<
  HomeStackParamList,
  'FlashcardModeSelect'
>;

export type FlashcardGameProps = NativeStackScreenProps<
  HomeStackParamList,
  'FlashcardGame'
>;
