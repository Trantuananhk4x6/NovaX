"""
TTSProvider — Abstract base class for all TTS engines.

Every engine (Kokoro, CosyVoice2, future engines) implements this interface.
The router dispatches requests to the correct engine by name.
"""
from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class VoiceInfo:
    """Metadata for a single voice, returned by GET /tts/voices."""
    id:          str                  # Unique voice ID within the engine
    name:        str                  # Human-readable display name
    engine:      str                  # "kokoro" | "cosyvoice2"
    language:    Optional[str] = None # e.g. "vi-VN", "en-US", "multi"
    gender:      Optional[str] = None # "female" | "male" | "neutral"
    description: Optional[str] = None


class TTSProvider(ABC):
    """
    Abstract TTS engine interface.
    Concrete implementations: KokoroProvider, CosyVoice2Provider.
    """

    engine_name: str = "unknown"

    @abstractmethod
    async def generate_wav(self, text: str, voice: str, speed: float = 1.0) -> bytes:
        """
        Synthesise text and return raw WAV bytes.
        Raises ValueError on bad voice, RuntimeError on inference failure.
        """

    @abstractmethod
    def list_voices(self) -> list[VoiceInfo]:
        """Return all voices available in this engine."""

    @abstractmethod
    def is_ready(self) -> bool:
        """True once load() completed successfully."""
