import apiClient, {getBingoGameBaseUrl, getMateenBaseUrl, getUmairBaseUrl} from './client';

export type VocabularyImageItem = {
  id: number;
  word: string;
  style: string;
  image_url: string;
  created_at: string;
};

export type VocabStylePreset =
  | 'cartoon'
  | 'realistic'
  | 'watercolor'
  | 'pixelart';

/** POST `/mubashir/vocabulary-to-image/` — generate + store for the user. */
export const generateImageVisual = async (
  text: string,
  style: VocabStylePreset = 'cartoon',
): Promise<VocabularyImageItem> => {
  try {
    const response = await apiClient.post<VocabularyImageItem>(
      'vocabulary-to-image/',
      {
        word: text,
        style: style,
      },
      {timeout: 180000},
    );
    return response.data;
  } catch (error: any) {
    console.error('API Error Details:', error.response?.data);
    throw new Error(
      error.response?.data?.error || 'Backend connection failed',
    );
  }
};

/** GET `/mubashir/vocabulary-to-image/` — user history. */
export async function fetchVocabularyImageHistory(): Promise<
  VocabularyImageItem[]
> {
  const {data} = await apiClient.get<{results: VocabularyImageItem[]}>(
    'vocabulary-to-image/',
  );
  return data.results ?? [];
}

/** DELETE `/mubashir/vocabulary-to-image/:id/` */
export async function deleteVocabularyImage(id: number): Promise<void> {
  await apiClient.delete(`vocabulary-to-image/${id}/`);
}

export interface FlashcardItem {
  word: string;
  image_url: string;
}

export interface FlashcardResponse {
  extracted_text: string;
  flashcards: FlashcardItem[];
  error?: string;
}

/**
 * Generate flashcards from an image.
 */
export const generateFlashcardDeck = async (imageAsset: any): Promise<FlashcardResponse> => {
  try {
    console.log("📤 Sending image to flashcard API natively via JSON...");
    
    // Using a JSON payload with image_base64 entirely avoids React Native's
    // notorious OS-level "Network Error" bugs with FormData on Android!
    const response = await apiClient.post("flashcard-generator/", {
      image_base64: imageAsset.base64
    }, {
      timeout: 180000, // Vision keyword extraction + image URLs
    });

    console.log("📥 API Response:", JSON.stringify(response.data));

    return {
      extracted_text: response.data?.extracted_text || "",
      flashcards: response.data?.flashcards || [],
      error: response.data?.error,
    };
  } catch (error: any) {
    console.error("❌ Flashcard API Error:", error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error("Request timed out. The server is taking too long to respond.");
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error("Session expired. Please log in again.");
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error.message?.includes('Network Error')) {
      throw new Error(
        "Network Error: Could not reach the server.\n\n" +
        "Please check if Django is running on port 8000 and restart the app."
      );
    }
    throw new Error(error.message || "Failed to generate flashcards. Please try again.");
  }
};

/** GET `/umair/alphabet-matcher/level/` — requires JWT. */
export async function fetchAlphabetMatcherLevel(): Promise<number> {
  const { data } = await apiClient.get<{ level: number }>('alphabet-matcher/level/', {
    baseURL: getUmairBaseUrl(),
  });
  return data.level;
}

/** PUT `/umair/alphabet-matcher/level/` — requires JWT. */
export async function updateAlphabetMatcherLevel(level: number): Promise<number> {
  const { data } = await apiClient.put<{ level: number }>(
    'alphabet-matcher/level/',
    { level },
    { baseURL: getUmairBaseUrl() },
  );
  return data.level;
}

export type AuditoryVisualizationItem = {
  id: number;
  prompt: string;
  description: string;
  image_url: string | null;
  sound1_url: string | null;
  sound1_label: string;
  sound2_url: string | null;
  sound2_label: string;
  created_at: string;
};

