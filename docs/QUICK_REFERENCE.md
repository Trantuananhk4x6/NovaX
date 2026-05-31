# ⚡ Quick Reference Guide

**Essential Commands & Configurations for AI Narrator System**

---

## 🔑 Essential Commands

### CUDA & GPU

```bash
# Check GPU status
nvidia-smi

# Monitor GPU continuously
watch -n 1 nvidia-smi

# Check CUDA version
nvcc --version

# Test CUDA in Python
python -c \"import torch; print(torch.cuda.is_available())\"
```

### WSL2 Management

```bash
# List WSL instances
wsl --list --verbose

# Start WSL2
wsl -d Ubuntu-22.04

# Shutdown WSL2
wsl --shutdown

# Update WSL2 packages
sudo apt update && sudo apt upgrade -y
```

### Python & Virtual Environment

```bash
# Create virtual environment
python3.10 -m venv venv

# Activate venv
source venv/bin/activate

# Deactivate
deactivate

# Install from requirements
pip install -r requirements.txt

# Check installed packages
pip list
```

### PyTorch

```bash
# Check PyTorch info
python << 'EOF'
import torch
print(f\"PyTorch: {torch.__version__}\")
print(f\"CUDA: {torch.cuda.is_available()}\")
print(f\"GPU: {torch.cuda.get_device_name(0)}\")
print(f\"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB\")
EOF

# Clear GPU cache
python -c \"import torch; torch.cuda.empty_cache()\"
```

---

## 🚀 API Commands

### Start Services

```bash
# Terminal 1: Redis
redis-server --port 6379

# Terminal 2: FastAPI
cd backend
source ../venv/bin/activate
python -m uvicorn api.main:app --reload --port 8000

# Terminal 3: Worker (optional)
cd backend
source ../venv/bin/activate
python queue/job_worker.py
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Generate TTS
curl -X POST http://localhost:8000/api/v1/tts/generate \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"text\": \"Hello world\",
    \"voice_id\": \"narrator_male_en\",
    \"emotion\": \"neutral\",
    \"language\": \"en\"
  }'

# Get job status
curl http://localhost:8000/api/v1/tts/status/{JOB_ID}

# Download audio
curl http://localhost:8000/api/v1/tts/download/{JOB_ID} -o output.wav

# List voices
curl http://localhost:8000/api/v1/voices
```

---

## 📁 Directory Navigation

```bash
# Main project
cd ~/ai-narrator

# Backend
cd ~/ai-narrator/backend

# Models
cd ~/ai-narrator/models

# Audio output
cd ~/ai-narrator/audio_output

# Logs
cd ~/ai-narrator/logs

# Scripts
cd ~/ai-narrator/scripts
```

---

## 🎛️ Configuration Quick Settings

### Development (.env)

```
DEBUG=true
ENVIRONMENT=development
GPU_DTYPE=float32
API_WORKERS=4
REDIS_URL=redis://localhost:6379
```

### Production (.env)

```
DEBUG=false
ENVIRONMENT=production
GPU_DTYPE=float16
API_WORKERS=1
REDIS_URL=redis://redis-server:6379
```

### VRAM Optimization

```python
# Low VRAM Mode (< 8GB)
dtype = \"float16\"
batch_size = 1
cpu_offload = True
enable_memory_optimization = True

# Balanced (8-10GB)
dtype = \"float16\"
batch_size = 1
cpu_offload = False

# High Performance (> 10GB)
dtype = \"float32\"
batch_size = 1
cpu_offload = False
```

---

## 🎤 Voice Configuration

### Built-in Voices

```
narrator_male_deep_en     → Deep male narrator (YouTube style)
narrator_female_warm_en   → Warm female narrator
narrator_male_neutral_en  → Neutral male
narrator_female_calm_en   → Calm female
narrator_male_authoritative_es → Spanish narrator
```

### Emotion Tags

```
[NEUTRAL]       - Default, informational
[WARM]          - Friendly, approachable
[CALM]          - Relaxed, peaceful
[EXCITED]       - Energetic, enthusiastic
[DRAMATIC]      - Theatrical, expressive
[SUSPENSE]      - Tense, mysterious
[WHISPER]       - Intimate, quiet
[ANGRY]         - Forceful, intense
[CONFIDENT]     - Strong, assured
```

### Script Template

```markdown
[WARM]
Introduction text here.

[CALM]
Context and background.

[SUSPENSE]
Building tension...

[DRAMATIC]
The climax!

[CALM]
Resolution and conclusion.
```

---

