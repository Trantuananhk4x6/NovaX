#!/usr/bin/env bash
# =============================================================================
# NovaX — Kokoro TTS Service
# Run from WSL2 TERMINAL (NOT via PowerShell):
#   bash /mnt/d/NovaX/start_kokoro.sh
# =============================================================================
set -euo pipefail

AI_DIR="${HOME}/ai-narrator"
VENV="${AI_DIR}/venv"          # kokoro 0.9.4 installed here
BACKEND_DIR="/mnt/d/NovaX/backend"

echo "=============================================="
echo " NovaX — Kokoro TTS (Kokoro-82M)"
echo "=============================================="

if nvidia-smi &>/dev/null; then
    GPU=$(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null | head -1)
    echo " GPU     : ${GPU}"
fi
echo " Backend : ${BACKEND_DIR}"
echo "=============================================="

source "${VENV}/bin/activate"
echo " Python  : $(python3 --version)"
echo " Kokoro  : $(python3 -c 'import kokoro; print(kokoro.__version__)' 2>/dev/null || echo 'installing...')"

if ! python3 -c "import kokoro" 2>/dev/null; then
    pip install -q kokoro
fi

echo ""
echo " Endpoints:"
echo "   POST http://0.0.0.0:8080/tts        → audio/wav"
echo "   GET  http://0.0.0.0:8080/tts/health → status"
echo "   GET  http://0.0.0.0:8080/tts/voices → voice list"
echo ""
echo " Model load: ~5-10s (Kokoro-82M is lightweight)"
echo " Press Ctrl+C to stop."
echo "=============================================="

export PYTHONPATH="${BACKEND_DIR}:${PYTHONPATH:-}"
export HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-0}"

exec python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers 1 \
    --log-level info \
    --app-dir "${BACKEND_DIR}"