/** POST `/umair/auditory-visualization/` — 1 image + 2 ElevenLabs SFX. */
export async function createAuditoryVisualization(
  prompt: string,
): Promise<AuditoryVisualizationItem> {
  const { data } = await apiClient.post<AuditoryVisualizationItem>(
    'auditory-visualization/',
    { prompt },
    { baseURL: getUmairBaseUrl(), timeout: 180000 },
  );
  return data;
}

/** GET `/umair/auditory-visualization/` — user history. */
export async function fetchAuditoryVisualizationHistory(): Promise<
  AuditoryVisualizationItem[]
> {
  const { data } = await apiClient.get<{ results: AuditoryVisualizationItem[] }>(
    'auditory-visualization/',
    { baseURL: getUmairBaseUrl() },
  );
  return data.results ?? [];
}

/** DELETE `/umair/auditory-visualization/:id/` */
export async function deleteAuditoryVisualization(id: number): Promise<void> {
  await apiClient.delete(`auditory-visualization/${id}/`, {
    baseURL: getUmairBaseUrl(),
  });
}

export type PhraseConversionItem = {
  id: number;
  original: string;
  simplified: string;
  target_level: string;
  result_json: Record<string, unknown>;
  created_at: string;
};

/** POST `/umair/phrase-conversion/` — save simplification result. */
export async function savePhraseConversion(payload: {
  original: string;
  simplified: string;
  target_level: string;
  result_json: Record<string, unknown>;
}): Promise<PhraseConversionItem> {
  const { data } = await apiClient.post<PhraseConversionItem>(
    'phrase-conversion/',
    payload,
    { baseURL: getUmairBaseUrl() },
  );
  return data;
}

/** GET `/umair/phrase-conversion/` — user history. */
export async function fetchPhraseConversionHistory(): Promise<
  PhraseConversionItem[]
> {
  const { data } = await apiClient.get<{ results: PhraseConversionItem[] }>(
    'phrase-conversion/',
    { baseURL: getUmairBaseUrl() },
  );
  return data.results ?? [];
}

/** DELETE `/umair/phrase-conversion/:id/` */
export async function deletePhraseConversion(id: number): Promise<void> {
  await apiClient.delete(`phrase-conversion/${id}/`, {
    baseURL: getUmairBaseUrl(),
  });
}





// Mateen work


export type ChildPreferences = {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  high_contrast_enabled: boolean;
};



export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};


/** POST `/mateen/chat/` — key remains safely on the Django server. */
export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const {data} = await apiClient.post<{reply: string}>('chat/', {messages}, {
    baseURL: getMateenBaseUrl(),
    timeout: 30000,
  });
  return data.reply;
}

/** GET `/mateen/preferences/` — requires the existing JWT token. */
export async function fetchChildPreferences(): Promise<ChildPreferences> {
  const {data} = await apiClient.get<ChildPreferences>('preferences/', {
    baseURL: getMateenBaseUrl(),
  });
  return data;
}

/** PUT `/mateen/preferences/` — stores a child's settings efficiently. */
export async function updateChildPreferences(
  changes: Partial<ChildPreferences>,
): Promise<ChildPreferences> {
  const {data} = await apiClient.put<ChildPreferences>('preferences/', changes, {
    baseURL: getMateenBaseUrl(),
  });
  return data;
}

// ─── Animal Bingo (mateen/bingo_game) ────────────────────────────────────────

export type BingoAgeGroup = 'little' | 'growing' | 'challenge';

export type BingoAnimalWord = {
  id: number;
  name: string;
  image_url: string;
  audio_url: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  age_group: BingoAgeGroup;
};

export type BingoRoundResponse = {
  target_id: number;
  target: BingoAnimalWord;
  grid: BingoAnimalWord[];
};

export type BingoVerifyResponse = {
  match: boolean;
  transcribed_text: string;
  similarity: number;
};

/** GET `/mateen/bingo/round/?age_group=...` — 3×3 grid + target for one round. */
export async function fetchBingoRound(
  ageGroup: BingoAgeGroup,
): Promise<BingoRoundResponse> {
  const {data} = await apiClient.get<BingoRoundResponse>('round/', {
    baseURL: getBingoGameBaseUrl(),
    params: {age_group: ageGroup},
  });
  return data;
}

