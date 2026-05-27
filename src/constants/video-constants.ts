// ============================================================================
// Video Constants
// Layer 1 — Themes, transitions, resolutions, styles, and presets
// ============================================================================

import {
  VideoTheme,
  VideoThemeId,
  TransitionType,
  VideoResolution,
  AspectRatio,
  VideoStyleId,
  MoodType,
} from '@/types/video.types';

// ── Video Themes ────────────────────────────────────────

export const VIDEO_THEMES: VideoTheme[] = [
  {
    id: 'cinematic',
    name: 'Điện ảnh',
    description: 'Phong cách điện ảnh Hollywood, tông màu ấm và tương phản cao',
    icon: '🎬',
    gradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)',
    colors: { primary: '#e2b714', secondary: '#c9a227', accent: '#ffd700', bg: '#0c0c1d', text: '#f5e6ca' },
    font: 'Georgia, serif',
    mood: 'dramatic',
  },
  {
    id: 'nature',
    name: 'Thiên nhiên',
    description: 'Tông xanh lá, cảm giác tự nhiên và thư giãn',
    icon: '🌿',
    gradient: 'linear-gradient(135deg, #0d3b2e 0%, #134e3a 50%, #1a6b4a 100%)',
    colors: { primary: '#4ade80', secondary: '#22c55e', accent: '#86efac', bg: '#0d3b2e', text: '#ecfdf5' },
    font: 'Inter, sans-serif',
    mood: 'calm',
  },
  {
    id: 'technology',
    name: 'Công nghệ',
    description: 'Phong cách tech, neon và hiện đại',
    icon: '💻',
    gradient: 'linear-gradient(135deg, #0a0e27 0%, #0f172a 50%, #1e293b 100%)',
    colors: { primary: '#3b82f6', secondary: '#6366f1', accent: '#06b6d4', bg: '#0a0e27', text: '#e2e8f0' },
    font: 'JetBrains Mono, monospace',
    mood: 'energetic',
  },
  {
    id: 'news',
    name: 'Tin tức',
    description: 'Phong cách bản tin chuyên nghiệp',
    icon: '📰',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    colors: { primary: '#ef4444', secondary: '#dc2626', accent: '#ffffff', bg: '#1a1a2e', text: '#f1f5f9' },
    font: 'Inter, sans-serif',
    mood: 'serious',
  },
  {
    id: 'anime',
    name: 'Anime/Cartoon',
    description: 'Phong cách anime Nhật Bản, màu sắc sống động',
    icon: '🎌',
    gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #574b90 100%)',
    colors: { primary: '#ff6b9d', secondary: '#c44569', accent: '#f8a5c2', bg: '#2d1b33', text: '#fce4ec' },
    font: 'Nunito, sans-serif',
    mood: 'energetic',
  },
  {
    id: 'vlog',
    name: 'Vlog',
    description: 'Phong cách vlog cá nhân, tươi trẻ',
    icon: '📹',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: { primary: '#a78bfa', secondary: '#8b5cf6', accent: '#c4b5fd', bg: '#1e1b4b', text: '#ede9fe' },
    font: 'Outfit, sans-serif',
    mood: 'happy',
  },
  {
    id: 'education',
    name: 'Giáo dục',
    description: 'Phong cách dạy học, rõ ràng và chuyên nghiệp',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)',
    colors: { primary: '#60a5fa', secondary: '#3b82f6', accent: '#93c5fd', bg: '#1e3a5f', text: '#dbeafe' },
    font: 'Inter, sans-serif',
    mood: 'inspiring',
  },
  {
    id: 'business',
    name: 'Doanh nghiệp',
    description: 'Phong cách doanh nghiệp, sang trọng',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3d3d5c 100%)',
    colors: { primary: '#94a3b8', secondary: '#64748b', accent: '#e2e8f0', bg: '#1a1a2e', text: '#f8fafc' },
    font: 'Inter, sans-serif',
    mood: 'serious',
  },
  {
    id: 'travel',
    name: 'Du lịch',
    description: 'Phong cách du lịch, khám phá và phiêu lưu',
    icon: '✈️',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
    colors: { primary: '#fb923c', secondary: '#f97316', accent: '#fdba74', bg: '#431407', text: '#fff7ed' },
    font: 'Outfit, sans-serif',
    mood: 'energetic',
  },
  {
    id: 'music',
    name: 'Âm nhạc',
    description: 'Phong cách âm nhạc, sôi động với hiệu ứng ánh sáng',
    icon: '🎵',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
    colors: { primary: '#ec4899', secondary: '#d946ef', accent: '#f0abfc', bg: '#1a0a2e', text: '#fae8ff' },
    font: 'Outfit, sans-serif',
    mood: 'energetic',
  },
  {
    id: 'horror',
    name: 'Kinh dị',
    description: 'Phong cách kinh dị, tối và bí ẩn',
    icon: '👻',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #2d0a0a 100%)',
    colors: { primary: '#dc2626', secondary: '#991b1b', accent: '#7f1d1d', bg: '#0a0a0a', text: '#fca5a5' },
    font: 'Georgia, serif',
    mood: 'mysterious',
  },
  {
    id: 'romantic',
    name: 'Lãng mạn',
    description: 'Phong cách lãng mạn, nhẹ nhàng và ấm áp',
    icon: '💕',
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 50%, #f48fb1 100%)',
    colors: { primary: '#ec4899', secondary: '#f472b6', accent: '#fbcfe8', bg: '#1a0a15', text: '#fce7f3' },
    font: 'Georgia, serif',
    mood: 'romantic',
  },
];

