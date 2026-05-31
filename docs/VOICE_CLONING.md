# 🎤 Voice Cloning & Advanced Techniques

**Creating custom AI narrator voices from reference audio**

---

## Part 1: Voice Cloning Fundamentals

### What is Voice Cloning?

Voice cloning is a machine learning technique that extracts unique voice characteristics (speaker embeddings) from a reference audio sample and applies them to synthesize new speech in any language with similar vocal properties.

### Prerequisites

**Reference Audio Requirements:**
- Duration: 5-60 seconds (minimum 5 seconds)
- Format: WAV, MP3, or FLAC
- Sample rate: 16kHz or 22.05kHz minimum
- Audio quality: Clean, minimal background noise
- Speaker consistency: Single speaker per clone
- Intelligibility: Clear speech, no heavy accents required

**Models for Cloning:**
1. **Fish Speech** - Best cloning quality (⭐⭐⭐⭐⭐)
2. **XTTS v2** - Good with short samples (⭐⭐⭐⭐)
3. **GPT-SoVITS** - Advanced cloning (⭐⭐⭐⭐⭐)

---

## Part 2: Voice Cloning Setup

### A. Prepare Reference Audio

```bash
# Extract clean audio from YouTube video (if needed)
youtube-dl -f 'bestaudio' -x --audio-format wav 'URL' -o '%(title)s.%(ext)s'

# Trim audio to 30 seconds
ffmpeg -i input.wav -ss 0:00:00 -t 0:00:30 -q:a 9 reference_audio.wav

# Verify audio
ffprobe reference_audio.wav

# Expected output:
# Duration: 00:00:30 (seconds)
# Sample Rate: 22050 Hz
# Channels: 1 (mono)
```

### B. Fish Speech Voice Cloning

```python
# backend/engines/models/fish_speech_cloner.py

import torch
import torchaudio
from pathlib import Path
import numpy as np
import logging

logger = logging.getLogger(__name__)

class FishSpeechCloner:
    \"\"\"Voice cloning with Fish Speech\"\"\"
    
    def __init__(self, model_path: str, device: str = \"cuda:0\"):
        self.device = device
        self.model_path = model_path
        self.model = self._load_model()
        
    def _load_model(self):
        \"\"\"Load Fish Speech model\"\"\"
        # Implementation depends on Fish Speech library
        pass
    
    def clone_voice(self, reference_audio_path: str, voice_name: str) -> dict:
        \"\"\"
        Clone a voice from reference audio
        
        Args:
            reference_audio_path: Path to reference audio file
            voice_name: Name for the cloned voice
            
        Returns:
            Dict with voice_id and speaker_embedding
        \"\"\"
        try:
            # Load reference audio
            waveform, sr = torchaudio.load(reference_audio_path)
            
            # Resample if needed
            if sr != 22050:
                resampler = torchaudio.transforms.Resample(sr, 22050)
                waveform = resampler(waveform)
            
            # Extract speaker embedding
            with torch.no_grad():
                speaker_embedding = self._extract_embedding(waveform)
            
            # Generate voice ID
            voice_id = f\"clone_{voice_name}_{int(time.time())}\"
            
            # Save speaker embedding
            embedding_path = f\"models/embeddings/{voice_id}.npy\"
            np.save(embedding_path, speaker_embedding.cpu().numpy())
            
            logger.info(f\"Voice cloned: {voice_id}\")
            
            return {
                \"voice_id\": voice_id,
                \"voice_name\": voice_name,
                \"embedding_path\": embedding_path,
                \"reference_duration\": waveform.shape[-1] / 22050,
                \"status\": \"ready\"
            }
        
        except Exception as e:
            logger.error(f\"Voice cloning error: {str(e)}\")
            raise
    
    def _extract_embedding(self, waveform: torch.Tensor) -> torch.Tensor:
        \"\"\"Extract speaker embedding from audio\"\"\"
        # Run through encoder to get embeddings
        with torch.no_grad():
            embedding = self.model.encode_speaker(
                waveform.to(self.device)
            )
        return embedding
    
    def synthesize_with_clone(self, text: str, voice_id: str, language: str = \"en\") -> torch.Tensor:
        \"\"\"
        Synthesize speech with cloned voice
        
        Args:
            text: Text to synthesize
            voice_id: Cloned voice ID
            language: Language code
            
        Returns:
            Audio waveform
        \"\"\"
        # Load speaker embedding
        embedding_path = f\"models/embeddings/{voice_id}.npy\"
        speaker_embedding = np.load(embedding_path)
        speaker_embedding = torch.from_numpy(speaker_embedding).to(self.device)
        
        # Generate speech with cloned voice
        with torch.no_grad():
            audio = self.model.synthesize(
                text=text,
                speaker_embedding=speaker_embedding,
                language=language,
                dtype=torch.float16
            )
        
        return audio
```

