# 🔌 FastAPI Backend Implementation Guide

**Complete API for AI Narrator TTS Engine**

---

## File 1: `backend/config/settings.py`

```python
\"\"\"Configuration management for AI Narrator backend\"\"\"
import os
from typing import Optional
from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = \"AI Narrator TTS Engine\"
    APP_VERSION: str = \"1.0.0\"
    DEBUG: bool = os.getenv(\"DEBUG\", \"false\").lower() == \"true\"
    ENVIRONMENT: str = os.getenv(\"ENVIRONMENT\", \"development\")
    
    # API Configuration
    API_HOST: str = \"0.0.0.0\"
    API_PORT: int = int(os.getenv(\"API_PORT\", \"8000\"))
    API_WORKERS: int = int(os.getenv(\"API_WORKERS\", \"4\"))
    API_TIMEOUT: int = 300
    
    # GPU Configuration
    GPU_DEVICE: int = 0
    GPU_VRAM_LIMIT: str = \"10GB\"
    GPU_DTYPE: str = \"float16\"  # or \"float32\"
    GPU_ENABLE_OPTIMIZATION: bool = True
    
    # Model Paths
    MODELS_DIR: str = os.path.join(os.getcwd(), \"models\")
    FISH_SPEECH_CHECKPOINT: str = os.path.join(MODELS_DIR, \"fish-speech-1.5.pth\")
    KOKORO_CHECKPOINT: str = os.path.join(MODELS_DIR, \"kokoro.pth\")
    XTTS_V2_CHECKPOINT: str = os.path.join(MODELS_DIR, \"xtts_v2.pth\")
    
    # Queue Configuration
    REDIS_URL: str = os.getenv(\"REDIS_URL\", \"redis://localhost:6379\")
    QUEUE_MAX_RETRIES: int = 3
    QUEUE_TIMEOUT: int = 300
    
    # Storage Configuration
    STORAGE_TYPE: str = \"local\"  # or \"s3\"
    OUTPUT_DIR: str = os.path.join(os.getcwd(), \"audio_output\")
    MAX_AUDIO_LENGTH: int = 600  # 10 minutes
    
    # Cache Configuration
    CACHE_TTL: int = 3600
    CACHE_MAX_SIZE: str = \"5GB\"
    ENABLE_CACHE: bool = True
    
    # Logging
    LOG_LEVEL: str = \"INFO\"
    LOG_FILE: str = os.path.join(os.getcwd(), \"logs/app.log\")
    
    class Config:
        env_file = \".env\"
        case_sensitive = True

# Initialize settings
settings = Settings()

# Create required directories
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)

logger.info(f\"Settings loaded: {settings.ENVIRONMENT} mode\")
```

---

## File 2: `backend/api/schemas/tts_request.py`

