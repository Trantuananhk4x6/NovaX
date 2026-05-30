-- Run this in the Neon SQL editor (https://console.neon.tech)
-- Adds tts_provider column to users and creates voice_previews cache table

-- 1. Add tts_provider to users (safe: does nothing if column exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tts_provider TEXT DEFAULT 'gemini';

-- 2. Create voice_previews cache table
CREATE TABLE IF NOT EXISTS voice_previews (
  id          TEXT PRIMARY KEY,
  provider    TEXT NOT NULL,
  voice_id    TEXT NOT NULL,
  preview_text TEXT NOT NULL,
  audio_url   TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_voice_previews_lookup
  ON voice_previews (provider, voice_id);
