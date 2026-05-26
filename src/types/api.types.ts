// ============================================================================
// API Type Definitions
// Layer 0 — Generic API response wrapper and history types
// ============================================================================

/** Generic API response envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/** History item for TTS generations */
export interface HistoryItem {
  id: string;
  /** Text that was converted (truncated for display) */
  textPreview: string;
  /** Full original text */
  fullText: string;
  /** Voice used */
  voiceId: string;
  voiceName: string;
  /** Language code */
  languageCode: string;
  /** Generated audio URL */
  audioUrl: string;
  /** Duration in seconds */
  duration: number;
  /** Character count */
  charCount: number;
  /** Creation timestamp */
  createdAt: string;
  /** Type of generation */
  type: 'tts' | 'bulk-tts' | 'clone-preview';
}

/** User profile (simplified for localStorage) */
export interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  /** Remaining characters in quota */
  charsRemaining: number;
  /** Total character quota */
  charsTotal: number;
  /** Quota expiry date */
  quotaExpiry: string;
  /** UI language preference */
  uiLanguage: 'vi' | 'en';
}

/** Default user profile */
export const DEFAULT_USER: UserProfile = {
  name: 'ASANA',
  email: 'asana@gmail.com',
  plan: 'free',
  charsRemaining: 2_400_480,
  charsTotal: 2_500_000,
  quotaExpiry: '2026-06-04',
  uiLanguage: 'vi',
};
