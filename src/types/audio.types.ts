// ============================================================================
// Audio Player Type Definitions
// Layer 0 — Interfaces for custom audio player state and controls
// ============================================================================

/** Playback status */
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'loading' | 'error';

/** Audio player state */
export interface AudioPlayerState {
  /** Current playback status */
  status: PlaybackStatus;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Progress percentage (0–100) */
  progress: number;
  /** Volume level (0–1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Audio source URL */
  audioUrl: string | null;
  /** Error message */
  error: string | null;
}

/** Default audio player state */
export const DEFAULT_AUDIO_PLAYER: AudioPlayerState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  progress: 0,
  volume: 1.0,
  isMuted: false,
  audioUrl: null,
  error: null,
};