### C. API Endpoint for Voice Cloning

```python
# backend/api/routes/voice.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uuid
import logging
import shutil
import os

from engines.models.fish_speech_cloner import FishSpeechCloner
from api.schemas.tts_request import VoiceCloneRequest

logger = logging.getLogger(__name__)
router = APIRouter()

cloner = FishSpeechCloner(model_path=\"./models\")

@router.post(\"/voices/clone\")
async def create_voice_clone(file: UploadFile = File(...)):
    \"\"\"
    Create a cloned voice from uploaded audio
    
    Args:
        file: Audio file (WAV, MP3, FLAC)
        
    Returns:
        Voice clone information
    \"\"\"
    try:
        # Validate file
        if file.content_type not in [\"audio/wav\", \"audio/mpeg\", \"audio/flac\"]:
            raise HTTPException(
                status_code=400,
                detail=\"File must be WAV, MP3, or FLAC\"
            )
        
        # Save uploaded file
        file_ext = file.filename.split(\".\")[-1]
        temp_path = f\"/tmp/voice_ref_{uuid.uuid4()}.{file_ext}\"
        
        with open(temp_path, \"wb\") as f:
            content = await file.read()
            f.write(content)
        
        # Clone voice
        voice_name = file.filename.split(\".\")[0]
        clone_info = cloner.clone_voice(temp_path, voice_name)
        
        # Cleanup
        os.remove(temp_path)
        
        return {
            \"status\": \"success\",
            **clone_info
        }
    
    except Exception as e:
        logger.error(f\"Voice cloning error: {str(e)}\")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(\"/voices\")
async def list_voices():
    \"\"\"List available voices (built-in + cloned)\"\"\"
    built_in_voices = [
        {
            \"voice_id\": \"narrator_male_deep_en\",
            \"name\": \"Deep Narrator (Male)\",
            \"language\": \"en\",
            \"gender\": \"male\",
            \"is_clone\": False,
            \"description\": \"Professional narrator voice\"
        },
        {
            \"voice_id\": \"narrator_female_warm_en\",
            \"name\": \"Warm Narrator (Female)\",
            \"language\": \"en\",
            \"gender\": \"female\",
            \"is_clone\": False,
            \"description\": \"Friendly, engaging narrator\"
        }
    ]
    
    # Add cloned voices from database
    cloned_voices = get_cloned_voices_from_db()  # Implement as needed
    
    return {
        \"built_in\": built_in_voices,
        \"cloned\": cloned_voices
    }
```

---

## Part 3: Creating High-Quality Clones

### Best Reference Audio Sources

```
✅ BEST (Clean, clear speech):
- Professional voice talent recordings
- Podcast audio (mono version)
- Audiobook narration samples
- TED talk clips
- News anchor recordings

⚠️ ACCEPTABLE (Some cleanup needed):
- YouTube video narration
- Movie/TV dialogue
- Dubbed foreign films
- Audio interviews

❌ AVOID (Too noisy):
- Music videos with singing
- Movies with background music
- Noisy environment recordings
- Heavy accent variations
```

### Preparation Workflow

