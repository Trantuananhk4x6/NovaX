// ============================================================================
// TTS Provider Base Interface — abstraction for ElevenLabs & Gemini
// ============================================================================

export interface TTSVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  languageCode: string;
  languageName: string;
  countryCode: string;
  category: 'general' | 'conversational' | 'narration' | 'news' | 'commercial' | 'game' | 'custom';
  previewUrl?: string;
  avatarColors: [string, string];
  provider: 'gemini' | 'elevenlabs';
}

export interface GenerateSpeechOptions {
  text: string;
  voiceId: string;
  speed?: number;
  languageCode?: string;
}

export interface GenerateSpeechResult {
  audioBuffer: Buffer;
  fileExtension: 'wav' | 'mp3';
  source: string;
}

export interface TTSProvider {
  getVoices(): Promise<TTSVoice[]>;
  generateSpeech(options: GenerateSpeechOptions): Promise<GenerateSpeechResult>;
  generatePreview(voiceId: string, text: string): Promise<GenerateSpeechResult>;
  validateKey(): Promise<boolean>;
}
