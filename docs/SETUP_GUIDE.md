# 🔧 Complete Setup Guide: Local AI Narrator on Windows + WSL2

**Target System:** Windows 11 + WSL2 Ubuntu + RTX 3060 12GB + CUDA 12.4

---

## 📋 Prerequisites Check

```powershell
# PowerShell - Check Windows version
Get-WmiObject -Class Win32_OperatingSystem | Select-Object Caption

# Should show: Windows 11
# Build: 22000 or higher
```

---

## Step 1️⃣: Setup WSL2 with GPU Support

### A. Enable WSL2

```powershell
# PowerShell (as Administrator)
wsl --install
wsl --set-default-version 2

# Install Ubuntu 22.04 LTS
wsl --install -d Ubuntu-22.04

# Verify installation
wsl --list --verbose
```

Expected output:
```
NAME            STATE           VERSION
Ubuntu-22.04    Running         2
```

### B. Setup Windows GPU Drivers

```powershell
# Download NVIDIA CUDA Toolkit for Windows
# Go to: https://developer.nvidia.com/cuda-downloads

# Select:
# - Operating System: Windows
# - Architecture: x86_64
# - Version: 11
# - Installer Type: exe (network)

# Run the installer and select:
# ✅ NVIDIA Graphics Driver
# ✅ CUDA Toolkit 12.4
# ✅ cuDNN
```

### C. Verify CUDA on Windows

```powershell
# Check NVIDIA driver
nvidia-smi

# Expected output:
# NVIDIA-SMI 550.xx
# RTX 3060 12GB
# CUDA Version: 12.4
```

---

## Step 2️⃣: Setup WSL2 Ubuntu Environment

### A. Initial Ubuntu Setup

```bash
# WSL2 Ubuntu terminal
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y python3.10 python3-pip python3-venv git wget curl build-essential

# Verify Python
python3 --version  # Should be 3.10+
```

### B. Install CUDA Toolkit in WSL2

```bash
# Add NVIDIA CUDA Repository
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A4B469963BF863CC
sudo apt-add-repository 'deb http://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64 /'

# Update and install
sudo apt update
sudo apt install -y cuda-toolkit-12-4 cuda-runtime-12-4

# Add to PATH
echo 'export PATH=/usr/local/cuda-12.4/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.4/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

# Verify CUDA
nvcc --version
cuda-runtime-api-version
```

Expected output:
```
nvcc: NVIDIA (R) Cuda compiler driver
Cuda compilation tools, release 12.4
```

### C. Install cuDNN

```bash
# Download cuDNN 8.x for CUDA 12.x from NVIDIA website
# https://developer.nvidia.com/cudnn

# Extract and copy files
tar -xzf cudnn-linux-x86_64-8.x.x_cuda12-archive.tar.xz

sudo cp cudnn-linux-x86_64-8.x.x_cuda12-archive/include/cudnn.h /usr/local/cuda-12.4/include/
sudo cp cudnn-linux-x86_64-8.x.x_cuda12-archive/lib/libcudnn* /usr/local/cuda-12.4/lib64/
sudo chmod a+r /usr/local/cuda-12.4/include/cudnn.h /usr/local/cuda-12.4/lib64/libcudnn*

# Update library cache
sudo ldconfig
```

### D. Verify GPU Access in WSL2

```bash
# Test GPU access
nvidia-smi

# Expected: RTX 3060 visible with 12GB VRAM
```

---

## Step 3️⃣: Create Project Directory Structure

```bash
# In WSL2 Ubuntu
mkdir -p ~/ai-narrator
cd ~/ai-narrator

# Create directory structure
mkdir -p {models,backend,audio_input,audio_output,scripts,config,logs}

# Structure:
# ai-narrator/
# ├── models/          # TTS models storage
# ├── backend/         # FastAPI application
# ├── audio_input/     # Input scripts
# ├── audio_output/    # Generated audio
# ├── scripts/         # Setup scripts
# ├── config/          # Configuration files
# └── logs/            # Application logs
```