/** GET `/mateen/bingo/words/?age_group=...` — full filtered pool (fallback). */
export async function fetchBingoWords(
  ageGroup: BingoAgeGroup,
): Promise<BingoAnimalWord[]> {
  const {data} = await apiClient.get<{results: BingoAnimalWord[]}>(
    'words/',
    {
      baseURL: getBingoGameBaseUrl(),
      params: {age_group: ageGroup},
    },
  );
  return data.results ?? [];
}

/**
 * POST `/mateen/bingo/verify-text/` — fuzzy match for on-device Voice STT text.
 * (Same matcher as verify-speech; avoids needing a separate audio recorder package.)
 */
export async function verifyBingoSpeechText(
  transcribedText: string,
  targetWord: string,
): Promise<BingoVerifyResponse> {
  const {data} = await apiClient.post<BingoVerifyResponse>(
    'verify-text/',
    {
      transcribed_text: transcribedText,
      target_word: targetWord,
    },
    {baseURL: getBingoGameBaseUrl()},
  );
  return data;
}

// // export const generateImageVisual = async (text: string, style: 'cartoon' | 'realistic' | 'watercolor' | 'pixelart' = 'cartoon'): Promise<string> => {
// //   try {
// //     const response = await apiClient.post('vocabulary-to-image/', {
// //       word: text,
// //       style: style,
// //     });
// //     return response.data.image_url;
// //   } catch (error: any) {
// //     console.error("API Error Details:", error.response?.data);
// //     throw new Error("Backend connection failed");
// //   }
// // };

// export interface FlashcardItem {
//   word: string;
//   image_url: string;
// }

// export interface FlashcardResponse {
//   extracted_text: string;
//   flashcards: FlashcardItem[];
//   error?: string;
// }

// /**
//  * Generate flashcards from an image.
//  */
// export const generateFlashcardDeck = async (imageAsset: any): Promise<FlashcardResponse> => {
//   try {
//     console.log("📤 Sending image to flashcard API natively via JSON...");
    
//     // Using a JSON payload with image_base64 entirely avoids React Native's
//     // notorious OS-level "Network Error" bugs with FormData on Android!
//     const response = await apiClient.post("flashcard-generator/", {
//       image_base64: imageAsset.base64
//     }, {
//       timeout: 120000, // Long timeout for OCR + AI Generation
//     });

//     console.log("📥 API Response:", JSON.stringify(response.data));

//     return {
//       extracted_text: response.data?.extracted_text || "",
//       flashcards: response.data?.flashcards || [],
//       error: response.data?.error,
//     };
//   } catch (error: any) {
//     console.error("❌ Flashcard API Error:", error.message);
    
//     if (error.code === 'ECONNABORTED') {
//       throw new Error("Request timed out. The server is taking too long to respond.");
//     }
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       throw new Error("Session expired. Please log in again.");
//     }
//     if (error.response?.data?.error) {
//       throw new Error(error.response.data.error);
//     }
//     if (error.message?.includes('Network Error')) {
//       throw new Error(
//         "Network Error: Could not reach the server.\n\n" +
//         "Please check if Django is running on port 8000 and restart the app."
//       );
//     }
//     throw new Error(error.message || "Failed to generate flashcards. Please try again.");
//   }
// };

// /** GET `/umair/alphabet-matcher/level/` — requires JWT. */
// export async function fetchAlphabetMatcherLevel(): Promise<number> {
//   const { data } = await apiClient.get<{ level: number }>('alphabet-matcher/level/', {
//     baseURL: getUmairBaseUrl(),
//   });
//   return data.level;
// }

// /** PUT `/umair/alphabet-matcher/level/` — requires JWT. */
// export async function updateAlphabetMatcherLevel(level: number): Promise<number> {
//   const { data } = await apiClient.put<{ level: number }>(
//     'alphabet-matcher/level/',
//     { level },
//     { baseURL: getUmairBaseUrl() },
//   );
//   return data.level;
// }