## 📊 Performance Monitoring

### Check System Health

```bash
# VRAM usage
nvidia-smi --query-gpu=memory.used --format=csv

# CPU usage
top -b -n 1 | head -20

# Disk space
df -h

# Process memory
ps aux --sort=-%mem | head -10
```

### Check API Health

```bash
# Health endpoint
curl -s http://localhost:8000/api/v1/health | jq .

# GPU health
curl -s http://localhost:8000/api/v1/health/gpu | jq .

# System metrics
curl -s http://localhost:8000/api/v1/metrics | jq .
```

### Monitor Logs

```bash
# Real-time logs
tail -f logs/app.log

# Filter for errors
grep ERROR logs/app.log

# Count by level
grep -c INFO logs/app.log
grep -c WARNING logs/app.log
grep -c ERROR logs/app.log

# Last 100 lines
tail -100 logs/app.log
```

---

## 🎯 Common Workflows

### Generate Single Audio

```bash
# 1. Create script
echo \"[WARM]Welcome![/WARM]\" > script.txt

# 2. Process via API
curl -X POST http://localhost:8000/api/v1/tts/generate \\
  -H \"Content-Type: application/json\" \\
  -d '{\"text\": \"Welcome\", \"voice_id\": \"narrator_male_en\"}'

# Save job_id from response

# 3. Monitor
while true; do
  curl -s http://localhost:8000/api/v1/tts/status/{JOB_ID} | jq .status
  sleep 2
done

# 4. Download when complete
curl http://localhost:8000/api/v1/tts/download/{JOB_ID} -o output.wav
```

### Batch Generate

```bash
# 1. Create scripts
for i in {1..10}; do
  echo \"[NEUTRAL]Section $i content.[/NEUTRAL]\" > script_$i.txt
done

# 2. Submit all
for i in {1..10}; do
  python scripts/process_script.py script_$i.txt
done

# 3. Monitor queue
watch -n 2 \"curl -s http://localhost:8000/api/v1/metrics | jq .queue_length\"

# 4. Download all when done
python scripts/download_audio.py
```

### Create Full Video

```bash
# Execute complete pipeline
python scripts/pipeline.py scripts/example_story.md

# With YouTube upload
python scripts/pipeline.py scripts/example_story.md --upload
```

---

## 🆘 Troubleshooting Commands

### GPU Issues

```bash
# Reset GPU
nvidia-smi --gpu-reset

# Check CUDA capability
python -c \"import torch; print(torch.cuda.is_available(), torch.cuda.get_device_capability())\"

# Reboot system
sudo shutdown -r now
```

### API Issues

```bash
# Restart Redis
redis-cli shutdown
redis-server --port 6379

# Restart FastAPI
pkill -f \"uvicorn\"
cd backend && python -m uvicorn api.main:app --port 8000

# Check port 8000
lsof -i :8000
```

### Memory Issues

```bash
# Clear Python cache
find . -type d -name \"__pycache__\" -exec rm -r {} +

# Clear VRAM
python -c \"import torch; torch.cuda.empty_cache()\"

# Clear Redis
redis-cli FLUSHALL

# Restart everything
sudo systemctl restart redis
pkill -f \"uvicorn\"
```

### Audio Issues

```bash
# Check audio file
ffprobe audio_output/section_01.wav

# Convert format
ffmpeg -i input.wav -acodec libmp3lame -ab 192k output.mp3

# Normalize audio
ffmpeg -i input.wav -af \"loudnorm=I=-16:TP=-1.5:LRA=11\" output.wav

# Verify quality
sox input.wav -n stat
```

---

## 📝 Important File Locations

```
Config Files:
├─ backend/.env
├─ backend/config/settings.py
├─ backend/config/vram_config.py
└─ backend/api/schemas/tts_request.py

Model Files:
├─ models/fish-speech-1.5.pth
├─ models/tokenizer.model
├─ models/kokoro.pth
└─ models/embeddings/

Output Files:
├─ audio_output/
├─ logs/app.log
└─ job_ids.json

Script Files:
├─ scripts/process_script.py
├─ scripts/monitor_jobs.py
├─ scripts/download_audio.py
├─ scripts/audio_enhancement.py
├─ scripts/generate_subtitles.py
└─ scripts/pipeline.py
```

---

## 🔐 Security Quick Settings

### Development (Localhost Only)

```python
# config/settings.py
CORS_ORIGINS = [\"http://localhost:3000\"]
API_KEY_REQUIRED = False
DEBUG = True
```

### Production

