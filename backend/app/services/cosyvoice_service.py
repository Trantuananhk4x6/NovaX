"""
CosyVoice2Provider — CosyVoice2-0.5B engine
=============================================

Architecture:
  CosyVoice2 model loaded once at startup.
  Reference WAV files in VOICES_DIR define available voices.
  Uses inference_cross_lingual: reference audio sets voice identity,
  model synthesises any language (Vietnamese, English, Chinese, ...).

Vietnamese support:
  Natively supported by CosyVoice2. Pass Vietnamese reference audio →
  model produces natural Vietnamese speech with that voice character.
  No espeak-ng required. No phoneme approximation.

Voice storage:
  ~/ai-narrator/voices/cosyvoice2/<voice_id>.wav   ← reference audio (15-30s)
  ~/ai-narrator/voices/cosyvoice2/<voice_id>.txt   ← optional transcript

Inference modes used:
  inference_cross_lingual(text, prompt_wav)   ← primary (no transcript needed)
  inference_zero_shot(text, prompt_text, prompt_wav)  ← if transcript exists
"""
from __future__ import annotations

import asyncio
import io
import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional

import numpy as np
import soundfile as sf
import torch

from app.services.tts_provider import TTSProvider, VoiceInfo

log = logging.getLogger("cosyvoice_service")

# CosyVoice2 repo layout
COSY_REPO      = Path(os.getenv("COSYVOICE_REPO",  "/home/tony/cosyvoice/CosyVoice"))
COSY_MODEL_DIR = Path(os.getenv("COSYVOICE_MODEL", str(COSY_REPO / "pretrained_models/CosyVoice2-0.5B")))
COSY_VOICES    = Path(os.getenv("COSYVOICE_VOICES", "/home/tony/ai-narrator/voices/cosyvoice2"))

# Vietnamese voice name hints for metadata
_VI_NAMES = {
    "linh_truyen":  ("Linh", "vi-VN", "female", "Giọng nữ kể chuyện, nhẹ nhàng diễn cảm [88K uses]"),
    "mai_truyen2":  ("Mai",  "vi-VN", "female", "Giọng nữ sâu lắng, truyền cảm [83K uses]"),
    "phong_binhlu": ("Phong","vi-VN", "male",   "Giọng nam bình luận thể thao, hùng hồn"),
    "viet_nam_m":   ("Việt Nam", "vi-VN", "male", "Giọng nam trầm ấm, đáng tin cậy"),
    "jessica_vi":   ("Jessica","vi-VN","female", "Giọng nữ trẻ trung, tươi vui"),
    "cctv_m":       ("CCTV",  "zh-CN", "male",  "央视标准普通话配音 [136K uses]"),
    "genki_f":      ("Genki", "ja-JP", "female","元気な日本語女性の声 [210K uses]"),
    "miku":         ("Miku",  "ja-JP", "female","アニメ系の澄んだ声 [153K uses]"),
}


