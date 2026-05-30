// ============================================================================
// ElevenLabs TTS Provider
// ============================================================================

import { TTSProvider, TTSVoice, GenerateSpeechOptions, GenerateSpeechResult } from './base.provider';
import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_API_HEADER,
  ELEVENLABS_TTS_MODEL,
  ELEVENLABS_TURBO_MODEL,
} from '@/ModelCall';

function mapLanguage(labels: Record<string, string>): { languageCode: string; languageName: string; countryCode: string } {
  const accent = (labels?.accent || '').toLowerCase();
  const lang = (labels?.language || '').toLowerCase();

  if (lang.includes('viet') || accent.includes('viet')) return { languageCode: 'vi-VN', languageName: 'Tiếng Việt', countryCode: 'VN' };
  if (lang.includes('spanish') || accent.includes('spanish') || accent.includes('español')) return { languageCode: 'es-ES', languageName: 'Español', countryCode: 'ES' };
  if (lang.includes('russian') || accent.includes('russian')) return { languageCode: 'ru-RU', languageName: 'Русский', countryCode: 'RU' };
  if (lang.includes('japanese') || accent.includes('japanese')) return { languageCode: 'ja-JP', languageName: '日本語', countryCode: 'JP' };
  if (lang.includes('korean') || accent.includes('korean')) return { languageCode: 'ko-KR', languageName: '한국어', countryCode: 'KR' };
  if (lang.includes('french') || accent.includes('french')) return { languageCode: 'fr-FR', languageName: 'Français', countryCode: 'FR' };
  if (lang.includes('german') || accent.includes('german')) return { languageCode: 'de-DE', languageName: 'Deutsch', countryCode: 'DE' };
  if (lang.includes('chinese') || accent.includes('chinese')) return { languageCode: 'zh-CN', languageName: '中文', countryCode: 'CN' };
  if (lang.includes('thai') || accent.includes('thai')) return { languageCode: 'th-TH', languageName: 'ภาษาไทย', countryCode: 'TH' };
  if (lang.includes('italian') || accent.includes('italian')) return { languageCode: 'it-IT', languageName: 'Italiano', countryCode: 'IT' };
  if (lang.includes('portuguese') || accent.includes('portuguese')) return { languageCode: 'pt-BR', languageName: 'Português', countryCode: 'BR' };
  return { languageCode: 'en-US', languageName: 'English', countryCode: 'US' };
}

function mapGender(gender: string): TTSVoice['gender'] {
  if (gender === 'male') return 'male';
  if (gender === 'female') return 'female';
  return 'neutral';
}

function mapCategory(labels: Record<string, string>): TTSVoice['category'] {
  const use = (labels?.use_case || '').toLowerCase();
  if (use.includes('narration') || use.includes('audiobook')) return 'narration';
  if (use.includes('news') || use.includes('broadcast')) return 'news';
  if (use.includes('conversational') || use.includes('social media')) return 'conversational';
  if (use.includes('advertisement') || use.includes('commercial')) return 'commercial';
  if (use.includes('game') || use.includes('anime') || use.includes('characters')) return 'game';
  return 'general';
}

const AVATAR_PALETTE: [string, string][] = [
  ['#8b5cf6', '#6d28d9'], ['#3b82f6', '#1d4ed8'], ['#10b981', '#047857'],
  ['#f59e0b', '#d97706'], ['#ef4444', '#b91c1c'], ['#ec4899', '#be185d'],
  ['#14b8a6', '#0d9488'], ['#f97316', '#ea580c'], ['#6366f1', '#4f46e5'],
  ['#a78bfa', '#7c3aed'], ['#34d399', '#10b981'], ['#f472b6', '#db2777'],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawVoiceToTTSVoice(v: any, index: number): TTSVoice {
  const labels = v.labels || {};
  const { languageCode, languageName, countryCode } = mapLanguage(labels);
  const colors = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  return {
    id: v.voice_id,
    name: v.name,
    description: v.description || labels.description || `${v.name} — ElevenLabs`,
    gender: mapGender(labels.gender || ''),
    languageCode,
    languageName,
    countryCode,
    category: mapCategory(labels),
    previewUrl: v.preview_url || undefined,
    avatarColors: colors,
    provider: 'elevenlabs',
  };
}

export class ElevenLabsProvider implements TTSProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${ELEVENLABS_API_BASE}/user`, {
        headers: { [ELEVENLABS_API_HEADER]: this.apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getVoices(): Promise<TTSVoice[]> {
    // Try user's voices first
    try {
      const res = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        headers: { [ELEVENLABS_API_HEADER]: this.apiKey },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        return (data.voices || []).map(rawVoiceToTTSVoice);
      }

      // If missing voices_read permission, fall through to shared voices
      const errBody = await res.json().catch(() => ({}));
      const isMissingPerm = errBody?.detail?.status === 'missing_permissions' || res.status === 401 || res.status === 403;
      if (!isMissingPerm) {
        throw new Error(`ElevenLabs API error ${res.status}: ${JSON.stringify(errBody)}`);
      }
    } catch (err) {
      // If it's our own thrown error, re-throw
      if (err instanceof Error && err.message.startsWith('ElevenLabs API error')) throw err;
    }

    // Fallback: fetch featured shared community voices (no auth needed)
    const sharedRes = await fetch(
      `${ELEVENLABS_API_BASE}/shared-voices?page_size=100&featured=true`,
      { cache: 'no-store' }
    );

    if (!sharedRes.ok) {
      throw new Error(`ElevenLabs shared voices error ${sharedRes.status}`);
    }

    const sharedData = await sharedRes.json();
    return (sharedData.voices || []).map(rawVoiceToTTSVoice);
  }

  async generateSpeech(options: GenerateSpeechOptions): Promise<GenerateSpeechResult> {
    const { text, voiceId, speed = 1.0 } = options;

    const modelId = speed !== 1.0 ? ELEVENLABS_TURBO_MODEL : ELEVENLABS_TTS_MODEL;

    const body: Record<string, unknown> = {
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    };

    if (speed !== 1.0 && modelId !== ELEVENLABS_TTS_MODEL) {
      (body.voice_settings as Record<string, unknown>).speed = speed;
    }

    const res = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        [ELEVENLABS_API_HEADER]: this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errMsg = `ElevenLabs TTS error ${res.status}`;
      try {
        const errBody = await res.json();
        const detail = errBody?.detail?.message || errBody?.detail || errBody?.message || JSON.stringify(errBody);
        errMsg = `ElevenLabs ${res.status}: ${detail}`;
      } catch {
        const errText = await res.text().catch(() => '');
        if (errText) errMsg = `ElevenLabs ${res.status}: ${errText}`;
      }
      throw new Error(errMsg);
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      fileExtension: 'mp3',
      source: 'elevenlabs',
    };
  }

  async generatePreview(voiceId: string, text: string): Promise<GenerateSpeechResult> {
    return this.generateSpeech({ text, voiceId, speed: 1.0 });
  }

  // ElevenLabs Instant Voice Cloning
  async cloneVoice(audioFile: Blob | File, name: string, description?: string): Promise<string> {
    const form = new FormData();
    form.append('name', name);
    if (description) form.append('description', description);
    form.append('files', audioFile, 'voice_sample.mp3');

    const res = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
      method: 'POST',
      headers: { [ELEVENLABS_API_HEADER]: this.apiKey },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`ElevenLabs clone error ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (!data.voice_id) throw new Error('ElevenLabs clone: no voice_id returned');
    return data.voice_id;
  }
}
