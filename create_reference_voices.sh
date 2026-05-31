#!/usr/bin/env bash
# =============================================================================
# create_reference_voices.sh
# Tạo reference voice WAV files cho Fish Speech conditioning.
#
# Fish Speech là voice cloning model — PHẢI có reference WAV để chất lượng tốt.
# Script dùng gTTS (Google TTS qua pip) → MP3 → resample 44100Hz → WAV
#
# Chạy: bash /mnt/d/NovaX/create_reference_voices.sh
# =============================================================================
set -euo pipefail

VOICES_DIR="${HOME}/ai-narrator/voices"
VENV="${HOME}/ai-narrator/venv"
mkdir -p "${VOICES_DIR}"

echo "================================================================"
echo " Tạo reference voices cho Fish Speech"
echo " Output: ${VOICES_DIR}"
echo "================================================================"

# Activate venv
source "${VENV}/bin/activate"
echo " Python: $(python3 --version)"

# ── Cài gTTS nếu chưa có ─────────────────────────────────────────────────
if ! python3 -c "import gtts" 2>/dev/null; then
    echo "[INFO] Cài gtts (Google Text-to-Speech)..."
    pip install -q gtts pydub 2>/dev/null || pip install -q gtts
fi

# pydub cần ffmpeg để convert mp3→wav
# Nếu không có ffmpeg, dùng scipy resample trực tiếp
HAS_FFMPEG=false
if command -v ffmpeg &>/dev/null; then
    HAS_FFMPEG=true
fi

# ── Text mẫu tiếng Việt đủ dài (15-25 giây speech) ──────────────────────
VI_TEXT="Xin chào các bạn. Tôi là trợ lý AI của hệ thống NovaX. \
Hôm nay chúng ta sẽ cùng trải nghiệm công nghệ chuyển văn bản thành giọng nói tiếng Việt. \
Đây là mẫu giọng được sử dụng để làm tham chiếu cho mô hình AI. \
Mô hình sẽ học theo âm điệu và phong cách nói của giọng này."

# ── Python script tạo WAV reference ──────────────────────────────────────
python3 << 'PYEOF'
import os, sys, io, time
from pathlib import Path

voices_dir = Path(os.environ.get("HOME", "~")) / "ai-narrator" / "voices"
voices_dir.mkdir(parents=True, exist_ok=True)

text = (
    "Xin chào các bạn. Tôi là trợ lý AI của hệ thống NovaX. "
    "Hôm nay chúng ta sẽ cùng trải nghiệm công nghệ chuyển văn bản thành giọng nói tiếng Việt. "
    "Đây là mẫu giọng được sử dụng để làm tham chiếu cho mô hình AI. "
    "Mô hình sẽ học theo âm điệu và phong cách nói của giọng này."
)

# Voice names that match voiceId routing in route.ts
# vi-charon → voice="charon" → voices/charon.wav
voice_names = ["default", "charon", "aoede", "kore", "puck", "fenrir"]

import numpy as np
import scipy.signal
import soundfile as sf

try:
    from gtts import gTTS
except ImportError:
    print("[ERROR] gtts không cài được. Chạy: pip install gtts")
    sys.exit(1)

for name in voice_names:
    output_path = voices_dir / f"{name}.wav"
    if output_path.exists():
        print(f"[SKIP] {output_path} đã tồn tại")
        continue

    print(f"[GEN] {name}.wav ...", end="", flush=True)
    try:
        tts = gTTS(text=text, lang="vi", slow=False)
        mp3_buf = io.BytesIO()
        tts.write_to_fp(mp3_buf)
        mp3_buf.seek(0)

        # Decode MP3 bằng pydub hoặc soundfile
        try:
            import pydub
            seg = pydub.AudioSegment.from_mp3(mp3_buf)
            seg = seg.set_frame_rate(44100).set_channels(1).set_sample_width(2)
            raw = np.array(seg.get_array_of_samples(), dtype=np.float32) / 32768.0
        except Exception:
            # Fallback: save mp3 to temp file and use soundfile via ffmpeg
            tmp_mp3 = f"/tmp/fish_ref_{name}.mp3"
            mp3_buf.seek(0)
            with open(tmp_mp3, "wb") as f:
                f.write(mp3_buf.read())

            # Try soundfile (needs libsndfile with mp3 support) or ffmpeg
            try:
                import subprocess
                tmp_wav = f"/tmp/fish_ref_{name}_raw.wav"
                subprocess.run(
                    ["ffmpeg", "-y", "-i", tmp_mp3, "-ar", "44100", "-ac", "1", tmp_wav],
                    check=True, capture_output=True
                )
                raw, _ = sf.read(tmp_wav)
                raw = raw.astype(np.float32)
                os.remove(tmp_wav)
            except Exception:
                # Last resort: pure scipy — load as PCM from mp3 bytes (lossy)
                print(f"\n[WARN] MP3 decode fallback for {name}")
                # Convert via dummy approach — skip this voice
                print(f"[SKIP] Không decode được MP3 cho {name} — bỏ qua")
                continue

        # Ensure 44100 Hz sample rate
        if len(raw.shape) > 1:
            raw = raw.mean(axis=1)

        # Peak normalize
        peak = np.abs(raw).max()
        if peak > 1e-6:
            raw = (raw / peak * 0.85).astype(np.float32)

        sf.write(str(output_path), raw, 44100, subtype="PCM_16")
        dur = len(raw) / 44100
        print(f" ✅ {dur:.1f}s → {output_path}")
        time.sleep(0.5)  # avoid rate limiting

    except Exception as e:
        print(f" ❌ Lỗi: {e}")

print("\nHoàn tất!")
PYEOF

echo ""
echo "================================================================"
echo " ✅ Reference voices:"
ls -lh "${VOICES_DIR}"/*.wav 2>/dev/null || echo " (không tạo được file nào)"
echo "================================================================"
echo ""
echo " Sau khi tạo xong, restart Fish Speech:"
echo "   bash /mnt/d/NovaX/start_fish_speech.sh"
echo ""
echo " 💡 Để chất lượng TỐT NHẤT: thay các file này bằng giọng người thật"
echo "    Thu âm 15-30 giây giọng người, lưu WAV 44100Hz mono, đặt vào:"
echo "    ${VOICES_DIR}/<tên>.wav"
