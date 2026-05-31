#!/usr/bin/env bash
# Run from WSL2: bash /mnt/d/NovaX/run_kokoro_bg.sh
cd /home/tony/ai-narrator
source venv/bin/activate
export PYTHONPATH="/mnt/d/NovaX/backend:${PYTHONPATH:-}"
python3 -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8080 \
    --workers 1 \
    --log-level info \
    --app-dir /mnt/d/NovaX/backend \
    > /tmp/kokoro.log 2>&1 &
echo "Started PID=$!"
echo "Logs: tail -f /tmp/kokoro.log"
# Wait for startup
sleep 20
curl -s http://localhost:8080/tts/health || echo "Service not responding yet"