// ── Transition Options ──────────────────────────────────

export interface TransitionOption {
  id: TransitionType;
  name: string;
  icon: string;
}

export const TRANSITION_OPTIONS: TransitionOption[] = [
  { id: 'fade', name: 'Fade', icon: '🌫️' },
  { id: 'slide-left', name: 'Slide Left', icon: '⬅️' },
  { id: 'slide-right', name: 'Slide Right', icon: '➡️' },
  { id: 'slide-up', name: 'Slide Up', icon: '⬆️' },
  { id: 'zoom-in', name: 'Zoom In', icon: '🔍' },
  { id: 'zoom-out', name: 'Zoom Out', icon: '🔎' },
  { id: 'blur', name: 'Blur', icon: '💨' },
  { id: 'dissolve', name: 'Dissolve', icon: '✨' },
  { id: 'wipe', name: 'Wipe', icon: '🧹' },
  { id: 'none', name: 'Không có', icon: '⏹️' },
];

// ── Resolution Options ──────────────────────────────────

export interface ResolutionOption {
  id: VideoResolution;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const RESOLUTION_OPTIONS: ResolutionOption[] = [
  { id: '720p', label: 'HD 720p', width: 1280, height: 720, description: 'Phù hợp chia sẻ nhanh' },
  { id: '1080p', label: 'Full HD 1080p', width: 1920, height: 1080, description: 'Chất lượng tốt nhất cho YouTube' },
  { id: '4K', label: '4K Ultra HD', width: 3840, height: 2160, description: 'Chất lượng cao nhất' },
];

// ── Aspect Ratio Options ────────────────────────────────

export interface AspectRatioOption {
  id: AspectRatio;
  label: string;
  description: string;
  icon: string;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: '16:9', label: '16:9', description: 'YouTube, Landscape', icon: '📺' },
  { id: '9:16', label: '9:16', description: 'TikTok, Shorts, Reels', icon: '📱' },
  { id: '1:1', label: '1:1', description: 'Instagram, Facebook', icon: '⬜' },
  { id: '4:3', label: '4:3', description: 'Truyền thống', icon: '🖥️' },
];

// ── Video Styles ────────────────────────────────────────

export interface VideoStyleOption {
  id: VideoStyleId;
  name: string;
  description: string;
  icon: string;
}

export const VIDEO_STYLE_OPTIONS: VideoStyleOption[] = [
  { id: 'cinematic', name: 'Điện ảnh', description: 'Hiệu ứng cinematic chuyên nghiệp', icon: '🎬' },
  { id: 'cartoon', name: 'Hoạt hình', description: 'Phong cách hoạt hình vui nhộn', icon: '🎨' },
  { id: 'slideshow', name: 'Trình chiếu', description: 'Slide ảnh với text', icon: '🖼️' },
  { id: 'news-broadcast', name: 'Bản tin', description: 'Phong cách tin tức truyền hình', icon: '📺' },
  { id: 'documentary', name: 'Phim tài liệu', description: 'Phong cách tài liệu', icon: '🎥' },
  { id: 'motion-graphics', name: 'Motion Graphics', description: 'Đồ họa chuyển động', icon: '💫' },
  { id: 'minimal', name: 'Tối giản', description: 'Thiết kế tối giản, thanh lịch', icon: '⚪' },
];

