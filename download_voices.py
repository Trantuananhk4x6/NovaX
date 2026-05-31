"""
download_voices.py — Tải reference audio cho Fish Speech từ fish.audio
======================================================================

Fish Speech không có built-in voices. Script này tải reference audio
từ fish.audio public model hub để dùng làm voice conditioning.

Cách dùng:
  cd ~/ai-narrator
  source venv/bin/activate
  python3 /mnt/d/NovaX/download_voices.py

Yêu cầu:
  - Kết nối internet
  - FISH_AUDIO_API_KEY trong env (tùy chọn — chỉ cần cho private models)
"""
from __future__ import annotations

import os
import sys
import time
import urllib.request
import json
from pathlib import Path

import numpy as np
import soundfile as sf
import scipy.signal

VOICES_DIR = Path.home() / "ai-narrator" / "voices"
VOICES_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.getenv("FISH_AUDIO_API_KEY", "")
SR_TARGET = 44_100

# ─────────────────────────────────────────────────────────────────────────────
# Danh sách voice model public trên fish.audio cho tiếng Việt
# Tìm thêm tại: https://fish.audio/m/  → search "Vietnamese"
#
# Format: { "tên_file": "model_id_trên_fish_audio" }
# model_id là chuỗi 32 ký tự trong URL fish.audio/m/<model_id>
# ─────────────────────────────────────────────────────────────────────────────
VOICE_TARGETS = {
    # Tên file WAV (không có .wav) : fish.audio model ID
    # Thay các ID dưới đây bằng model_id thực từ fish.audio
    # Truy cập https://fish.audio và tìm giọng Vietnamese bạn thích
    # Copy phần ID trong URL: fish.audio/m/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    "aoede":  None,   # Thay bằng ID giọng nữ nhẹ nhàng
    "kore":   None,   # Thay bằng ID giọng nữ trong trẻo
    "charon": None,   # Thay bằng ID giọng nam trầm ấm
    "fenrir": None,   # Thay bằng ID giọng nam mạnh mẽ
    "puck":   None,   # Thay bằng ID giọng nam sôi động
}

def download_url(url: str, headers: dict | None = None) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def resample_save(audio: np.ndarray, src_sr: int, path: Path) -> None:
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if src_sr != SR_TARGET:
        n = int(len(audio) * SR_TARGET / src_sr)
        audio = scipy.signal.resample(audio, n).astype(np.float32)
    peak = np.abs(audio).max()
    if peak > 1e-6:
        audio = (audio / peak * 0.85).astype(np.float32)
    sf.write(str(path), audio, SR_TARGET, subtype="PCM_16")
    print(f"  ✅ Saved {path.name}  ({len(audio)/SR_TARGET:.1f}s)")

def download_from_fish_audio(model_id: str, out_name: str) -> bool:
    """
    Tải sample audio từ fish.audio model.
    API: GET https://api.fish.audio/model/{model_id}
         → response.voices[0].url  (sample audio URL)
    """
    headers = {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}
    try:
        raw = download_url(f"https://api.fish.audio/model/{model_id}", headers)
        data = json.loads(raw)
    except Exception as e:
        print(f"  [ERR] Không lấy được model info: {e}")
        return False

    # Sample audio is in data['voices'][0]['url'] or data['samples'][0]['url']
    sample_url = None
    for key in ("voices", "samples"):
        items = data.get(key, [])
        if items and isinstance(items, list):
            item = items[0]
            if isinstance(item, dict):
                sample_url = item.get("url") or item.get("audio_url")
            elif isinstance(item, str):
                sample_url = item
            if sample_url:
                break

    if not sample_url:
        print(f"  [WARN] Không tìm thấy sample audio trong model {model_id}")
        print(f"  Model data keys: {list(data.keys())}")
        return False

    # Tải audio
    try:
        audio_bytes = download_url(sample_url, headers)
    except Exception as e:
        print(f"  [ERR] Tải sample thất bại: {e}")
        return False

    # Lưu vào temp và đọc với soundfile
    tmp = Path("/tmp/_fish_sample.wav")
    tmp.write_bytes(audio_bytes)
    try:
        audio, sr = sf.read(str(tmp))
        resample_save(audio, sr, VOICES_DIR / f"{out_name}.wav")
        return True
    except Exception as e:
        print(f"  [ERR] Đọc audio thất bại: {e}")
        return False

