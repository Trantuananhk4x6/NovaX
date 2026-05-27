// ============================================================================
// Video Type Definitions
// Layer 0 — All types for Video Studio module
// ============================================================================

/** Supported video aspect ratios */
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';

/** Supported video resolutions */
export type VideoResolution = '720p' | '1080p' | '4K';

/** Supported FPS values */
export type VideoFPS = 24 | 30 | 60;

/** Video export format */
export type VideoFormat = 'mp4' | 'webm';

/** Video theme identifier */
export type VideoThemeId =
  | 'cinematic'
  | 'nature'
  | 'technology'
  | 'news'
  | 'anime'
  | 'vlog'
  | 'education'
  | 'business'
  | 'travel'
  | 'music'
  | 'horror'
  | 'romantic';

/** Video style identifier */
export type VideoStyleId =
  | 'cinematic'
  | 'cartoon'
  | 'slideshow'
  | 'news-broadcast'
  | 'documentary'
  | 'motion-graphics'
  | 'minimal';

/** Transition type between scenes */
export type TransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'zoom-in'
  | 'zoom-out'
  | 'blur'
  | 'dissolve'
  | 'wipe'
  | 'none';

/** Detected mood from AI analysis */
export type MoodType =
  | 'happy'
  | 'sad'
  | 'energetic'
  | 'calm'
  | 'dramatic'
  | 'mysterious'
  | 'inspiring'
  | 'funny'
  | 'serious'
  | 'romantic';

// ── Video Theme ─────────────────────────────────────────

export interface VideoTheme {
  id: VideoThemeId;
  name: string;
  description: string;
  icon: string;
  /** Primary gradient for the theme */
  gradient: string;
  /** Theme colors */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  /** Suggested font family */
  font: string;
  /** Suggested mood */
  mood: MoodType;
}

// ── Video Scene ─────────────────────────────────────────

export interface VideoScene {
  id: string;
  /** Order in the video */
  order: number;
  /** Scene title/label */
  title: string;
  /** Descriptive text for the scene */
  description: string;
  /** Duration in seconds */
  duration: number;
  /** Background gradient or color */
  background: string;
  /** Text overlay content */
  textOverlay?: string;
  /** Font size for text overlay */
  textSize?: 'small' | 'medium' | 'large';
  /** Text position */
  textPosition?: 'top' | 'center' | 'bottom';
  /** Transition to next scene */
  transition: TransitionType;
  /** Transition duration in ms */
  transitionDuration: number;
  /** Keywords associated with this scene */
  keywords: string[];
  /** Scene icon/emoji */
  icon?: string;
}

// ── Video Settings ──────────────────────────────────────

export interface VideoSettings {
  /** Video title */
  title: string;
  /** Aspect ratio */
  aspectRatio: AspectRatio;
  /** Resolution */
  resolution: VideoResolution;
  /** Frames per second */
  fps: VideoFPS;
  /** Selected theme */
  themeId: VideoThemeId;
  /** Selected style */
  styleId: VideoStyleId;
  /** Enable background music */
  backgroundMusic: boolean;
  /** Background music volume (0-1) */
  musicVolume: number;
  /** Enable watermark */
  watermark: boolean;
  /** Enable subtitles */
  subtitles: boolean;
  /** Output file prefix */
  filePrefix: string;
}

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  title: '',
  aspectRatio: '16:9',
  resolution: '1080p',
  fps: 30,
  themeId: 'cinematic',
  styleId: 'cinematic',
  backgroundMusic: false,
  musicVolume: 0.3,
  watermark: false,
  subtitles: true,
  filePrefix: 'novax_video',
};

// ── Video Project ───────────────────────────────────────

export interface VideoProject {
  id: string;
  /** Project creation timestamp */
  createdAt: string;
  /** Source audio URL (for audio-to-video) */
  audioUrl?: string;
  /** Source audio file name */
  audioFileName?: string;
  /** Source video URL (for video-to-audio) */
  sourceVideoUrl?: string;
  /** Source video file name */
  sourceVideoFileName?: string;
  /** AI analysis result */
  analysis?: VideoAnalysis;
  /** Video scenes */
  scenes: VideoScene[];
  /** Video settings */
  settings: VideoSettings;
  /** Generated video URL */
  outputVideoUrl?: string;
  /** Generated audio URL (for video-to-audio) */
  outputAudioUrl?: string;
  /** Project status */
  status: 'draft' | 'analyzing' | 'generating' | 'editing' | 'exporting' | 'complete';
  /** Progress percentage (0–100) */
  progress: number;
  /** Current phase label */
  phaseLabel: string;
}

// ── AI Analysis Result ──────────────────────────────────

export interface VideoAnalysis {
  /** Detected keywords from audio/video */
  keywords: string[];
  /** Detected mood/emotion */
  mood: MoodType;
  /** Confidence score (0–1) */
  moodConfidence: number;
  /** Suggested theme based on analysis */
  suggestedTheme: VideoThemeId;
  /** Suggested scenes */
  suggestedScenes: VideoScene[];
  /** Transcript (for audio analysis) */
  transcript?: string;
  /** Generated script (for video analysis) */
  generatedScript?: string;
  /** Summary of the content */
  summary: string;
  /** Detected language */
  detectedLanguage?: string;
  /** Total duration of source in seconds */
  sourceDuration: number;
}

// ── Timeline Track ──────────────────────────────────────

export type TrackType = 'video' | 'audio' | 'text' | 'effects';

export interface TimelineClip {
  id: string;
  /** Track this clip belongs to */
  trackId: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Display label */
  label: string;
  /** Color for the clip */
  color: string;
  /** Associated scene ID (if video track) */
  sceneId?: string;
  /** Is this clip selected */
  isSelected?: boolean;
}

export interface TimelineTrack {
  id: string;
  type: TrackType;
  label: string;
  /** Track color */
  color: string;
  /** Is track muted */
  isMuted: boolean;
  /** Is track locked */
  isLocked: boolean;
  /** Clips on this track */
  clips: TimelineClip[];
}

// ── Video Export Options ────────────────────────────────

export interface VideoExportOptions {
  format: VideoFormat;
  resolution: VideoResolution;
  fps: VideoFPS;
  /** Quality 1-100 */
  quality: number;
  /** Include audio */
  includeAudio: boolean;
  /** Include subtitles */
  includeSubtitles: boolean;
}

// ── Video-to-Audio Voice Settings ───────────────────────

export interface VideoVoiceSettings {
  voiceId: string;
  languageCode: string;
  speed: number;
  stability: number;
  clarity: number;
  pitch: number;
}

export const DEFAULT_VIDEO_VOICE_SETTINGS: VideoVoiceSettings = {
  voiceId: '',
  languageCode: 'vi-VN',
  speed: 1.0,
  stability: 0.5,
  clarity: 0.75,
  pitch: 0,
};

// ── YouTube Tools Types ─────────────────────────────────

export interface ThumbnailConcept {
  id: string;
  title: string;
  style: string;
  gradient: string;
  textOverlay: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface SEOSuggestion {
  id: string;
  title: string;
  description: string;
  tags: string[];
  score: number;
}

export interface ContentCalendarItem {
  id: string;
  videoTitle: string;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'published';
  thumbnail?: string;
  platform: 'youtube' | 'tiktok' | 'both';
}

export interface BatchVideoItem {
  id: string;
  audioFileName: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  progress: number;
  outputUrl?: string;
}

// ── Step wizard for multi-step flows ────────────────────

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  isComplete: boolean;
  isActive: boolean;
}
