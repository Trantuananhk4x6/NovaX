// ============================================================================
// TTS Generate API Route — Real Gemini Flash TTS Integration
// Calls Google AI Studio's Gemini Flash TTS to generate real audio
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const TTS_MODEL = 'gemini-3.1-flash-tts-preview';

// Map voice IDs to Gemini voice names
const VOICE_MAP: Record<string, string> = {
  // Vietnamese (Strict Gemini 5 Voices)
  'vi-aoede': 'Aoede',
  'vi-kore': 'Kore',
  'vi-charon': 'Charon',
  'vi-fenrir': 'Fenrir',
  'vi-puck': 'Puck',
  // English
  'en-james': 'Charon',
  'en-sarah': 'Leda',
  'en-michael': 'Puck',
  'en-emma': 'Zephyr',
  'en-david': 'Kore',
  'en-olivia': 'Aoede',
  // Spanish
  'es-animals': 'Puck',
  'es-tbn-dl': 'Kore',
  'es-carmen': 'Leda',
  'es-pablo': 'Charon',
  // Russian
  'ru-khao': 'Puck',
  'ru-natasha': 'Leda',
  'ru-dmitri': 'Charon',
  'ru-anna': 'Aoede',
  // Japanese
  'ja-yuki': 'Leda',
  'ja-takeshi': 'Puck',
  'ja-sakura': 'Zephyr',
  'ja-kenji': 'Charon',
  // Korean
  'ko-soyeon': 'Leda',
  'ko-junhyeok': 'Puck',
  'ko-minji': 'Zephyr',
  'ko-hyunwoo': 'Kore',
  // French
  'fr-jacques': 'Charon',
  'fr-chloe': 'Leda',
  'fr-philippe': 'Puck',
  'fr-amelie': 'Aoede',
  // Science
  'en-science': 'Kore',
  'es-science': 'Leda',
};

// Language code mapping for Gemini
const LANGUAGE_MAP: Record<string, string> = {
  'vi-VN': 'vi-VN',
  'en-US': 'en-US',
  'es-ES': 'es-ES',
  'ru-RU': 'ru-RU',
  'ja-JP': 'ja-JP',
  'ko-KR': 'ko-KR',
  'fr-FR': 'fr-FR',
  'zh-CN': 'zh-CN',
  'de-DE': 'de-DE',
  'th-TH': 'th-TH',
};

function addWavHeader(pcmData: Buffer, sampleRate: number, numChannels: number): Buffer {
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

export async function POST(request: NextRequest) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const body = await request.json();
    const { text, voiceId, speed, languageCode, filePrefix } = body;

    // Validate required fields
    if (!text || !voiceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu trường bắt buộc: text và voiceId.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chưa cấu hình GEMINI_API_KEY trên server. Vui lòng khởi động lại server.',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Get Gemini voice name from our voice mapping
    const geminiVoice = VOICE_MAP[voiceId] || 'Kore';
    const geminiLang = LANGUAGE_MAP[languageCode] || 'vi-VN';

    // Strip SSML tags for plain text (Gemini TTS prefers clean text)
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Build Gemini TTS request
    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: cleanText,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: geminiVoice,
            },
          },
        },
      },
    };

    // Call Gemini TTS API
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
      cache: 'no-store'
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('Gemini TTS Error:', geminiResponse.status, errorBody);
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi từ Gemini TTS API: ${geminiResponse.status}`,
          details: errorBody,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract audio data from response
    const candidate = geminiData?.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (part: { inlineData?: { mimeType?: string; data?: string } }) =>
        part.inlineData?.mimeType?.startsWith('audio/')
    );

    if (!audioPart?.inlineData?.data) {
      console.error('No audio data in Gemini response:', JSON.stringify(geminiData).slice(0, 500));
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini TTS không trả về dữ liệu audio. Vui lòng thử lại.',
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    const audioBase64 = audioPart.inlineData.data;
    const audioMime = audioPart.inlineData.mimeType || 'audio/l16';
    let audioBuffer = Buffer.from(audioBase64, 'base64');

    // If Gemini returns raw PCM audio (l16), we must add a WAV header
    // so the browser's <audio> element can parse and play it (fixing the 0:00 bug)
    if (audioMime.includes('audio/l16')) {
      // Gemini TTS usually returns 24000Hz, 1 channel for audio/l16
      audioBuffer = addWavHeader(audioBuffer, 24000, 1);
    }

    // Save to public/audio directory
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const generationId = `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${filePrefix || 'voice_output'}_${generationId}.wav`;
    const filepath = path.join(audioDir, filename);

    await writeFile(filepath, audioBuffer);

    // Calculate approximate duration
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const baseDuration = (wordCount / 150) * 60;
    const adjustedDuration = baseDuration / (speed || 1.0);

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      duration: Math.round(adjustedDuration),
      fileSize: audioBuffer.length,
      generationId,
      timestamp: new Date().toISOString(),
      metadata: {
        voiceId,
        geminiVoice,
        speed,
        languageCode: geminiLang,
        filePrefix,
        charCount: cleanText.length,
        wordCount,
      },
    });
  } catch (err) {
    console.error('TTS Generate Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi server nội bộ khi tạo giọng nói.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
