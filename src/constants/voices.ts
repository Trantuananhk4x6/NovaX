// ============================================================================
// Voice Catalog — Multi-Engine (Kokoro-82M + CosyVoice2-0.5B)
// ============================================================================
//
// engine: "kokoro"     — Kokoro-82M (English + multilingual via espeak)
// engine: "cosyvoice2" — CosyVoice2-0.5B (Vietnamese native, voice cloning)
//
// geminiVoiceName = engine-internal voice ID:
//   kokoro:     Kokoro .pt file stem, e.g. "af_bella"
//   cosyvoice2: WAV reference filename stem, e.g. "linh_truyen"
//
// route.ts reads VOICE_ENGINE_MAP + GEMINI_VOICE_NAME_MAP to build the
// payload { engine, voice } sent to POST /tts.
// ============================================================================

import { Voice, Country } from '@/types/voice.types';

export const COUNTRIES: Country[] = [
  { code: 'VN', name: 'Việt Nam',     flag: '🇻🇳', languageCode: 'vi-VN', languageName: 'Tiếng Việt'    },
  { code: 'US', name: 'English (US)', flag: '🇺🇸', languageCode: 'en-US', languageName: 'English (US)'  },
  { code: 'GB', name: 'English (UK)', flag: '🇬🇧', languageCode: 'en-GB', languageName: 'English (UK)'  },
  { code: 'JP', name: '日本語',        flag: '🇯🇵', languageCode: 'ja-JP', languageName: '日本語'          },
  { code: 'CN', name: '中文',          flag: '🇨🇳', languageCode: 'zh-CN', languageName: '中文'            },
  { code: 'FR', name: 'Français',     flag: '🇫🇷', languageCode: 'fr-FR', languageName: 'Français'       },
  { code: 'ES', name: 'Español',      flag: '🇪🇸', languageCode: 'es-ES', languageName: 'Español'        },
  { code: 'DE', name: 'Deutsch',      flag: '🇩🇪', languageCode: 'de-DE', languageName: 'Deutsch'        },
  { code: 'IN', name: 'Hindi',        flag: '🇮🇳', languageCode: 'hi-IN', languageName: 'Hindi'          },
  { code: 'PT', name: 'Português',    flag: '🇧🇷', languageCode: 'pt-BR', languageName: 'Português (BR)' },
];