```python
\"\"\"Pydantic schemas for TTS requests and responses\"\"\"
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
from datetime import datetime

class EmotionType(str, Enum):
    \"\"\"Supported emotions\"\"\"
    NEUTRAL = \"neutral\"
    WARM = \"warm\"
    SAD = \"sad\"
    ANGRY = \"angry\"
    SUSPENSE = \"suspense\"
    WHISPER = \"whisper\"
    LAUGH = \"laugh\"
    EXCITED = \"excited\"
    CALM = \"calm\"
    CONFIDENT = \"confident\"

class LanguageType(str, Enum):
    \"\"\"Supported languages\"\"\"
    ENGLISH = \"en\"
    SPANISH = \"es\"
    GERMAN = \"de\"
    FRENCH = \"fr\"
    JAPANESE = \"ja\"
    KOREAN = \"ko\"
    VIETNAMESE = \"vi\"
    CHINESE = \"zh\"
    PORTUGUESE = \"pt\"
    HINDI = \"hi\"
    ARABIC = \"ar\"

class ModelType(str, Enum):
    \"\"\"Available TTS models\"\"\"
    FISH_SPEECH = \"fish_speech\"
    KOKORO = \"kokoro\"
    XTTS_V2 = \"xtts_v2\"
    STYLE_TTS2 = \"style_tts2\"
    AUTO = \"auto\"  # Automatic model selection

class VoiceCloneRequest(BaseModel):
    \"\"\"Voice cloning request\"\"\"
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    audio_url: str = Field(...)
    language: LanguageType = LanguageType.ENGLISH
    
    class Config:
        example = {
            \"name\": \"My Custom Voice\",
            \"description\": \"Deep male narrator voice\",
            \"audio_url\": \"https://example.com/sample.wav\",
            \"language\": \"en\"
        }

class TTSRequest(BaseModel):
    \"\"\"Main TTS generation request\"\"\"
    text: str = Field(..., min_length=1, max_length=10000)
    voice_id: Optional[str] = Field(None, description=\"Voice ID or 'clone:{clone_id}'\"
    emotion: EmotionType = EmotionType.NEUTRAL
    language: LanguageType = LanguageType.ENGLISH
    model: ModelType = ModelType.AUTO
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=1.0, ge=0.5, le=1.5)
    
    # Advanced options
    enable_emotion_tags: bool = True
    enable_subtitle_generation: bool = True
    enable_enhancement: bool = True
    output_format: str = Field(default=\"wav\", regex=\"^(wav|mp3|flac)$\")
    
    # Callback
    callback_url: Optional[str] = None
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        \"\"\"Validate and clean input text\"\"\"
        if len(v.strip()) == 0:
            raise ValueError('Text cannot be empty')
        return v.strip()
    
    class Config:
        example = {
            \"text\": \"Today we explore the mysteries of ancient civilizations.\",
            \"voice_id\": \"narrator_male_en\",
            \"emotion\": \"calm\",
            \"language\": \"en\",
            \"speed\": 1.0,
            \"enable_subtitle_generation\": True
        }

class JobStatus(str, Enum):
    QUEUED = \"queued\"
    PROCESSING = \"processing\"
    COMPLETED = \"completed\"
    FAILED = \"failed\"
    CANCELLED = \"cancelled\"

class JobResponse(BaseModel):
    \"\"\"Job status response\"\"\"
    job_id: str
    status: JobStatus
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Progress info
    progress: int = Field(default=0, ge=0, le=100)
    estimated_seconds: Optional[float] = None
    
    # Results (when completed)
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    subtitle_url: Optional[str] = None
    metadata: Optional[dict] = None
    
    # Error info
    error: Optional[str] = None
    error_code: Optional[str] = None
    
    class Config:
        example = {
            \"job_id\": \"550e8400-e29b-41d4-a716-446655440000\",
            \"status\": \"processing\",
            \"progress\": 45,
            \"estimated_seconds\": 5.5
        }

class VoiceConfig(BaseModel):
    \"\"\"Voice configuration\"\"\"
    voice_id: str
    name: str
    language: LanguageType
    accent: Optional[str] = None
    gender: Optional[str] = None
    age_category: Optional[str] = None
    description: Optional[str] = None
    is_clone: bool = False
    
    class Config:
        example = {
            \"voice_id\": \"narrator_male_en_deep\",
            \"name\": \"Deep Narrator\",
            \"language\": \"en\",
            \"accent\": \"american\",
            \"gender\": \"male\",
            \"age_category\": \"adult\"
        }

class HealthCheckResponse(BaseModel):
    \"\"\"Health check response\"\"\"
    status: str = \"healthy\"
    version: str
    gpu_available: bool
    gpu_memory_gb: Optional[float] = None
    models_loaded: List[str] = []
    queue_length: int = 0
    
    class Config:
        example = {
            \"status\": \"healthy\",
            \"version\": \"1.0.0\",
            \"gpu_available\": True,
            \"gpu_memory_gb\": 8.5,
            \"models_loaded\": [\"fish_speech\"],
            \"queue_length\": 3
        }
```

---

