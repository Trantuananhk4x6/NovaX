// ============================================================================
// useVideoToAudio — Hook for Video → Voice Conversion Flow
// Layer 3 — Manages the 3-step flow: Upload Video → Analyze → Generate Voice
// ============================================================================

import { useState, useCallback } from 'react';
import {
  VideoAnalysis,
  VideoVoiceSettings,
  DEFAULT_VIDEO_VOICE_SETTINGS,
} from '@/types/video.types';
import { simulateVideoAnalysis } from '@/lib/video-engine';

export type VideoToAudioStep = 1 | 2 | 3;

interface VideoToAudioState {
  currentStep: VideoToAudioStep;
  /** Source video file */
  videoFile: File | null;
  /** Video preview URL */
  videoUrl: string | null;
  /** Video duration */
  videoDuration: number;
  /** Video metadata */
  videoMeta: {
    width: number;
    height: number;
    size: string;
  } | null;
  /** AI analysis result */
  analysis: VideoAnalysis | null;
  /** Is analyzing */
  isAnalyzing: boolean;
  /** Editable script */
  editedScript: string;
  /** Voice settings */
  voiceSettings: VideoVoiceSettings;
  /** Is generating voice */
  isGenerating: boolean;
  /** Generation progress */
  progress: number;
  /** Progress label */
  progressLabel: string;
  /** Generated audio URL */
  outputAudioUrl: string | null;
  /** Output video with voice URL */
  outputVideoUrl: string | null;
  /** Error */
  error: string | null;
}

const initialState: VideoToAudioState = {
  currentStep: 1,
  videoFile: null,
  videoUrl: null,
  videoDuration: 0,
  videoMeta: null,
  analysis: null,
  isAnalyzing: false,
  editedScript: '',
  voiceSettings: { ...DEFAULT_VIDEO_VOICE_SETTINGS },
  isGenerating: false,
  progress: 0,
  progressLabel: '',
  outputAudioUrl: null,
  outputVideoUrl: null,
  error: null,
};

export function useVideoToAudio() {
  const [state, setState] = useState<VideoToAudioState>(initialState);

  // ── Step 1: Upload Video ────────────────────────────────

  const setVideoFile = useCallback((file: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setState(prev => ({ ...prev, error: 'File quá lớn. Tối đa 500MB.' }));
      return;
    }

    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
      setState(prev => ({ ...prev, error: 'Định dạng không hỗ trợ. Hãy dùng MP4, WebM, MOV.' }));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      setState(prev => ({
        ...prev,
        videoFile: file,
        videoUrl: url,
        videoDuration: video.duration,
        videoMeta: {
          width: video.videoWidth,
          height: video.videoHeight,
          size: formatFileSize(file.size),
        },
        error: null,
      }));
    };

    video.onerror = () => {
      setState(prev => ({ ...prev, error: 'Không thể đọc file video.' }));
      URL.revokeObjectURL(url);
    };

    video.src = url;
  }, []);

  const clearVideo = useCallback(() => {
    setState(prev => {
      if (prev.videoUrl) URL.revokeObjectURL(prev.videoUrl);
      return { ...initialState };
    });
  }, []);

  // ── Step 2: Analyze & Configure ─────────────────────────

  const startAnalysis = useCallback(() => {
    if (!state.videoFile) return;

    setState(prev => ({ ...prev, isAnalyzing: true, currentStep: 2, error: null }));

    setTimeout(() => {
      const analysis = simulateVideoAnalysis(
        state.videoDuration,
        state.videoFile?.name
      );

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        analysis,
        editedScript: analysis.generatedScript || '',
      }));
    }, 3000 + Math.random() * 2000);
  }, [state.videoFile, state.videoDuration]);

  const updateScript = useCallback((script: string) => {
    setState(prev => ({ ...prev, editedScript: script }));
  }, []);

  const updateVoiceSettings = useCallback(<K extends keyof VideoVoiceSettings>(
    key: K,
    value: VideoVoiceSettings[K]
  ) => {
    setState(prev => ({
      ...prev,
      voiceSettings: { ...prev.voiceSettings, [key]: value },
    }));
  }, []);

  // ── Step 3: Generate Voice & Export ─────────────────────

  const startGeneration = useCallback(async () => {
    if (!state.editedScript.trim()) {
      setState(prev => ({ ...prev, error: 'Vui lòng nhập script cho voice.' }));
      return;
    }

    if (!state.voiceSettings.voiceId) {
      setState(prev => ({ ...prev, error: 'Vui lòng chọn giọng nói trước khi tạo.' }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentStep: 3,
      isGenerating: true,
      progress: 10,
      progressLabel: 'Đang chuẩn bị...',
      error: null,
    }));

    try {
      // Update progress UI
      setState(prev => ({ ...prev, progress: 25, progressLabel: 'Đang tạo giọng nói AI...' }));

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: state.editedScript,
          voiceId: state.voiceSettings.voiceId,
          speed: state.voiceSettings.speed,
          languageCode: state.voiceSettings.languageCode || 'vi-VN',
          filePrefix: 'video_voice',
        }),
      });

      setState(prev => ({ ...prev, progress: 75, progressLabel: 'Đang xử lý kết quả...' }));

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `Lỗi server: ${response.status}` }));
        throw new Error(err.error || `Lỗi server: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.audioUrl) {
        throw new Error(data.error || 'Không nhận được audio từ server.');
      }

      setState(prev => ({
        ...prev,
        progress: 100,
        progressLabel: 'Hoàn tất!',
        isGenerating: false,
        outputAudioUrl: data.audioUrl,
        outputVideoUrl: data.audioUrl, // use audio url as output indicator
      }));

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: message,
        currentStep: 2, // Go back to step 2 on error
      }));
    }
  }, [state.editedScript, state.voiceSettings]);

  const goToStep = useCallback((step: VideoToAudioStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => {
      if (prev.videoUrl) URL.revokeObjectURL(prev.videoUrl);
      return { ...initialState };
    });
  }, []);

  return {
    state,
    // Step 1
    setVideoFile,
    clearVideo,
    // Step 2
    startAnalysis,
    updateScript,
    updateVoiceSettings,
    // Step 3
    startGeneration,
    // Navigation
    goToStep,
    reset,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