export const VOICE_CATALOG: Voice[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // COSYVOICE2 — Tiếng Việt Native (reference WAV cloning, natural prosody)
  // WAV files in ~/ai-narrator/voices/cosyvoice2/
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'cv2-vi-linh',
    name: 'Linh',
    label: 'Linh — Kể chuyện',
    countryCode: 'VN', languageCode: 'vi-VN',
    category: 'narration', gender: 'female',
    description: '[CosyVoice2] Nữ, nhẹ nhàng diễn cảm. Kể chuyện, sách nói tiếng Việt. [88K uses]',
    previewText: 'Xin chào! Tôi là Linh. Hãy để tôi kể cho bạn nghe câu chuyện thật hay.',
    engine: 'cosyvoice2', geminiVoiceName: 'linh_truyen',
    avatarColors: ['#ec4899', '#f43f5e'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'cv2-vi-mai',
    name: 'Mai',
    label: 'Mai — Sâu lắng',
    countryCode: 'VN', languageCode: 'vi-VN',
    category: 'narration', gender: 'female',
    description: '[CosyVoice2] Nữ, sâu lắng truyền cảm. Tiểu thuyết, nội dung dài. [83K uses]',
    previewText: 'Trong căn nhà nhỏ ven sông, tiếng mưa rơi tạo nên giai điệu buồn man mác.',
    engine: 'cosyvoice2', geminiVoiceName: 'mai_truyen2',
    avatarColors: ['#14b8a6', '#0d9488'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'cv2-vi-phong',
    name: 'Phong',
    label: 'Phong — Bình luận',
    countryCode: 'VN', languageCode: 'vi-VN',
    category: 'news', gender: 'male',
    description: '[CosyVoice2] Nam, hùng hồn sôi động. Bình luận thể thao, game, sự kiện.',
    previewText: 'Một pha bóng cực kỳ kịch tính! Khán giả đang nín thở chờ đợi kết quả!',
    engine: 'cosyvoice2', geminiVoiceName: 'phong_binhlu',
    avatarColors: ['#f97316', '#ea580c'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'cv2-vi-duc',
    name: 'Đức',
    label: 'Đức — Trầm ấm',
    countryCode: 'VN', languageCode: 'vi-VN',
    category: 'general', gender: 'male',
    description: '[CosyVoice2] Nam, trầm ấm đáng tin cậy. Documentary, doanh nghiệp.',
    previewText: 'Xin chào! Tôi là Đức. Giọng trầm ấm cho nội dung chuyên nghiệp.',
    engine: 'cosyvoice2', geminiVoiceName: 'viet_nam_m',
    avatarColors: ['#10b981', '#059669'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'cv2-vi-jessica',
    name: 'Jessica',
    label: 'Jessica — Tươi vui',
    countryCode: 'VN', languageCode: 'vi-VN',
    category: 'conversational', gender: 'female',
    description: '[CosyVoice2] Nữ trẻ tươi vui. Vlog, review, lifestyle tiếng Việt.',
    previewText: 'Chào mọi người! Tôi là Jessica. Hôm nay chúng ta cùng khám phá điều mới nhé!',
    engine: 'cosyvoice2', geminiVoiceName: 'jessica_vi',
    avatarColors: ['#a855f7', '#7c3aed'],
    isCustom: false, createdAt: '2025-01-01',
  },

  // CosyVoice2 — Other languages
  {
    id: 'cv2-zh-cctv',
    name: 'CCTV (央视)',
    label: 'CCTV — 播音员',
    countryCode: 'CN', languageCode: 'zh-CN',
    category: 'news', gender: 'male',
    description: '[CosyVoice2] 标准普通话播音。新闻、纪录片。[136K uses]',
    previewText: '各位观众朋友们好，欢迎收看今天的新闻联播。',
    engine: 'cosyvoice2', geminiVoiceName: 'cctv_m',
    avatarColors: ['#dc2626', '#b91c1c'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'cv2-ja-genki',
    name: 'Genki (元気)',
    label: 'Genki — 元気な女性',
    countryCode: 'JP', languageCode: 'ja-JP',
    category: 'conversational', gender: 'female',
    description: '[CosyVoice2] 明るく元気な日本語。アニメ・YouTube。[210K uses]',
    previewText: 'こんにちは！今日はとても楽しいことをお伝えします。',
    engine: 'cosyvoice2', geminiVoiceName: 'genki_f',
    avatarColors: ['#f43f5e', '#e11d48'],
    isCustom: false, createdAt: '2025-01-01',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // KOKORO — English (American)  engine: "kokoro"
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'en-af-bella',
    name: 'Bella',
    label: 'Bella — Warm & Expressive',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'female',
    description: '[Kokoro] Warm, expressive. Podcasts, storytelling.',
    previewText: "Hi! I'm Bella. Warm and expressive, ready to bring your words to life.",
    engine: 'kokoro', geminiVoiceName: 'af_bella',
    avatarColors: ['#ec4899', '#f43f5e'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-sarah',
    name: 'Sarah',
    label: 'Sarah — Youthful & Friendly',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'female',
    description: '[Kokoro] Youthful, friendly. Vlogs, social, tutorials.',
    previewText: "Hey! I'm Sarah — friendly and natural.",
    engine: 'kokoro', geminiVoiceName: 'af_sarah',
    avatarColors: ['#8b5cf6', '#7c3aed'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-nova',
    name: 'Nova',
    label: 'Nova — Clear & Energetic',
    countryCode: 'US', languageCode: 'en-US',
    category: 'news', gender: 'female',
    description: '[Kokoro] Clear, energetic. News, announcements.',
    previewText: "Hello! I'm Nova — clear and energetic.",
    engine: 'kokoro', geminiVoiceName: 'af_nova',
    avatarColors: ['#06b6d4', '#0891b2'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-heart',
    name: 'Heart',
    label: 'Heart — Warm Narrator',
    countryCode: 'US', languageCode: 'en-US',
    category: 'narration', gender: 'female',
    description: '[Kokoro] Warm narrative. Audiobooks, meditation.',
    previewText: "Hello. I'm Heart — warm and soothing.",
    engine: 'kokoro', geminiVoiceName: 'af_heart',
    avatarColors: ['#f43f5e', '#e11d48'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-jessica',
    name: 'Jessica',
    label: 'Jessica — Lively',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'female',
    description: '[Kokoro] Lively, engaging. Commercials, product demos.',
    previewText: "Hi! I'm Jessica — lively and engaging!",
    engine: 'kokoro', geminiVoiceName: 'af_jessica',
    avatarColors: ['#f97316', '#ea580c'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-kore',
    name: 'Kore',
    label: 'Kore — Confident',
    countryCode: 'US', languageCode: 'en-US',
    category: 'general', gender: 'female',
    description: '[Kokoro] Confident, clear. E-learning, business.',
    previewText: "Hello. I'm Kore — confident and professional.",
    engine: 'kokoro', geminiVoiceName: 'af_kore',
    avatarColors: ['#10b981', '#059669'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-nicole',
    name: 'Nicole',
    label: 'Nicole — Elegant',
    countryCode: 'US', languageCode: 'en-US',
    category: 'commercial', gender: 'female',
    description: '[Kokoro] Smooth, elegant. Luxury brands, trailers.',
    previewText: "Hello. I'm Nicole — smooth and elegant.",
    engine: 'kokoro', geminiVoiceName: 'af_nicole',
    avatarColors: ['#a855f7', '#9333ea'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-aoede',
    name: 'Aoede',
    label: 'Aoede — Breezy',
    countryCode: 'US', languageCode: 'en-US',
    category: 'narration', gender: 'female',
    description: '[Kokoro] Breezy, natural. Long-form narration.',
    previewText: "Hi. I'm Aoede — breezy and natural.",
    engine: 'kokoro', geminiVoiceName: 'af_aoede',
    avatarColors: ['#14b8a6', '#0d9488'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-river',
    name: 'River',
    label: 'River — Soothing',
    countryCode: 'US', languageCode: 'en-US',
    category: 'narration', gender: 'female',
    description: '[Kokoro] Soothing, calm. Meditation, ASMR.',
    previewText: "Hello… I'm River — calm and soothing.",
    engine: 'kokoro', geminiVoiceName: 'af_river',
    avatarColors: ['#0ea5e9', '#0284c7'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-af-sky',
    name: 'Sky',
    label: 'Sky — Bright & Upbeat',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'female',
    description: '[Kokoro] Bright, upbeat. Motivation, intros.',
    previewText: "Hey! I'm Sky — bright and upbeat!",
    engine: 'kokoro', geminiVoiceName: 'af_sky',
    avatarColors: ['#fbbf24', '#d97706'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-adam',
    name: 'Adam',
    label: 'Adam — Deep & Authoritative',
    countryCode: 'US', languageCode: 'en-US',
    category: 'news', gender: 'male',
    description: '[Kokoro] Deep, authoritative. News, documentaries.',
    previewText: "Good evening. I'm Adam — deep and authoritative.",
    engine: 'kokoro', geminiVoiceName: 'am_adam',
    avatarColors: ['#1d4ed8', '#1e40af'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-michael',
    name: 'Michael',
    label: 'Michael — Warm Narrator',
    countryCode: 'US', languageCode: 'en-US',
    category: 'narration', gender: 'male',
    description: '[Kokoro] Warm, narrative. Audiobooks, documentary.',
    previewText: "Hello. I'm Michael — warm and trustworthy.",
    engine: 'kokoro', geminiVoiceName: 'am_michael',
    avatarColors: ['#059669', '#047857'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-puck',
    name: 'Puck',
    label: 'Puck — Dynamic',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'male',
    description: '[Kokoro] Dynamic, engaging. Gaming, entertainment.',
    previewText: "Hey! I'm Puck — dynamic and engaging!",
    engine: 'kokoro', geminiVoiceName: 'am_puck',
    avatarColors: ['#7c3aed', '#6d28d9'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-echo',
    name: 'Echo',
    label: 'Echo — Clear',
    countryCode: 'US', languageCode: 'en-US',
    category: 'general', gender: 'male',
    description: '[Kokoro] Clear, resonant. Tutorials, presentations.',
    previewText: "Hello. I'm Echo — clear and resonant.",
    engine: 'kokoro', geminiVoiceName: 'am_echo',
    avatarColors: ['#0891b2', '#0e7490'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-eric',
    name: 'Eric',
    label: 'Eric — Professional',
    countryCode: 'US', languageCode: 'en-US',
    category: 'general', gender: 'male',
    description: '[Kokoro] Professional, calm. Corporate, training.',
    previewText: "Hello. I'm Eric — professional and calm.",
    engine: 'kokoro', geminiVoiceName: 'am_eric',
    avatarColors: ['#374151', '#1f2937'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-fenrir',
    name: 'Fenrir',
    label: 'Fenrir — Powerful',
    countryCode: 'US', languageCode: 'en-US',
    category: 'game', gender: 'male',
    description: '[Kokoro] Powerful, dramatic. Gaming, trailers.',
    previewText: "Let's GO! I'm Fenrir — powerful and dramatic!",
    engine: 'kokoro', geminiVoiceName: 'am_fenrir',
    avatarColors: ['#dc2626', '#b91c1c'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-liam',
    name: 'Liam',
    label: 'Liam — Friendly',
    countryCode: 'US', languageCode: 'en-US',
    category: 'conversational', gender: 'male',
    description: '[Kokoro] Friendly, natural. Interviews, casual podcasts.',
    previewText: "Hey there! I'm Liam — friendly and natural.",
    engine: 'kokoro', geminiVoiceName: 'am_liam',
    avatarColors: ['#16a34a', '#15803d'],
    isCustom: false, createdAt: '2025-01-01',
  },
  {
    id: 'en-am-onyx',
    name: 'Onyx',
    label: 'Onyx — Deep',
    countryCode: 'US', languageCode: 'en-US',
    category: 'narration', gender: 'male',
    description: '[Kokoro] Deep, serious. Thriller, grave content.',
    previewText: "Hello. I'm Onyx. Deep and serious.",
    engine: 'kokoro', geminiVoiceName: 'am_onyx',
    avatarColors: ['#111827', '#374151'],
    isCustom: false, createdAt: '2025-01-01',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
export function getVoicesByCountry(countryCode: string): Voice[] {
  return VOICE_CATALOG.filter(v => v.countryCode === countryCode);
}
export function getVoicesByCategory(category: string): Voice[] {
  return VOICE_CATALOG.filter(v => v.category === category);
}
export function findVoiceById(id: string): Voice | undefined {
  return VOICE_CATALOG.find(v => v.id === id);
}

/** voiceId → engine-internal voice ID (e.g. "en-af-bella" → "af_bella") */
export const GEMINI_VOICE_NAME_MAP: Record<string, string> = Object.fromEntries(
  VOICE_CATALOG.filter(v => v.geminiVoiceName).map(v => [v.id, v.geminiVoiceName as string])
);

/** voiceId → engine ("en-af-bella" → "kokoro", "cv2-vi-linh" → "cosyvoice2") */
export const VOICE_ENGINE_MAP: Record<string, string> = Object.fromEntries(
  VOICE_CATALOG.map(v => [v.id, v.engine])
);
