#!/usr/bin/env bash
for i in $(seq 1 20); do
    sleep 3
    CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/tts/health 2>/dev/null || echo "000")
    echo "Try $i: HTTP $CODE"
    if [ "$CODE" = "200" ]; then
        echo "=== Kokoro Service Ready ==="
        curl -s http://localhost:8080/tts/health
        echo ""
        echo "=== Available Voices ==="
        curl -s http://localhost:8080/tts/voices
        break
    fi
done
