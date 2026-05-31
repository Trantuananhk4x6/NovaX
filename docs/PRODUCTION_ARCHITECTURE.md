# 🏗️ Production Architecture: AI Narrator System

**Designed for RTX 3060 12GB, 28GB RAM, Local Deployment**

---

## 📐 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                         │
│                   (Next.js Application)                     │
│        - Script Input Interface                             │
│        - Voice Selection & Cloning                          │
│        - Real-time Preview                                  │
│        - Job Management Dashboard                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│              (FastAPI + Load Balancer)                      │
│        - Request Validation                                 │
│        - Authentication/Authorization                       │
│        - Request Queuing                                    │
│        - Rate Limiting                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──┐   ┌──────▼──┐   ┌──────▼──┐
│ Job      │   │ Cache   │   │ Metrics │
│ Queue    │   │ Layer   │   │ Logging │
│ (Redis)  │   │(Redis)  │   │(Prom)   │
└────┬─────┘   └─────────┘   └─────────┘
     │
┌────▼─────────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER                             │
│        (Python Queue Manager + Celery/RQ)                   │
│        - Job Routing                                         │
│        - Model Selection                                     │
│        - VRAM Management                                     │
│        - Retry Logic                                         │
└────┬──────────┬───────────────┬──────────────────────────────┘
     │          │               │
     │    ┌─────▼────┐    ┌────▼──────┐
     │    │ Emotion  │    │ Routing   │
     │    │ Engine   │    │ Engine    │
     │    └──────────┘    └───────────┘
     │
┌────▼─────────────────────────────────────────────────────────┐
│           TTS ENGINE ORCHESTRATOR                            │
│        - Model Pool Management                               │
│        - Batch Processing                                    │
│        - Model Loading/Unloading                             │
│        - VRAM Allocation                                     │
└────┬─────────┬──────────┬──────────┬────────────────────────┘
     │         │          │          │
┌────▼──┐  ┌──▼──┐  ┌────▼──┐  ┌───▼───┐
│ Fish  │  │Koko │  │ XTTS  │  │ Style │
│Speech │  │ ro  │  │  v2   │  │ TTS2  │
│8GB    │  │ 3GB │  │ 6GB   │  │ 8GB   │
└───────┘  └─────┘  └───────┘  └───────┘
     │         │          │          │
     └─────────┴──────────┴──────────┘
              │
       ┌──────▼─────────┐
       │   GPU/CUDA     │
       │  RTX 3060 12GB │
       └────────────────┘
     │
┌────▼─────────────────────────────────────────────────────────┐
│         POST-PROCESSING LAYER                                │
│        - Audio Mastering (Normalization)                     │
│        - Voice Enhancement                                   │
│        - Subtitle Generation                                 │
│        - Format Conversion                                   │
└────┬──────────────────────────────────────────────────────────┘
     │
┌────▼─────────────────────────────────────────────────────────┐
│         STORAGE & DELIVERY LAYER                             │
│        - Local File Storage                                  │
│        - CDN Cache                                           │
│        - Archive Management                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
User Input (Script + Metadata)
        │
        ▼
┌──────────────────┐
│ Validation       │ - Schema validation
│ & Formatting    │ - Text normalization
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Emotion          │ - Parse emotion tags
│ Extraction       │ - Extract speaker info
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ LLM Script       │ - Add pauses
│ Enhancement      │ - Add emphasis markers
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Model Selection  │ - Choose primary TTS
│ & Routing        │ - Select voice
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Batch Chunking   │ - Split into 30s chunks
│ & Optimization   │ - Optimize for GPU
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ GPU Inference    │ - Load model to VRAM
│                  │ - Generate audio
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Post-Processing  │ - Normalize audio
│ & Mastering      │ - Enhance quality
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Subtitle Gen     │ - Forced alignment
│                  │ - Timing extraction
└────────┬─────────┘
         │
         ▼
Output (Audio + Metadata + Subtitles)
```

---

## 🧠 Component Descriptions

### 1. API Gateway (FastAPI)
```python
# Responsibilities:
- Request validation (Pydantic models)
- Authentication (JWT tokens)
- Request queuing (Redis)
- Rate limiting (per-user quota)
- Error handling & logging
- Response formatting

# Example request:
POST /api/v1/tts/generate
{
    "text": "Hello world",
    "voice": "narrator_male_en",
    "emotion": "neutral",
    "language": "en",
    "speed": 1.0,
    "priority": "normal"
}

