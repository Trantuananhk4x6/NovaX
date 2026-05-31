// ============================================================================
// TTS (Text-to-Speech) Type Definitions
// Layer 0 — Shared interfaces for TTS form, settings, and API contracts
// ============================================================================

/** Supported split modes for bulk text processing */
export type SplitMode = 'line' | 'sentence' | 'paragraph';

/** TTS form state — holds all user inputs for speech generation */
export interface TTSFormState {
  /** Raw text input (may include SSML tags) */
  text: string;
  /** Selected voice identifier */
  voiceId: string;
  /** Playback speed multiplier (0.5x – 2.0x) */
  speed: number;
  /**
   * Fish Speech temperature (0.1 – 1.0).
   * Controls creativity / randomness.
   * Low = stable/monotone, High = expressive/variable. Default: 0.7
   */
  temperature: number;
  /**
   * Fish Speech top_p (0.1 – 1.0).
   * Nucleus sampling threshold — how diverse the token pool is.
   * Low = focused, High = diverse. Default: 0.7
   */
  topP: number;
  /**
   * Fish Speech repetition_penalty (1.0 – 2.0).
   * Penalises repeating the same tokens.
   * 1.0 = off (risk of loops), 1.2 = recommended, 2.0 = aggressive. Default: 1.2
   */
  repetitionPenalty: number;
  /** Default break time in seconds for SSML pauses */
  breakTime: number;
  /** Output file name prefix */
  filePrefix: string;
  /** Selected language code (e.g., 'vi-VN', 'en-US') */
  languageCode: string;
  /** Split mode for bulk text */
  splitMode: SplitMode;
}

/** Default values for TTSFormState */
export const DEFAULT_TTS_FORM: TTSFormState = {
  text: '',
  voiceId: '',
  speed: 1.0,
  temperature: 0.6,
  topP: 0.7,
  repetitionPenalty: 1.3,
  breakTime: 1.0,
  filePrefix: 'voice_output',
  languageCode: 'vi-VN',
  splitMode: 'line',
};

/** Character limit constants */
export const TTS_CHAR_LIMIT = 5_000;
export const BULK_TTS_CHAR_LIMIT = 100_000;

/** Estimated duration result */
export interface EstimatedDuration {
  /** Total seconds */
  totalSeconds: number;
  /** Formatted as MM:SS */
  formatted: string;
  /** Word count used in calculation */
  wordCount: number;
}

/** Script template for quick injection */
export interface ScriptTemplate {
  id: string;
  /** Template display name */
  title: string;
  /** Short description */
  description: string;
  /** Category tag */
  category: 'story' | 'review' | 'news' | 'ad' | 'podcast' | 'meditation' | 'game' | 'film';
  /** The script content to inject */
  content: string;
  /** Icon name from Lucide */
  icon: string;
  /** Gradient colors for card background */
  gradient: [string, string];
}

/** TTS generation request payload */
export interface TTSGenerateRequest {
  text: string;
  voiceId: string;
  speed: number;
  temperature: number;
  topP: number;
  repetitionPenalty: number;
  languageCode: string;
  filePrefix: string;
}

/** TTS generation response from API */
export interface TTSGenerateResponse {
  success: boolean;
  /** URL to the generated audio file */
  audioUrl?: string;
  /** Duration of generated audio in seconds */
  duration?: number;
  /** File size in bytes */
  fileSize?: number;
  /** Error message if failed */
  error?: string;
  /** Generation ID for history tracking */
  generationId?: string;
}

/** TTS generation state machine */
export interface TTSGenerationState {
  isGenerating: boolean;
  progress: number;
  error: string | null;
  /** Shake animation trigger for validation errors */
  shouldShake: boolean;
  /** Result from the last generation */
  result: TTSGenerateResponse | null;
}