```bash
# 1. Extract audio segment
ffmpeg -i video.mp4 -ss 00:05:00 -t 00:00:30 audio_segment.wav

# 2. Normalize audio level
ffmpeg-normalize audio_segment.wav -c:a pcm_s16le -o normalized.wav

# 3. Remove background noise (optional)
sox normalized.wav denoised.wav norm -3.0

# 4. Verify quality
ffprobe -show_format -show_streams denoised.wav | grep -E \"duration|sample_rate\"

# 5. Final check
python << 'EOF'
import librosa
y, sr = librosa.load('denoised.wav', sr=22050)
print(f\"Duration: {len(y)/sr:.1f}s\")
print(f\"RMS Energy: {librosa.feature.rms(y=y).mean():.3f}\")
# RMS should be > 0.02 (not too quiet)
EOF
```

---

## Part 4: Voice Cloning Quality Tips

### Tip 1: Duration Sweet Spot

```
Duration          | Quality | Speed  | Best For
---------------------------------------------------
5 seconds         | 7/10    | ⚡⚡   | Quick clones
15 seconds        | 8.5/10  | ⚡    | Good balance
30 seconds        | 9.5/10  | ⚡    | Optimal
60 seconds        | 9.5/10  | ⚠️    | Overkill, slow
```

### Tip 2: Audio Content Matters

```
BEST FOR CLONING:
\"The quick brown fox jumps over the lazy dog.\"
→ Contains variety of phonemes

\"Welcome to our channel.\"
→ Natural conversational tone

\"Today we explore ancient history.\"
→ Clear pronunciation

AVOID:
- Whispered speech
- Heavily processed audio
- Fast talking
- Slurred speech
```

### Tip 3: Pre-processing Checklist

```python
import librosa
import numpy as np

def validate_reference_audio(audio_path: str) -> dict:
    \"\"\"Validate reference audio quality\"\"\"
    y, sr = librosa.load(audio_path, sr=22050)
    
    # Duration check
    duration = len(y) / sr
    if duration < 5:
        return {\"valid\": False, \"reason\": \"Too short (min 5s)\"}
    if duration > 120:
        return {\"valid\": False, \"reason\": \"Too long (max 120s)\"}
    
    # Silence check
    S = librosa.feature.melspectrogram(y=y, sr=sr)
    db = librosa.power_to_db(S)
    mean_db = db.mean()
    if mean_db < -30:
        return {\"valid\": False, \"reason\": \"Audio too quiet\"}
    
    # Clipping check
    if np.max(np.abs(y)) > 0.99:
        return {\"valid\": False, \"reason\": \"Audio clipped/distorted\"}
    
    # Noise level (SNR estimate)
    rms = librosa.feature.rms(y=y).mean()
    if rms < 0.02:
        return {\"valid\": False, \"reason\": \"RMS too low\"}
    
    return {
        \"valid\": True,
        \"duration\": duration,
        \"rms\": float(rms),
        \"db_level\": float(mean_db)
    }
```

---

## Part 5: Advanced Cloning Techniques

### Technique 1: Multi-Sample Cloning

```python
# Combine multiple reference samples for better embeddings

def create_enhanced_clone(audio_samples: List[str], voice_name: str):
    \"\"\"
    Create clone from multiple reference samples
    
    Args:
        audio_samples: List of reference audio paths
        voice_name: Name for cloned voice
        
    Returns:
        Enhanced voice clone
    \"\"\"
    embeddings = []
    
    # Extract embedding from each sample
    for audio_path in audio_samples:
        waveform, _ = torchaudio.load(audio_path)
        embedding = cloner._extract_embedding(waveform)
        embeddings.append(embedding)
    
    # Average embeddings for robustness
    averaged_embedding = torch.stack(embeddings).mean(dim=0)
    
    # Save averaged embedding
    voice_id = f\"multi_clone_{voice_name}\"
    np.save(f\"models/embeddings/{voice_id}.npy\", 
            averaged_embedding.cpu().numpy())
    
    return voice_id
```

### Technique 2: Voice Adaptation

