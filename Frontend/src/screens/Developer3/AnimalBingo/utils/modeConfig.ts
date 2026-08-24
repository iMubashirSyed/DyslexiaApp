import type {BingoAgeGroup, BingoModeConfig} from './types';

export const MODE_CONFIG: Record<BingoAgeGroup, BingoModeConfig> = {
  little: {
    label: 'Little Learners',
    ageRange: 'Ages 7–9',
    description: 'Tap the animal · easy words · gentle pace',
    icon: '🐣',
    ageGroup: 'little',
    voiceEnabled: false,
    showTimer: false,
    showStreak: false,
    imageSize: 96,
    totalRounds: 9,
  },
  growing: {
    label: 'Growing Readers',
    ageRange: 'Ages 10–12',
    description: 'Tap or say the name · easy & medium words',
    icon: '🦊',
    ageGroup: 'growing',
    voiceEnabled: true,
    showTimer: false,
    showStreak: false,
    imageSize: 88,
    totalRounds: 9,
  },
  challenge: {
    label: 'Challenge Mode',
    ageRange: 'Ages 13–14',
    description: 'Tap or voice · harder words · timer & streak',
    icon: '🦁',
    ageGroup: 'challenge',
    voiceEnabled: true,
    showTimer: true,
    showStreak: true,
    imageSize: 82,
    totalRounds: 9,
  },
};

export const TOTAL_ROUNDS = 9;

export function buildPromptText(animalName: string): string {
  return `Find the: ${animalName}`;
}

/** True when image_url is a remote http(s) URL; otherwise treat as emoji text. */
export function isRemoteImage(imageUrl: string): boolean {
  return /^https?:\/\//i.test(imageUrl);
}
