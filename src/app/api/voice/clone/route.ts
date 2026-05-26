// ============================================================================
// Mock Voice Clone API Route
// Simulates AI voice cloning — returns a new voice object after delay
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const voiceName = formData.get('voiceName') as string;
    const voiceDescription = formData.get('voiceDescription') as string;
    const category = formData.get('category') as string;
    const languageCode = formData.get('languageCode') as string;
    const audioFile = formData.get('audio') as File;

    // Validate
    if (!audioFile || !voiceName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu file âm thanh hoặc tên giọng nói.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Simulate AI training delay (3–5 seconds)
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Generate a new voice object
    const voiceId = `custom_${Date.now().toString(36)}`;

    // Random avatar gradient colors for the new voice
    const gradientPairs = [
      ['#f97316', '#ea580c'],
      ['#8b5cf6', '#7c3aed'],
      ['#ec4899', '#f43f5e'],
      ['#10b981', '#059669'],
      ['#3b82f6', '#1d4ed8'],
      ['#f43f5e', '#e11d48'],
    ];
    const randomGradient = gradientPairs[Math.floor(Math.random() * gradientPairs.length)];

    const newVoice = {
      id: voiceId,
      name: voiceName,
      label: `${voiceName} - Tùy chỉnh`,
      countryCode: languageCode?.split('-')[1] || 'VN',
      languageCode: languageCode || 'vi-VN',
      category: category || 'custom',
      gender: 'neutral' as const,
      description: voiceDescription || `Giọng nói tùy chỉnh: ${voiceName}`,
      avatarColors: randomGradient as [string, string],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      voice: newVoice,
      timestamp: new Date().toISOString(),
      message: `Giọng nói "${voiceName}" đã được tạo thành công!`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi server khi xử lý voice cloning.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
