// ============================================================================
// Gemini TTS Provider
// ============================================================================

import { Buffer } from 'buffer';
import { TTSProvider, TTSVoice, GenerateSpeechOptions, GenerateSpeechResult } from './base.provider';
import { GEMINI_TTS_MODEL, GEMINI_API_BASE } from '@/ModelCall';

// All available Gemini prebuilt voices
export const GEMINI_VOICES: TTSVoice[] = [
  // Vietnamese
  { id: 'vi-aoede', name: 'Mai', description: 'Giọng nữ êm ái, nhẹ nhàng (Aoede)', gender: 'female', languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN', category: 'narration', avatarColors: ['#14b8a6', '#0d9488'], provider: 'gemini' },
  { id: 'vi-kore', name: 'Linh', description: 'Giọng nữ rõ ràng, trong trẻo (Kore)', gender: 'female', languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN', category: 'conversational', avatarColors: ['#ec4899', '#f43f5e'], provider: 'gemini' },
  { id: 'vi-charon', name: 'Đức', description: 'Giọng nam trầm ấm, đáng tin cậy (Charon)', gender: 'male', languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN', category: 'general', avatarColors: ['#10b981', '#059669'], provider: 'gemini' },
  { id: 'vi-fenrir', name: 'Phong', description: 'Giọng nam dứt khoát, mạnh mẽ (Fenrir)', gender: 'male', languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN', category: 'news', avatarColors: ['#f97316', '#ea580c'], provider: 'gemini' },
  { id: 'vi-puck', name: 'Minh', description: 'Giọng nam trẻ trung, năng động (Puck)', gender: 'male', languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN', category: 'conversational', avatarColors: ['#3b82f6', '#1d4ed8'], provider: 'gemini' },
  // English
  { id: 'en-james', name: 'James', description: 'Deep, cinematic narrator voice', gender: 'male', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'narration', avatarColors: ['#6366f1', '#4f46e5'], provider: 'gemini' },
  { id: 'en-sarah', name: 'Sarah', description: 'Friendly, natural conversational voice', gender: 'female', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'conversational', avatarColors: ['#f472b6', '#ec4899'], provider: 'gemini' },
  { id: 'en-michael', name: 'Michael', description: 'Professional news anchor voice', gender: 'male', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'news', avatarColors: ['#0ea5e9', '#0284c7'], provider: 'gemini' },
  { id: 'en-emma', name: 'Emma', description: 'Young, energetic voice for social media', gender: 'female', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'conversational', avatarColors: ['#a78bfa', '#8b5cf6'], provider: 'gemini' },
  { id: 'en-david', name: 'David', description: 'Authoritative commercial voiceover', gender: 'male', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'general', avatarColors: ['#f59e0b', '#d97706'], provider: 'gemini' },
  { id: 'en-olivia', name: 'Olivia', description: 'Calm, soothing voice for meditation', gender: 'female', languageCode: 'en-US', languageName: 'English', countryCode: 'US', category: 'narration', avatarColors: ['#34d399', '#10b981'], provider: 'gemini' },
  // Spanish
  { id: 'es-animals', name: 'Animals TBN', description: 'Narración general en español con tono natural', gender: 'male', languageCode: 'es-ES', languageName: 'Español', countryCode: 'ES', category: 'general', avatarColors: ['#f97316', '#dc2626'], provider: 'gemini' },
  { id: 'es-tbn-dl', name: 'TBN DL', description: 'Voz conversacional para diálogos', gender: 'male', languageCode: 'es-ES', languageName: 'Español', countryCode: 'ES', category: 'conversational', avatarColors: ['#6366f1', '#3b82f6'], provider: 'gemini' },
  { id: 'es-carmen', name: 'Carmen', description: 'Voz profesional para noticias', gender: 'female', languageCode: 'es-ES', languageName: 'Español', countryCode: 'ES', category: 'news', avatarColors: ['#ec4899', '#be185d'], provider: 'gemini' },
  { id: 'es-pablo', name: 'Pablo', description: 'Voz enérgica para contenido publicitario', gender: 'male', languageCode: 'es-ES', languageName: 'Español', countryCode: 'ES', category: 'general', avatarColors: ['#10b981', '#047857'], provider: 'gemini' },
  // Russian
  { id: 'ru-khao', name: 'Khảo cổ Nga', description: 'Общий русский голос для повествования', gender: 'male', languageCode: 'ru-RU', languageName: 'Русский', countryCode: 'RU', category: 'general', avatarColors: ['#ef4444', '#b91c1c'], provider: 'gemini' },
  { id: 'ru-natasha', name: 'Natasha', description: 'Естественный женский голос для диалогов', gender: 'female', languageCode: 'ru-RU', languageName: 'Русский', countryCode: 'RU', category: 'conversational', avatarColors: ['#a78bfa', '#7c3aed'], provider: 'gemini' },
  { id: 'ru-dmitri', name: 'Dmitri', description: 'Профессиональный голос для новостей', gender: 'male', languageCode: 'ru-RU', languageName: 'Русский', countryCode: 'RU', category: 'news', avatarColors: ['#0ea5e9', '#0369a1'], provider: 'gemini' },
  { id: 'ru-anna', name: 'Anna', description: 'Тёплый голос для аудиокниг', gender: 'female', languageCode: 'ru-RU', languageName: 'Русский', countryCode: 'RU', category: 'narration', avatarColors: ['#f472b6', '#db2777'], provider: 'gemini' },
  // Japanese
  { id: 'ja-yuki', name: 'Yuki', description: '落ち着いたナレーション向きの女性ボイス', gender: 'female', languageCode: 'ja-JP', languageName: '日本語', countryCode: 'JP', category: 'narration', avatarColors: ['#f43f5e', '#e11d48'], provider: 'gemini' },
  { id: 'ja-takeshi', name: 'Takeshi', description: 'プロフェッショナルなニュースキャスターの声', gender: 'male', languageCode: 'ja-JP', languageName: '日本語', countryCode: 'JP', category: 'news', avatarColors: ['#3b82f6', '#2563eb'], provider: 'gemini' },
  { id: 'ja-sakura', name: 'Sakura', description: '明るく親しみやすいカジュアルボイス', gender: 'female', languageCode: 'ja-JP', languageName: '日本語', countryCode: 'JP', category: 'conversational', avatarColors: ['#ec4899', '#f472b6'], provider: 'gemini' },
  { id: 'ja-kenji', name: 'Kenji', description: 'エネルギッシュな広告ナレーション', gender: 'male', languageCode: 'ja-JP', languageName: '日本語', countryCode: 'JP', category: 'general', avatarColors: ['#f59e0b', '#d97706'], provider: 'gemini' },
  // Korean
  { id: 'ko-soyeon', name: 'Soyeon', description: '부드럽고 전문적인 내레이션 음성', gender: 'female', languageCode: 'ko-KR', languageName: '한국어', countryCode: 'KR', category: 'narration', avatarColors: ['#8b5cf6', '#6d28d9'], provider: 'gemini' },
  { id: 'ko-junhyeok', name: 'Junhyeok', description: '명확하고 신뢰감 있는 뉴스 앵커 음성', gender: 'male', languageCode: 'ko-KR', languageName: '한국어', countryCode: 'KR', category: 'news', avatarColors: ['#0ea5e9', '#0284c7'], provider: 'gemini' },
  { id: 'ko-minji', name: 'Minji', description: '밝고 친근한 대화체 음성', gender: 'female', languageCode: 'ko-KR', languageName: '한국어', countryCode: 'KR', category: 'conversational', avatarColors: ['#f43f5e', '#e11d48'], provider: 'gemini' },
  { id: 'ko-hyunwoo', name: 'Hyunwoo', description: '힘있고 에너지 넘치는 광고 음성', gender: 'male', languageCode: 'ko-KR', languageName: '한국어', countryCode: 'KR', category: 'general', avatarColors: ['#10b981', '#059669'], provider: 'gemini' },
  // French
  { id: 'fr-jacques', name: 'Jacques', description: 'Voix masculine profonde pour la narration', gender: 'male', languageCode: 'fr-FR', languageName: 'Français', countryCode: 'FR', category: 'narration', avatarColors: ['#1d4ed8', '#3b82f6'], provider: 'gemini' },
  { id: 'fr-chloe', name: 'Chloé', description: 'Voix féminine naturelle pour les vlogs', gender: 'female', languageCode: 'fr-FR', languageName: 'Français', countryCode: 'FR', category: 'conversational', avatarColors: ['#f472b6', '#ec4899'], provider: 'gemini' },
  { id: 'fr-philippe', name: 'Philippe', description: 'Voix de journaliste professionnel', gender: 'male', languageCode: 'fr-FR', languageName: 'Français', countryCode: 'FR', category: 'news', avatarColors: ['#0ea5e9', '#0369a1'], provider: 'gemini' },
  { id: 'fr-amelie', name: 'Amélie', description: 'Voix dynamique pour la publicité', gender: 'female', languageCode: 'fr-FR', languageName: 'Français', countryCode: 'FR', category: 'general', avatarColors: ['#a78bfa', '#8b5cf6'], provider: 'gemini' },
];

// Voice ID → Gemini voice name mapping
const VOICE_MAP: Record<string, string> = {
  'vi-aoede': 'Aoede', 'vi-kore': 'Kore', 'vi-charon': 'Charon', 'vi-fenrir': 'Fenrir', 'vi-puck': 'Puck',
  'en-james': 'Charon', 'en-sarah': 'Leda', 'en-michael': 'Puck', 'en-emma': 'Zephyr', 'en-david': 'Kore', 'en-olivia': 'Aoede',
  'es-animals': 'Puck', 'es-tbn-dl': 'Kore', 'es-carmen': 'Leda', 'es-pablo': 'Charon',
  'ru-khao': 'Puck', 'ru-natasha': 'Leda', 'ru-dmitri': 'Charon', 'ru-anna': 'Aoede',
  'ja-yuki': 'Leda', 'ja-takeshi': 'Puck', 'ja-sakura': 'Zephyr', 'ja-kenji': 'Charon',
  'ko-soyeon': 'Leda', 'ko-junhyeok': 'Puck', 'ko-minji': 'Zephyr', 'ko-hyunwoo': 'Kore',
  'fr-jacques': 'Charon', 'fr-chloe': 'Leda', 'fr-philippe': 'Puck', 'fr-amelie': 'Aoede',
  'en-science': 'Kore', 'es-science': 'Leda',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addWavHeader(pcmData: any, sampleRate: number, numChannels: number): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmData]);
}

export class GeminiProvider implements TTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateKey(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getVoices(): Promise<TTSVoice[]> {
    return GEMINI_VOICES;
  }

  async generateSpeech(options: GenerateSpeechOptions): Promise<GenerateSpeechResult> {
    const { text, voiceId, languageCode = 'vi-VN' } = options;
    const geminiVoice = VOICE_MAP[voiceId] || 'Kore';
    const apiUrl = `${GEMINI_API_BASE}/models/${GEMINI_TTS_MODEL}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
        },
      },
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini TTS error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const audioPart = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('audio/')
    );

    if (!audioPart?.inlineData?.data) {
      throw new Error('Gemini TTS returned no audio data');
    }

    const rawBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
    const mime = (audioPart.inlineData.mimeType || 'audio/l16').toLowerCase();
    // Gemini returns 'audio/L16' (raw 16-bit PCM, 24kHz mono) — must add WAV header
    const audioBuffer: Buffer = mime.includes('audio/l16') ? addWavHeader(rawBuffer, 24000, 1) : rawBuffer;

    return { audioBuffer, fileExtension: 'wav', source: 'gemini' };
  }

  async generatePreview(voiceId: string, text: string): Promise<GenerateSpeechResult> {
    return this.generateSpeech({ text, voiceId, languageCode: 'vi-VN' });
  }
}
