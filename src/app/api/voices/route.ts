// ============================================================================
// GET /api/voices?provider=gemini|elevenlabs
// Returns voice list for the given provider — ElevenLabs voices fetched live
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getProvider, ProviderName } from '@/lib/tts/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = (searchParams.get('provider') || 'gemini') as ProviderName;

  if (provider !== 'gemini' && provider !== 'elevenlabs') {
    return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const p = getProvider(provider);
    const voices = await p.getVoices();
    return NextResponse.json({ success: true, voices, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch voices';
    console.error('[/api/voices]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
