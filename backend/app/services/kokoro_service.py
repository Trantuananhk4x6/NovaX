"""
KokoroService — Production Kokoro TTS (Kokoro-82M)
===================================================

Architecture:
  One KModel shared across all languages (loaded once, stays in GPU).
  One KPipeline per lang_code (created lazily, reuses KModel).
  asyncio.Semaphore(1) serialises GPU jobs — RTX 3060 12 GB, one at a time.

Vietnamese support (verified working):
  Kokoro doesn't ship with a Vietnamese G2P, but we patch LANG_CODES to add
  lang_code='v' → espeak-ng Vietnamese G2P.
  Auto-detection: if text contains Vietnamese diacritics → use 'v' pipeline.
  The VOICE stays as requested (am_adam, af_bella, etc.) → Adam speaks Vietnamese!

  Test result:
    Input:    "Xin chào thế giới"
    Phonemes: "sˈin ʧˈaː2w tˈeɜ zˈəːɜj"
    Output:   2.88s WAV — Adam voice speaking Vietnamese ✅

Language auto-detection priority:
  đĐơưƠƯ + tonal diacritics → Vietnamese ('v')
  CJK Unified Ideographs (4E00–9FFF) → Chinese ('z')
  Hiragana/Katakana (3040–30FF) → Japanese ('j')
  Hangul (AC00–D7AF) → Korean (espeak-ng ko, uses 'k')
  Default → American English ('a')
"""
from __future__ import annotations

import asyncio
import glob
import io
import logging
import os
import re
import time
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf
import torch

from app.services.tts_provider import TTSProvider, VoiceInfo

log = logging.getLogger("kokoro_service")

SAMPLE_RATE = 24_000

# ─────────────────────────────────────────────────────────────────────────────
# Patch Kokoro LANG_CODES to add Vietnamese + Korean (espeak-ng based)
# Must happen BEFORE any KPipeline is instantiated.
# ─────────────────────────────────────────────────────────────────────────────
def _patch_kokoro_langs() -> None:
    try:
        import kokoro.pipeline as _kp
        if 'v' not in _kp.LANG_CODES:
            _kp.LANG_CODES['v'] = 'vi'       # Vietnamese via espeak-ng
            _kp.ALIASES['vi']    = 'v'
            _kp.ALIASES['vi-vn'] = 'v'
            log.info("Kokoro LANG_CODES patched: added Vietnamese ('v' → espeak vi)")
        if 'k' not in _kp.LANG_CODES:
            _kp.LANG_CODES['k'] = 'ko'       # Korean via espeak-ng
            _kp.ALIASES['ko']    = 'k'
            log.info("Kokoro LANG_CODES patched: added Korean ('k' → espeak ko)")
    except Exception as e:
        log.warning("Could not patch Kokoro LANG_CODES: %s", e)


# ─────────────────────────────────────────────────────────────────────────────
# Language auto-detection from text content
# ─────────────────────────────────────────────────────────────────────────────

# Vietnamese-specific Unicode characters.
# đ/Đ alone is sufficient to identify Vietnamese.
# ơ, ư and their tonal variants are also exclusively Vietnamese.
_VI_CHARS = frozenset(
    "đĐơƠưƯ"
    # Tonal vowels unique to Vietnamese
    "ắặẳẵăẦẬẨẪẤầậẩẫấ"
    "ợởỡờớỏọõôồổỗộố"
    "ựửữừứụủũ"
    "ẻẹẽềểễệế"
    "ỉịỉ"
    "ỵỷỹý"
)


def _detect_lang(text: str) -> str:
    """
    Infer KPipeline lang_code from text content.
    Returns one of: 'v' (vi), 'z' (zh), 'j' (ja), 'k' (ko), 'a' (en-us, default).
    """
    for ch in text:
        if ch in _VI_CHARS:
            return 'v'                          # Vietnamese
    for ch in text:
        cp = ord(ch)
        if 0x4E00 <= cp <= 0x9FFF:             # CJK Unified Ideographs
            return 'z'                          # Chinese
        if 0x3040 <= cp <= 0x30FF:             # Hiragana + Katakana
            return 'j'                          # Japanese
        if 0xAC00 <= cp <= 0xD7AF:             # Hangul Syllables
            return 'k'                          # Korean
    return 'a'                                  # Default: American English


