'use client';
// ============================================================================
// useVoiceCloning — Voice Cloning Workflow Hook
// Layer 3 — Manages file upload validation, cloning API call with simulated
//           progress, and auto-push of new voice to global voice list
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { VoiceCloningState, Voice, VoiceCategory, CLONING_PHASES } from '@/types/voice.types';
import { AudioFileValidation } from '@/types/voice.types';
import { validateAudioFile } from '@/lib/audio-utils';

interface UseVoiceCloningReturn {
  // ── State ──────────────────────────────────────────────
  cloning: VoiceCloningState;
  uploadedFile: File | null;
  uploadError: string | null;
  voiceName: string;
  voiceDescription: string;
  voiceCategory: VoiceCategory;

  // ── Actions ────────────────────────────────────────────
  handleAudioFileUpload: (file: File) => AudioFileValidation;
  clearUploadedFile: () => void;
  setVoiceName: (name: string) => void;
  setVoiceDescription: (desc: string) => void;
  setVoiceCategory: (cat: VoiceCategory) => void;
  handleStartVoiceCloning: (
    audioSource: Blob | File,
    languageCode: string,
    onSuccess: (newVoice: Voice) => void,
    transcript?: string,
  ) => Promise<void>;
  resetCloning: () => void;
}

export function useVoiceCloning(): UseVoiceCloningReturn {
  const [cloning, setCloning] = useState<VoiceCloningState>({
    isCloning: false,
    progress: 0,
    phaseLabel: '',
    error: null,
    result: null,
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceCategory, setVoiceCategory] = useState<VoiceCategory>('general');

  // Ref to hold interval ID for cleanup
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─────────────────────────────────────────────────────────
  // handleAudioFileUpload — Validate dropped/selected file
  //
  // Checks format (.mp3, .wav, .m4a) and size (<10MB).
  // Sets error state with visual feedback if invalid.
  // ─────────────────────────────────────────────────────────
  const handleAudioFileUpload = useCallback((file: File): AudioFileValidation => {
    const validation = validateAudioFile(file);

    if (validation.valid) {
      setUploadedFile(file);
      setUploadError(null);
    } else {
      setUploadedFile(null);
      setUploadError(validation.error ?? 'File không hợp lệ');
    }

    return validation;
  }, []);

  // ─────────────────────────────────────────────────────────
  // handleStartVoiceCloning — Full cloning workflow
  //
  // Flow:
  // 1. Create FormData with audio file + voice metadata
  // 2. POST to /api/voice/clone
  // 3. Simulate progress bar (0→100% in ~5 seconds)
  //    with phase labels showing "AI learning" stages
  // 4. On success: create new Voice object and push to
  //    the global voice list via onSuccess callback
  // ─────────────────────────────────────────────────────────
  const handleStartVoiceCloning = useCallback(async (
    audioSource: Blob | File,
    languageCode: string,
    onSuccess: (newVoice: Voice) => void,
    transcript = '',
  ) => {
    if (!voiceName.trim()) {
      setCloning(prev => ({
        ...prev,
        error: 'Vui lòng đặt tên cho giọng nói.',
      }));
      return;
    }

    // Step 1: Build FormData
    const formData = new FormData();
    formData.append('audio', audioSource, 'voice_sample.webm');
    formData.append('voiceName', voiceName);
    formData.append('voiceDescription', voiceDescription);
    formData.append('category', voiceCategory);
    formData.append('languageCode', languageCode);
    formData.append('transcript', transcript);

    // Step 2: Start cloning state
    setCloning({
      isCloning: true,
      progress: 0,
      phaseLabel: CLONING_PHASES[0].label,
      error: null,
      result: null,
    });

    try {
      // Step 3: POST to API (runs concurrently with progress simulation)
      const apiPromise = fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      });

      // Step 4: Simulate progress bar animation (5 seconds total)
      const progressPromise = new Promise<void>((resolve) => {
        let currentProgress = 0;
        const totalDuration = 5000; // 5 seconds
        const intervalMs = 50;     // Update every 50ms
        const increment = 100 / (totalDuration / intervalMs);

        progressIntervalRef.current = setInterval(() => {
          currentProgress = Math.min(currentProgress + increment, 99);

          // Find current phase based on progress threshold
          const currentPhase = CLONING_PHASES.find(p => currentProgress <= p.threshold)
            ?? CLONING_PHASES[CLONING_PHASES.length - 1];

          setCloning(prev => ({
            ...prev,
            progress: Math.round(currentProgress),
            phaseLabel: currentPhase.label,
          }));

          if (currentProgress >= 99) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            resolve();
          }
        }, intervalMs);
      });

      // Wait for both API call and progress animation
      const [response] = await Promise.all([apiPromise, progressPromise]);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.voice) {
        // Step 5: Complete progress to 100%
        const finalPhase = CLONING_PHASES[CLONING_PHASES.length - 1];
        setCloning({
          isCloning: false,
          progress: 100,
          phaseLabel: finalPhase.label,
          error: null,
          result: data,
        });

        // Step 6: Push new voice to the global voice list
        onSuccess(data.voice);
      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      const errorMessage = err instanceof Error
        ? err.message
        : 'Đã xảy ra lỗi khi nhân bản giọng nói.';

      setCloning({
        isCloning: false,
        progress: 0,
        phaseLabel: '',
        error: errorMessage,
        result: null,
      });
    }
  }, [voiceName, voiceDescription, voiceCategory]); // transcript passed as arg, not state

  // ─────────────────────────────────────────────────────────
  // resetCloning — Clear all cloning state
  // ─────────────────────────────────────────────────────────
  const resetCloning = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setCloning({
      isCloning: false,
      progress: 0,
      phaseLabel: '',
      error: null,
      result: null,
    });
    setUploadedFile(null);
    setUploadError(null);
    setVoiceName('');
    setVoiceDescription('');
    setVoiceCategory('general');
  }, []);

  const clearUploadedFile = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
  }, []);

  return {
    cloning,
    uploadedFile,
    uploadError,
    voiceName,
    voiceDescription,
    voiceCategory,
    handleAudioFileUpload,
    clearUploadedFile,
    setVoiceName,
    setVoiceDescription,
    setVoiceCategory,
    handleStartVoiceCloning,
    resetCloning,
  };
}