```python
# Adapt built-in voice to sound more like reference

def adapt_voice(base_voice_id: str, reference_audio: str, adaptation_strength: float = 0.5):
    \"\"\"
    Adapt built-in voice towards reference audio
    
    Args:
        base_voice_id: Built-in voice to adapt
        reference_audio: Reference audio to adapt towards
        adaptation_strength: 0-1, higher = more adaptation
        
    Returns:
        Adapted voice_id
    \"\"\"
    # Load base embedding
    base_embedding = load_base_voice_embedding(base_voice_id)
    
    # Extract reference embedding
    waveform, _ = torchaudio.load(reference_audio)
    ref_embedding = cloner._extract_embedding(waveform)
    
    # Blend embeddings
    adapted_embedding = (1 - adaptation_strength) * base_embedding + \
                       adaptation_strength * ref_embedding
    
    # Save adapted voice
    adapted_voice_id = f\"adapted_{base_voice_id}_{int(time.time())}\"
    np.save(f\"models/embeddings/{adapted_voice_id}.npy\", 
            adapted_embedding.cpu().numpy())
    
    return adapted_voice_id
```

### Technique 3: Style Transfer

```python
# Transfer emotional style from one voice to another

def transfer_voice_style(source_voice: str, target_voice: str, 
                        emotion: str = \"warm\") -> str:
    \"\"\"
    Transfer vocal characteristics from one voice to another
    
    Args:
        source_voice: Voice to copy style from
        target_voice: Voice to apply style to
        emotion: Emotional context
        
    Returns:
        Hybrid voice_id
    \"\"\"
    source_emb = load_voice_embedding(source_voice)
    target_emb = load_voice_embedding(target_voice)
    
    # Extract prosody/style features
    source_prosody = extract_prosody_features(source_emb)
    
    # Apply to target
    hybrid_emb = apply_prosody_to_embedding(target_emb, source_prosody)
    
    hybrid_id = f\"hybrid_{source_voice}_{target_voice}\"
    np.save(f\"models/embeddings/{hybrid_id}.npy\", hybrid_emb.cpu().numpy())
    
    return hybrid_id
```

---

## Part 6: VRAM Optimization for Cloning

### Memory-Efficient Cloning

```python
# config/cloning_config.py

CLONING_CONFIG = {
    # Inference settings
    \"inference\": {
        \"dtype\": \"float16\",  # Half precision
        \"batch_size\": 1,      # Process one at a time
        \"cpu_offload\": True,  # Offload non-critical parts
    },
    
    # Memory management
    \"memory\": {
        \"enable_gradient_checkpointing\": False,  # Not needed for inference
        \"empty_cache_interval\": 10,  # Every 10 clones
        \"max_audio_length\": 60,  # Max 60 seconds
    },
    
    # Embedding optimization
    \"embeddings\": {
        \"quantize_embeddings\": True,  # Use int8 for storage
        \"embedding_size\": 256,  # Reduced from 512
        \"use_cache\": True,
    }
}
```

### Monitor Cloning Performance

```python
import torch
import time
import logging

logger = logging.getLogger(__name__)

class CloningMonitor:
    \"\"\"Monitor voice cloning performance\"\"\"
    
    def __init__(self):
        self.metrics = {
            \"total_clones\": 0,
            \"avg_time\": 0,
            \"peak_vram\": 0
        }
    
    def monitor_clone_process(self, reference_audio: str):
        \"\"\"Monitor a single clone operation\"\"\"
        start_time = time.time()
        start_vram = torch.cuda.memory_allocated() / 1e9
        
        # Perform cloning...
        
        end_time = time.time()
        end_vram = torch.cuda.memory_allocated() / 1e9
        
        clone_time = end_time - start_time
        vram_used = end_vram - start_vram
        
        self.metrics[\"total_clones\"] += 1
        self.metrics[\"avg_time\"] = (
            (self.metrics[\"avg_time\"] * (self.metrics[\"total_clones\"] - 1) + clone_time)
            / self.metrics[\"total_clones\"]
        )
        self.metrics[\"peak_vram\"] = max(self.metrics[\"peak_vram\"], vram_used)
        
        logger.info(
            f\"Clone completed in {clone_time:.2f}s, \"
            f\"VRAM used: {vram_used:.2f}GB, \"
            f\"Avg: {self.metrics['avg_time']:.2f}s\"
        )
```

