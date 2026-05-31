"""
Download real reference audio từ fish.audio để dùng với Fish Speech local.
Chạy NGAY trong WSL2 (URLs hết hạn sau 1 giờ):
  cd ~/ai-narrator && source venv/bin/activate
  python3 /mnt/d/NovaX/download_real_voices.py
"""
import urllib.request, json, io, os, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf
import scipy.signal

VOICES_DIR = Path.home() / "ai-narrator" / "voices"
VOICES_DIR.mkdir(parents=True, exist_ok=True)
SR = 44_100

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def get_json(url, headers=None):
    return json.loads(get(url, headers))

def save_audio(raw_bytes: bytes, name: str, src_format: str = "mp3") -> bool:
    tmp = Path(f"/tmp/_fish_{name}.{src_format}")
    tmp.write_bytes(raw_bytes)

    # Try soundfile first
    try:
        audio, sr = sf.read(str(tmp), always_2d=False)
    except Exception:
        # Try ffmpeg
        import subprocess
        wav_tmp = Path(f"/tmp/_fish_{name}.wav")
        r = subprocess.run(
            ["ffmpeg", "-y", "-i", str(tmp), "-ar", str(SR), "-ac", "1", str(wav_tmp)],
            capture_output=True, timeout=30
        )
        if r.returncode != 0:
            print(f"  [ERR] ffmpeg failed: {r.stderr.decode()[:100]}")
            return False
        audio, sr = sf.read(str(wav_tmp))
        wav_tmp.unlink(missing_ok=True)

    tmp.unlink(missing_ok=True)

    # Mono + resample
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    audio = audio.astype(np.float32)
    if sr != SR:
        n = int(len(audio) * SR / sr)
        audio = scipy.signal.resample(audio, n).astype(np.float32)

    # Normalize
    peak = np.abs(audio).max()
    if peak > 1e-6:
        audio = (audio / peak * 0.88).astype(np.float32)

    out = VOICES_DIR / f"{name}.wav"
    sf.write(str(out), audio, SR, subtype="PCM_16")
    print(f"  ✅ {out.name}  {len(audio)/SR:.1f}s  {out.stat().st_size//1024}KB")
    return True

# ─────────────────────────────────────────────────────────────────────────────
# Voices to download: (file_name, fish_audio_model_id, description)
# ─────────────────────────────────────────────────────────────────────────────
TARGETS = [
    # ── Vietnamese ──────────────────────────────────────────────────────────
    ("linh_truyen",  "3f366bc073b449bca5838fb37d26ff62", "VN female — voice truyện nữ trẻ (88K tasks)"),
    ("phong_binhlu", "835a674392f64d9bb819ad0de17ce388", "VN male  — Bình luận viên Tạ Biên Giới (232 tasks)"),
    ("jessica_vi",   "e252335b9b314e919d22d54164397dd7", "VN female — Jessica (162 tasks)"),
    ("viet_nam_m",   "2e324e52a86c4ec69d98bb99e1b61c5b", "VN male  — Vietnam (149 tasks)"),
    # ── More Vietnamese from Korean section (mislabeled) ─────────────────────
    ("mai_truyen2",  "4e298b87e291459aa9ede6ed07a6b336", "VN female — voice han (83K tasks)"),
    # ── Japanese ─────────────────────────────────────────────────────────────
    ("genki_f",      "5161d41404314212af1254556477c17d", "JA female — 元気な女性 (210K tasks)"),
    ("miku",         "6717a74323274cb296ea9a0da654c977", "JA female — Hatsune Miku style (153K tasks)"),
    # ── Chinese ──────────────────────────────────────────────────────────────
    ("cctv_m",       "59cb5986671546eaa6ca8ae6f29f6d22", "ZH male   — 央视配音 CCTV announcer (136K tasks)"),
]

KEY = os.getenv("FISH_AUDIO_API_KEY", "")
HDR = {"Authorization": f"Bearer {KEY}"} if KEY else {}

print("=" * 64)
print(f" Downloading {len(TARGETS)} reference voices from fish.audio")
print(f" Output: {VOICES_DIR}")
print("=" * 64)

ok = 0
for fname, model_id, desc in TARGETS:
    out = VOICES_DIR / f"{fname}.wav"
    if out.exists():
        print(f"[SKIP] {fname}.wav already exists")
        ok += 1
        continue

    print(f"\n[DL] {fname}.wav — {desc}")
    try:
        data = get_json(f"https://api.fish.audio/model/{model_id}", HDR)
        samples = data.get("samples", [])
        if not samples:
            print("  [ERR] No samples in model")
            continue
        audio_url = samples[0].get("audio") or samples[0].get("audio_url")
        if not audio_url:
            print(f"  [ERR] No audio URL in sample. Keys: {list(samples[0].keys())}")
            continue
        print(f"  URL: {audio_url[:60]}…")
        raw = get(audio_url)
        fmt = "mp3" if "mp3" in audio_url else "wav"
        if save_audio(raw, fname, fmt):
            ok += 1
    except Exception as e:
        print(f"  [ERR] {e}")
    time.sleep(0.3)

print(f"\n{'='*64}")
print(f" ✅ Downloaded {ok}/{len(TARGETS)} voices")
print(f"{'='*64}")
print(f"\nFiles in {VOICES_DIR}:")
for f in sorted(VOICES_DIR.glob("*.wav")):
    print(f"  {f.name:25}  {f.stat().st_size//1024}KB")

print("\nUpdate voices.ts with new voice IDs, then restart Fish Speech.")
