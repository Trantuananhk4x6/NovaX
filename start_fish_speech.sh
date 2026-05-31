#!/usr/bin/env bash
# =============================================================================
# NovaX — Fish Speech v1.5.1 Local TTS Service
# Run from WSL2:  bash /mnt/d/NovaX/start_fish_speech.sh
#
# System Architecture:
#
#   Windows 11
#   └── Next.js dev server (port 3000)
#         └── fetch POST http://localhost:8080/tts
#               │
#   WSL2 Ubuntu (same machine — loopback)
#   └── FastAPI  (port 8080)  ← this script starts it
#         └── FishSpeechService
#               ├── DualARTransformer  (6-8 GB VRAM)
#               └── FireflyArchitecture VQGAN  (1-2 GB VRAM)
#                     └── NVIDIA RTX 3060 12 GB
#
# Verified model paths:
#   T2S   : ~/ai-narrator/models/fish-speech-1_5/
#   VQGAN : ~/ai-narrator/models/firefly-gan-vq-fsq-8x1024-21hz-generator.pth
# =============================================================================
set -euo pipefail

# ── Paths ────────────────────────────────────────────────────────────────────
AI_DIR="${HOME}/ai-narrator"
FISH_REPO="${AI_DIR}/fish-speech"
VENV="${AI_DIR}/venv"
BACKEND_DIR="/mnt/d/NovaX/backend"

# ── Model paths (relative to AI_DIR — matches real_tts_test.py) ──────────────
export FISH_T2S_CHECKPOINT="models/fish-speech-1_5"
export FISH_VQGAN_CHECKPOINT="models/firefly-gan-vq-fsq-8x1024-21hz-generator.pth"

# ── Voice reference WAVs (optional — enables voice conditioning) ──────────────
# Put 5-30s WAV samples here: voices/aoede.wav, voices/puck.wav, etc.
export FISH_VOICES_DIR="${AI_DIR}/voices"
mkdir -p "${FISH_VOICES_DIR}"

# ─────────────────────────────────────────────────────────────────────────────
echo "================================================================"
echo " NovaX — Fish Speech v1.5.1 Local TTS"
echo "================================================================"

# GPU check
if nvidia-smi &>/dev/null; then
    GPU=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -1)
    echo " GPU     : ${GPU}"
else
    echo " [WARN]  nvidia-smi not found — CUDA may not be available"
fi

echo " AI dir  : ${AI_DIR}"
echo " T2S     : ${FISH_T2S_CHECKPOINT}"
echo " VQGAN   : ${FISH_VQGAN_CHECKPOINT}"
echo " Voices  : ${FISH_VOICES_DIR}"
echo " Backend : ${BACKEND_DIR}"
echo "================================================================"

# Verify model files exist
if [ ! -d "${AI_DIR}/${FISH_T2S_CHECKPOINT}" ]; then
    echo "[ERROR] T2S checkpoint not found: ${AI_DIR}/${FISH_T2S_CHECKPOINT}"
    exit 1
fi
if [ ! -f "${AI_DIR}/${FISH_VQGAN_CHECKPOINT}" ]; then
    echo "[ERROR] VQGAN checkpoint not found: ${AI_DIR}/${FISH_VQGAN_CHECKPOINT}"
    exit 1
fi

# Activate venv
echo ""
echo " Activating venv: ${VENV}"
# shellcheck source=/dev/null
source "${VENV}/bin/activate"
echo " Python : $(python3 --version)"

# Install missing backend deps silently
pip install -q fastapi uvicorn soundfile scipy 2>/dev/null || true

# fish-speech package must be on PYTHONPATH (installed via pip install -e .)
export PYTHONPATH="${FISH_REPO}:${PYTHONPATH:-}"

# The service uses CWD-relative model paths → cd to AI_DIR
cd "${AI_DIR}"

# Backend source is on /mnt/d (Windows NTFS) — add to PYTHONPATH
export PYTHONPATH="${BACKEND_DIR}:${PYTHONPATH}"

echo ""
# ── Check reference voices ────────────────────────────────────────────────
VOICE_COUNT=$(find "${FISH_VOICES_BASE}/voices" -name "*.wav" 2>/dev/null | wc -l)
if [ "${VOICE_COUNT}" -eq 0 ]; then
    echo ""
    echo " ⚠️  CẢNH BÁO: Không có reference voice WAV nào trong voices/"
    echo " Giọng sẽ NGHE NHƯ ROBOT nếu không có reference audio!"
    echo ""
    echo " Chạy lệnh sau để tạo bootstrap voices:"
    echo "   bash /mnt/d/NovaX/create_reference_voices.sh"
    echo ""
    echo " Hoặc tự thu âm 15-30 giây và lưu vào:"
    echo "   ${FISH_VOICES_BASE}/voices/charon.wav  (Giọng Đức)"
    echo "   ${FISH_VOICES_BASE}/voices/aoede.wav   (Giọng Mai)"
    echo "   ${FISH_VOICES_BASE}/voices/puck.wav    (Giọng Minh)"
    echo ""
    read -r -t 10 -p " Tiếp tục không có voice? (Ctrl+C để thoát, Enter để tiếp) " || true
else
    echo " ✅ Reference voices: ${VOICE_COUNT} file(s)"
    find "${FISH_VOICES_BASE}/voices" -name "*.wav" | while read -r f; do
        dur=$(python3 -c "import soundfile as sf; info=sf.info('$f'); print(f'{info.duration:.1f}s')" 2>/dev/null || echo "?s")
        echo "    $(basename "$f") [${dur}]"
    done
fi
echo ""
echo " Starting FastAPI on http://0.0.0.0:8080 …"
echo " Swagger UI: http://localhost:8080/docs"
echo " Health   : http://localhost:8080/tts/health"
echo " Press Ctrl+C to stop."
echo "================================================================"
echo ""

exec python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers 1 \
    --log-level info \
    --app-dir "${BACKEND_DIR}"
