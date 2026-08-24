export interface LetterTile {
  id: string;
  letter: string;
  /** false when placed in a slot */
  available: boolean;
}

export interface WordScrambleGameState {
  sessionKey: number;
  shuffledWords: string[];
  levelIndex: number;
  targetWord: string;
  scrambledLetters: string[];
  slots: (string | null)[];
  /** slot index -> tile id */
  slotTileIds: (string | null)[];
  tiles: LetterTile[];
  streak: number;
  score: number;
  phase: 'playing' | 'success' | 'complete';
}