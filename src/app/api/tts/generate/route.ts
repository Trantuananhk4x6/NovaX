// ============================================================================
// TTS Generate API Route — Multi-Engine (Kokoro + CosyVoice2)
// Routes to the correct engine based on voice catalog metadata.
// Fish Audio Cloud for user-cloned voices (optional).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { GEMINI_VOICE_NAME_MAP, VOICE_ENGINE_MAP } from '@/constants/voices';

export const dynamic = 'force-dynamic';

const LOCAL_TTS_URL = process.env.KOKORO_URL ?? process.env.FISH_SPEECH_URL ?? 'http://localhost:8080/tts';

// ─────────────────────────────────────────────────────────────────────────────
// Resolve voiceId → { engine, voiceName }
// ─────────────────────────────────────────────────────────────────────────────
function resolveVoice(voiceId: string): { engine: string; voiceName: string } {
  // 1. Static catalog lookup (Kokoro + built-in CosyVoice2 voices)
  if (VOICE_ENGINE_MAP[voiceId]) {
    return {
      engine:    VOICE_ENGINE_MAP[voiceId],
      voiceName: GEMINI_VOICE_NAME_MAP[voiceId] ?? voiceId,
    };
  }

  // 2. Custom cloned voices — always CosyVoice2
  //    clone_* format set by POST /tts/clone in the FastAPI service
  if (voiceId.startsWith('clone_')) {
    return { engine: 'cosyvoice2', voiceName: voiceId };
  }

  // 3. Fallback: default to Kokoro for unknown IDs
  return { engine: 'kokoro', voiceName: voiceId };
}

// ─────────────────────────────────────────────────────────────────────────────
interface TTSSuccessResponse {
  success: true;
  audioUrl: string;
  duration: number;
  fileSize: number;
  generationId: string;
  timestamp: string;
  metadata: {
    voiceId: string;
    engine: string;
    voiceName: string;
    speed: number;
    languageCode?: string;
    filePrefix?: string;
    charCount: number;
    wordCount: number;
  };
}
interface TTSErrorResponse { success: false; error: string; timestamp: string; }
type TTSResponse = TTSSuccessResponse | TTSErrorResponse;

function errorJson(msg: string, status: number) {
  return NextResponse.json<TTSErrorResponse>(
    { success: false, error: msg, timestamp: new Date().toISOString() },
    { status }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse<TTSResponse>> {
  try {
    const body = await request.json();
    const { text, voiceId, speed = 1.0, languageCode, filePrefix } = body as {
      text?: string; voiceId?: string; speed?: number;
      languageCode?: string; filePrefix?: string;
    };

    if (!text || !voiceId) return errorJson('Thiếu text hoặc voiceId.', 400);

    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return errorJson('text rỗng.', 400);

    let audioBuffer: Buffer;
    let fileExtension = 'wav';
    let engine = 'kokoro';

    // ── Fish Audio cloud — long hex IDs are Fish Audio cloned voices ─────────
    const FISH_KEY = process.env.FISH_AUDIO_API_KEY;
    const isFishAudio = FISH_KEY?.trim() && voiceId.length > 20
      && !voiceId.startsWith('en-') && !voiceId.startsWith('cv2-')
      && !voiceId.startsWith('af_') && !voiceId.startsWith('am_');

    if (isFishAudio) {
      const res = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${FISH_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, reference_id: voiceId, format: 'mp3' }),
      });
      if (!res.ok) {
        const err = await res.text();
        if (res.status === 402) return errorJson('Fish Audio credits insufficient.', 402);
        if (res.status === 401) return errorJson('Fish Audio API key invalid.', 401);
        return errorJson(`Fish Audio error: ${res.status}`, 502);
      }
      audioBuffer = Buffer.from(await res.arrayBuffer());
      fileExtension = 'mp3';
      engine = 'fishaudio';

    } else {
      // ── Local engines (Kokoro or CosyVoice2) ─────────────────────────────
      const { engine: resolvedEngine, voiceName } = resolveVoice(voiceId);
      engine = resolvedEngine;

      const payload = { text: cleanText, voice: voiceName, engine: resolvedEngine, speed: speed ?? 1.0 };

      let res: Response;
      try {
        res = await fetch(LOCAL_TTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(180_000),  // CosyVoice2 can be slower
        });
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.error('[TTS] Cannot reach TTS service:', msg);
        return errorJson(
          `Cannot connect to TTS service (${LOCAL_TTS_URL}). Run start_tts.sh in WSL2.`,
          503
        );
      }

      if (!res.ok) {
        const err = await res.text();
        console.error('[TTS] Engine error:', res.status, err.slice(0, 200));
        if (res.status === 400) return errorJson(`Voice '${voiceName}' not found in engine '${resolvedEngine}'.`, 400);
        if (res.status === 503) return errorJson(`Engine '${resolvedEngine}' not ready.`, 503);
        return errorJson(`TTS engine error ${res.status}: ${err.slice(0, 100)}`, 502);
      }

      audioBuffer = Buffer.from(await res.arrayBuffer());
    }

    // ── Save file ─────────────────────────────────────────────────────────────
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });

    const generationId = `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const filename     = `${filePrefix ?? 'tts'}_${generationId}.${fileExtension}`;
    await writeFile(path.join(audioDir, filename), audioBuffer);

    const wordCount     = cleanText.split(/\s+/).filter(Boolean).length;
    const estimatedSecs = Math.round((wordCount / 150) * 60 / (speed ?? 1.0));
    const { voiceName } = resolveVoice(voiceId);

    console.log(`[TTS] ✓ engine=${engine} voice=${voiceName} chars=${cleanText.length} size=${audioBuffer.length}B`);

    return NextResponse.json<TTSSuccessResponse>({
      success: true,
      audioUrl: `/audio/${filename}`,
      duration: estimatedSecs,
      fileSize: audioBuffer.length,
      generationId,
      timestamp: new Date().toISOString(),
      metadata: { voiceId, engine, voiceName, speed: speed ?? 1.0, languageCode, filePrefix, charCount: cleanText.length, wordCount },
    });

  } catch (err) {
    console.error('[TTS] Unexpected error:', err);
    return errorJson(err instanceof Error ? err.message : 'Internal error.', 500);
  }
}
