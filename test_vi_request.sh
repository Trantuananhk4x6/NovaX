#!/usr/bin/env bash
# Test Vietnamese TTS
echo "Test 1: Vietnamese with diacritics (auto-detect → espeak vi G2P)"
curl -s -X POST http://localhost:8080/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Xin chào các bạn, đây là hệ thống NovaX AI giọng nói.","voice":"am_adam","speed":1.0}' \
  -o /tmp/vi_adam.wav -w "HTTP %{http_code} size=%{size_download}B\n"

echo ""
echo "Test 2: English text → English G2P (same voice)"
curl -s -X POST http://localhost:8080/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello everyone, welcome to NovaX voice platform.","voice":"am_adam","speed":1.0}' \
  -o /tmp/en_adam.wav -w "HTTP %{http_code} size=%{size_download}B\n"

echo ""
echo "Check log for lang detection:"
tail -5 /tmp/kokoro.log
