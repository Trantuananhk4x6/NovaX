"""
Global application state — populated once in main.py lifespan.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.services.kokoro_service import KokoroService
    from app.services.cosyvoice_service import CosyVoice2Provider


@dataclass
class AppState:
    # Kokoro engine (always loaded)
    kokoro:    Optional["KokoroService"]      = None
    # CosyVoice2 engine (loaded if available, optional)
    cosyvoice: Optional["CosyVoice2Provider"] = None

    device:      str  = "cpu"
    sample_rate: int  = 24_000
    ready:       bool = False   # True when at least Kokoro is ready


state = AppState()
