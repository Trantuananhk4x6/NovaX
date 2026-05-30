// ============================================================================
// POST /api/voices/preview
// Generates a voice preview and caches to DB + /public/audio.
// First call → generate + save. Subsequent calls → serve cached URL.
// Shared cache: all users share the same preview for each voiceId.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getProvider, ProviderName } from '@/lib/tts/providers';

export const dynamic = 'force-dynamic';

// Gemini voice IDs follow our short pattern: {lang}-{name}
const GEMINI_ID_PATTERN = /^(vi|en|es|ru|ja|ko|fr|de|zh|th)-[a-z]+$/;

function detectProvider(voiceId: string, hint?: string): ProviderName {
  if (hint === 'elevenlabs') return 'elevenlabs';
  if (hint === 'gemini') return 'gemini';
  // Gemini IDs are short with dash prefix
  if (GEMINI_ID_PATTERN.test(voiceId)) return 'gemini';
  // ElevenLabs IDs are long alphanumeric
  return 'elevenlabs';
}

const PREVIEW_TEXTS: Record<string, string> = {
  'vi-VN': 'Xin chào! Đây là giọng nói của tôi. Rất vui được gặp bạn hôm nay.',
  'en-US': 'Hello! This is my voice. Nice to meet you today.',
  'es-ES': '¡Hola! Esta es mi voz. Es un placer conocerte hoy.',
  'ru-RU': 'Привет! Это мой голос. Рад познакомиться с тобой сегодня.',
  'ja-JP': 'こんにちは！これは私の声です。今日はお会いできて光栄です。',
  'ko-KR': '안녕하세요! 이것은 제 목소리입니다. 오늘 만나서 반갑습니다.',
  'fr-FR': "Bonjour! C'est ma voix. Ravi de vous rencontrer aujourd'hui.",
  'de-DE': 'Hallo! Das ist meine Stimme. Schön, Sie heute zu treffen.',
  'zh-CN': '你好！这是我的声音。很高兴今天认识你。',
  'th-TH': 'สวัสดี! นี่คือเสียงของฉัน ยินดีที่ได้รู้จักคุณวันนี้',
};

async function getCachedPreview(voiceId: string, provider: string): Promise<string | null> {
  try {
    const { db } = await import('@/db');
    const { voicePreviews } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const rows = await db
      .select({ audioUrl: voicePreviews.audioUrl })
      .from(voicePreviews)
      .where(and(eq(voicePreviews.voiceId, voiceId), eq(voicePreviews.provider, provider)))
      .limit(1);
    return rows[0]?.audioUrl ?? null;
  } catch {
    return null;
  }
}

async function savePreviewCache(id: string, provider: string, voiceId: string, previewText: string, audioUrl: string): Promise<void> {
  try {
    const { db } = await import('@/db');
    const { voicePreviews } = await import('@/db/schema');
    await db.insert(voicePreviews).values({ id, provider, voiceId, previewText, audioUrl });
  } catch {
    // Migration not run yet — skip
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, provider: providerHint, languageCode = 'vi-VN' } = body as {
      voiceId: string;
      provider?: string;
      languageCode?: string;
    };

    if (!voiceId) {
      return NextResponse.json({ success: false, error: 'voiceId is required' }, { status: 400 });
    }

    const provider = detectProvider(voiceId, providerHint);

    // Check DB cache first (shared across all users)
    const cached = await getCachedPreview(voiceId, provider);
    if (cached) {
      return NextResponse.json({ success: true, audioUrl: cached, cached: true });
    }

    // Generate preview
    const previewText = PREVIEW_TEXTS[languageCode] || PREVIEW_TEXTS['en-US'];
    const p = getProvider(provider);
    const result = await p.generatePreview(voiceId, previewText);

    // Persist to /public/audio
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true });

    const safeId = voiceId.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    const filename = `preview_${provider}_${safeId}_${Date.now()}.${result.fileExtension}`;
    await writeFile(path.join(audioDir, filename), result.audioBuffer);
    const audioUrl = `/audio/${filename}`;

    // Save to DB (non-blocking)
    const cacheId = `prev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    void savePreviewCache(cacheId, provider, voiceId, previewText, audioUrl);

    return NextResponse.json({ success: true, audioUrl, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Preview generation failed';
    console.error('[/api/voices/preview]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
