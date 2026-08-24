import type {CardBankEntry, Difficulty} from '../types';

/** Local offline word bank — emoji images, no API or assets required */
export const cardBank: CardBankEntry[] = [
  {id: 1, word: 'CAT', image: '🐱', difficulty: 'easy'},
  {id: 2, word: 'SUN', image: '☀️', difficulty: 'easy'},
  {id: 3, word: 'DOG', image: '🐶', difficulty: 'easy'},
  {id: 4, word: 'FISH', image: '🐟', difficulty: 'easy'},
  {id: 5, word: 'BIRD', image: '🐦', difficulty: 'easy'},
  {id: 6, word: 'MILK', image: '🥛', difficulty: 'easy'},
  {id: 7, word: 'BOOK', image: '📖', difficulty: 'easy'},
  {id: 8, word: 'TREE', image: '🌳', difficulty: 'easy'},
  {id: 9, word: 'STAR', image: '⭐', difficulty: 'easy'},
  {id: 10, word: 'FROG', image: '🐸', difficulty: 'easy'},
  {id: 11, word: 'CAKE', image: '🎂', difficulty: 'easy'},
  {id: 12, word: 'MOON', image: '🌙', difficulty: 'easy'},
  {id: 13, word: 'APPLE', image: '🍎', difficulty: 'medium'},
  {id: 14, word: 'HOUSE', image: '🏠', difficulty: 'medium'},
  {id: 15, word: 'WATER', image: '💧', difficulty: 'medium'},
  {id: 16, word: 'PLANT', image: '🌱', difficulty: 'medium'},
  {id: 17, word: 'CHAIR', image: '🪑', difficulty: 'medium'},
  {id: 18, word: 'LAMP', image: '💡', difficulty: 'medium'},
  {id: 19, word: 'CLOUD', image: '☁️', difficulty: 'medium'},
  {id: 20, word: 'GRASS', image: '🌿', difficulty: 'medium'},
  {id: 21, word: 'PIZZA', image: '🍕', difficulty: 'medium'},
  {id: 22, word: 'TIGER', image: '🐯', difficulty: 'medium'},
  {id: 23, word: 'ELEPHANT', image: '🐘', difficulty: 'hard'},
  {id: 24, word: 'BANANA', image: '🍌', difficulty: 'hard'},
  {id: 25, word: 'RABBIT', image: '🐰', difficulty: 'hard'},
  {id: 26, word: 'MONKEY', image: '🐵', difficulty: 'hard'},
  {id: 27, word: 'GARDEN', image: '🌻', difficulty: 'hard'},
  {id: 28, word: 'PURPLE', image: '🟣', difficulty: 'hard'},
  {id: 29, word: 'DOLPHIN', image: '🐬', difficulty: 'hard'},
  {id: 30, word: 'BUTTERFLY', image: '🦋', difficulty: 'hard'},
];

export function filterBankByDifficulties(
  difficulties: Difficulty[],
): CardBankEntry[] {
  return cardBank.filter(entry => difficulties.includes(entry.difficulty));
}
