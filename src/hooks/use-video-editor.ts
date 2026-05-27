// ============================================================================
// useVideoEditor — Hook for Timeline Video Editor
// Layer 3 — Manages timeline playback, track manipulation, and clip editing
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  TimelineTrack,
  TimelineClip,
  VideoScene,
} from '@/types/video.types';

interface VideoEditorState {
  /** Timeline tracks */
  tracks: TimelineTrack[];
  /** Current playhead position in seconds */
  currentTime: number;
  /** Total duration */
  totalDuration: number;
  /** Is timeline playing */
  isPlaying: boolean;
  /** Zoom level (1 = normal, 2 = 2x zoom) */
  zoomLevel: number;
  /** Selected clip ID */
  selectedClipId: string | null;
  /** Selected track ID */
  selectedTrackId: string | null;
  /** Is dragging playhead */
  isDragging: boolean;
}

const initialState: VideoEditorState = {
  tracks: [],
  currentTime: 0,
  totalDuration: 0,
  isPlaying: false,
  zoomLevel: 1,
  selectedClipId: null,
  selectedTrackId: null,
  isDragging: false,
};

export function useVideoEditor(
  initialTracks: TimelineTrack[] = [],
  totalDuration: number = 0
) {
  const [state, setState] = useState<VideoEditorState>({
    ...initialState,
    tracks: initialTracks,
    totalDuration,
  });

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync tracks when external data changes
  useEffect(() => {
    setState(prev => {
      // Prevent infinite loop by deeply comparing tracks
      if (
        prev.totalDuration === totalDuration &&
        JSON.stringify(prev.tracks) === JSON.stringify(initialTracks)
      ) {
        return prev;
      }
      return {
        ...prev,
        tracks: initialTracks,
        totalDuration,
      };
    });
  }, [initialTracks, totalDuration]);

  // ── Playback Controls ─────────────────────────────────

  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Auto-advance playhead during playback
  useEffect(() => {
    if (state.isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setState(prev => {
          const next = prev.currentTime + 0.1;
          if (next >= prev.totalDuration) {
            return { ...prev, currentTime: 0, isPlaying: false };
          }
          return { ...prev, currentTime: next };
        });
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  const seekTo = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.totalDuration)),
    }));
  }, []);

  const skipForward = useCallback((seconds: number = 5) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.min(prev.currentTime + seconds, prev.totalDuration),
    }));
  }, []);

  const skipBackward = useCallback((seconds: number = 5) => {
    setState(prev => ({
      ...prev,
      currentTime: Math.max(prev.currentTime - seconds, 0),
    }));
  }, []);

  // ── Zoom Controls ─────────────────────────────────────

  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel + 0.5, 5),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel - 0.5, 0.5),
    }));
  }, []);

  // ── Track Operations ──────────────────────────────────

  const toggleTrackMute = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
      ),
    }));
  }, []);

  const toggleTrackLock = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(t =>
        t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
      ),
    }));
  }, []);

  // ── Clip Operations ───────────────────────────────────

  const selectClip = useCallback((clipId: string | null) => {
    setState(prev => ({ ...prev, selectedClipId: clipId }));
  }, []);

  const selectTrack = useCallback((trackId: string | null) => {
    setState(prev => ({ ...prev, selectedTrackId: trackId }));
  }, []);

  const trimClip = useCallback((clipId: string, newStart: number, newEnd: number) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, startTime: newStart, endTime: newEnd }
            : clip
        ),
      })),
    }));
  }, []);

  const deleteClip = useCallback((clipId: string) => {
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId),
      })),
      selectedClipId: prev.selectedClipId === clipId ? null : prev.selectedClipId,
    }));
  }, []);

  // ── Get current scene based on playhead ───────────────

  const getCurrentScene = useCallback((scenes: VideoScene[]): VideoScene | null => {
    const videoTrack = state.tracks.find(t => t.type === 'video');
    if (!videoTrack) return null;

    const currentClip = videoTrack.clips.find(
      c => state.currentTime >= c.startTime && state.currentTime < c.endTime
    );

    if (!currentClip?.sceneId) return null;
    return scenes.find(s => s.id === currentClip.sceneId) || null;
  }, [state.tracks, state.currentTime]);

  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    state,
    // Playback
    play,
    pause,
    togglePlay,
    seekTo,
    skipForward,
    skipBackward,
    // Zoom
    zoomIn,
    zoomOut,
    // Tracks
    toggleTrackMute,
    toggleTrackLock,
    // Clips
    selectClip,
    selectTrack,
    trimClip,
    deleteClip,
    // Helpers
    getCurrentScene,
    formatTime,
  };
}
