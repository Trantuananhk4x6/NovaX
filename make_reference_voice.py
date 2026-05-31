"""
make_reference_voice.py
========================
Tạo reference voice WAV files cho Fish Speech conditioning.

Cách dùng trong WSL2:
  cd ~/ai-narrator
  source venv/bin/activate
  python3 /mnt/d/NovaX/make_reference_voice.py

Ưu tiên (từ tốt đến đơn giản):
  1. gTTS + ffmpeg   → giọng Google TTS tiếng Việt (tốt nhất)
  2. espeak-ng       → giọng tổng hợp offline (trung bình)
  3. Synthetic       → harmonic synthesis (chỉ để test, chất lượng thấp)

Sau khi tạo xong, restart Fish Speech service.
"""
from __future__ import annotations
import io
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import scipy.signal
import soundfile as sf

VOICES_DIR = Path.home() / "ai-narrator" / "voices"
VOICES_DIR.mkdir(parents=True, exist_ok=True)
SR = 44_100

VI_TEXT = (
    "Xin chào các bạn. Tôi là trợ lý AI của hệ thống NovaX. "
    "Hôm nay chúng ta sẽ cùng trải nghiệm công nghệ chuyển văn bản thành giọng nói. "
    "Đây là mẫu giọng tiếng Việt dùng làm tham chiếu cho mô hình học sâu. "
    "Mô hình sẽ học theo âm điệu và phong cách nói của giọng này."
)

VOICE_NAMES = ["default", "charon", "aoede", "kore", "puck", "fenrir"]

# ─────────────────────────────────────────────────────────────────────────────
def _resample_to_sr(audio: np.ndarray, src_sr: int) -> np.ndarray:
    if src_sr == SR:
        return audio.astype(np.float32)
    n_out = int(len(audio) * SR / src_sr)
    return scipy.signal.resample(audio, n_out).astype(np.float32)

def _normalize(audio: np.ndarray, target: float = 0.85) -> np.ndarray:
    peak = np.abs(audio).max()
    return (audio / peak * target).astype(np.float32) if peak > 1e-6 else audio

def _save(audio: np.ndarray, name: str) -> Path:
    path = VOICES_DIR / f"{name}.wav"
    audio = _normalize(audio)
    sf.write(str(path), audio, SR, subtype="PCM_16")
    dur = len(audio) / SR
    print(f"  ✅ {path.name}  ({dur:.1f}s)")
    return path

# ─────────────────────────────────────────────────────────────────────────────
# Strategy 1: gTTS (Google TTS — cần internet, chất lượng tốt nhất)
# ─────────────────────────────────────────────────────────────────────────────
def _make_gtts(text: str) -> np.ndarray | None:
    try:
        from gtts import gTTS
    except ImportError:
        return None

    mp3_buf = io.BytesIO()
    try:
        tts = gTTS(text=text, lang="vi", slow=False)
        tts.write_to_fp(mp3_buf)
        mp3_buf.seek(0)
    except Exception as e:
        print(f"  [gTTS] lỗi: {e}")
        return None

    # Decode MP3 → WAV
    # Try pydub
    try:
        import pydub
        seg = pydub.AudioSegment.from_mp3(mp3_buf)
        raw = np.array(seg.get_array_of_samples(), dtype=np.float32) / 32768.0
        if seg.channels > 1:
            raw = raw.reshape(-1, seg.channels).mean(axis=1)
        return _resample_to_sr(raw, seg.frame_rate)
    except Exception:
        pass

    # Try ffmpeg directly
    tmp_mp3 = "/tmp/_fish_ref.mp3"
    tmp_wav = "/tmp/_fish_ref.wav"
    mp3_buf.seek(0)
    with open(tmp_mp3, "wb") as f:
        f.write(mp3_buf.read())
    try:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_mp3, "-ar", str(SR), "-ac", "1", tmp_wav],
            capture_output=True, timeout=30
        )
        if result.returncode == 0:
            audio, src_sr = sf.read(tmp_wav)
            return _resample_to_sr(audio.astype(np.float32), src_sr)
    except Exception:
        pass

    print("  [gTTS] không decode được MP3 (thiếu ffmpeg/pydub)")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Strategy 2: espeak-ng (offline, trung bình)
