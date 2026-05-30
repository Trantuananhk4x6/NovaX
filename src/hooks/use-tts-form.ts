'use client';
// ============================================================================
// useTTSForm — Text-to-Speech Form Hook
// Layer 3 — Manages TTS form state, character counting, duration estimation,
//           script injection, SSML insertion, validation, and API submission
// ============================================================================

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { TTSFormState, DEFAULT_TTS_FORM, TTSGenerationState, TTS_CHAR_LIMIT } from '@/types/tts.types';
import {
  countCharacters,
  calculateEstimatedDuration,
  insertAtCursor,
  generateSSMLBreak,
  validateTTSText,
} from '@/lib/tts-engine';

interface UseTTSFormReturn {
  // ── State ──────────────────────────────────────────────
  ttsForm: TTSFormState;
  generation: TTSGenerationState;
  charCount: number;
  estimatedDuration: ReturnType<typeof calculateEstimatedDuration>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;

  // ── Handlers ───────────────────────────────────────────
  handleTextChange: (text: string) => void;
  handleFieldChange: <K extends keyof TTSFormState>(field: K, value: TTSFormState[K]) => void;
  injectTemplate: (templateContent: string) => void;
  injectSSMLBreak: (breakSeconds?: number) => void;
  handleSubmitTTS: () => Promise<void>;
  resetGeneration: () => void;
  clearShake: () => void;
}

