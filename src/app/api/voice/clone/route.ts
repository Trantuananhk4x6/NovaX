// ============================================================================
// Real Voice Clone API Route (Fish Audio)
// Creates a custom cloned voice via Fish Audio API
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

    const fishAudioApiKey = process.env.FISH_AUDIO_API_KEY;
    
    // If no key is set, fallback to mock to prevent crashing
    if (!fishAudioApiKey || fishAudioApiKey.trim() === '') {
      console.warn('No FISH_AUDIO_API_KEY found, falling back to mock clone');
      const delay = 3000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      const voiceId = `custom_${Date.now().toString(36)}`;
      
      const newVoice = {
        id: voiceId,
        name: voiceName,
        label: `${voiceName} - Tùy chỉnh`,
        countryCode: languageCode?.split('-')[1] || 'VN',
        languageCode: languageCode || 'vi-VN',
        category: category || 'custom',
        gender: 'neutral' as const,
        description: voiceDescription || `Giọng nói tùy chỉnh: ${voiceName}`,
        avatarColors: ['#8b5cf6', '#7c3aed'] as [string, string],
        isCustom: true,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        voice: newVoice,
        timestamp: new Date().toISOString(),
        message: `Giọng nói "${voiceName}" đã được tạo thành công (Chế độ giả lập)!`,
      });
    }

    // Prepare FormData for Fish Audio
    const fishAudioFormData = new FormData();
    fishAudioFormData.append('title', voiceName);
    fishAudioFormData.append('type', 'tts');
    fishAudioFormData.append('train_mode', 'fast');
    fishAudioFormData.append('visibility', 'private');
    // Using 'voices' as expected by Fish Audio
    fishAudioFormData.append('voices', audioFile);
    
    if (voiceDescription) {
      fishAudioFormData.append('description', voiceDescription);
    }

    // Call Fish Audio Create Model API
    const response = await fetch('https://api.fish.audio/model', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fishAudioApiKey}`,
      },
      body: fishAudioFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fish Audio Error:', response.status, errorText);
      try { require('fs').appendFileSync('clone-error.log', `[${new Date().toISOString()}] Fish Audio API Error: ${response.status} - ${errorText}\n`); } catch(e){}
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi từ Fish Audio: ${response.status} - ${errorText}`,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    // Fish Audio typically returns the model ID in the response (e.g., data._id or data.id)
    const voiceId = data._id || data.id;

    if (!voiceId) {
       console.error('Fish Audio Error: No voice ID returned', data);
       return NextResponse.json(
        {
          success: false,
          error: `Lỗi từ Fish Audio: Không nhận được ID giọng nói.`,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

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
      id: voiceId, // Save the REAL Fish Audio reference ID
      name: voiceName,
      label: `${voiceName} - Tùy chỉnh (Fish Audio)`,
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
      message: `Giọng nói "${voiceName}" đã được nhân bản thành công qua Fish Audio!`,
    });
  } catch (error) {
    console.error('Clone Error:', error);
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
