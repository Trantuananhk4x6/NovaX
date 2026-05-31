"""Test Vietnamese G2P via Kokoro's misaki + espeak-ng"""
# Run: cd ~/ai-narrator && source venv/bin/activate && python3 /mnt/d/NovaX/test_vi_g2p.py

from kokoro import pipeline as kp
print("LANG_CODES:", kp.LANG_CODES)
print("ALIASES:", kp.ALIASES)

# Patch to add Vietnamese
kp.LANG_CODES['v'] = 'vi'
kp.ALIASES['vi'] = 'v'
kp.ALIASES['vi-vn'] = 'v'
print("\nPatched LANG_CODES:", kp.LANG_CODES)

from misaki import espeak
g2p = espeak.EspeakG2P(language='vi')
text = "Xin chào thế giới"
phonemes, _ = g2p(text)
print(f"\nInput:    '{text}'")
print(f"Phonemes: '{phonemes}'")

# Test full pipeline with Vietnamese
from kokoro import KPipeline, KModel
import torch, soundfile as sf, numpy as np

print("\nLoading KModel...")
model = KModel(repo_id='hexgrad/Kokoro-82M').to('cuda').eval()
vi_pipeline = KPipeline(lang_code='v', repo_id='hexgrad/Kokoro-82M', model=model)
print("KPipeline('v') created OK")

audio_parts = []
for gs, ps, audio in vi_pipeline("Xin chào, đây là test tiếng Việt.", voice="am_adam"):
    if audio is not None:
        audio_parts.append(audio.cpu().numpy())
        print(f"Chunk: '{gs}' → phonemes: '{ps}'")

if audio_parts:
    out = np.concatenate(audio_parts)
    sf.write("/tmp/test_vi.wav", out, 24000)
    print(f"\nSaved /tmp/test_vi.wav ({len(out)/24000:.2f}s)")
else:
    print("No audio generated!")
