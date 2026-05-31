// ============================================================================
// Voice & Cloning Type Definitions
// Layer 0 — Interfaces for voice catalog, recording, and cloning workflow
// ============================================================================

/** Voice category classification */
export type VoiceCategory = 'general' | 'conversational' | 'narration' | 'news' | 'commercial' | 'game' | 'custom';

/** Supported country for voices */
export interface Country {
  code: string;        // e.g., 'VN', 'US'
  name: string;        // e.g., 'Việt Nam'
  flag: string;        // Emoji flag
  languageCode: string; // e.g., 'vi-VN'
  languageName: string; // e.g., 'Tiếng Việt'
}

/** TTS engine identifier */
export type TTSEngine = 'kokoro' | 'cosyvoice2';

/** Voice profile in the catalog */
export interface Voice {
  id: string;
  name: string;
  /** Display label (e.g., "adam - Chung") */
  label: string;
  /** Country code */
  countryCode: string;
  /** Language code (e.g., 'vi-VN') */
  languageCode: string;
  /** Voice category */
  category: VoiceCategory;
  /** Gender */
  gender: 'male' | 'female' | 'neutral';
  /** Short description of the voice character */
  description: string;
  /** URL to a static preview audio clip */
  previewUrl?: string;
  /** Short sentence spoken in the voice's own language for live preview generation */
  previewText?: string;
  /** Avatar gradient colors */
  avatarColors: [string, string];
  /** Whether this is a premium voice */
  isPremium?: boolean;
  /** TTS engine that handles this voice — "kokoro" | "cosyvoice2" */
  engine: TTSEngine;
  /** Engine-internal voice ID (Kokoro voice ID, or CosyVoice2 WAV filename stem) */
  geminiVoiceName?: string;
  /** Whether this is a user-cloned voice */
  isCustom: boolean;
  /** Creation timestamp */
  createdAt: string;
}

/** Audio recorder state */
export interface RecorderState {
  /** Whether currently recording */
  isRecording: boolean;
  /** Recorded audio as Blob */
  audioBlob: Blob | null;
  /** Recording elapsed time in seconds */
  recordingTime: number;
  /** Object URL for preview playback */
  audioUrl: string | null;
  /** Realtime waveform data array (0–255 range) */
  waveformData: number[];
  /** Error message if mic access denied or other issues */
  error: string | null;
  /** Whether the mic permission has been granted */
  permissionGranted: boolean;
}

/** Minimum recording duration in seconds for voice cloning */
export const MIN_RECORDING_DURATION = 10;

/** Audio file upload validation result */
export interface AudioFileValidation {
  valid: boolean;
  error?: string;
  file?: File;
  /** File size in MB */
  sizeMB?: number;
}

/** Accepted audio formats */
export const ACCEPTED_AUDIO_FORMATS = ['.mp3', '.wav', '.m4a'];
export const ACCEPTED_AUDIO_MIMES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/mp3',
];
export const MAX_AUDIO_FILE_SIZE_MB = 10;

/** Voice cloning request */
export interface VoiceCloneRequest {
  audioFile: Blob | File;
  voiceName: string;
  voiceDescription?: string;
  category: VoiceCategory;
  languageCode: string;
}

/** Voice cloning response from API */
export interface VoiceCloneResponse {
  success: boolean;
  voice?: Voice;
  error?: string;
}

/** Voice cloning state machine */
export interface VoiceCloningState {
  isCloning: boolean;
  /** Progress percentage (0–100) */
  progress: number;
  /** Current phase label */
  phaseLabel: string;
  error: string | null;
  result: VoiceCloneResponse | null;
}

/** Cloning progress phases */
export const CLONING_PHASES = [
  { threshold: 15, label: 'Đang tải lên file âm thanh...' },
  { threshold: 35, label: 'Phân tích đặc trưng giọng nói...' },
  { threshold: 55, label: 'Quét ma trận âm thanh AI...' },
  { threshold: 75, label: 'Huấn luyện mô hình giọng nói...' },
  { threshold: 90, label: 'Tinh chỉnh và tối ưu...' },
  { threshold: 100, label: 'Hoàn tất! Giọng nói đã sẵn sàng.' },
] as const;
