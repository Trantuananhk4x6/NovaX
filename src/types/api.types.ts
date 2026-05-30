// ============================================================================
// API Type Definitions
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  textPreview: string;
  fullText: string;
  voiceId: string;
  voiceName: string;
  languageCode: string;
  audioUrl: string;
  duration: number;
  charCount: number;
  createdAt: string;
  type: 'tts' | 'bulk-tts' | 'clone-preview' | 'audio-to-video' | 'video-to-audio';
}

export type TTSProvider = 'gemini' | 'elevenlabs';

export interface UserProfile {
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  charsRemaining: number;
  charsTotal: number;
  quotaExpiry: string;
  uiLanguage: 'vi' | 'en';
  ttsProvider: TTSProvider;
}

export const DEFAULT_USER: UserProfile = {
  name: 'User',
  email: '',
  plan: 'free',
  charsRemaining: 2_400_480,
  charsTotal: 2_500_000,
  quotaExpiry: '2026-06-04',
  uiLanguage: 'vi',
  ttsProvider: 'gemini',
};