# Response:
{
    "job_id": "uuid",
    "status": "queued",
    "estimated_time": 5,
    "callback_url": "..."
}
```

### 2. Job Queue (Redis + RQ/Celery)
```python
# Manages:
- Job persistence
- Job status tracking
- Retry logic
- Dead letter queue
- Priority queuing

# Queue structure:
- priority: high/normal/low
- max_retries: 3
- timeout: 300 seconds
- result_ttl: 3600 seconds
```

### 3. TTS Engine Orchestrator
```python
# Manages:
- Model loading/unloading
- VRAM allocation
- Model selection
- Batch processing
- Error handling

# Algorithm:
if script_length <= 30s:
    use Fish Speech (high quality)
elif emotion_needed:
    use StyleTTS2 for emotional parts
    use Fish Speech for narrative
else:
    use Kokoro (fast)
```

### 4. Emotion Engine
```python
# Processes:
- Emotion tags: [EMOTION_NAME] text [/EMOTION_NAME]
- Speaker embeddings
- Prosody control
- Pause insertion
- Speed variation

# Supported emotions:
- neutral, warm, sad, angry, suspense
- whisper, laugh, hesitation
- confident, calm, excited
```

### 5. Post-Processing
```python
# Steps:
1. Audio normalization (loudness)
2. Noise reduction (if needed)
3. Equalization (voice enhancement)
4. Format conversion (wav → mp3)
5. Metadata embedding (ID3)
```

### 6. Subtitle Generator
```python
# Generates:
- .srt format
- Timing information
- Forced alignment
- Multi-language support
```

---

## 📦 Directory Structure

```
ai-narrator/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── routes/
│   │   │   ├── tts.py           # /api/tts endpoints
│   │   │   ├── voice.py         # /api/voice endpoints
│   │   │   ├── job.py           # /api/job endpoints
│   │   │   └── health.py        # /api/health
│   │   ├── middleware/
│   │   │   ├── auth.py
│   │   │   ├── logging.py
│   │   │   └── error_handler.py
│   │   └── schemas/
│   │       ├── tts_request.py
│   │       ├── job_response.py
│   │       └── voice_config.py
│   │
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── tts_orchestrator.py  # Main TTS controller
│   │   ├── emotion_engine.py    # Emotion processing
│   │   ├── models/
│   │   │   ├── fish_speech.py   # Fish Speech wrapper
│   │   │   ├── kokoro.py        # Kokoro wrapper
│   │   │   ├── xtts_v2.py       # XTTS v2 wrapper
│   │   │   └── style_tts2.py    # StyleTTS2 wrapper
│   │   └── vram_manager.py      # VRAM optimization
│   │
│   ├── processing/
│   │   ├── audio_processor.py   # Audio post-processing
│   │   ├── subtitle_gen.py      # Subtitle generation
│   │   ├── batch_processor.py   # Batch handling
│   │   └── voice_cloner.py      # Voice cloning
│   │
│   ├── queue/
│   │   ├── job_queue.py         # Redis queue management
│   │   ├── job_worker.py        # Worker processes
│   │   └── job_scheduler.py     # Job scheduling
│   │
│   ├── config/
│   │   ├── settings.py          # Configuration
│   │   ├── vram_config.py       # VRAM settings
│   │   └── model_config.py      # Model settings
│   │
│   ├── utils/
│   │   ├── logger.py
│   │   ├── metrics.py           # Prometheus metrics
│   │   └── cache.py             # Caching layer
│   │
│   ├── models/
│   │   └── downloaded TTS models here
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
│
├── scripts/
│   ├── setup.sh                 # Setup script
│   ├── download_models.sh       # Model download
│   ├── run_backend.sh           # Start backend
│   └── test_api.py              # API testing
│
├── audio_output/                # Generated audio
├── logs/                        # Application logs
└── config/
    ├── docker-compose.yml
    └── nginx.conf
```

---

## 🚀 Deployment Architecture

### Development (Single Machine)

```
Windows 11 Host
    │
    ├─ WSL2 Ubuntu
    │    │
    │    ├─ FastAPI API (port 8000)
    │    ├─ Redis Queue (port 6379)
    │    ├─ Worker Process
    │    ├─ TTS Engines
    │    └─ GPU (RTX 3060)
    │
    └─ Next.js Frontend (port 3000)
```

### Production (Future Scale)

```
Load Balancer (nginx)
    │
    ├─ API Server 1 (FastAPI)
    ├─ API Server 2 (FastAPI)
    ├─ API Server 3 (FastAPI)
    │
    ├─ Redis Cluster (Queue + Cache)
    │
    ├─ Worker Pool 1 (RTX 3060)
    ├─ Worker Pool 2 (RTX 4090)
    ├─ Worker Pool 3 (RTX A6000)
    │
    ├─ Storage (S3/Local)
    ├─ CDN (for delivery)
    └─ Monitoring (Prometheus + Grafana)
