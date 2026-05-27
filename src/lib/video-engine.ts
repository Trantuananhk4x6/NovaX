// ============================================================================
// Video Engine — Pure Logic Functions (Simulated AI)
// Layer 2 — No React dependencies. All AI features are simulated.
// ============================================================================

import {
  VideoScene,
  VideoAnalysis,
  VideoThemeId,
  MoodType,
  TransitionType,
  VideoSettings,
  TimelineTrack,
  TimelineClip,
  ThumbnailConcept,
  SEOSuggestion,
} from '@/types/video.types';
import { VIDEO_THEMES, SCENE_PRESETS } from '@/constants/video-constants';

/** Generate a unique ID */
export function generateVideoId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Audio Context Analysis (Simulated) ──────────────────

/**
 * Simulate AI analysis of audio content.
 * In production, this would call a speech-to-text API + NLP.
 */
export function simulateAudioAnalysis(
  audioDuration: number,
  fileName?: string
): VideoAnalysis {
  // Simulate keyword detection based on filename patterns
  const name = (fileName || '').toLowerCase();

  let mood: MoodType = 'calm';
  let keywords: string[] = [];
  let suggestedTheme: VideoThemeId = 'cinematic';
  let transcript = '';

  if (name.includes('tin') || name.includes('news')) {
    mood = 'serious';
    keywords = ['tin tức', 'cập nhật', 'thông tin', 'sự kiện'];
    suggestedTheme = 'news';
    transcript = 'Xin chào quý vị khán giả, hôm nay chúng ta sẽ cập nhật những tin tức mới nhất...';
  } else if (name.includes('game') || name.includes('gaming')) {
    mood = 'energetic';
    keywords = ['game', 'chơi game', 'review', 'gameplay'];
    suggestedTheme = 'anime';
    transcript = 'Yo các bạn, hôm nay mình sẽ review game mới nhất...';
  } else if (name.includes('hoc') || name.includes('learn') || name.includes('giao')) {
    mood = 'inspiring';
    keywords = ['học tập', 'kiến thức', 'bài học', 'giáo dục'];
    suggestedTheme = 'education';
    transcript = 'Chào mừng các bạn đến với bài học hôm nay...';
  } else if (name.includes('vlog') || name.includes('daily')) {
    mood = 'happy';
    keywords = ['vlog', 'cuộc sống', 'hàng ngày', 'chia sẻ'];
    suggestedTheme = 'vlog';
    transcript = 'Hello mọi người, hôm nay mình sẽ chia sẻ một ngày của mình...';
  } else if (name.includes('kinh') || name.includes('horror')) {
    mood = 'mysterious';
    keywords = ['kinh dị', 'bí ẩn', 'ma', 'rùng rợn'];
    suggestedTheme = 'horror';
    transcript = 'Câu chuyện hôm nay sẽ khiến bạn không dám tắt đèn...';
  } else {
    // Default: general content
    mood = 'calm';
    keywords = ['giới thiệu', 'nội dung', 'chia sẻ', 'thông tin', 'subscribe'];
    suggestedTheme = 'cinematic';
    transcript = 'Xin chào các bạn, chào mừng đến với kênh của mình. Hôm nay chúng ta sẽ cùng tìm hiểu về một chủ đề rất thú vị...';
  }

  const scenes = generateScenesFromAnalysis(keywords, mood, audioDuration, suggestedTheme);

  return {
    keywords,
    mood,
    moodConfidence: 0.85 + Math.random() * 0.1,
    suggestedTheme,
    suggestedScenes: scenes,
    transcript,
    summary: `Nội dung ${getMoodLabel(mood)} với ${keywords.length} chủ đề chính. Thời lượng ${formatSeconds(audioDuration)}.`,
    detectedLanguage: 'vi-VN',
    sourceDuration: audioDuration,
  };
}

// ── Video Context Analysis (Simulated) ──────────────────

/**
 * Simulate AI analysis of video content.
 * In production, this would call a vision AI API.
 */
export function simulateVideoAnalysis(
  videoDuration: number,
  fileName?: string
): VideoAnalysis {
  const name = (fileName || '').toLowerCase();

  let mood: MoodType = 'calm';
  let keywords: string[] = [];
  let generatedScript = '';

  if (name.includes('travel') || name.includes('du-lich')) {
    mood = 'happy';
    keywords = ['du lịch', 'phong cảnh', 'khám phá', 'thiên nhiên'];
    generatedScript = 'Hãy cùng nhau khám phá vẻ đẹp tuyệt vời của điểm đến này. Phong cảnh nơi đây thật sự ngoạn mục với những dãy núi hùng vĩ và biển xanh trong vắt.';
  } else if (name.includes('cook') || name.includes('nau')) {
    mood = 'happy';
    keywords = ['nấu ăn', 'món ăn', 'công thức', 'nguyên liệu'];
    generatedScript = 'Hôm nay chúng ta sẽ cùng nhau thực hiện một món ăn vô cùng ngon miệng. Đầu tiên, hãy chuẩn bị các nguyên liệu cần thiết.';
  } else if (name.includes('review') || name.includes('danh-gia')) {
    mood = 'serious';
    keywords = ['đánh giá', 'review', 'sản phẩm', 'trải nghiệm'];
    generatedScript = 'Chào các bạn, hôm nay mình sẽ đánh giá chi tiết sản phẩm này. Sau một thời gian sử dụng, đây là những nhận xét của mình.';
  } else {
    mood = 'calm';
    keywords = ['video', 'nội dung', 'hình ảnh', 'chuyển động'];
    generatedScript = 'Đây là một video với nhiều nội dung thú vị. Hãy cùng theo dõi để khám phá những điều đặc biệt trong video này.';
  }

  return {
    keywords,
    mood,
    moodConfidence: 0.82 + Math.random() * 0.12,
    suggestedTheme: 'cinematic',
    suggestedScenes: [],
    generatedScript,
    summary: `Video ${getMoodLabel(mood)} với nội dung về ${keywords.slice(0, 3).join(', ')}. Thời lượng ${formatSeconds(videoDuration)}.`,
    detectedLanguage: 'vi-VN',
    sourceDuration: videoDuration,
  };
}

