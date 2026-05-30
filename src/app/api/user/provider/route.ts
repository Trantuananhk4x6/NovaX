// ============================================================================
// GET/PUT /api/user/provider — Persist TTS provider preference per user
// Gracefully falls back if users table column hasn't been migrated yet.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await db.select({ ttsProvider: users.ttsProvider }).from(users).where(eq(users.id, userId)).limit(1);
    const provider = rows[0]?.ttsProvider || 'gemini';
    return NextResponse.json({ success: true, provider });
  } catch {
    // Column may not exist yet — return default
    return NextResponse.json({ success: true, provider: 'gemini' });
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { provider } = body as { provider: string };

  if (provider !== 'gemini' && provider !== 'elevenlabs') {
    return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
  }

  try {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      const { currentUser } = await import('@clerk/nextjs/server');
      const clerkUser = await currentUser();
      await db.insert(users).values({
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        ttsProvider: provider,
      });
    } else {
      await db.update(users).set({ ttsProvider: provider }).where(eq(users.id, userId));
    }
    return NextResponse.json({ success: true, provider });
  } catch {
    // Schema not migrated — preference is saved in localStorage only
    return NextResponse.json({ success: true, provider, note: 'saved locally only' });
  }
}
