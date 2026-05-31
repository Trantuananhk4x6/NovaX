"""
POST /tts          — synthesise audio (engine dispatch)
GET  /tts/health   — status of all engines
GET  /tts/voices   — voices from ALL engines (with engine metadata)
"""
from __future__ import annotations

import logging
import uuid

import torch
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.models import state
from app.schemas.tts import (
    TTSRequest, TTSHealthResponse, TTSVoicesResponse,
    VoiceInfoResponse, CloneVoiceResponse,
)

log    = logging.getLogger("router.tts")
router = APIRouter(prefix="/tts", tags=["tts"])


# ── POST /tts ─────────────────────────────────────────────────────────────────
@router.post(
    "",
    response_class=Response,
    responses={
        200: {"content": {"audio/wav": {}}, "description": "WAV bytes"},
        400: {"description": "Bad voice or engine"},
        503: {"description": "Engine not ready"},
        500: {"description": "Inference error"},
    },
)
async def generate_tts(req: TTSRequest) -> Response:
    """
    Dispatch to the correct TTS engine by req.engine.
    Returns raw WAV bytes (audio/wav).
    """
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text must not be empty.")

    engine = req.engine.lower()
    log.info("POST /tts | engine=%s  voice=%s  speed=%.2f  chars=%d",
             engine, req.voice, req.speed, len(text))

    # ── route to engine ──────────────────────────────────────────────────────
    if engine == "kokoro":
        if not state.kokoro or not state.kokoro.is_ready():
            raise HTTPException(status_code=503, detail="Kokoro engine not ready.")
        provider = state.kokoro

    elif engine == "cosyvoice2":
        if not state.cosyvoice or not state.cosyvoice.is_ready():
            raise HTTPException(
                status_code=503,
                detail="CosyVoice2 engine not ready. Check startup logs."
            )
        provider = state.cosyvoice

    else:
        ready_engines = [e for e, ok in _engine_status().items() if ok]
        raise HTTPException(
            status_code=400,
            detail=f"Unknown engine '{engine}'. Available: {ready_engines}"
        )

    try:
        wav = await provider.generate_wav(text=text, voice=req.voice, speed=req.speed)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("Inference failed [engine=%s voice=%s]", engine, req.voice)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return Response(content=wav, media_type="audio/wav")


# ── GET /tts/health ───────────────────────────────────────────────────────────
@router.get("/health", response_model=TTSHealthResponse)
async def health() -> TTSHealthResponse:
    statuses = _engine_status()
    all_voices = _all_voices()
    return TTSHealthResponse(
        status="ready" if any(statuses.values()) else "loading",
        engines=statuses,
        gpu=torch.cuda.is_available(),
        device="cuda" if torch.cuda.is_available() else "cpu",
        voices_count=len(all_voices),
    )


# ── POST /tts/clone — CosyVoice2 Voice Cloning ───────────────────────────────
@router.post("/clone", response_model=CloneVoiceResponse)
async def clone_voice(
    audio:         UploadFile = File(...,    description="Reference audio (WAV/MP3/WebM, 3-60s)"),
    voice_name:    str        = Form(...,    description="Display name for the cloned voice"),
    language_code: str        = Form("vi-VN",description="Language code, e.g. vi-VN"),
    transcript:    str        = Form("",     description="Optional: what the reference audio says (improves quality)"),
    voice_id:      str        = Form("",     description="Optional: custom voice ID (auto-generated if blank)"),
) -> CloneVoiceResponse:
    """
    Clone a voice using CosyVoice2 zero-shot speaker adaptation.

    Steps:
      1. Decode + resample reference audio to 24 kHz mono WAV
      2. Save to ~/ai-narrator/voices/cosyvoice2/<voice_id>.wav
      3. Encode speaker embedding via add_zero_shot_spk()
      4. Persist embedding to spk2info.pt
      5. Return voice metadata for use in POST /tts

    Tips for best quality:
      • 10-30 seconds of clear, natural speech
      • Quiet environment (no background noise)
      • Provide transcript if possible (significantly improves quality)
    """
    if not state.cosyvoice or not state.cosyvoice.is_ready():
        raise HTTPException(
            status_code=503,
            detail="CosyVoice2 engine not ready. Start the service with start_tts.sh."
        )

    # Generate unique, safe voice ID
    safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in voice_name.lower())[:20]
    vid = voice_id.strip() or f"clone_{safe_name}_{uuid.uuid4().hex[:6]}"

    audio_bytes = await audio.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small or empty.")

    log.info("POST /tts/clone | voice_id=%s name=%s lang=%s bytes=%d transcript_len=%d",
             vid, voice_name, language_code, len(audio_bytes), len(transcript))

    try:
        info = await state.cosyvoice.clone_voice(
            audio_bytes=audio_bytes,
            voice_id=vid,
            voice_name=voice_name,
            transcript=transcript,
            language_code=language_code,
            src_filename=audio.filename or "audio.wav",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("Voice cloning failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return CloneVoiceResponse(
        success=True,
        voice_id=info.id,
        voice_name=info.name,
        engine="cosyvoice2",
        language=info.language,
        message=f"Voice '{voice_name}' cloned successfully. Use engine='cosyvoice2', voice='{vid}' in /tts.",
    )


# ── GET /tts/voices ───────────────────────────────────────────────────────────
@router.get("/voices", response_model=TTSVoicesResponse)
async def list_voices() -> TTSVoicesResponse:
    """Return voices from ALL ready engines, each tagged with engine name."""
    voices = _all_voices()
    ready  = [e for e, ok in _engine_status().items() if ok]
    return TTSVoicesResponse(
        voices=[VoiceInfoResponse(**v.__dict__) for v in voices],
        count=len(voices),
        engines=ready,
    )


# ── helpers ───────────────────────────────────────────────────────────────────
def _engine_status() -> dict[str, bool]:
    return {
        "kokoro":      bool(state.kokoro     and state.kokoro.is_ready()),
        "cosyvoice2":  bool(state.cosyvoice  and state.cosyvoice.is_ready()),
    }


def _all_voices():
    voices = []
    if state.kokoro and state.kokoro.is_ready():
        voices.extend(state.kokoro.list_voices())
    if state.cosyvoice and state.cosyvoice.is_ready():
        voices.extend(state.cosyvoice.list_voices())
    return voices