```python
# config/settings.py
CORS_ORIGINS = [\"https://yourdomain.com\"]
API_KEY_REQUIRED = True
DEBUG = False
RATE_LIMIT_PER_MINUTE = 10
```

### API Authentication

```bash
# Generate token
python -c \"import secrets; print(secrets.token_urlsafe(32))\"

# Use in request
curl -H \"Authorization: Bearer {TOKEN}\" http://localhost:8000/api/v1/health
```

---

## 📦 Package Management

### Update All Packages

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt --upgrade
```

### Check for Vulnerabilities

```bash
pip install safety
safety check
```

### Create Requirements File

```bash
pip freeze > requirements.txt
```

---

## 🎓 Environment Variables

### GPU Configuration

```bash
export CUDA_VISIBLE_DEVICES=0           # Use GPU 0
export CUDA_LAUNCH_BLOCKING=1          # Sequential GPU execution
export TF_CPP_MIN_LOG_LEVEL=3           # Suppress TensorFlow warnings
export PYTHONUNBUFFERED=1              # Unbuffered output
```

### Application Configuration

```bash
export FLASK_ENV=production
export LOG_LEVEL=INFO
export API_PORT=8000
export REDIS_URL=redis://localhost:6379
```

---

## 📊 Quick Metrics

### RTX 3060 Reference

```
Max VRAM:          12.0 GB
Recommended Max:   10.0 GB
Safe Reserve:      2.0 GB

Fish Speech:       8.0 GB (fp32), 4.0 GB (fp16)
Kokoro:            3.0 GB (fp32), 2.0 GB (fp16)
XTTS v2:           6.0 GB (fp32), 3.0 GB (fp16)
StyleTTS2:         8.0 GB (fp32), 4.0 GB (fp16)

30-second audio:   ~2-3 seconds (Fish Speech)
                   ~0.3 seconds (Kokoro)

Queue throughput:  10-20 jobs/hour
```

---

## 🎬 Common Use Cases

### 1. YouTube Narrator (Single Video)

```bash
# 1. Write script
nano script.md

# 2. Process
python scripts/pipeline.py script.md

# 3. Upload
# Video ready at: final_video_with_subtitles.mp4
```

### 2. Podcast Generation

```bash
# Use multi-speaker voices
[CHARACTER_JOHN]\"Hello!\"[/CHARACTER_JOHN]
[CHARACTER_SARAH]\"Hi there!\"[/CHARACTER_SARAH]
```

### 3. Real-time API Service

```bash
# Start server
cd backend && python -m uvicorn api.main:app --workers 4 --port 8000

# Use via API
# POST /api/v1/tts/generate → 2-3 second response
```

### 4. Batch Production

```bash
# Process 100 scripts
for f in scripts/*.md; do
  python scripts/pipeline.py \"$f\"
done
```

---

## ✅ Pre-Launch Checklist

```bash
# System
[ ] GPU detected: nvidia-smi
[ ] VRAM adequate: nvidia-smi | grep \"12 GB\"
[ ] Python ready: python --version
[ ] Torch GPU: python -c \"import torch; print(torch.cuda.is_available())\"

# API
[ ] Redis running: redis-cli ping
[ ] FastAPI running: curl http://localhost:8000/api/v1/health
[ ] Models downloaded: ls models/fish-speech*.pth
[ ] Output dir ready: mkdir -p audio_output

# Configuration
[ ] .env file exists: ls backend/.env
[ ] Settings loaded: cat backend/config/settings.py
[ ] Paths correct: ls -la models/
```

---

## 🆘 Emergency Commands

```bash
# Kill all Python processes
pkill -9 python

# Kill all Redis processes
pkill -9 redis

# Clear all temp files
rm -rf __pycache__
find . -type d -name \"__pycache__\" -delete

# Reset GPU
nvidia-smi --gpu-reset=2

# Full system reset
sudo systemctl restart cuda
sudo systemctl restart redis
source venv/bin/activate
python -m uvicorn api.main:app --port 8000
```

---

## 📞 Help Resources

**CUDA Issues:** See SETUP_GUIDE.md → Troubleshooting
**API Issues:** See BACKEND_API.md → Troubleshooting
**Performance:** See OPTIMIZATION_GUIDE.md → Troubleshooting
**Voice Quality:** See EMOTION_SYSTEM.md → Quality Tips
**Full Pipeline:** See COMPLETE_WORKFLOW.md

---

**Last Updated:** May 28, 2026
**System:** RTX 3060 12GB + WSL2 Ubuntu
**Status:** ✅ Ready to Use