# Voice name → KPipeline lang_code (for non-auto cases)
_VOICE_TO_LANG: dict[str, str] = {
    "a": "a",  "b": "b",  "e": "e",  "f": "f",
    "h": "h",  "i": "i",  "j": "j",  "p": "p",
    "z": "z",  "v": "v",  "k": "k",
}


def _lang_from_voice(voice: str) -> str:
    """Fallback: infer lang from voice prefix (e.g. 'am_adam' → 'a')."""
    return _VOICE_TO_LANG.get(voice[0] if voice else "", "a")


# ─────────────────────────────────────────────────────────────────────────────
# Vietnamese sentence splitter
# Kokoro's EspeakG2P warns: "Chunking logic not yet implemented for non-EN."
# Split Vietnamese at sentence boundaries before passing to pipeline.
# ─────────────────────────────────────────────────────────────────────────────
_VI_SPLIT_RE = re.compile(r'(?<=[.!?…])\s+|(?<=[。！？])')


def _split_vietnamese(text: str, max_chars: int = 300) -> list[str]:
    """Split Vietnamese text at sentence boundaries for the espeak G2P."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    # Split on sentence-ending punctuation
    parts = _VI_SPLIT_RE.split(text)
    chunks: list[str] = []
    buf = ""
    for p in parts:
        if not p.strip():
            continue
        candidate = (buf + " " + p).strip() if buf else p
        if len(candidate) <= max_chars:
            buf = candidate
        else:
            if buf:
                chunks.append(buf)
            buf = p
    if buf:
        chunks.append(buf)
    return chunks or [text]


# ─────────────────────────────────────────────────────────────────────────────
# Service
# ─────────────────────────────────────────────────────────────────────────────
class KokoroService(TTSProvider):
    """
    Singleton.  Call load() once from FastAPI lifespan.
    Supports all Kokoro languages + Vietnamese + Korean via espeak-ng.
    Auto-detects input language; voice characteristics are always preserved.
    """

    engine_name = "kokoro"

    def __init__(self) -> None:
        self._model        = None
        self._pipelines: dict[str, object] = {}
        self._raw_voices:  list[str]       = []
        self._gpu_sem:     Optional[asyncio.Semaphore] = None
        self.device:       str = "cuda" if torch.cuda.is_available() else "cpu"
        self.sample_rate:  int = SAMPLE_RATE
        self.repo_id:      str = "hexgrad/Kokoro-82M"
        self._ready:       bool = False

    # ── startup ───────────────────────────────────────────────────────────────
    def load(self, repo_id: str = "hexgrad/Kokoro-82M") -> None:
        from kokoro import KModel, KPipeline  # type: ignore[import-untyped]

        # Patch LANG_CODES before any KPipeline is created
        _patch_kokoro_langs()

        self.repo_id = repo_id
        log.info("Loading KModel(%s) → %s …", repo_id, self.device)
        t0 = time.time()
        self._model = KModel(repo_id=repo_id).to(self.device).eval()
        log.info("KModel ready in %.1f s  VRAM: %.2f GB",
                 time.time() - t0,
                 torch.cuda.memory_allocated() / 1e9 if self.device == "cuda" else 0)

        # Pre-create American English pipeline
        log.info("Creating KPipeline('a') — American English …")
        self._pipelines["a"] = KPipeline(lang_code="a", repo_id=repo_id, model=self._model)

        # Pre-create Vietnamese pipeline (confirms espeak-ng vi is working)
        log.info("Creating KPipeline('v') — Vietnamese via espeak-ng …")
        try:
            self._pipelines["v"] = KPipeline(lang_code="v", repo_id=repo_id, model=self._model)
            log.info("Vietnamese pipeline ready ✅")
        except Exception as e:
            log.warning("Vietnamese pipeline failed (espeak-ng vi may not be installed): %s", e)

        self._raw_voices = self._scan_voices()
        self._gpu_sem    = asyncio.Semaphore(1)
        self._ready      = True
        log.info("KokoroService ready. Voices: %d  Languages: auto-detect+vi+ko+zh+ja", len(self._raw_voices))

    # ── voice discovery ───────────────────────────────────────────────────────
    def _scan_voices(self) -> list[str]:
        pattern = os.path.expanduser(
            "~/.cache/huggingface/hub/models--hexgrad--Kokoro-82M/snapshots/*/voices/*.pt"
        )
        voices = sorted({Path(f).stem for f in glob.glob(pattern)})
        if not voices:
            voices = [
                "af_aoede", "af_bella", "af_heart", "af_jessica", "af_kore",
                "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
                "am_adam",  "am_echo",  "am_eric",  "am_fenrir", "am_liam",
                "am_michael", "am_onyx", "am_puck",
            ]
        return voices

    def is_ready(self) -> bool:
        return self._ready

    def list_voices(self) -> list[VoiceInfo]:
        """Return VoiceInfo for every downloaded Kokoro voice."""
        return [
            VoiceInfo(id=v, name=v, engine=self.engine_name,
                      language="multi", gender=("female" if v[1] == "f" else "male"))
            for v in self._raw_voices
        ]

    def list_voice_ids(self) -> list[str]:
        return list(self._raw_voices)

    def refresh_voices(self) -> list[VoiceInfo]:
        self._raw_voices = self._scan_voices()
        return self.list_voices()

    # ── pipeline management ───────────────────────────────────────────────────
    def _get_pipeline(self, lang_code: str):
        if lang_code not in self._pipelines:
            from kokoro import KPipeline  # type: ignore[import-untyped]
            log.info("Creating KPipeline(lang_code='%s') lazily …", lang_code)
            self._pipelines[lang_code] = KPipeline(
                lang_code=lang_code, repo_id=self.repo_id, model=self._model
            )
        return self._pipelines[lang_code]

    # ── synchronous inference ─────────────────────────────────────────────────
    def _generate_sync(self, text: str, voice: str, speed: float) -> bytes:
        """
        Auto-detect language from text → pick correct G2P pipeline.
        Voice identity (timbre, style) is always from the requested voice pack.
        E.g. Adam voice will speak Vietnamese if Vietnamese text is detected.
        """
        # Detect language from text content (overrides voice prefix)
        lang_code = _detect_lang(text)
        log.info("Lang detected: '%s' | voice=%s | chars=%d", lang_code, voice, len(text))

        # Validate voice
        pipeline = self._get_pipeline(lang_code)
        try:
            pipeline.load_voice(voice)
        except Exception as exc:
            raise ValueError(
                f"Voice '{voice}' not found. "
                f"Available: {', '.join(self._raw_voices[:8])}..."
            ) from exc

        t0 = time.time()
        parts: list[np.ndarray] = []

        # For Vietnamese / Korean (espeak-based), pre-split into sentences
        # because espeak G2P doesn't implement chunking for long texts.
        if lang_code in ('v', 'k'):
            segments = _split_vietnamese(text)
            log.debug("Vietnamese/Korean: %d sentence segments", len(segments))
        else:
            segments = [text]

        for segment in segments:
            if not segment.strip():
                continue
            for graphemes, phonemes, audio in pipeline(segment, voice=voice, speed=speed):
                if audio is None:
                    continue
                chunk = audio.cpu().float().numpy() if hasattr(audio, "cpu") else np.asarray(audio, dtype=np.float32)
                if chunk.ndim > 1:
                    chunk = chunk.squeeze()
                parts.append(chunk)

        if not parts:
            raise RuntimeError(
                f"No audio produced for voice='{voice}' lang='{lang_code}'. "
                "For Vietnamese, ensure espeak-ng is installed: sudo apt install espeak-ng"
            )

        full = np.concatenate(parts).astype(np.float32)
        log.info("Generated %.2f s | voice=%s lang=%s speed=%.2f took=%.2f s",
                 len(full) / self.sample_rate, voice, lang_code, speed, time.time() - t0)

        buf = io.BytesIO()
        sf.write(buf, full, self.sample_rate, format="WAV", subtype="PCM_16")
        buf.seek(0)
        return buf.read()

    # ── async public API ──────────────────────────────────────────────────────
    async def generate_wav(self, text: str, voice: str, speed: float = 1.0) -> bytes:
        if self._model is None:
            raise RuntimeError("KokoroService not loaded — call load() first")
        loop = asyncio.get_event_loop()
        async with self._gpu_sem:  # type: ignore[union-attr]
            return await loop.run_in_executor(None, self._generate_sync, text, voice, speed)

    def shutdown(self) -> None:
        self._model = None
        self._pipelines.clear()
        if self.device == "cuda":
            torch.cuda.empty_cache()
        log.info("KokoroService shut down.")