---

## Step 4️⃣: Setup Python Virtual Environment

```bash
cd ~/ai-narrator

# Create venv
python3.10 -m venv venv
source venv/bin/activate

# Verify
which python
python --version
```

---

## Step 5️⃣: Install PyTorch with CUDA Support

```bash
# In activated venv
pip install --upgrade pip setuptools wheel

# Install PyTorch for CUDA 12.4
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124

# Verify CUDA support
python << 'EOF'
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"CUDA Version: {torch.version.cuda}")
print(f"Device: {torch.cuda.get_device_name(0)}")
print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f}GB")
EOF
```

Expected output:
```
PyTorch: 2.x.x
CUDA Available: True
CUDA Version: 12.4
Device: NVIDIA RTX 3060
Memory: 12.0GB
```

---

## Step 6️⃣: Install Fish Speech

### A. Clone Fish Speech Repository

```bash
cd ~/ai-narrator
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech

# Install dependencies
pip install -e .
pip install pydantic numpy scipy

# Install specific version for stability
pip install torch==2.1.2 torchaudio==2.1.2
```

### B. Download Fish Speech Models

```bash
cd ~/ai-narrator/models

# Download encoder
wget https://huggingface.co/fishaudio/fish-speech-1.5/resolve/main/fish-speech-1.5.pth

# Download tokenizer
wget https://huggingface.co/fishaudio/fish-speech-1.5/resolve/main/tokenizer.model

# Download decoder
wget https://huggingface.co/fishaudio/fish-speech-1.5/resolve/main/decoder.pth

# Verify downloads
ls -lah *.pth *.model
```

### C. Test Fish Speech Installation

```bash
cd ~/ai-narrator/fish-speech

# Test basic functionality
python << 'EOF'
from fish_speech.models import load_model

print("Loading Fish Speech model...")
model = load_model("../models")
print("✅ Model loaded successfully!")
EOF
```

---

## Step 7️⃣: Install Kokoro (Optional Fast Engine)

```bash
cd ~/ai-narrator

# Clone Kokoro
git clone https://github.com/remsky/Kokoro-82M.git
cd Kokoro-82M

# Install dependencies
pip install -r requirements.txt
```

---

## Step 8️⃣: Install FastAPI Backend Dependencies

```bash
cd ~/ai-narrator

pip install fastapi uvicorn python-multipart pydantic numpy scipy librosa soundfile pyyaml

# Optional monitoring
pip install prometheus-client
```

---

## Step 9️⃣: Verify Complete Installation

```bash
cd ~/ai-narrator

# Test script
python << 'EOF'
import torch
import torchaudio
import numpy as np

print("=" * 50)
print("✅ Installation Verification")
print("=" * 50)

# Check PyTorch
print(f"✅ PyTorch: {torch.__version__}")
print(f"✅ CUDA: {torch.cuda.is_available()}")
print(f"✅ GPU: {torch.cuda.get_device_name(0)}")

# Check disk space
import os
home = os.path.expanduser("~")
statvfs = os.statvfs(home)
free_gb = statvfs.f_bavail * statvfs.f_frsize / 1e9
print(f"✅ Free Disk Space: {free_gb:.1f}GB")

print("\n" + "=" * 50)
print("🚀 System Ready for AI Narrator!")
print("=" * 50)
EOF
```

---

## 🔟 First TTS Generation (Test Run)

### A. Create Test Script

```bash
cat > ~/ai-narrator/test_tts.py << 'EOF'
#!/usr/bin/env python3
import torch
from fish_speech.models import load_model
import torchaudio
import sys

# Load model
print("Loading Fish Speech model...")
model = load_model("./models")

# Test text
text = "Hello, this is a test of the AI narrator system."

# Generate audio
print(f"Generating audio for: '{text}'")
with torch.no_grad():
    audio = model.generate(text, lang="en")

# Save audio
output_path = "./audio_output/test_output.wav"
torchaudio.save(output_path, audio, sample_rate=44100)

print(f"✅ Audio saved to: {output_path}")
EOF

chmod +x ~/ai-narrator/test_tts.py
```

