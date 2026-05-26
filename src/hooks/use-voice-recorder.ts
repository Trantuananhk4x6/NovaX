'use client';
// ============================================================================
// useVoiceRecorder — Live Audio Recorder Hook
// Layer 3 — MediaRecorder + Web Audio API for voice recording with
//           realtime waveform visualization data
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { RecorderState, MIN_RECORDING_DURATION } from '@/types/voice.types';
import { getPreferredMimeType } from '@/lib/audio-utils';

interface UseVoiceRecorderReturn {
  // ── State ──────────────────────────────────────────────
  recorder: RecorderState;
  canComplete: boolean;

  // ── Actions ────────────────────────────────────────────
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [recorder, setRecorder] = useState<RecorderState>({
    isRecording: false,
    audioBlob: null,
    recordingTime: 0,
    audioUrl: null,
    waveformData: [],
    error: null,
    permissionGranted: false,
  });

  // ── Refs for MediaRecorder and Web Audio API ───────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const objectUrlRef = useRef<string | null>(null);

  // ── Derived: Can user complete the recording? ──────────
  const canComplete = recorder.isRecording && recorder.recordingTime >= MIN_RECORDING_DURATION;

  // ─────────────────────────────────────────────────────────
  // startRecording — Initialize mic, MediaRecorder, and
  //                  Web Audio API for waveform extraction
  //
  // Pipeline:
  //   getUserMedia → MediaStream → MediaRecorder (data chunks)
  //                              → AudioContext → AnalyserNode (waveform)
  // ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      // Step 1: Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Step 2: Set up MediaRecorder for audio data capture
      const mimeType = getPreferredMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Collect data every 250ms for smoother assembly
      mediaRecorder.start(250);

      // Step 3: Set up Web Audio API for realtime waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // 128 frequency bins — enough for visualization
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Step 4: Start waveform data extraction loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Convert Uint8Array to regular number array for React state
          setRecorder(prev => ({
            ...prev,
            waveformData: Array.from(dataArray),
          }));
          animFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      };
      updateWaveform();

      // Step 5: Start recording timer (updates every second)
      timerRef.current = setInterval(() => {
        setRecorder(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);

      // Step 6: Update state
      setRecorder(prev => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        error: null,
        permissionGranted: true,
        audioBlob: null,
        audioUrl: null,
        waveformData: [],
      }));
    } catch (err) {
      // Handle mic permission denied or other errors
      const errorMessage = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Quyền truy cập microphone bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.'
        : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'Không tìm thấy microphone. Vui lòng kết nối microphone và thử lại.'
          : 'Lỗi khi khởi tạo ghi âm. Vui lòng thử lại.';

      setRecorder(prev => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
      }));
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // stopRecording — Stop all tracks, assemble Blob, create
  //                 preview URL for playback
  //
  // Cleanup order:
  // 1. Stop timer
  // 2. Cancel animation frame
  // 3. Stop MediaRecorder → assemble Blob
  // 4. Stop all media stream tracks (release mic)
  // 5. Close AudioContext
  // 6. Create Object URL for preview
  // ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    // 1. Stop the recording timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 2. Cancel waveform animation loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }

    // 3. Stop MediaRecorder and assemble final Blob
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Revoke previous URL if exists
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        // Create new preview URL
        const audioUrl = URL.createObjectURL(audioBlob);
        objectUrlRef.current = audioUrl;

        setRecorder(prev => ({
          ...prev,
          isRecording: false,
          audioBlob,
          audioUrl,
          waveformData: [],
        }));
      };

      mediaRecorder.stop();
    }

    // 4. Release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 5. Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // resetRecording — Clear all state for a new recording
  // ─────────────────────────────────────────────────────────
  const resetRecording = useCallback(() => {
    // Make sure we stop if still recording
    stopRecording();

    // Revoke Object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setRecorder({
      isRecording: false,
      audioBlob: null,
      recordingTime: 0,
      audioUrl: null,
      waveformData: [],
      error: null,
      permissionGranted: false,
    });
  }, [stopRecording]);

  // ── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return {
    recorder,
    canComplete,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