# ─────────────────────────────────────────────────────────────────────────────
def _make_espeak(text: str, variant: str = "vi") -> np.ndarray | None:
    if not _cmd_exists("espeak-ng"):
        return None
    tmp = "/tmp/_fish_espeak.wav"
    try:
        result = subprocess.run(
            ["espeak-ng", "-v", variant, "-s", "140", text, "-w", tmp],
            capture_output=True, timeout=30
        )
        if result.returncode != 0:
            return None
        audio, src_sr = sf.read(tmp)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        return _resample_to_sr(audio.astype(np.float32), src_sr)
    except Exception as e:
        print(f"  [espeak] {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Strategy 3: Synthetic harmonic signal (không cần gì, chỉ để bootstrap)
# Tạo âm thanh giống giọng người đọc thơ — đủ để Fish Speech có một mẫu.
# ─────────────────────────────────────────────────────────────────────────────
def _make_synthetic(duration_s: float = 20.0, base_hz: float = 150.0) -> np.ndarray:
    """
    Tạo synthetic "voice-like" signal:
    - Fundamental frequency ~150 Hz (giọng nam) hoặc ~200 Hz (giọng nữ)
    - Harmonics theo Klatt model đơn giản
    - Amplitude envelope có dạng syllable (on/off mỗi 0.2 giây)
    """
    t = np.linspace(0, duration_s, int(SR * duration_s), endpoint=False)

    # F0 với jitter nhỏ (giọng tự nhiên)
    f0 = base_hz + 5 * np.sin(2 * np.pi * 0.1 * t)  # slow vibrato

    # Harmonics (giả lập glottal source)
    signal = np.zeros_like(t)
    for k in range(1, 12):
        amplitude = 1.0 / (k ** 1.2)  # rolloff -12 dB/octave
        signal += amplitude * np.sin(2 * np.pi * k * f0 * t)

    # Syllable envelope — bật/tắt mỗi 0.18 giây (giả lập âm tiết Việt)
    syllable_rate = 4.5  # ~4.5 âm tiết/giây
    envelope = 0.5 + 0.5 * np.sin(2 * np.pi * syllable_rate * t)
    envelope = np.maximum(envelope, 0.05)  # không im lặng hoàn toàn

    # Formant filter đơn giản (F1=700, F2=1200 Hz — vowel /a/)
    sos = scipy.signal.butter(2, [600, 1400], btype="bandpass", fs=SR, output="sos")
    filtered = scipy.signal.sosfilt(sos, signal * envelope)

    return filtered.astype(np.float32)


def _cmd_exists(cmd: str) -> bool:
    return subprocess.run(["which", cmd], capture_output=True).returncode == 0


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    print("=" * 60)
    print(" Fish Speech — Reference Voice Generator")
    print(f" Output: {VOICES_DIR}")
    print("=" * 60)

    # Detect available strategy
    has_gtts    = _cmd_exists("python3") and not subprocess.run(
        [sys.executable, "-c", "import gtts"], capture_output=True
    ).returncode
    has_espeak  = _cmd_exists("espeak-ng")

    if has_gtts:
        print("[INFO] Strategy: gTTS (Google TTS) — tốt nhất")
        strategy = "gtts"
    elif has_espeak:
        print("[INFO] Strategy: espeak-ng — trung bình")
        strategy = "espeak"
    else:
        print("[INFO] Strategy: synthetic harmonic — thấp nhất (bootstrap only)")
        strategy = "synthetic"

    # Base frequencies for different "voice characters"
    base_freqs = {
        "default": 170.0,
        "charon":  140.0,   # trầm ấm (male)
        "aoede":   210.0,   # nhẹ nhàng (female)
        "kore":    200.0,   # trong trẻo (female)
        "puck":    160.0,   # sôi động (male)
        "fenrir":  145.0,   # mạnh mẽ (male)
    }

    espeak_variants = {
        "default": "vi",
        "charon":  "vi+m1",
        "aoede":   "vi+f1",
        "kore":    "vi+f2",
        "puck":    "vi+m3",
        "fenrir":  "vi+m2",
    }

    for name in VOICE_NAMES:
        out_path = VOICES_DIR / f"{name}.wav"
        if out_path.exists():
            size_kb = out_path.stat().st_size / 1024
            print(f"[SKIP] {name}.wav ({size_kb:.0f} KB) — đã tồn tại")
            continue

        print(f"\n[GEN]  {name}.wav ...", flush=True)
        audio = None

        if strategy == "gtts":
            audio = _make_gtts(VI_TEXT)
            time.sleep(0.3)  # rate limit
        elif strategy == "espeak":
            audio = _make_espeak(VI_TEXT, espeak_variants.get(name, "vi"))

        if audio is None:
            print(f"  [FALLBACK] dùng synthetic signal cho {name}")
            audio = _make_synthetic(duration_s=20.0, base_hz=base_freqs[name])

        _save(audio, name)

    print("\n" + "=" * 60)
    print(" ✅ Hoàn tất!")
    print("=" * 60)
    existing = list(VOICES_DIR.glob("*.wav"))
    for f in existing:
        dur_s = sf.info(str(f)).duration
        print(f"   {f.name:20s}  {dur_s:.1f}s  {f.stat().st_size/1024:.0f} KB")

    if not existing:
        print("  (không tạo được file nào — kiểm tra lỗi ở trên)")
        sys.exit(1)

    print("\n💡 Để chất lượng THỰC SỰ tốt:")
    print("   Thu âm 15-30 giây giọng người thật, lưu WAV 44100Hz mono,")
    print(f"   thay file vào: {VOICES_DIR}/<tên>.wav")
    print("\n   Sau đó restart: bash /mnt/d/NovaX/start_fish_speech.sh")


if __name__ == "__main__":
    main()