// ── Scene Generation ────────────────────────────────────

/**
 * Generate video scenes from analysis results.
 */
export function generateScenesFromAnalysis(
  keywords: string[],
  mood: MoodType,
  totalDuration: number,
  themeId: VideoThemeId
): VideoScene[] {
  const theme = VIDEO_THEMES.find(t => t.id === themeId) || VIDEO_THEMES[0];
  const scenes: VideoScene[] = [];
  const transitions: TransitionType[] = ['fade', 'slide-left', 'zoom-in', 'dissolve', 'blur'];

  // Always start with an intro scene
  scenes.push({
    id: generateVideoId(),
    order: 0,
    title: 'Intro',
    description: 'Màn hình mở đầu với logo và tiêu đề',
    duration: Math.min(4, totalDuration * 0.1),
    background: theme.gradient,
    textOverlay: '✨ Chào mừng bạn đến kênh',
    textSize: 'large',
    textPosition: 'center',
    transition: 'fade',
    transitionDuration: 800,
    keywords: ['intro', 'mở đầu'],
    icon: '🎬',
  });

  // Generate scenes based on keywords
  const sceneDuration = (totalDuration - 8) / Math.max(keywords.length, 1);

  keywords.forEach((keyword, index) => {
    const preset = SCENE_PRESETS.find(p => keyword.includes(p.keyword));
    const bg = preset?.background || getGradientForIndex(index);

    scenes.push({
      id: generateVideoId(),
      order: index + 1,
      title: preset?.title || capitalizeFirst(keyword),
      description: `Nội dung về: ${keyword}`,
      duration: Math.max(3, Math.min(sceneDuration, 10)),
      background: bg,
      textOverlay: capitalizeFirst(keyword),
      textSize: 'medium',
      textPosition: 'center',
      transition: transitions[index % transitions.length],
      transitionDuration: 600,
      keywords: [keyword],
      icon: preset?.icon || '📌',
    });
  });

  // Always end with outro
  scenes.push({
    id: generateVideoId(),
    order: scenes.length,
    title: 'Outro',
    description: 'Màn hình kết thúc — đăng ký kênh',
    duration: Math.min(4, totalDuration * 0.1),
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    textOverlay: '🔔 Đăng ký kênh & Nhấn chuông',
    textSize: 'large',
    textPosition: 'center',
    transition: 'fade',
    transitionDuration: 1000,
    keywords: ['outro', 'subscribe'],
    icon: '🔔',
  });

  return scenes;
}

// ── Timeline Generation ─────────────────────────────────

/**
 * Generate timeline tracks from scenes and audio.
 */
export function generateTimelineTracks(
  scenes: VideoScene[],
  audioDuration: number,
  hasAudio: boolean
): TimelineTrack[] {
  const tracks: TimelineTrack[] = [];

  // Video track
  let currentTime = 0;
  const videoClips: TimelineClip[] = scenes.map(scene => {
    const clip: TimelineClip = {
      id: `clip_${scene.id}`,
      trackId: 'track_video',
      startTime: currentTime,
      endTime: currentTime + scene.duration,
      label: scene.title,
      color: extractColorFromGradient(scene.background),
      sceneId: scene.id,
    };
    currentTime += scene.duration;
    return clip;
  });

  tracks.push({
    id: 'track_video',
    type: 'video',
    label: 'Video',
    color: '#8b5cf6',
    isMuted: false,
    isLocked: false,
    clips: videoClips,
  });

  // Audio track
  if (hasAudio) {
    tracks.push({
      id: 'track_audio',
      type: 'audio',
      label: 'Audio',
      color: '#06b6d4',
      isMuted: false,
      isLocked: false,
      clips: [{
        id: 'clip_main_audio',
        trackId: 'track_audio',
        startTime: 0,
        endTime: audioDuration,
        label: 'Main Audio',
        color: '#06b6d4',
      }],
    });
  }

  // Text/Subtitle track
  const textClips: TimelineClip[] = scenes
    .filter(s => s.textOverlay)
    .map(scene => {
      const videoClip = videoClips.find(c => c.sceneId === scene.id);
      return {
        id: `text_${scene.id}`,
        trackId: 'track_text',
        startTime: videoClip?.startTime || 0,
        endTime: videoClip?.endTime || scene.duration,
        label: scene.textOverlay || '',
        color: '#f97316',
      };
    });

  tracks.push({
    id: 'track_text',
    type: 'text',
    label: 'Phụ đề',
    color: '#f97316',
    isMuted: false,
    isLocked: false,
    clips: textClips,
  });

  return tracks;
}

