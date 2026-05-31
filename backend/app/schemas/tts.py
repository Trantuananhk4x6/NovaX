from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal


class TTSRequest(BaseModel):
    text:   str   = Field(..., min_length=1, max_length=100_000)
    voice:  str   = Field(default="af_bella", description="Voice ID within the engine")
    engine: str   = Field(default="kokoro",   description="TTS engine: 'kokoro' | 'cosyvoice2'")
    speed:  float = Field(default=1.0, ge=0.25, le=4.0)


class VoiceInfoResponse(BaseModel):
    """Single voice entry returned by GET /tts/voices."""
    id:          str
    name:        str
    engine:      str                  # "kokoro" | "cosyvoice2"
    language:    Optional[str] = None # "vi-VN" | "en-US" | "multi" | ...
    gender:      Optional[str] = None # "female" | "male" | "neutral"
    description: Optional[str] = None


class TTSVoicesResponse(BaseModel):
    voices: list[VoiceInfoResponse]
    count:  int
    engines: list[str]               # which engines are ready


class TTSHealthResponse(BaseModel):
    status:  str
    engines: dict[str, bool]         # engine_name → ready
    gpu:     bool = False
    device:  str  = "cpu"
    voices_count: int = 0


class CloneVoiceResponse(BaseModel):
    success:    bool
    voice_id:   str
    voice_name: str
    engine:     str = "cosyvoice2"
    language:   Optional[str] = None
    message:    str = ""
    error:      Optional[str] = None