```

---

## ⚙️ Configuration Example

```yaml
# config/settings.yml
app:
  name: "AI Narrator"
  version: "1.0.0"
  environment: "development"
  debug: true

api:
  host: "0.0.0.0"
  port: 8000
  workers: 4
  timeout: 300

gpu:
  device: 0
  vram_limit: "10GB"
  dtype: "float16"
  enable_memory_optimization: true

models:
  primary: "fish_speech"
  fallback: "kokoro"
  cache_dir: "./models"
  
  fish_speech:
    enabled: true
    checkpoint: "./models/fish-speech-1.5.pth"
    vram_gb: 8
    batch_size: 1
    
  kokoro:
    enabled: true
    checkpoint: "./models/kokoro.pth"
    vram_gb: 3
    batch_size: 4
    
  xtts_v2:
    enabled: true
    checkpoint: "./models/xtts_v2.pth"
    vram_gb: 6
    batch_size: 1
    
  style_tts2:
    enabled: false  # Enable for emotional content
    checkpoint: "./models/style_tts2.pth"
    vram_gb: 8

queue:
  backend: "redis"
  url: "redis://localhost:6379"
  max_retries: 3
  timeout: 300

storage:
  type: "local"
  path: "./audio_output"
  max_age_days: 30

cache:
  backend: "redis"
  ttl: 3600
  max_size: "5GB"

logging:
  level: "INFO"
  format: "json"
  file: "./logs/app.log"

monitoring:
  prometheus_enabled: true
  prometheus_port: 9090
  metrics_prefix: "ai_narrator_"
```

---

## 🔌 API Endpoints

```
# TTS Generation
POST   /api/v1/tts/generate
GET    /api/v1/tts/status/{job_id}
DELETE /api/v1/tts/cancel/{job_id}

# Voice Management
GET    /api/v1/voices
GET    /api/v1/voices/{voice_id}
POST   /api/v1/voices/clone
GET    /api/v1/voices/clone/{clone_id}

# Job Management
GET    /api/v1/jobs
GET    /api/v1/jobs/{job_id}
GET    /api/v1/jobs/{job_id}/download

# System Health
GET    /api/v1/health
GET    /api/v1/health/gpu
GET    /api/v1/metrics
```

---

## 📊 Performance Targets

| Metric | Target | RTX 3060 |
|--------|--------|---------|
| Latency (p95) | < 2s | ✅ |
| Throughput | 10 jobs/hour | ✅ |
| Availability | 99.5% | ✅ |
| VRAM Usage | < 12GB | ✅ |
| Queue Length | < 20 | ✅ |
| Model Load Time | < 500ms | ✅ |

---

## 🔐 Security Considerations

1. **API Authentication**: JWT tokens
2. **Rate Limiting**: Per-IP quota
3. **Input Validation**: Pydantic schemas
4. **CORS**: Restricted origins
5. **Encryption**: TLS for API
6. **Logging**: Audit trail
7. **Monitoring**: Anomaly detection

---

## 📈 Monitoring & Observability

```python
# Key metrics:
- api_requests_total
- api_request_duration_seconds
- tts_generation_duration_seconds
- gpu_memory_usage_bytes
- gpu_utilization_percent
- job_queue_length
- model_load_time_seconds
- cache_hit_ratio
- error_rate_percent
```

---

## 🔄 Deployment Steps

1. Setup WSL2 + CUDA (45 min)
2. Clone backend repo (5 min)
3. Download models (30 min)
4. Start API server (2 min)
5. Test endpoints (5 min)
6. Deploy frontend (5 min)
7. Run load tests (10 min)
8. Monitor metrics (ongoing)

**Total: ~2 hours**

---

## 🚨 Scaling Strategy

### Phase 1: Local Single GPU (Now)
- ✅ Single RTX 3060
- ✅ Batch processing
- ✅ Queue management
- Throughput: 10-20 jobs/hour

### Phase 2: Multi-GPU (Future)
- Add second GPU
- Parallel processing
- Model sharding
- Throughput: 50-100 jobs/hour

### Phase 3: Distributed (Future)
- Multiple machines
- Load balancing
- Auto-scaling
- Throughput: 1000+ jobs/hour

---

Next: See `BACKEND_API.md` for FastAPI implementation
