// ============================================================================
// ModelCall.ts — Trung tâm quản lý tên model AI
// Thay đổi model ở đây sẽ ảnh hưởng toàn bộ hệ thống
// ============================================================================

// ─── GEMINI MODELS ───────────────────────────────────────────────────────────
// Tài liệu: https://ai.google.dev/gemini-api/docs/text-to-speech

export const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
// Model khác có thể dùng: 'gemini-2.5-pro-preview-tts'

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Tất cả giọng nói Gemini prebuilt hợp lệ (tên chính xác theo Google API)
export const GEMINI_VOICE_NAMES = {
    Aoede: 'Aoede',       // Nữ, nhẹ nhàng
    Kore: 'Kore',         // Nữ, rõ ràng
    Charon: 'Charon',     // Nam, trầm ấm
    Fenrir: 'Fenrir',     // Nam, mạnh mẽ
    Puck: 'Puck',         // Nam, sôi động
    Leda: 'Leda',         // Nữ, tự nhiên
    Zephyr: 'Zephyr',     // Nữ, trẻ trung
    Orus: 'Orus',         // Nam, chuyên nghiệp
    Perseus: 'Perseus',   // Nam, rõ nét
    Schedar: 'Schedar',   // Nam, sâu lắng
} as const;

export type GeminiVoiceName = typeof GEMINI_VOICE_NAMES[keyof typeof GEMINI_VOICE_NAMES];

// ─── ELEVENLABS MODELS ───────────────────────────────────────────────────────
// Tài liệu: https://elevenlabs.io/docs/api-reference/text-to-speech

// Model mặc định — hỗ trợ đa ngôn ngữ, chất lượng cao
export const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2';

// Model nhanh hơn — hỗ trợ speed control
export const ELEVENLABS_TURBO_MODEL = 'eleven_turbo_v2_5';

// Model flash — nhanh nhất, cũng hỗ trợ speed
export const ELEVENLABS_FLASH_MODEL = 'eleven_flash_v2_5';

export const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Header key name cho ElevenLabs API
export const ELEVENLABS_API_HEADER = 'xi-api-key';

// ─── PROVIDER TYPES ──────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'elevenlabs';

// Helper: chọn model ElevenLabs dựa vào có cần speed control hay không
export function getElevenLabsModel(needsSpeedControl: boolean = false): string {
    return needsSpeedControl ? ELEVENLABS_TURBO_MODEL : ELEVENLABS_TTS_MODEL;
}
