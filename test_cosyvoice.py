"""Test CosyVoice2 import in ai-narrator venv"""
import sys, os
sys.path.insert(0, "/home/tony/cosyvoice/CosyVoice/third_party/Matcha-TTS")
sys.path.insert(0, "/home/tony/cosyvoice/CosyVoice")
os.chdir("/home/tony/cosyvoice/CosyVoice")

import traceback
try:
    from cosyvoice.cli.cosyvoice import CosyVoice2
    print("Import OK")
    c = CosyVoice2("pretrained_models/CosyVoice2-0.5B")
    print("Load OK, sample_rate=", c.sample_rate)
except Exception as e:
    traceback.print_exc()
    print("FAILED:", e)