### B. Run Test

```bash
cd ~/ai-narrator
python test_tts.py
```

Expected:
```
Loading Fish Speech model...
Generating audio for: 'Hello, this is a test of the AI narrator system.'
✅ Audio saved to: ./audio_output/test_output.wav
```

---

## 📊 VRAM Optimization Configuration

### A. Create VRAM Optimizer Script

```bash
cat > ~/ai-narrator/config/vram_config.py << 'EOF'
"""VRAM Optimization for RTX 3060 12GB"""

VRAM_CONFIG = {
    # Model configurations
    "fish_speech": {
        "dtype": "float16",  # Half precision to save VRAM
        "load_in_8bit": False,  # Try if needed
        "device_map": "cuda:0",
        "max_memory": {0: "8GB"},
    },
    
    # Inference settings
    "inference": {
        "batch_size": 1,  # Process one item at a time
        "max_sequence_length": 1024,
        "chunk_size": 30,  # 30 second chunks
    },
    
    # Memory management
    "memory": {
        "enable_gradient_checkpointing": True,
        "enable_cpu_offloading": True,
        "empty_cache_interval": 100,  # Clean cache every 100 items
    }
}

# Test VRAM availability
import torch

def get_vram_info():
    if torch.cuda.is_available():
        total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
        allocated = torch.cuda.memory_allocated(0) / 1e9
        cached = torch.cuda.memory_cached(0) / 1e9
        free = total_memory - allocated - cached
        
        return {
            "total_gb": total_memory,
            "allocated_gb": allocated,
            "cached_gb": cached,
            "free_gb": free,
        }
    return None

if __name__ == "__main__":
    info = get_vram_info()
    if info:
        print(f"Total VRAM: {info['total_gb']:.1f}GB")
        print(f"Allocated: {info['allocated_gb']:.1f}GB")
        print(f"Free: {info['free_gb']:.1f}GB")
EOF
```

### B. Test VRAM Configuration

```bash
cd ~/ai-narrator
python config/vram_config.py
```

---

## 🎯 Next Steps

1. ✅ **GPU Setup Complete** - Move to `BACKEND_API.md`
2. ✅ **Model Setup Complete** - Move to `EMOTION_SYSTEM.md`
3. ✅ **Python Environment Ready** - Move to `PRODUCTION_ARCHITECTURE.md`

---

## 🆘 Troubleshooting

### GPU Not Detected in WSL2

```bash
# Verify GPU driver on Windows
nvidia-smi  # Run in PowerShell

# Update WSL2 NVIDIA driver integration
# Download: https://developer.nvidia.com/cuda/wsl
```

### CUDA Out of Memory

```bash
# Reduce batch size in config
"batch_size": 1  # Instead of 4

# Enable offloading
"enable_cpu_offloading": True

# Use float16 instead of float32
"dtype": "float16"
```

### Model Download Fails

```bash
# Manual download from Hugging Face
cd ~/ai-narrator/models
wget https://huggingface.co/fishaudio/fish-speech-1.5/resolve/main/fish-speech-1.5.pth
```

### Permission Denied

```bash
# Fix permissions
chmod +x ~/ai-narrator/*.py
sudo usermod -a -G video $USER
```

---

## 📝 Summary

| Step | Task | Status |
|------|------|--------|
| 1 | WSL2 Installation | ✅ |
| 2 | CUDA/cuDNN Setup | ✅ |
| 3 | Python Environment | ✅ |
| 4 | PyTorch Install | ✅ |
| 5 | Fish Speech Install | ✅ |
| 6 | Test Generation | ✅ |
| 7 | VRAM Optimization | ✅ |

**Total Setup Time: 45-60 minutes**

You're now ready to build the FastAPI backend! See `BACKEND_API.md`