export function useTTSForm(charLimit: number = TTS_CHAR_LIMIT, provider: string = 'gemini'): UseTTSFormReturn {
  // ── Core form state ────────────────────────────────────
  const [ttsForm, setTtsForm] = useState<TTSFormState>(DEFAULT_TTS_FORM);

  // ── Generation state machine ───────────────────────────
  const [generation, setGeneration] = useState<TTSGenerationState>({
    isGenerating: false,
    progress: 0,
    error: null,
    shouldShake: false,
    result: null,
  });

  // ── Textarea ref for cursor position tracking ──────────
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Load quick text from Dashboard if navigated from there ─
  useEffect(() => {
    try {
      const quickText = sessionStorage.getItem('novax_quick_text');
      if (quickText) {
        setTtsForm(prev => ({ ...prev, text: quickText }));
        sessionStorage.removeItem('novax_quick_text');
      }
    } catch { /* ignore */ }
  }, []);

  // ── Derived state: character count (excludes SSML tags) ─
  const charCount = useMemo(() => countCharacters(ttsForm.text), [ttsForm.text]);

  // ── Derived state: estimated audio duration ────────────
  const estimatedDuration = useMemo(
    () => calculateEstimatedDuration(ttsForm.text, ttsForm.speed),
    [ttsForm.text, ttsForm.speed]
  );

  // ─────────────────────────────────────────────────────────
  // handleTextChange — Update text and trigger realtime counts
  // ─────────────────────────────────────────────────────────
  const handleTextChange = useCallback((text: string) => {
    setTtsForm(prev => ({ ...prev, text }));
    // Clear any existing errors when user starts typing
    setGeneration(prev => ({ ...prev, error: null, shouldShake: false }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // handleFieldChange — Generic field updater for sliders etc
  // ─────────────────────────────────────────────────────────
  const handleFieldChange = useCallback(<K extends keyof TTSFormState>(
    field: K,
    value: TTSFormState[K]
  ) => {
    setTtsForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // injectTemplate — Insert template at cursor position
  //
  // Instead of replacing the entire text, this inserts the
  // template content at the current cursor position (selectionStart).
  // This preserves any existing text the user has typed.
  // ─────────────────────────────────────────────────────────
  const injectTemplate = useCallback((templateContent: string) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? ttsForm.text.length;

    const result = insertAtCursor(ttsForm.text, templateContent, cursorPos);

    setTtsForm(prev => ({ ...prev, text: result.text }));

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(result.cursorPos, result.cursorPos);
      }
    });
  }, [ttsForm.text]);

  // ─────────────────────────────────────────────────────────
  // injectSSMLBreak — Insert <break time="X.Xs"/> at cursor
  //
  // Adds a pause tag at the current cursor position for
  // TikTok-style pacing (hook → pause → reveal pattern).
  // ─────────────────────────────────────────────────────────
  const injectSSMLBreak = useCallback((breakSeconds: number = 1.0) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? ttsForm.text.length;

    const breakTag = generateSSMLBreak(breakSeconds);
    const result = insertAtCursor(ttsForm.text, breakTag, cursorPos);

    setTtsForm(prev => ({ ...prev, text: result.text }));

    // Restore cursor position after the inserted tag
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(result.cursorPos, result.cursorPos);
      }
    });
  }, [ttsForm.text]);

  // ─────────────────────────────────────────────────────────
  // handleSubmitTTS — Validate, submit to API, handle response
  //
  // Flow:
  // 1. Validate text (not empty, within char limit)
  // 2. If invalid → trigger shake animation + show error
  // 3. If valid → POST to /api/tts/generate
  // 4. On success → store result (audioUrl) for player
  // 5. On error → show error message
  // ─────────────────────────────────────────────────────────
  const handleSubmitTTS = useCallback(async () => {
    // Step 1: Validate
    const validation = validateTTSText(ttsForm.text, charLimit);

    if (!validation.valid) {
      setGeneration(prev => ({
        ...prev,
        error: validation.error ?? 'Lỗi không xác định',
        shouldShake: true,
      }));
      return;
    }

    if (!ttsForm.voiceId) {
      setGeneration(prev => ({
        ...prev,
        error: 'Vui lòng chọn giọng nói trước khi tạo.',
        shouldShake: true,
      }));
      return;
    }

    // Step 2: Start generation
    setGeneration({
      isGenerating: true,
      progress: 0,
      error: null,
      shouldShake: false,
      result: null,
    });

    try {
      // Step 3: POST to API endpoint
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsForm.text,
          voiceId: ttsForm.voiceId,
          speed: ttsForm.speed,
          pitch: ttsForm.pitch,
          stability: ttsForm.stability,
          clarity: ttsForm.clarity,
          languageCode: ttsForm.languageCode,
          filePrefix: ttsForm.filePrefix,
          provider, // truyền provider để server biết dùng Gemini hay ElevenLabs
        }),
      });

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.details || errorData?.error || errorMsg;
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Step 4: Handle success
      if (data.success) {
        setGeneration({
          isGenerating: false,
          progress: 100,
          error: null,
          shouldShake: false,
          result: data,
        });
      } else {
        throw new Error(data.error || 'Lỗi không xác định từ server');
      }
    } catch (err) {
      // Step 5: Handle errors (network, permission, server)
      const errorMessage = err instanceof Error
        ? err.message
        : 'Đã xảy ra lỗi. Vui lòng thử lại.';

      setGeneration({
        isGenerating: false,
        progress: 0,
        error: `Lỗi: ${errorMessage}`,
        shouldShake: true,
        result: null,
      });
    }
  }, [ttsForm, charLimit]);

  // ─────────────────────────────────────────────────────────
  // resetGeneration — Clear generation result to start fresh
  // ─────────────────────────────────────────────────────────
  const resetGeneration = useCallback(() => {
    setGeneration({
      isGenerating: false,
      progress: 0,
      error: null,
      shouldShake: false,
      result: null,
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // clearShake — Remove shake animation class after it plays
  // ─────────────────────────────────────────────────────────
  const clearShake = useCallback(() => {
    setGeneration(prev => ({ ...prev, shouldShake: false }));
  }, []);

  return {
    ttsForm,
    generation,
    charCount,
    estimatedDuration,
    textareaRef,
    handleTextChange,
    handleFieldChange,
    injectTemplate,
    injectSSMLBreak,
    handleSubmitTTS,
    resetGeneration,
    clearShake,
  };
}