// ── Mood to Theme Mapping ───────────────────────────────

export const MOOD_THEME_MAP: Record<MoodType, VideoThemeId[]> = {
  happy: ['vlog', 'travel', 'music'],
  sad: ['cinematic', 'romantic'],
  energetic: ['technology', 'anime', 'music'],
  calm: ['nature', 'education'],
  dramatic: ['cinematic', 'horror'],
  mysterious: ['horror', 'cinematic'],
  inspiring: ['education', 'business', 'nature'],
  funny: ['anime', 'vlog'],
  serious: ['news', 'business', 'education'],
  romantic: ['romantic', 'vlog'],
};

// ── Scene Presets based on keywords ─────────────────────

export interface ScenePreset {
  keyword: string;
  title: string;
  icon: string;
  background: string;
  defaultDuration: number;
}

export const SCENE_PRESETS: ScenePreset[] = [
  { keyword: 'giới thiệu', title: 'Giới thiệu', icon: '👋', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', defaultDuration: 5 },
  { keyword: 'kết luận', title: 'Kết luận', icon: '🎯', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', defaultDuration: 5 },
  { keyword: 'câu hỏi', title: 'Câu hỏi', icon: '❓', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', defaultDuration: 4 },
  { keyword: 'trả lời', title: 'Trả lời', icon: '💡', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', defaultDuration: 4 },
  { keyword: 'mẹo', title: 'Mẹo hay', icon: '✨', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', defaultDuration: 4 },
  { keyword: 'cảnh báo', title: 'Cảnh báo', icon: '⚠️', background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', defaultDuration: 3 },
  { keyword: 'ví dụ', title: 'Ví dụ', icon: '📝', background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)', defaultDuration: 5 },
  { keyword: 'bước', title: 'Hướng dẫn', icon: '📋', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', defaultDuration: 5 },
  { keyword: 'thống kê', title: 'Thống kê', icon: '📊', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', defaultDuration: 4 },
  { keyword: 'subscribe', title: 'Đăng ký kênh', icon: '🔔', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', defaultDuration: 3 },
  { keyword: 'like', title: 'Nhấn Like', icon: '👍', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', defaultDuration: 2 },
  { keyword: 'comment', title: 'Bình luận', icon: '💬', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', defaultDuration: 3 },
];

// ── FPS Options ─────────────────────────────────────────

export const FPS_OPTIONS = [
  { value: 24, label: '24 FPS', description: 'Điện ảnh' },
  { value: 30, label: '30 FPS', description: 'Tiêu chuẩn' },
  { value: 60, label: '60 FPS', description: 'Mượt mà' },
] as const;

// ── YouTube Tool Presets ────────────────────────────────

export const THUMBNAIL_STYLES = [
  { id: 'bold-text', name: 'Text nổi bật', icon: '🔤', description: 'Text to lớn, màu sắc nổi bật' },
  { id: 'face-reaction', name: 'Khuôn mặt', icon: '😱', description: 'Khuôn mặt phản ứng + text' },
  { id: 'before-after', name: 'Trước/Sau', icon: '↔️', description: 'So sánh trước và sau' },
  { id: 'number-list', name: 'Top danh sách', icon: '🔢', description: 'Danh sách top N' },
  { id: 'question', name: 'Câu hỏi', icon: '❓', description: 'Đặt câu hỏi gây tò mò' },
  { id: 'minimal', name: 'Tối giản', icon: '⚪', description: 'Thiết kế tối giản, sạch sẽ' },
];

export const CONTENT_CATEGORIES = [
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'education', name: 'Giáo dục', icon: '📚' },
  { id: 'tech', name: 'Công nghệ', icon: '💻' },
  { id: 'entertainment', name: 'Giải trí', icon: '🎭' },
  { id: 'lifestyle', name: 'Đời sống', icon: '🏠' },
  { id: 'cooking', name: 'Nấu ăn', icon: '🍳' },
  { id: 'fitness', name: 'Thể dục', icon: '💪' },
  { id: 'music', name: 'Âm nhạc', icon: '🎵' },
  { id: 'news', name: 'Tin tức', icon: '📰' },
  { id: 'business', name: 'Kinh doanh', icon: '💼' },
];
