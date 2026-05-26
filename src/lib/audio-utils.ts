// ============================================================================
// Audio Utilities — Pure Logic Functions
// Layer 2 — File validation, format conversion, and audio helpers
// ============================================================================

import {
  AudioFileValidation,
  ACCEPTED_AUDIO_FORMATS,
  ACCEPTED_AUDIO_MIMES,
  MAX_AUDIO_FILE_SIZE_MB,
} from '@/types/voice.types';

/**
 * Validate an uploaded audio file for voice cloning.
 *
 * Checks:
 * 1. File extension is .mp3, .wav, or .m4a
 * 2. MIME type matches audio/*
 * 3. File size is under MAX_AUDIO_FILE_SIZE_MB (10MB)
 *
 * @param file - The File object from input or drag-drop
 * @returns Validation result with error message if invalid
 */
export function validateAudioFile(file: File): AudioFileValidation {
  // Check file extension
  const fileName = file.name.toLowerCase();
  const extension = '.' + fileName.split('.').pop();
  const hasValidExtension = ACCEPTED_AUDIO_FORMATS.includes(extension);

  // Check MIME type
  const hasValidMime = ACCEPTED_AUDIO_MIMES.includes(file.type) ||
    file.type.startsWith('audio/');

  if (!hasValidExtension && !hasValidMime) {
    return {
      valid: false,
      error: `Định dạng không hợp lệ. Chỉ chấp nhận: ${ACCEPTED_AUDIO_FORMATS.join(', ')}`,
    };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_AUDIO_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File quá lớn (${sizeMB.toFixed(1)}MB). Giới hạn tối đa: ${MAX_AUDIO_FILE_SIZE_MB}MB.`,
      sizeMB,
    };
  }

  return {
    valid: true,
    file,
    sizeMB,
  };
}

/**
 * Format seconds into a human-readable duration string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1:30", "0:05")
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes into human-readable file size.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "150 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Create a safe Object URL from a Blob, returning a cleanup function.
 * Prevents memory leaks by revoking the URL when no longer needed.
 *
 * @param blob - Audio Blob data
 * @returns Object with url string and revoke() cleanup function
 */
export function createSafeObjectURL(blob: Blob): {
  url: string;
  revoke: () => void;
} {
  const url = URL.createObjectURL(blob);
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  };
}

/**
 * Generate a unique ID for history items and transactions.
 * Uses timestamp + random suffix for uniqueness.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get the preferred audio MIME type for MediaRecorder.
 * Falls back through formats based on browser support.
 *
 * @returns Best supported MIME type string
 */
export function getPreferredMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];

  if (typeof MediaRecorder !== 'undefined') {
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
  }

  return 'audio/webm'; // Fallback
}
