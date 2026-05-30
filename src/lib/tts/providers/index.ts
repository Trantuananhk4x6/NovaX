// ============================================================================
// TTS Provider Factory
// ============================================================================

import { TTSProvider } from './base.provider';
import { ElevenLabsProvider } from './elevenlabs.provider';
import { GeminiProvider } from './gemini.provider';

export type ProviderName = 'gemini' | 'elevenlabs';

export function getProvider(name: ProviderName): TTSProvider {
  if (name === 'elevenlabs') {
    const key = process.env.ELEVENLABS_API_KEY?.trim();
    if (!key) throw new Error('ELEVENLABS_API_KEY not configured');
    return new ElevenLabsProvider(key);
  }
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  return new GeminiProvider(key);
}

export { ElevenLabsProvider, GeminiProvider };
export type { TTSProvider, TTSVoice, GenerateSpeechOptions, GenerateSpeechResult } from './base.provider';
