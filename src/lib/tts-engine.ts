// ============================================================================
// TTS Engine — Pure Logic Functions
// Layer 2 — No React dependencies. Pure input → output transformations.
// ============================================================================

import { EstimatedDuration } from '@/types/tts.types';

/** Average words per minute for Vietnamese TTS narration */
const WORDS_PER_MINUTE = 150;

/**
 * Count the number of characters in text, excluding SSML tags.
 * This gives an accurate character count for billing purposes.
 *
 * @param text - Raw text that may contain SSML tags
 * @returns Character count excluding SSML markup
 */
export function countCharacters(text: string): number {
  // Strip all SSML tags like <break time="1.0s"/>
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped.length;
}

/**
 * Count the number of words in text, excluding SSML tags.
 * Uses a regex that handles Vietnamese (multi-byte) and Latin word boundaries.
 *
 * @param text - Raw text that may contain SSML tags
 * @returns Word count
 */
export function countWords(text: string): number {
  const stripped = text.replace(/<[^>]*>/g, '').trim();
  if (stripped.length === 0) return 0;
  // Split on whitespace boundaries — works for Vietnamese and Latin scripts
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate estimated audio duration based on word count and speed.
 *
 * Formula:
 *   duration = (wordCount / WORDS_PER_MINUTE) / speed  (in minutes)
 *
 * Additionally accounts for SSML break tags that add explicit pauses.
 *
 * @param text  - The script text (may include SSML)
 * @param speed - Playback speed multiplier (0.5x – 2.0x)
 * @returns EstimatedDuration with total seconds and MM:SS format
 */
export function calculateEstimatedDuration(
  text: string,
  speed: number = 1.0
): EstimatedDuration {
  const wordCount = countWords(text);

  // Base duration from word count
  const baseDurationMinutes = wordCount / WORDS_PER_MINUTE;
  const baseDurationSeconds = baseDurationMinutes * 60;

  // Sum up all SSML <break> tag durations
  const breakDuration = extractBreakDurations(text);

  // Apply speed multiplier (faster speed = shorter duration)
  const adjustedSeconds = baseDurationSeconds / Math.max(speed, 0.1) + breakDuration;
  const totalSeconds = Math.max(0, Math.round(adjustedSeconds));

  return {
    totalSeconds,
    formatted: formatDurationMMSS(totalSeconds),
    wordCount,
  };
}

/**
 * Extract and sum all SSML <break> tag durations.
 *
 * Matches patterns like:
 *   <break time="1.0s"/>
 *   <break time="500ms"/>
 *   <break time="2s"/>
 *
 * @param text - Text containing SSML break tags
 * @returns Total break duration in seconds
 */
export function extractBreakDurations(text: string): number {
  const breakRegex = /<break\s+time="([\d.]+)(s|ms)"\s*\/>/g;
  let totalSeconds = 0;
  let match: RegExpExecArray | null;

  while ((match = breakRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    totalSeconds += unit === 'ms' ? value / 1000 : value;
  }

  return totalSeconds;
}

/**
 * Format seconds into MM:SS display string.
 *
 * @param totalSeconds - Duration in seconds
 * @returns Formatted string like "01:30"
 */
export function formatDurationMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Insert text at a specific cursor position without overwriting existing content.
 * Used for script template injection and SSML tag insertion.
 *
 * @param originalText  - The current text in the textarea
 * @param insertion     - The text to insert
 * @param cursorPos     - The cursor position (selectionStart)
 * @returns Object with new text and new cursor position after insertion
 */
export function insertAtCursor(
  originalText: string,
  insertion: string,
  cursorPos: number
): { text: string; cursorPos: number } {
  const before = originalText.slice(0, cursorPos);
  const after = originalText.slice(cursorPos);
  const text = before + insertion + after;
  return {
    text,
    cursorPos: cursorPos + insertion.length,
  };
}

/**
 * Generate an SSML break tag with the specified duration.
 *
 * @param seconds - Break duration in seconds (e.g., 1.0)
 * @returns SSML break tag string
 */
export function generateSSMLBreak(seconds: number = 1.0): string {
  return `<break time="${seconds.toFixed(1)}s"/>`;
}

/**
 * Validate TTS text input.
 *
 * @param text     - The text to validate
 * @param maxChars - Maximum character limit
 * @returns Validation result with error message if invalid
 */
export function validateTTSText(
  text: string,
  maxChars: number
): { valid: boolean; error?: string } {
  const charCount = countCharacters(text);

  if (text.trim().length === 0) {
    return { valid: false, error: 'Vui lòng nhập văn bản để chuyển đổi.' };
  }

  if (charCount > maxChars) {
    return {
      valid: false,
      error: `Văn bản vượt quá giới hạn ${maxChars.toLocaleString('vi-VN')} ký tự (hiện tại: ${charCount.toLocaleString('vi-VN')}).`,
    };
  }

  return { valid: true };
}

/**
 * Truncate text for preview display.
 *
 * @param text      - Full text
 * @param maxLength - Maximum preview length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateForPreview(text: string, maxLength: number = 80): string {
  const stripped = text.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + '...';
}
