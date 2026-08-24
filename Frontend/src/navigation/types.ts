import type {NavigatorScreenParams} from '@react-navigation/native';

export type HomeStackParamList = {
  Home: undefined;
  AlphabetMatcher: undefined;
  PhrasesConversion: undefined;
  SpeechCoach: undefined;
  LetterTrace: undefined;
  VoiceChatbot: undefined;
  AuditoryGuidedVisualization: undefined;
  FlashcardGenerator: undefined;
  PhraseToImageConverter: undefined;
  WordScramble: undefined;
  FlashcardModeSelect: undefined;
  FlashcardGame: {mode: 'little' | 'growing' | 'challenge'};
  AnimalBingoModeSelect: undefined;
  AnimalBingoGame: {mode: 'little' | 'growing' | 'challenge'};
  Search: undefined;
  Details: {itemId: string};
};

export type SettingsStackParamList = {
  Settings: undefined;
  Help: undefined;
};

export type MainTabParamList = {
  Profile: undefined;
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList> | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};