---

## Part 7: Common Issues & Solutions

### Issue 1: Cloned Voice Sounds Robotic

```python
# Solution: Use higher quality reference

✅ DO:
- Use clear, natural speech
- Avoid robotic-sounding sources (e.g., Google Translate)
- Choose expressive speakers

❌ DON'T:
- Use AI-generated audio as reference
- Use heavily processed voice
- Use singing or unusual prosody
```

### Issue 2: Poor Multilingual Cloning

```python
# Solution: Use language-specific audio

def clone_multilingual_voice(reference_audios: Dict[str, str], voice_name: str):
    \"\"\"
    Create language-specific clones
    
    Args:
        reference_audios: Dict mapping language to audio path
        voice_name: Base name for clones
    \"\"\"
    clones = {}
    
    for language, audio_path in reference_audios.items():
        # Ensure reference audio is in target language
        clone_id = cloner.clone_voice(audio_path, f\"{voice_name}_{language}\")
        clones[language] = clone_id
    
    return clones
```

### Issue 3: Clone Sounds Different from Reference

```python
# Solution: Validate quality

def validate_clone_similarity(original_audio: str, clone_voice_id: str) -> float:
    \"\"\"
    Measure how similar clone is to original
    
    Returns:
        Similarity score 0-1
    \"\"\"
    # Load original audio
    orig_waveform, sr = torchaudio.load(original_audio)
    orig_embedding = cloner._extract_embedding(orig_waveform)
    
    # Generate clone audio
    clone_audio = cloner.synthesize_with_clone(
        \"The quick brown fox jumps over the lazy dog\",
        clone_voice_id
    )
    clone_embedding = cloner._extract_embedding(clone_audio)
    
    # Calculate cosine similarity
    similarity = torch.nn.functional.cosine_similarity(
        orig_embedding.unsqueeze(0),
        clone_embedding.unsqueeze(0)
    ).item()
    
    return similarity
```

---

## Part 8: Voice Cloning Workflow

```yaml
# Complete workflow for production

workflow:
  step_1_preparation:
    - Record or extract 30-second reference audio
    - Normalize audio levels
    - Remove background noise
    - Save as WAV 22.05kHz mono

  step_2_validation:
    - Check duration (5-60 seconds)
    - Verify audio quality (RMS > 0.02)
    - Test for clipping
    - Validate sample rate

  step_3_cloning:
    - Load model to GPU
    - Extract speaker embeddings
    - Generate voice_id
    - Save embeddings

  step_4_testing:
    - Generate test audio
    - Compare with reference
    - Verify across languages
    - Check emotion control

  step_5_deployment:
    - Register voice in API
    - Set permissions
    - Create voice profile
    - Enable for users

  step_6_monitoring:
    - Track clone usage
    - Monitor quality metrics
    - Collect user feedback
    - Update embeddings if needed
```

---

## Part 9: Best Practices

✅ **DO:**
- Use 15-30 second samples (optimal)
- Clean audio with minimal noise
- Natural speech patterns
- Professional voice talent
- Store multiple backups
- Test before deployment
- Monitor similarity scores

❌ **DON'T:**
- Use AI-generated audio as reference
- Process audio too much
- Use singing or whispers
- Mix multiple speakers
- Use very short (< 5s) samples
- Deploy without testing
- Ignore quality metrics

---

## 📊 Cloning Quality Scorecard

| Criteria | Weight | Scoring |
|----------|--------|---------|
| Reference Audio Quality | 30% | 0-100 |
| Embedding Extraction | 25% | 0-100 |
| Multilingual Performance | 25% | 0-100 |
| Emotion Preservation | 20% | 0-100 |

**Target Score:** 90+ for production use

---

Next: See `OPTIMIZATION_GUIDE.md` for RTX 3060 specific optimization
