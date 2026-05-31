// ============================================================================
// useAudioToVideo — Hook for Audio → Video Conversion Flow
// Layer 3 — Manages the 4-step wizard: Upload → Analyze → Customize → Export
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import {
  VideoScene,
  VideoSettings,
  VideoAnalysis,
  VideoThemeId,
  DEFAULT_VIDEO_SETTINGS,
} from '@/types/video.types';
import {
  generateVideoId,
  simulateAudioAnalysis,
  generateScenesFromAnalysis,
  generateTimelineTracks,
} from '@/lib/video-engine';

export type AudioToVideoStep = 1 | 2 | 3 | 4;

interface AudioToVideoState {
  /** Current wizard step */
  currentStep: AudioToVideoStep;
  /** Audio file */
  audioFile: File | null;
  /** Audio object URL for playback */
  audioUrl: string | null;
  /** Audio duration in seconds */
  audioDuration: number;
  /** AI analysis result */
  analysis: VideoAnalysis | null;
  /** Is currently analyzing */
  isAnalyzing: boolean;
  /** Video scenes */
  scenes: VideoScene[];
  /** Video settings */
  settings: VideoSettings;
  /** Is generating video */
  isGenerating: boolean;
  /** Generation progress */
  progress: number;
  /** Progress label */
  progressLabel: string;
  /** Generated output URL */
  outputUrl: string | null;
  /** Error message */
  error: string | null;
}

const initialState: AudioToVideoState = {
  currentStep: 1,
  audioFile: null,
  audioUrl: null,
  audioDuration: 0,
  analysis: null,
  isAnalyzing: false,
  scenes: [],
  settings: { ...DEFAULT_VIDEO_SETTINGS },
  isGenerating: false,
  progress: 0,
  progressLabel: '',
  outputUrl: null,
  error: null,
};

