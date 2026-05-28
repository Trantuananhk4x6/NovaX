// ============================================================================
// TTS Merge API — Merges multiple audio segments with silence into one file
// Used by YouTube Script Studio to combine multi-voice segments
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

export const dynamic = 'force-dynamic';

interface MergeSegment {
  audioUrl: string;   // relative URL like /audio/filename.wav
  pauseBefore: number; // seconds of silence to insert BEFORE this segment
}

/**
 * Generate PCM silence buffer for a given duration
 * @param durationSeconds  seconds of silence
 * @param sampleRate       samples per second (default 24000 to match Gemini output)
 * @param numChannels      number of channels (default 1 = mono)
 */
function generateSilence(durationSeconds: number, sampleRate = 24000, numChannels = 1): Buffer {
  const numSamples = Math.round(durationSeconds * sampleRate * numChannels);
  return Buffer.alloc(numSamples * 2, 0); // 16-bit PCM = 2 bytes per sample
}

/**
 * Add a 44-byte WAV header to raw PCM data
 */
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
  header.writeUInt16LE(1, 20);       // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);      // 16-bit depth
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Strip WAV header from a WAV buffer, returning only raw PCM data
 * Handles standard 44-byte and extended headers
 */
function stripWavHeader(wavBuffer: Buffer): { pcm: Buffer; sampleRate: number; channels: number } {
  // Verify RIFF header
  if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
    // Not a WAV file — treat entire buffer as raw PCM at 24kHz mono
    return { pcm: wavBuffer, sampleRate: 24000, channels: 1 };
  }

  const sampleRate = wavBuffer.readUInt32LE(24);
  const channels = wavBuffer.readUInt16LE(22);

  // Find the 'data' chunk offset (standard is 44 but can vary)
  let dataOffset = 44;
  for (let i = 12; i < Math.min(wavBuffer.length - 8, 256); i += 1) {
    if (wavBuffer.toString('ascii', i, i + 4) === 'data') {
      dataOffset = i + 8;
      break;
    }
  }

  return {
    pcm: wavBuffer.slice(dataOffset),
    sampleRate,
    channels,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segments, filePrefix }: { segments: MergeSegment[]; filePrefix?: string } = body;

    if (!segments || segments.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có segments để ghép.' }, { status: 400 });
    }

    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Accumulate PCM buffers for all segments + silence gaps
    const pcmParts: Buffer[] = [];
    let sampleRate = 24000;
    let channels = 1;

    for (const seg of segments) {
      // 1. Add silence before this segment (if requested)
      if (seg.pauseBefore > 0) {
        const silence = generateSilence(seg.pauseBefore, sampleRate, channels);
        pcmParts.push(silence);
      }

      // 2. Read the audio file for this segment
      const relativeUrl = seg.audioUrl; // e.g. /audio/voice_output_gen_xxx.wav
      const localPath = path.join(process.cwd(), 'public', relativeUrl);

      if (!existsSync(localPath)) {
        console.warn(`Segment audio not found: ${localPath}`);
        continue;
      }

      const fileBuffer = await readFile(localPath);
      const { pcm, sampleRate: sr, channels: ch } = stripWavHeader(fileBuffer);

      // Use the first segment's format as the canonical format
      if (pcmParts.length === 0 || (sr > 0 && ch > 0)) {
        sampleRate = sr;
        channels = ch;
      }

      pcmParts.push(pcm);
    }

    if (pcmParts.length === 0) {
      return NextResponse.json({ success: false, error: 'Không đọc được dữ liệu audio.' }, { status: 500 });
    }

    // Combine all PCM parts
    const mergedPcm = Buffer.concat(pcmParts);
    const mergedWav = addWavHeader(mergedPcm, sampleRate, channels);

    // Save merged file
    const generationId = `merge_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${filePrefix || 'youtube_audio'}_${generationId}.wav`;
    const filepath = path.join(audioDir, filename);

    await writeFile(filepath, mergedWav);

    // Estimate duration
    const totalSamples = mergedPcm.length / (2 * channels);
    const durationSeconds = Math.round(totalSamples / sampleRate);

    return NextResponse.json({
      success: true,
      audioUrl: `/audio/${filename}`,
      duration: durationSeconds,
      fileSize: mergedWav.length,
      segmentCount: segments.length,
      generationId,
    });
  } catch (err) {
    console.error('TTS Merge Error:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi ghép audio.' },
      { status: 500 }
    );
  }
}
