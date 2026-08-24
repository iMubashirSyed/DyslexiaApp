import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../../navigation/types';
import type {BingoAgeGroup, BingoAnimalWord} from '../../../api/services';

export type {BingoAgeGroup};

export interface BingoModeConfig {
  label: string;
  ageRange: string;
  description: string;
  icon: string;
  ageGroup: BingoAgeGroup;
  voiceEnabled: boolean;
  showTimer: boolean;
  showStreak: boolean;
  imageSize: number;
  totalRounds: number;
}

export interface BingoGameState {
  roundNumber: number;
  roundsCompleted: number;
  wrongAttempts: number;
  streak: number;
  elapsedSeconds: number;
  targetId: number | null;
  target: BingoAnimalWord | null;
  grid: BingoAnimalWord[];
  promptText: string;
  isLoading: boolean;
  loadError: string | null;
  isResolving: boolean;
  isComplete: boolean;
  feedback: string | null;
}

export type AnimalBingoModeSelectProps = NativeStackScreenProps<
  HomeStackParamList,
  'AnimalBingoModeSelect'
>;

export type AnimalBingoGameProps = NativeStackScreenProps<
  HomeStackParamList,
  'AnimalBingoGame'
>;
