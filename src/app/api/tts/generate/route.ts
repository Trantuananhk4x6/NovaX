// ============================================================================
// POST /api/tts/generate
// Unified TTS generation supporting Gemini and ElevenLabs providers.
// Auto-detects provider from voiceId prefix or explicit provider field.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getProvider, ProviderName } from '@/lib/tts/providers';

export const dynamic = 'force-dynamic';

// ElevenLabs voice IDs are long UUIDs; Gemini voice IDs use our short prefixes
function detectProvider(voiceId: string, explicitProvider?: string): ProviderName {
  if (explicitProvider === 'elevenlabs') return 'elevenlabs';
  if (explicitProvider === 'gemini') return 'gemini';
  // ElevenLabs voice IDs are UUID-like (length > 20, no dashes in our format)
  if (voiceId.length > 20 && !voiceId.includes('-')) return 'elevenlabs';
  // UUIDs with hyphens that don't match our short vi-/en-/es- prefix pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(voiceId)) return 'elevenlabs';
  return 'gemini';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, speed = 1.0, languageCode = 'vi-VN', filePrefix, provider: explicitProvider } = body as {
      text: string;
      voiceId: string;
      speed?: number;
      languageCode?: string;
      filePrefix?: string;
      provider?: string;
    };

    if (!text || !voiceId) {
      return NextResponse.json({ success: false, error: 'Thiếu text hoặc voiceId.' }, { status: 400 });
    }

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const providerName = detectProvider(voiceId, explicitProvider);

    const p = getProvider(providerName);
    const result = await p.generateSpeech({ text: cleanText, voiceId, speed, languageCode });

    // Save audio to public/audio
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });

    const generationId = `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${filePrefix || 'voice_output'}_${generationId}.${result.fileExtension}`;
    const filepath = path.join(audioDir, filename);
    await writeFile(filepath, result.audioBuffer);

    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const duration = Math.round((wordCount / 150) * 60 / speed);

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      duration,
      fileSize: result.audioBuffer.length,
      generationId,
      timestamp: new Date().toISOString(),
      metadata: { voiceId, speed, languageCode, filePrefix, charCount: cleanText.length, wordCount, source: result.source },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[/api/tts/generate]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