# ─────────────────────────────────────────────────────────────────────────────
# Tìm kiếm Vietnamese voices trên fish.audio
# ─────────────────────────────────────────────────────────────────────────────
def search_vietnamese_voices(max_results: int = 20) -> list[dict]:
    """Tìm public Vietnamese voice models trên fish.audio."""
    headers = {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}
    try:
        url = "https://api.fish.audio/model?language=vi&sort_by=task_count&page_size=20&visibility=public"
        raw = download_url(url, headers)
        data = json.loads(raw)
        items = data.get("items", data) if isinstance(data, dict) else data
        return items[:max_results] if isinstance(items, list) else []
    except Exception as e:
        print(f"[WARN] Không tìm được voices: {e}")
        return []

# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    print("=" * 64)
    print(" Fish Speech — Voice Reference Downloader")
    print(f" Output: {VOICES_DIR}")
    print("=" * 64)

    # Bước 1: Liệt kê public Vietnamese voices để user chọn
    print("\n[1] Tìm kiếm Vietnamese voices trên fish.audio …")
    voices = search_vietnamese_voices()

    if voices:
        print(f"\nTìm thấy {len(voices)} Vietnamese voices:")
        print("-" * 64)
        for i, v in enumerate(voices):
            vid  = v.get("_id", v.get("id", "?"))
            name = v.get("title", v.get("name", "?"))
            tasks = v.get("task_count", "?")
            tags  = ", ".join(v.get("tags", [])[:3])
            print(f"  [{i+1:2}] {name[:30]:30}  tasks={tasks:6}  id={vid[:16]}…")
            if tags:
                print(f"       tags: {tags}")
        print("-" * 64)
        print("\nCách dùng:")
        print("  1. Mở https://fish.audio và tìm giọng bạn muốn")
        print("  2. Copy model ID từ URL: fish.audio/m/<model_id>")
        print("  3. Điền vào VOICE_TARGETS ở đầu file này")
        print("  4. Chạy lại script")
    else:
        print("[WARN] Không tìm thấy voices (có thể cần API key)")

    # Bước 2: Tải voices đã cấu hình (nếu có)
    configured = {k: v for k, v in VOICE_TARGETS.items() if v}
    if not configured:
        print("\n[2] Chưa cấu hình model_id nào trong VOICE_TARGETS")
        print("    Chỉnh sửa file này và điền model_id từ fish.audio")
        _show_manual_instructions()
        return

    print(f"\n[2] Tải {len(configured)} voice(s) đã cấu hình …")
    success = 0
    for name, model_id in configured.items():
        out_path = VOICES_DIR / f"{name}.wav"
        if out_path.exists():
            print(f"  [SKIP] {name}.wav đã tồn tại (xóa để tải lại)")
            success += 1
            continue
        print(f"\n  [DL] {name} ← model {model_id[:16]}…")
        if download_from_fish_audio(model_id, name):
            success += 1
        time.sleep(0.5)

    print(f"\n✅ Hoàn tất: {success}/{len(configured)} voices tải thành công")
    if success:
        print("\nRestart Fish Speech service để áp dụng:")
        print("  bash /mnt/d/NovaX/start_fish_speech.sh")

def _show_manual_instructions() -> None:
    print("""
──────────────────────────────────────────────────────────
  CÁCH TẢI VOICE THỦ CÔNG (không cần script)
──────────────────────────────────────────────────────────

  1. Mở https://fish.audio
  2. Tìm kiếm "Vietnamese" hoặc ngôn ngữ bạn muốn
  3. Vào trang voice model bạn thích
  4. Click "Try" → nó sẽ tạo 1 đoạn audio mẫu
  5. Right-click audio player → Save audio as → lưu .wav

  Hoặc:
  - Nhờ 1 người (hoặc dùng TTS khác) đọc 15-30 giây bằng giọng thật
  - Export WAV 44100Hz, 1 channel (mono), 16-bit

  Đặt file vào:
    ~/ai-narrator/voices/charon.wav   (giọng Đức)
    ~/ai-narrator/voices/aoede.wav    (giọng Mai)
    ~/ai-narrator/voices/kore.wav     (giọng Linh)
    ~/ai-narrator/voices/puck.wav     (giọng Minh)
    ~/ai-narrator/voices/fenrir.wav   (giọng Phong)

  Chạy lại:
    bash /mnt/d/NovaX/start_fish_speech.sh
──────────────────────────────────────────────────────────
""")

if __name__ == "__main__":
    main()
