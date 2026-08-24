import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

type IconProps = {
  color: string;
  size?: number;
};

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
});

/** A–Z matching */
export function IconAlphabet({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20L8 4h3l4 16" {...stroke(color)} />
      <Path d="M6.5 14h6" {...stroke(color)} />
      <Path d="M15 20V8c0-2 1.5-3.5 3.5-3.5S22 6 22 8v12" {...stroke(color)} />
    </Svg>
  );
}

/** Phrase conversion / text rewrite */
export function IconPhrases({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6h11" {...stroke(color)} />
      <Path d="M4 12h8" {...stroke(color)} />
      <Path d="M4 18h6" {...stroke(color)} />
      <Path d="M14 14l6-6 2 2-6 6-3 1 1-3z" {...stroke(color)} />
    </Svg>
  );
}

/** Word/phrase to image */
export function IconPhraseToImage({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="5" width="18" height="14" rx="2" {...stroke(color)} />
      <Circle cx="8.5" cy="10" r="1.5" stroke={color} strokeWidth={1.75} fill="none" />
      <Path d="M3 16l5-4 4 3 3-2 6 4" {...stroke(color)} />
    </Svg>
  );
}

/** Flashcard generator */
export function IconFlashcardGen({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="5" y="4" width="12" height="16" rx="2" {...stroke(color)} />
      <Path d="M9 4v16" {...stroke(color)} />
      <Path d="M17 7h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9" {...stroke(color)} />
    </Svg>
  );
}

/** Reading coach / book + mic */
export function IconReadingCoach({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 19a2 2 0 0 0 2 2h12" {...stroke(color)} />
      <Path d="M6 21V7a2 2 0 0 1 2-2h9v14" {...stroke(color)} />
      <Path d="M10 10h5M10 13h4" {...stroke(color)} />
      <Path d="M18 8v3a2 2 0 0 0 4 0V8" {...stroke(color)} />
      <Path d="M20 13v2" {...stroke(color)} />
    </Svg>
  );
}

/** Letter trace / pen */
export function IconLetterTrace({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20h9" {...stroke(color)} />
      <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5z" {...stroke(color)} />
    </Svg>
  );
}

/** Auditory / headphones */
export function IconAuditory({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 14v-2a9 9 0 0 1 18 0v2"
        {...stroke(color)}
      />
      <Path d="M3 14a2 2 0 0 0 2 2h1v-5H5a2 2 0 0 0-2 2z" {...stroke(color)} />
      <Path d="M21 14a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z" {...stroke(color)} />
    </Svg>
  );
}

/** Voice chatbot */
export function IconVoiceChat({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4A8 8 0 1 1 21 12z"
        {...stroke(color)}
      />
      <Path d="M9 11v2M12 9v6M15 11v2" {...stroke(color)} />
    </Svg>
  );
}

/** Word scramble / puzzle */
export function IconWordScramble({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h5v5H4zM10 7h5v5h-5zM15 12h5v5h-5zM4 12h5v5H4z" {...stroke(color)} />
      <Path d="M10 14h3M14 10v3" {...stroke(color)} />
    </Svg>
  );
}

/** Flashcard frenzy / match cards */
export function IconFlashcardFrenzy({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="6" width="10" height="14" rx="2" {...stroke(color)} />
      <Rect x="11" y="4" width="10" height="14" rx="2" {...stroke(color)} />
      <Path d="M15 10h2M15 13h2" {...stroke(color)} />
    </Svg>
  );
}

/** Animal bingo / paw */
export function IconAnimalBingo({color, size = 28}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="8" cy="8" r="2" stroke={color} strokeWidth={1.75} fill="none" />
      <Circle cx="16" cy="8" r="2" stroke={color} strokeWidth={1.75} fill="none" />
      <Circle cx="6" cy="13" r="2" stroke={color} strokeWidth={1.75} fill="none" />
      <Circle cx="18" cy="13" r="2" stroke={color} strokeWidth={1.75} fill="none" />
      <Path
        d="M12 21c-3 0-5-2.2-5-4.5S9.5 13 12 15.2 17 14 17 16.5 15 21 12 21z"
        {...stroke(color)}
      />
    </Svg>
  );
}

export type FeatureIconKey =
  | 'alphabet'
  | 'phrases'
  | 'phraseToImage'
  | 'flashcardGen'
  | 'readingCoach'
  | 'letterTrace'
  | 'auditory'
  | 'voiceChat'
  | 'wordScramble'
  | 'flashcardFrenzy'
  | 'animalBingo';

export function FeatureIcon({
  name,
  color,
  size = 28,
}: {
  name: FeatureIconKey;
  color: string;
  size?: number;
}) {
  switch (name) {
    case 'alphabet':
      return <IconAlphabet color={color} size={size} />;
    case 'phrases':
      return <IconPhrases color={color} size={size} />;
    case 'phraseToImage':
      return <IconPhraseToImage color={color} size={size} />;
    case 'flashcardGen':
      return <IconFlashcardGen color={color} size={size} />;
    case 'readingCoach':
      return <IconReadingCoach color={color} size={size} />;
    case 'letterTrace':
      return <IconLetterTrace color={color} size={size} />;
    case 'auditory':
      return <IconAuditory color={color} size={size} />;
    case 'voiceChat':
      return <IconVoiceChat color={color} size={size} />;
    case 'wordScramble':
      return <IconWordScramble color={color} size={size} />;
    case 'flashcardFrenzy':
      return <IconFlashcardFrenzy color={color} size={size} />;
    case 'animalBingo':
      return <IconAnimalBingo color={color} size={size} />;
    default:
      return <IconAlphabet color={color} size={size} />;
  }
}