## File 3: `backend/config/vram_config.py`

```python
\"\"\"VRAM management and optimization\"\"\"
import torch
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class VRAMManager:
    \"\"\"Manage VRAM for RTX 3060 (12GB)\"\"\"
    
    def __init__(self, device: int = 0):
        self.device = device
        self.total_vram = self._get_total_vram()
        self.reserved_vram = 0.5  # 500MB reserved for system
        self.available_vram = self.total_vram - self.reserved_vram
        
    def _get_total_vram(self) -> float:
        \"\"\"Get total VRAM in GB\"\"\"
        if torch.cuda.is_available():
            return torch.cuda.get_device_properties(self.device).total_memory / 1e9
        return 0
    
    def get_free_vram(self) -> float:
        \"\"\"Get free VRAM in GB\"\"\"
        if not torch.cuda.is_available():
            return 0
        
        allocated = torch.cuda.memory_allocated(self.device) / 1e9
        reserved = torch.cuda.memory_reserved(self.device) / 1e9
        total = self.total_vram
        free = total - allocated - reserved
        return max(0, free)
    
    def get_vram_info(self) -> Dict:
        \"\"\"Get detailed VRAM information\"\"\"
        if not torch.cuda.is_available():
            return {\"available\": False}
        
        total = self.total_vram
        allocated = torch.cuda.memory_allocated(self.device) / 1e9
        reserved = torch.cuda.memory_reserved(self.device) / 1e9
        free = self.get_free_vram()
        
        return {
            \"available\": True,
            \"total_gb\": total,
            \"allocated_gb\": allocated,
            \"reserved_gb\": reserved,
            \"free_gb\": free,
            \"utilization_percent\": (allocated / total) * 100
        }
    
    def can_load_model(self, model_vram_gb: float) -> bool:
        \"\"\"Check if model can fit in VRAM\"\"\"
        free = self.get_free_vram()
        # Add 1GB buffer
        required = model_vram_gb + 1.0
        return free >= required
    
    def empty_cache(self):
        \"\"\"Clear VRAM cache\"\"\"
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info(\"VRAM cache cleared\")
    
    def get_model_config(self, model_name: str) -> Dict:
        \"\"\"Get optimal config for model based on available VRAM\"\"\"
        free_vram = self.get_free_vram()
        
        configs = {
            \"fish_speech\": {
                \"batch_size\": 1,
                \"dtype\": \"float16\" if free_vram < 10 else \"float32\",
                \"load_in_8bit\": free_vram < 8,
                \"enable_cpu_offload\": free_vram < 8,
            },
            \"kokoro\": {
                \"batch_size\": 4 if free_vram > 10 else 2,
                \"dtype\": \"float32\",
                \"load_in_8bit\": False,
            },
            \"xtts_v2\": {
                \"batch_size\": 1,
                \"dtype\": \"float16\" if free_vram < 10 else \"float32\",
                \"load_in_8bit\": free_vram < 8,
            },
            \"style_tts2\": {
                \"batch_size\": 1,
                \"dtype\": \"float16\" if free_vram < 10 else \"float32\",
                \"load_in_8bit\": free_vram < 8,
            }
        }
        
        return configs.get(model_name, configs[\"fish_speech\"])

# Global VRAM manager
vram_manager = VRAMManager()
```

---

## File 4: `backend/api/main.py`

