// ============================================================================
// POST /api/voice/clone
// Clones a voice using ElevenLabs Instant Voice Cloning (primary)
// Falls back to Fish Audio if ElevenLabs key not available
// Requires: audio file ≥ 10 seconds, voice name
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ELEVENLABS_API_BASE, ELEVENLABS_API_HEADER } from '@/ModelCall';

const GRADIENT_PAIRS: [string, string][] = [
  ['#f97316', '#ea580c'], ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#f43f5e'], ['#10b981', '#059669'],
  ['#3b82f6', '#1d4ed8'], ['#f43f5e', '#e11d48'],
];

function randomGradient(): [string, string] {
  return GRADIENT_PAIRS[Math.floor(Math.random() * GRADIENT_PAIRS.length)];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const voiceName = formData.get('voiceName') as string;
    const voiceDescription = (formData.get('voiceDescription') as string) || '';
    const category = (formData.get('category') as string) || 'custom';
    const languageCode = (formData.get('languageCode') as string) || 'vi-VN';
    const audioFile = formData.get('audio') as File;

    if (!audioFile || !voiceName?.trim()) {
      return NextResponse.json({ success: false, error: 'Thiếu file âm thanh hoặc tên giọng nói.' }, { status: 400 });
    }

    const elevenLabsKey = process.env.ELEVENLABS_API_KEY?.trim();
    const fishAudioKey = process.env.FISH_AUDIO_API_KEY?.trim();

    // ── ElevenLabs Instant Voice Cloning (primary) ─────────────────────────
    if (elevenLabsKey) {
      const elForm = new FormData();
      elForm.append('name', voiceName.trim());
      if (voiceDescription) elForm.append('description', voiceDescription);
      // ElevenLabs requires the audio files array
      elForm.append('files', audioFile, audioFile.name || 'voice_sample.mp3');

      const res = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
        method: 'POST',
        headers: { [ELEVENLABS_API_HEADER]: elevenLabsKey },
        body: elForm,
      });

      if (!res.ok) {
        let errMsg = `ElevenLabs clone error ${res.status}`;
        try {
          const errBody = await res.json();
          errMsg = errBody?.detail?.message || errBody?.message || JSON.stringify(errBody);
        } catch {
          errMsg = await res.text().catch(() => errMsg);
        }
        // If ElevenLabs fails, try Fish Audio next
        console.warn('ElevenLabs clone failed:', errMsg, '— trying Fish Audio');
        if (!fishAudioKey) {
          return NextResponse.json({ success: false, error: `Lỗi clone giọng nói: ${errMsg}` }, { status: 502 });
        }
      } else {
        const data = await res.json();
        const voiceId = data.voice_id;
        if (!voiceId) {
          return NextResponse.json({ success: false, error: 'ElevenLabs không trả về voice_id.' }, { status: 502 });
        }

        const countryCode = languageCode.split('-')[1] || 'VN';
        return NextResponse.json({
          success: true,
          voice: {
            id: voiceId,
            name: voiceName.trim(),
            label: `${voiceName.trim()} - Giọng clone`,
            countryCode,
            languageCode,
            category,
            gender: 'neutral' as const,
            description: voiceDescription || `Giọng nói clone: ${voiceName.trim()}`,
            avatarColors: randomGradient(),
            isCustom: true,
            provider: 'elevenlabs',
            createdAt: new Date().toISOString(),
          },
          message: `Giọng nói "${voiceName}" đã được clone thành công qua ElevenLabs!`,
        });
      }
    }

    // ── Fish Audio fallback ────────────────────────────────────────────────
    if (fishAudioKey) {
      const fishForm = new FormData();
      fishForm.append('title', voiceName.trim());
      fishForm.append('type', 'tts');
      fishForm.append('train_mode', 'fast');
      fishForm.append('visibility', 'private');
      fishForm.append('voices', audioFile);
      if (voiceDescription) fishForm.append('description', voiceDescription);

      const res = await fetch('https://api.fish.audio/model', {
        method: 'POST',
        headers: { Authorization: `Bearer ${fishAudioKey}` },
        body: fishForm,
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: `Fish Audio error ${res.status}: ${errText}` }, { status: 502 });
      }

      const data = await res.json();
      const voiceId = data._id || data.id;
      if (!voiceId) {
        return NextResponse.json({ success: false, error: 'Fish Audio không trả về voice ID.' }, { status: 502 });
      }

      const countryCode = languageCode.split('-')[1] || 'VN';
      return NextResponse.json({
        success: true,
        voice: {
          id: voiceId,
          name: voiceName.trim(),
          label: `${voiceName.trim()} - Clone (Fish Audio)`,
          countryCode,
          languageCode,
          category,
          gender: 'neutral' as const,
          description: voiceDescription || `Giọng nói clone: ${voiceName.trim()}`,
          avatarColors: randomGradient(),
          isCustom: true,
          provider: 'fishaudio',
          createdAt: new Date().toISOString(),
        },
        message: `Giọng nói "${voiceName}" đã được clone thành công qua Fish Audio!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Chưa cấu hình API key cho voice cloning.' }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi server khi clone giọng nói.';
    console.error('[/api/voice/clone]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
