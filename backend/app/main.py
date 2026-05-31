"""
NovaX — Multi-Engine TTS Service
=================================

Engines:
  1. Kokoro-82M       (English + multilingual via espeak, 0.33 GB VRAM)
  2. CosyVoice2-0.5B  (Vietnamese native, voice cloning, 24 kHz)

Architecture:
  ┌─────────────────────────────────────────────────┐
  │  Next.js (Windows :3000)                        │
  │  POST /api/tts/generate  →  :8080/tts           │
  └──────────────┬──────────────────────────────────┘
                 │ HTTP (WSL2 loopback)
  ┌──────────────▼──────────────────────────────────┐
  │  FastAPI (:8080)                                │
  │  POST /tts  →  engine dispatch                  │
  │    engine="kokoro"     → KokoroService          │
  │    engine="cosyvoice2" → CosyVoice2Provider     │
  │                                                 │
  │  GET /tts/voices → all engines, engine metadata │
  └─────────────────────────────────────────────────┘
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import state
from app.routers import tts as tts_router
from app.services.kokoro_service    import KokoroService
from app.services.cosyvoice_service import CosyVoice2Provider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("main")

KOKORO_REPO     = os.getenv("KOKORO_REPO",      "hexgrad/Kokoro-82M")
COSYVOICE_REPO  = os.getenv("COSYVOICE_REPO",   "/home/tony/cosyvoice/CosyVoice")
COSYVOICE_MODEL = os.getenv("COSYVOICE_MODEL",  "/home/tony/cosyvoice/CosyVoice/pretrained_models/CosyVoice2-0.5B")
COSYVOICE_VOICES= os.getenv("COSYVOICE_VOICES", "/home/tony/ai-narrator/voices/cosyvoice2")
LOAD_COSYVOICE  = os.getenv("LOAD_COSYVOICE",   "1") == "1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=" * 64)
    log.info("NovaX Multi-Engine TTS Service  —  starting up")
    if torch.cuda.is_available():
        p = torch.cuda.get_device_properties(0)
        log.info("GPU : %s  (%.1f GB)", p.name, p.total_memory / 1e9)
    log.info("=" * 64)

    # ── Engine 1: Kokoro (always load) ────────────────────────────────────────
    log.info("[1/2] Loading Kokoro engine …")
    kokoro = KokoroService()
    kokoro.load(repo_id=KOKORO_REPO)
    state.kokoro      = kokoro
    state.device      = kokoro.device
    state.sample_rate = kokoro.sample_rate
    state.ready       = True
    log.info("[1/2] Kokoro ready ✅  voices=%d  VRAM=%.2f GB",
             len(kokoro.list_voices()),
             torch.cuda.memory_allocated() / 1e9 if kokoro.device == "cuda" else 0)

    # ── Engine 2: CosyVoice2 (optional, load if available) ────────────────────
    if LOAD_COSYVOICE:
        log.info("[2/2] Loading CosyVoice2 engine from %s …", COSYVOICE_MODEL)
        try:
            cosy = CosyVoice2Provider()
            cosy.load(model_dir=COSYVOICE_MODEL, voices_dir=COSYVOICE_VOICES)
            state.cosyvoice = cosy
            log.info("[2/2] CosyVoice2 ready ✅  voices=%d", len(cosy.list_voices()))
        except Exception as exc:
            log.warning("[2/2] CosyVoice2 failed to load (non-fatal): %s", exc)
            log.warning("      Kokoro will still serve requests.")
            state.cosyvoice = None
    else:
        log.info("[2/2] CosyVoice2 disabled (LOAD_COSYVOICE=0).")

    log.info("=" * 64)
    log.info("Service ready at http://0.0.0.0:8080")
    log.info("  Engines : kokoro=%s  cosyvoice2=%s",
             state.kokoro.is_ready() if state.kokoro else False,
             state.cosyvoice.is_ready() if state.cosyvoice else False)
    log.info("  Voices  : GET http://localhost:8080/tts/voices")
    log.info("  Health  : GET http://localhost:8080/tts/health")
    log.info("=" * 64)

    yield   # ── serve ──

    log.info("Shutting down …")
    if state.kokoro:
        state.kokoro.shutdown()
    if state.cosyvoice:
        state.cosyvoice.shutdown()
    state.ready = False


app = FastAPI(
    title="NovaX Multi-Engine TTS",
    version="3.0.0",
    description="Kokoro-82M + CosyVoice2-0.5B local inference (RTX 3060, WSL2)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)

app.include_router(tts_router.router)


@app.get("/")
async def root():
    return {
        "service": "NovaX Multi-Engine TTS",
        "engines": {
            "kokoro":     state.kokoro.is_ready()    if state.kokoro    else False,
            "cosyvoice2": state.cosyvoice.is_ready() if state.cosyvoice else False,
        },
        "voices": "/tts/voices",
        "docs":   "/docs",
    }