```python
\"\"\"FastAPI application entry point\"\"\"
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import traceback
from datetime import datetime
import uvicorn

from config.settings import settings
from config.vram_config import vram_manager
from api.routes import tts, voice, job, health
from api.middleware import setup_middleware

# Setup logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    \"\"\"Application lifecycle\"\"\"
    # Startup
    logger.info(f\"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}\")
    logger.info(f\"Environment: {settings.ENVIRONMENT}\")
    logger.info(f\"GPU VRAM Info: {vram_manager.get_vram_info()}\")
    yield
    # Shutdown
    logger.info(\"🛑 Shutting down AI Narrator\")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=\"Advanced multilingual TTS engine for narration\",
    lifespan=lifespan
)

# Setup middleware
setup_middleware(app)

# Include routes
app.include_router(health.router, prefix=\"/api/v1\", tags=[\"Health\"])
app.include_router(tts.router, prefix=\"/api/v1\", tags=[\"TTS\"])
app.include_router(voice.router, prefix=\"/api/v1\", tags=[\"Voice\"])
app.include_router(job.router, prefix=\"/api/v1\", tags=[\"Job\"])

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f\"HTTP Exception: {exc.detail}\")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            \"error\": exc.detail,
            \"timestamp\": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f\"Exception: {str(exc)}\", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            \"error\": \"Internal server error\",
            \"detail\": str(exc) if settings.DEBUG else \"An error occurred\",
            \"timestamp\": datetime.now().isoformat()
        }
    )

if __name__ == \"__main__\":
    uvicorn.run(
        \"main:app\",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
```

---

## File 5: `backend/api/routes/tts.py`

```python
\"\"\"TTS generation endpoints\"\"\"
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
import uuid
import logging
from datetime import datetime

from api.schemas.tts_request import TTSRequest, JobResponse, JobStatus
from engines.tts_orchestrator import tts_orchestrator
from queue.job_queue import job_queue

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post(\"/tts/generate\", response_model=JobResponse)
async def generate_tts(request: TTSRequest, background_tasks: BackgroundTasks):
    \"\"\"
    Generate speech from text
    
    Args:
        request: TTS generation request with text and parameters
        
    Returns:
        Job information with status and job_id
    \"\"\"
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Queue the job
        job = job_queue.enqueue(
            job_id=job_id,
            task_type=\"tts\",
            data=request.dict(),
            priority=\"normal\"
        )
        
        logger.info(f\"TTS job queued: {job_id}\")
        
        return JobResponse(
            job_id=job_id,
            status=JobStatus.QUEUED,
            created_at=datetime.now(),
            progress=0,
            estimated_seconds=5.0
        )
    
    except Exception as e:
        logger.error(f\"TTS generation error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(\"/tts/status/{job_id}\", response_model=JobResponse)
async def get_status(job_id: str):
    \"\"\"Get TTS generation status\"\"\"
    try:
        job = job_queue.get_job(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail=\"Job not found\")
        
        return JobResponse(**job)
    
    except Exception as e:
        logger.error(f\"Status check error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(\"/tts/download/{job_id}\")
async def download_audio(job_id: str):
    \"\"\"Download generated audio\"\"\"
    try:
        job = job_queue.get_job(job_id)
        
        if not job:
            raise HTTPException(status_code=404, detail=\"Job not found\")
        
        if job[\"status\"] != JobStatus.COMPLETED:
            raise HTTPException(status_code=400, detail=\"Job not completed\")
        
        if not job.get(\"audio_url\"):
            raise HTTPException(status_code=404, detail=\"Audio file not found\")
        
        return FileResponse(job[\"audio_url\"])
    
    except Exception as e:
        logger.error(f\"Download error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete(\"/tts/cancel/{job_id}\")
async def cancel_job(job_id: str):
    \"\"\"Cancel TTS generation job\"\"\"
    try:
        job_queue.cancel_job(job_id)
        return {\"status\": \"cancelled\", \"job_id\": job_id}
    
    except Exception as e:
        logger.error(f\"Cancel error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## File 6: `backend/api/routes/health.py`

```python
\"\"\"Health check endpoints\"\"\"
from fastapi import APIRouter, HTTPException
import logging
import torch

