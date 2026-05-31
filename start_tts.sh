#!/usr/bin/env bash
# =============================================================================
# NovaX — Multi-Engine TTS Service (Kokoro + CosyVoice2)
# Open this in WSL2 terminal and keep it running.
#
# Engines:
#   Kokoro-82M      (English + multilingual, 0.33 GB VRAM)
#   CosyVoice2-0.5B (Vietnamese native, voice cloning, ~2 GB VRAM)
# =============================================================================
set -euo pipefail

AI_DIR="${HOME}/ai-narrator"
VENV="${AI_DIR}/venv"
BACKEND_DIR="/mnt/d/NovaX/backend"
COSY_REPO="${HOME}/cosyvoice/CosyVoice"

echo "=================================================="
echo " NovaX Multi-Engine TTS"
echo " Kokoro-82M  +  CosyVoice2-0.5B"
echo "=================================================="

if nvidia-smi &>/dev/null; then
    GPU=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    echo " GPU : ${GPU}"
fi

# ── Kill any process already holding port 8080 ────────────────────────────────
if lsof -ti:8080 &>/dev/null; then
    echo " Killing existing process on port 8080..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

source "${VENV}/bin/activate"
echo " Python : $(python3 --version)"

# ── Check dependencies ────────────────────────────────────────────────────────
python3 -c "import kokoro" 2>/dev/null || pip install -q kokoro
python3 -c "import soundfile" 2>/dev/null || pip install -q soundfile
python3 -c "import hyperpyyaml" 2>/dev/null || pip install -q hyperpyyaml
python3 -c "import openai_whisper" 2>/dev/null || pip install -q openai-whisper
# pkg_resources requires setuptools<72 (newer setuptools hide it from venv)
python3 -c "import pkg_resources" 2>/dev/null || pip install -q "setuptools<72" --force-reinstall

# ── CosyVoice2 setup ─────────────────────────────────────────────────────────
export COSYVOICE_REPO="${COSY_REPO}"
export COSYVOICE_MODEL="${COSY_REPO}/pretrained_models/CosyVoice2-0.5B"
export COSYVOICE_VOICES="${AI_DIR}/voices/cosyvoice2"
export LOAD_COSYVOICE="1"

# Make cosyvoice importable
export PYTHONPATH="${COSY_REPO}/third_party/Matcha-TTS:${COSY_REPO}:${BACKEND_DIR}:${PYTHONPATH:-}"

# CosyVoice2 has some relative imports — needs to run from its repo dir
# But FastAPI needs to find app.* from BACKEND_DIR.
# Solution: PYTHONPATH includes both; uvicorn uses --app-dir for app imports.

echo ""
echo " Voices:"
echo "   CosyVoice2 : ${COSYVOICE_VOICES}"
ls "${COSYVOICE_VOICES}"/*.wav 2>/dev/null | while read f; do
    echo "     $(basename $f)"
done

echo ""
echo " Endpoints:"
echo "   POST http://0.0.0.0:8080/tts          → audio/wav"
echo "   GET  http://0.0.0.0:8080/tts/voices   → all voices + engine"
echo "   GET  http://0.0.0.0:8080/tts/health   → engine status"
echo ""
echo " Model load: ~10-30s (Kokoro first, then CosyVoice2)"
echo " Press Ctrl+C to stop."
echo "=================================================="

exec python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers 1 \
    --log-level info \
    --app-dir "${BACKEND_DIR}"