class CosyVoice2Provider(TTSProvider):
    """
    CosyVoice2-0.5B engine.
    Call load() once from FastAPI lifespan.
    All inference uses asyncio.Semaphore(1) for GPU safety.
    """

    engine_name = "cosyvoice2"

    def __init__(self) -> None:
        self._model    = None          # CosyVoice2 instance
        self._voices: list[VoiceInfo] = []
        self._voices_dir = COSY_VOICES
        self._gpu_sem: Optional[asyncio.Semaphore] = None
        self.device: str = "cuda" if torch.cuda.is_available() else "cpu"
        self.sample_rate: int = 24_000
        self._ready: bool = False

    # ── startup ───────────────────────────────────────────────────────────────
    def load(
        self,
        model_dir: str = str(COSY_MODEL_DIR),
        voices_dir: str = str(COSY_VOICES),
    ) -> None:
        """
        Load CosyVoice2 model.  Blocking.
        Adds CosyVoice repo to sys.path before import.
        """
        self._voices_dir = Path(voices_dir)
        self._voices_dir.mkdir(parents=True, exist_ok=True)

        # CosyVoice2 requires third_party/Matcha-TTS in sys.path
        matcha_path = str(COSY_REPO / "third_party" / "Matcha-TTS")
        repo_path   = str(COSY_REPO)
        for p in [matcha_path, repo_path]:
            if p not in sys.path:
                sys.path.insert(0, p)

        log.info("Loading CosyVoice2 from %s …", model_dir)
        t0 = time.time()

        # Import AFTER sys.path is patched
        from cosyvoice.cli.cosyvoice import CosyVoice2  # type: ignore[import-untyped]

        self._model = CosyVoice2(model_dir)
        self.sample_rate = self._model.sample_rate

        log.info(
            "CosyVoice2 ready in %.1f s  sample_rate=%d Hz  device=%s",
            time.time() - t0, self.sample_rate, self.device,
        )

        self._voices  = self._scan_voices()
        self._gpu_sem = asyncio.Semaphore(1)
        self._ready   = True
        log.info("CosyVoice2Provider ready. Voices: %d", len(self._voices))

    def is_ready(self) -> bool:
        return self._ready

    # ── voice discovery ───────────────────────────────────────────────────────
    def _scan_voices(self) -> list[VoiceInfo]:
        voices: list[VoiceInfo] = []
        for wav in sorted(self._voices_dir.glob("*.wav")):
            vid  = wav.stem
            hint = _VI_NAMES.get(vid)
            if hint:
                name, lang, gender, desc = hint
            else:
                name   = vid.replace("_", " ").title()
                lang   = "vi-VN"  # default assumption
                gender = "neutral"
                desc   = None
            voices.append(VoiceInfo(
                id=vid, name=name, engine=self.engine_name,
                language=lang, gender=gender, description=desc,
            ))
        return voices

    def list_voices(self) -> list[VoiceInfo]:
        return list(self._voices)

    def refresh_voices(self) -> list[VoiceInfo]:
        self._voices = self._scan_voices()
        return self._voices

    # ── synchronous inference ─────────────────────────────────────────────────
    def _generate_sync(self, text: str, voice: str, speed: float) -> bytes:
        """
        Cross-lingual inference:
          reference WAV  →  voice identity
          text           →  what to say (any language)
        Result: WAV bytes at self.sample_rate Hz.
        """
        ref_wav = self._voices_dir / f"{voice}.wav"
        if not ref_wav.exists():
            avail = [v.id for v in self._voices]
            raise ValueError(
                f"CosyVoice2 voice '{voice}' not found. "
                f"Available: {', '.join(avail[:8])}. "
                f"Add {voice}.wav to {self._voices_dir}"
            )

        transcript_file = self._voices_dir / f"{voice}.txt"
        transcript = transcript_file.read_text(encoding="utf-8").strip() if transcript_file.exists() else ""

        t0 = time.time()
        parts: list[np.ndarray] = []

        try:
            if transcript:
                # Zero-shot: transcript helps with language conditioning
                gen = self._model.inference_zero_shot(
                    text, transcript, str(ref_wav), stream=False, speed=speed
                )
            else:
                # Cross-lingual: reference sets voice, model handles any language
                gen = self._model.inference_cross_lingual(
                    text, str(ref_wav), stream=False, speed=speed
                )

            for chunk in gen:
                arr = chunk["tts_speech"].squeeze().float().cpu().numpy()
                parts.append(arr)

        except Exception as exc:
            raise RuntimeError(f"CosyVoice2 inference failed: {exc}") from exc

        if not parts:
            raise RuntimeError(f"CosyVoice2 produced no audio for voice='{voice}'")

        full     = np.concatenate(parts).astype(np.float32)
        duration = len(full) / self.sample_rate
        log.info(
            "CosyVoice2 generated %.2f s | voice=%s  chars=%d  speed=%.2f  %.2f s wall",
            duration, voice, len(text), speed, time.time() - t0,
        )

        buf = io.BytesIO()
        sf.write(buf, full, self.sample_rate, format="WAV", subtype="PCM_16")
        buf.seek(0)
        return buf.read()

    # ── async public API ──────────────────────────────────────────────────────
    async def generate_wav(self, text: str, voice: str, speed: float = 1.0) -> bytes:
        if not self._ready or self._model is None:
            raise RuntimeError("CosyVoice2Provider not loaded — call load() first")
        loop = asyncio.get_event_loop()
        async with self._gpu_sem:  # type: ignore[union-attr]
            return await loop.run_in_executor(None, self._generate_sync, text, voice, speed)

    # ── Voice Cloning ─────────────────────────────────────────────────────────
    def _clone_sync(
        self,
        audio_bytes: bytes,
        voice_id: str,
        voice_name: str,
        transcript: str,
        language_code: str,
        src_filename: str,
    ) -> VoiceInfo:
        """
        CosyVoice2 Zero-Shot Voice Cloning:
          1. Decode + resample audio → 24 kHz mono WAV
          2. Save WAV reference to voices/cosyvoice2/<voice_id>.wav
          3. Save transcript to voices/cosyvoice2/<voice_id>.txt (if provided)
          4. Call model.add_zero_shot_spk() → stores speaker embedding in memory
          5. Call model.save_spkinfo() → persists embedding to disk
          6. Refresh voice catalog

        With embedding saved, inference_zero_shot(..., zero_shot_spk_id=voice_id)
        is faster than loading the WAV each time, and persists across restarts
        (spk2info.pt is reloaded by CosyVoice2.__init__).
        """
        import torchaudio
        import subprocess
        import tempfile

        t0 = time.time()
        log.info("Cloning voice '%s' from %d bytes (%s) …", voice_id, len(audio_bytes), src_filename)

        # ── Step 1: decode audio → numpy float32 at 24kHz mono ───────────────
        ext = Path(src_filename).suffix.lower() or ".wav"
        tmp_in = Path(tempfile.mktemp(suffix=ext))
        tmp_wav = Path(tempfile.mktemp(suffix=".wav"))
        try:
            tmp_in.write_bytes(audio_bytes)

            if ext in (".wav",):
                # soundfile handles WAV directly
                raw, sr = sf.read(str(tmp_in), always_2d=False)
            else:
                # Use ffmpeg for webm / mp3 / m4a
                result = subprocess.run(
                    ["ffmpeg", "-y", "-i", str(tmp_in),
                     "-ar", str(self.sample_rate), "-ac", "1", str(tmp_wav)],
                    capture_output=True, timeout=30,
                )
                if result.returncode != 0:
                    # Fallback: try torchaudio (uses ffmpeg or sox)
                    waveform, sr = torchaudio.load(str(tmp_in))
                    raw = waveform.mean(0).numpy()
                else:
                    raw, sr = sf.read(str(tmp_wav), always_2d=False)

            raw = np.asarray(raw, dtype=np.float32)
            if raw.ndim > 1:
                raw = raw.mean(axis=1)

            # Resample if needed
            if sr != self.sample_rate:
                import scipy.signal
                n = int(len(raw) * self.sample_rate / sr)
                raw = scipy.signal.resample(raw, n).astype(np.float32)

        finally:
            tmp_in.unlink(missing_ok=True)
            tmp_wav.unlink(missing_ok=True)

        # ── Step 2: validate length (CosyVoice2 needs ≥ 3s, ideally 10-30s) ─
        duration = len(raw) / self.sample_rate
        if duration < 3.0:
            raise ValueError(
                f"Audio too short ({duration:.1f}s). "
                "CosyVoice2 needs at least 3 seconds; 10-30s gives best quality."
            )
        if duration > 60.0:
            log.warning("Audio %.1f s — trimming to 60 s for efficiency", duration)
            raw = raw[:60 * self.sample_rate]

        # Normalize peak
        peak = np.abs(raw).max()
        if peak > 1e-6:
            raw = (raw / peak * 0.88).astype(np.float32)

        # ── Step 3: save WAV reference ────────────────────────────────────────
        wav_path = self._voices_dir / f"{voice_id}.wav"
        sf.write(str(wav_path), raw, self.sample_rate, subtype="PCM_16")
        log.info("Saved reference WAV: %s (%.1f s)", wav_path, duration)

        # ── Step 4: save transcript ───────────────────────────────────────────
        if transcript.strip():
            txt_path = self._voices_dir / f"{voice_id}.txt"
            txt_path.write_text(transcript.strip(), encoding="utf-8")
            log.info("Saved transcript: %s", txt_path)

        # ── Step 5: register speaker embedding in CosyVoice2 ─────────────────
        # add_zero_shot_spk encodes the reference WAV into a speaker embedding
        # and stores it in self._model.frontend.spk2info under voice_id.
        # This allows inference_zero_shot(..., zero_shot_spk_id=voice_id)
        # to skip WAV loading at inference time.
        try:
            prompt_text = transcript.strip() if transcript.strip() else "."
            success = self._model.add_zero_shot_spk(  # type: ignore[union-attr]
                prompt_text=prompt_text,
                prompt_wav=str(wav_path),
                zero_shot_spk_id=voice_id,
            )
            if success:
                self._model.save_spkinfo()  # type: ignore[union-attr]
                log.info("Speaker embedding saved for voice_id='%s'", voice_id)
        except Exception as e:
            # Non-fatal: inference will fall back to WAV file
            log.warning("add_zero_shot_spk failed (will use WAV fallback): %s", e)

        # ── Step 6: refresh voice catalog ────────────────────────────────────
        self._voices = self._scan_voices()

        elapsed = time.time() - t0
        log.info("Voice '%s' cloned in %.1f s", voice_id, elapsed)

        lang = "vi-VN" if language_code.startswith("vi") else language_code
        return VoiceInfo(
            id=voice_id,
            name=voice_name,
            engine=self.engine_name,
            language=lang,
            gender="neutral",
            description=f"Giọng nhân bản — {voice_name}",
        )

    async def clone_voice(
        self,
        audio_bytes: bytes,
        voice_id: str,
        voice_name: str,
        transcript: str = "",
        language_code: str = "vi-VN",
        src_filename: str = "audio.wav",
    ) -> VoiceInfo:
        """
        Clone a voice from reference audio.  Serialised by GPU semaphore.
        Returns VoiceInfo describing the new cloned voice.
        """
        if not self._ready or self._model is None:
            raise RuntimeError("CosyVoice2Provider not loaded — call load() first")
        loop = asyncio.get_event_loop()
        async with self._gpu_sem:  # type: ignore[union-attr]
            return await loop.run_in_executor(
                None,
                self._clone_sync,
                audio_bytes, voice_id, voice_name, transcript, language_code, src_filename,
            )

    # ── Synthesis with cloned voice (uses saved embedding) ───────────────────
    def _generate_sync_with_clone(self, text: str, voice_id: str, speed: float) -> bytes:
        """
        Synthesise using a saved speaker embedding (faster than WAV loading).
        Falls back to WAV-based synthesis if embedding not available.
        """
        spk2info = getattr(
            getattr(self._model, "frontend", None), "spk2info", {}
        )
        if voice_id in spk2info:
            log.debug("Using saved embedding for voice_id='%s'", voice_id)
            t0 = time.time()
            parts: list[np.ndarray] = []
            try:
                gen = self._model.inference_zero_shot(  # type: ignore[union-attr]
                    text, "", "", zero_shot_spk_id=voice_id,
                    stream=False, speed=speed,
                )
                for chunk in gen:
                    parts.append(chunk["tts_speech"].squeeze().float().cpu().numpy())
            except Exception as exc:
                log.warning("Embedding inference failed, falling back to WAV: %s", exc)
                return self._generate_sync(text, voice_id, speed)

            if not parts:
                return self._generate_sync(text, voice_id, speed)

            full = np.concatenate(parts).astype(np.float32)
            log.info("Synthesised %.2f s with embedding | took %.2f s",
                     len(full) / self.sample_rate, time.time() - t0)
            buf = io.BytesIO()
            sf.write(buf, full, self.sample_rate, format="WAV", subtype="PCM_16")
            buf.seek(0)
            return buf.read()
        else:
            # Embedding not in memory (service restarted) — use WAV file
            return self._generate_sync(text, voice_id, speed)

    def shutdown(self) -> None:
        self._model = None
        self._ready = False
        if self.device == "cuda":
            torch.cuda.empty_cache()
        log.info("CosyVoice2Provider shut down.")