from api.schemas.tts_request import HealthCheckResponse
from config.settings import settings
from config.vram_config import vram_manager
from queue.job_queue import job_queue

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(\"/health\", response_model=HealthCheckResponse)
async def health_check():
    \"\"\"Basic health check\"\"\"
    try:
        vram_info = vram_manager.get_vram_info()
        
        return HealthCheckResponse(
            status=\"healthy\",
            version=settings.APP_VERSION,
            gpu_available=vram_info.get(\"available\", False),
            gpu_memory_gb=vram_info.get(\"free_gb\", 0),
            models_loaded=[\"fish_speech\"],  # Update based on loaded models
            queue_length=job_queue.get_queue_length()
        )
    
    except Exception as e:
        logger.error(f\"Health check error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(\"/health/gpu\")
async def gpu_health():
    \"\"\"GPU health detailed check\"\"\"
    try:
        if not torch.cuda.is_available():
            raise HTTPException(status_code=503, detail=\"GPU not available\")
        
        vram_info = vram_manager.get_vram_info()
        
        return {
            \"status\": \"healthy\" if vram_info[\"utilization_percent\"] < 95 else \"warning\",
            \"device\": torch.cuda.get_device_name(0),
            **vram_info
        }
    
    except Exception as e:
        logger.error(f\"GPU health check error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(\"/metrics\")
async def metrics():
    \"\"\"Get system metrics\"\"\"
    try:
        vram_info = vram_manager.get_vram_info()
        
        return {
            \"timestamp\": datetime.now().isoformat(),
            \"vram\": vram_info,
            \"queue_length\": job_queue.get_queue_length(),
            \"processed_jobs\": job_queue.get_stats()[\"processed\"],
            \"failed_jobs\": job_queue.get_stats()[\"failed\"]
        }
    
    except Exception as e:
        logger.error(f\"Metrics error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## File 7: `backend/requirements.txt`

```txt
# Core
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0

# GPU & ML
torch==2.1.2
torchaudio==2.1.2
numpy==1.24.3
scipy==1.11.4

# Audio processing
librosa==0.10.0
soundfile==0.12.1
pydub==0.25.1
wave==0.0.2

# Queue & Caching
redis==5.0.1
rq==1.14.1
celery==5.3.4

# Database (optional)
sqlalchemy==2.0.23
psycopg2-binary==2.9.9

# Utilities
python-dotenv==1.0.0
pyyaml==6.0.1
python-jose==3.3.0
passlib==1.7.4

# Monitoring
prometheus-client==0.19.0

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.12.0
flake8==6.1.0
```

---

## 🚀 Running the Backend

```bash
# 1. Setup environment
cd ~/ai-narrator/backend
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download models
python scripts/download_models.py

# 4. Start Redis (in separate terminal)
redis-server

# 5. Start API server
python -m uvicorn api.main:app --reload --port 8000

# 6. Test endpoint
curl http://localhost:8000/api/v1/health
```

Expected output:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "gpu_available": true,
  "gpu_memory_gb": 10.5,
  "models_loaded": ["fish_speech"],
  "queue_length": 0
}
```

---

## 📝 Example Usage

### 1. Generate TTS

```bash
curl -X POST http://localhost:8000/api/v1/tts/generate \\
  -H \"Content-Type: application/json\" \\
  -d '{
    \"text\": \"Welcome to the AI Narrator system.\",
    \"voice_id\": \"narrator_male_en\",
    \"emotion\": \"warm\",
    \"language\": \"en\",
    \"speed\": 1.0,
    \"enable_subtitle_generation\": true
  }'
```

Response:
```json
{
  \"job_id\": \"550e8400-e29b-41d4-a716-446655440000\",
  \"status\": \"queued\",
  \"created_at\": \"2024-01-15T10:30:00\",
  \"progress\": 0,
  \"estimated_seconds\": 2.5
}
```

### 2. Check Status

```bash
curl http://localhost:8000/api/v1/tts/status/550e8400-e29b-41d4-a716-446655440000
```

### 3. Download Audio

```bash
curl http://localhost:8000/api/v1/tts/download/550e8400-e29b-41d4-a716-446655440000 -o output.wav
```

---

Next: See `EMOTION_SYSTEM.md` for emotional synthesis implementation
