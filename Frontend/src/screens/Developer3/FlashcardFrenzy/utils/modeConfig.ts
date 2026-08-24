import type {FlashcardFrenzyMode, ModeConfig} from '../types';
import {filterBankByDifficulties} from './cardBank';
import type {CardBankEntry, PlayableCard} from '../types';
import {shuffleArray} from './shuffle';

export const MODE_CONFIG: Record<FlashcardFrenzyMode, ModeConfig> = {
  little: {
    label: 'Little Learners',
    ageRange: 'Ages 7–9',
    description: '3 pairs · easy words · gentle pace',
    icon: '🌱',
    pairCount: 3,
    gridColumns: 2,
    difficulties: ['easy'],
    flipBackDelayMs: 1500,
    cardSize: 110,
    cardGap: 14,
    showTimer: false,
  },
  growing: {
    label: 'Growing Readers',
    ageRange: 'Ages 10–12',
    description: '4 pairs · easy & medium words',
    icon: '📘',
    pairCount: 4,
    gridColumns: 2,
    difficulties: ['easy', 'medium'],
    flipBackDelayMs: 1000,
    cardSize: 96,
    cardGap: 12,
    showTimer: false,
  },
  challenge: {
    label: 'Challenge Mode',
    ageRange: 'Ages 13–14',
    description: '6 pairs · medium & hard · timed',
    icon: '🏆',
    pairCount: 6,
    gridColumns: 3,
    difficulties: ['medium', 'hard'],
    flipBackDelayMs: 700,
    cardSize: 88,
    cardGap: 10,
    showTimer: true,
  },
};

/**
 * Picks `pairCount` random entries from the difficulty-filtered bank,
 * then builds word + image cards and shuffles grid order.
 */
export function createShuffledDeck(mode: FlashcardFrenzyMode): {
  cards: PlayableCard[];
  totalPairs: number;
} {
  const config = MODE_CONFIG[mode];
  const pool = filterBankByDifficulties(config.difficulties);

  if (pool.length < config.pairCount) {
    throw new Error(
      `Not enough cards in bank for mode "${mode}" (need ${config.pairCount}, have ${pool.length})`,
    );
  }

  const selected: CardBankEntry[] = shuffleArray(pool).slice(0, config.pairCount);
  const playable: PlayableCard[] = [];

  selected.forEach(entry => {
    const suffix = `${entry.id}-${Math.random().toString(36).slice(2, 7)}`;
    playable.push({
      cardId: `word-${suffix}`,
      bankId: entry.id,
      kind: 'word',
      word: entry.word,
      image: entry.image,
      isFlipped: false,
      isMatched: false,
      showMismatch: false,
    });
    playable.push({
      cardId: `image-${suffix}`,
      bankId: entry.id,
      kind: 'image',
      word: entry.word,
      image: entry.image,
      isFlipped: false,
      isMatched: false,
      showMismatch: false,
    });
  });

  return {
    cards: shuffleArray(playable),
    totalPairs: config.pairCount,
  };
}

/** Returns true when one card is a word, one is an image, and they share bankId */
export function isMatchingPair(a: PlayableCard, b: PlayableCard): boolean {
  if (a.bankId !== b.bankId) {
    return false;
  }
  return (
    (a.kind === 'word' && b.kind === 'image') ||
    (a.kind === 'image' && b.kind === 'word')
  );
}