// ── Export Size Estimation ───────────────────────────────

export function estimateExportSize(settings: VideoSettings, durationSeconds: number): string {
  const resMultiplier = settings.resolution === '4K' ? 4 : settings.resolution === '1080p' ? 2 : 1;
  const fpsMultiplier = settings.fps / 30;
  // Rough estimate: ~0.5MB per second at 720p 30fps
  const baseMBPerSecond = 0.5;
  const totalMB = durationSeconds * baseMBPerSecond * resMultiplier * fpsMultiplier;

  if (totalMB >= 1024) {
    return `${(totalMB / 1024).toFixed(1)} GB`;
  }
  return `${Math.round(totalMB)} MB`;
}

// ── Thumbnail Generation (Simulated) ────────────────────

export function generateThumbnailConcepts(title: string): ThumbnailConcept[] {
  return [
    {
      id: generateVideoId(),
      title: 'Bold Impact',
      style: 'bold-text',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      textOverlay: title.toUpperCase(),
      fontSize: 'large',
    },
    {
      id: generateVideoId(),
      title: 'Clean Minimal',
      style: 'minimal',
      gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      textOverlay: title,
      fontSize: 'medium',
    },
    {
      id: generateVideoId(),
      title: 'Neon Glow',
      style: 'bold-text',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      textOverlay: title,
      fontSize: 'large',
    },
    {
      id: generateVideoId(),
      title: 'Nature Fresh',
      style: 'minimal',
      gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
      textOverlay: title,
      fontSize: 'medium',
    },
  ];
}

// ── SEO Suggestions (Simulated) ─────────────────────────

export function generateSEOSuggestions(topic: string): SEOSuggestion[] {
  const base = topic.trim();
  return [
    {
      id: generateVideoId(),
      title: `${base} - Hướng dẫn chi tiết A-Z cho người mới bắt đầu`,
      description: `Trong video này, mình sẽ hướng dẫn chi tiết về ${base}. Đây là guide đầy đủ nhất dành cho người mới...\n\n⏰ Timeline:\n0:00 - Giới thiệu\n1:00 - Nội dung chính\n5:00 - Mẹo hay\n8:00 - Kết luận`,
      tags: [base, `${base} hướng dẫn`, `${base} cho người mới`, 'tutorial', 'hướng dẫn'],
      score: 92,
    },
    {
      id: generateVideoId(),
      title: `TOP 10 điều bạn PHẢI BIẾT về ${base} | Update mới nhất`,
      description: `Tổng hợp 10 điều quan trọng nhất về ${base} mà bạn không thể bỏ qua...`,
      tags: [base, `top ${base}`, `${base} mới nhất`, 'top 10', 'cập nhật'],
      score: 88,
    },
    {
      id: generateVideoId(),
      title: `${base} | Sự thật KHÔNG AI nói cho bạn biết`,
      description: `Khám phá những sự thật ít người biết về ${base}. Video này sẽ thay đổi cách bạn nhìn nhận...`,
      tags: [base, `sự thật ${base}`, `bí mật ${base}`, 'sự thật', 'khám phá'],
      score: 85,
    },
    {
      id: generateVideoId(),
      title: `Review ${base} SAU 30 ngày sử dụng — Có đáng tiền không?`,
      description: `Mình đã dùng ${base} suốt 30 ngày. Đây là review trung thực và chi tiết nhất...`,
      tags: [base, `review ${base}`, `đánh giá ${base}`, 'review', 'trải nghiệm'],
      score: 82,
    },
    {
      id: generateVideoId(),
      title: `Cách kiếm tiền với ${base} — Hướng dẫn MMO`,
      description: `Chia sẻ cách mình kiếm tiền online với ${base}. Ai cũng có thể làm được nếu biết cách...`,
      tags: [base, `kiếm tiền ${base}`, `mmo ${base}`, 'kiếm tiền online', 'mmo'],
      score: 79,
    },
  ];
}

// ── Helper Functions ────────────────────────────────────

function getMoodLabel(mood: MoodType): string {
  const labels: Record<MoodType, string> = {
    happy: 'vui vẻ',
    sad: 'buồn',
    energetic: 'sôi động',
    calm: 'bình tĩnh',
    dramatic: 'kịch tính',
    mysterious: 'bí ẩn',
    inspiring: 'truyền cảm hứng',
    funny: 'hài hước',
    serious: 'nghiêm túc',
    romantic: 'lãng mạn',
  };
  return labels[mood] || mood;
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getGradientForIndex(index: number): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  ];
  return gradients[index % gradients.length];
}

function extractColorFromGradient(gradient: string): string {
  const match = gradient.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#8b5cf6';
}