export function useAudioToVideo() {
  const [state, setState] = useState<AudioToVideoState>(initialState);

  // ── Step 1: Upload Audio ────────────────────────────────

  const setAudioFile = useCallback((file: File) => {
    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm'];

    if (file.size > maxSize) {
      setState(prev => ({ ...prev, error: 'File quá lớn. Tối đa 50MB.' }));
      return;
    }

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      setState(prev => ({ ...prev, error: 'Định dạng không hỗ trợ. Hãy dùng MP3, WAV, M4A.' }));
      return;
    }

    const url = URL.createObjectURL(file);

    // Get audio duration
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setState(prev => ({
        ...prev,
        audioFile: file,
        audioUrl: url,
        audioDuration: audio.duration,
        error: null,
      }));
    });

    audio.addEventListener('error', () => {
      setState(prev => ({ ...prev, error: 'Không thể đọc file audio.' }));
      URL.revokeObjectURL(url);
    });
  }, []);

  const setAudioFromRecording = useCallback((blob: Blob, duration: number) => {
    const url = URL.createObjectURL(blob);
    const file = new File([blob], `recording_${Date.now()}.webm`, { type: blob.type });

    setState(prev => ({
      ...prev,
      audioFile: file,
      audioUrl: url,
      audioDuration: duration,
      error: null,
    }));
  }, []);

  const clearAudio = useCallback(() => {
    setState(prev => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return { ...initialState };
    });
  }, []);

  // ── Step 2: Analyze Audio Context ───────────────────────

  const startAnalysis = useCallback(() => {
    if (!state.audioFile) return;

    setState(prev => ({ ...prev, isAnalyzing: true, currentStep: 2, error: null }));

    // Simulate AI analysis with a delay
    setTimeout(() => {
      const analysis = simulateAudioAnalysis(
        state.audioDuration,
        state.audioFile?.name
      );

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysis,
        scenes: analysis.suggestedScenes,
        settings: {
          ...prev.settings,
          themeId: analysis.suggestedTheme,
        },
      }));
    }, 2500 + Math.random() * 1500);
  }, [state.audioFile, state.audioDuration]);

  // ── Step 3: Customize Video ─────────────────────────────

  const goToCustomize = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 3 }));
  }, []);

  const updateSettings = useCallback(<K extends keyof VideoSettings>(
    key: K,
    value: VideoSettings[K]
  ) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  }, []);

  const updateTheme = useCallback((themeId: VideoThemeId) => {
    setState(prev => {
      // Regenerate scenes with new theme
      const newScenes = prev.analysis
        ? generateScenesFromAnalysis(
            prev.analysis.keywords,
            prev.analysis.mood,
            prev.analysis.sourceDuration,
            themeId
          )
        : prev.scenes;

      return {
        ...prev,
        settings: { ...prev.settings, themeId },
        scenes: newScenes,
      };
    });
  }, []);

  const updateScene = useCallback((sceneId: string, updates: Partial<VideoScene>) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s =>
        s.id === sceneId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const removeScene = useCallback((sceneId: string) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes
        .filter(s => s.id !== sceneId)
        .map((s, i) => ({ ...s, order: i })),
    }));
  }, []);

  const addScene = useCallback(() => {
    setState(prev => {
      const newScene: VideoScene = {
        id: generateVideoId(),
        order: prev.scenes.length,
        title: 'Scene mới',
        description: 'Mô tả scene...',
        duration: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textOverlay: 'Nội dung',
        textSize: 'medium',
        textPosition: 'center',
        transition: 'fade',
        transitionDuration: 600,
        keywords: [],
        icon: '📌',
      };
      return {
        ...prev,
        scenes: [...prev.scenes, newScene],
      };
    });
  }, []);

  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newScenes = [...prev.scenes];
      const [moved] = newScenes.splice(fromIndex, 1);
      newScenes.splice(toIndex, 0, moved);
      return {
        ...prev,
        scenes: newScenes.map((s, i) => ({ ...s, order: i })),
      };
    });
  }, []);

  // ── Step 4: Generate & Export ────────────────────────────

  const startGeneration = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 4,
      isGenerating: true,
      progress: 0,
      progressLabel: 'Đang chuẩn bị...',
    }));

    // Simulate generation progress
    const phases = [
      { progress: 15, label: 'Đang xử lý scenes...' },
      { progress: 35, label: 'Đang render video...' },
      { progress: 55, label: 'Đang thêm hiệu ứng chuyển cảnh...' },
      { progress: 70, label: 'Đang ghép âm thanh...' },
      { progress: 85, label: 'Đang thêm phụ đề...' },
      { progress: 95, label: 'Đang xuất file...' },
      { progress: 100, label: 'Hoàn tất!' },
    ];

    phases.forEach((phase, index) => {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          progress: phase.progress,
          progressLabel: phase.label,
          ...(phase.progress === 100 ? {
            isGenerating: false,
            outputUrl: prev.audioUrl, // Use audio URL as demo output
          } : {}),
        }));
      }, (index + 1) * 1200);
    });
  }, []);

  const goToStep = useCallback((step: AudioToVideoStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return { ...initialState };
    });
  }, []);

  // ── Computed values ─────────────────────────────────────

  const totalSceneDuration = state.scenes.reduce((sum, s) => sum + s.duration, 0);

  const tracks = useMemo(() => {
    return state.scenes.length > 0
      ? generateTimelineTracks(state.scenes, state.audioDuration, !!state.audioUrl)
      : [];
  }, [state.scenes, state.audioDuration, state.audioUrl]);

  return {
    state,
    totalSceneDuration,
    tracks,
    // Step 1
    setAudioFile,
    setAudioFromRecording,
    clearAudio,
    // Step 2
    startAnalysis,
    // Step 3
    goToCustomize,
    updateSettings,
    updateTheme,
    updateScene,
    removeScene,
    addScene,
    reorderScenes,
    // Step 4
    startGeneration,
    // Navigation
    goToStep,
    reset,
  };
}
