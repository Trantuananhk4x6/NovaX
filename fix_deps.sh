#!/usr/bin/env bash
source /home/tony/ai-narrator/venv/bin/activate

echo "=== Fixing pkg_resources ==="
pip install --force-reinstall "setuptools>=70" 2>&1 | tail -3

echo ""
echo "=== Testing pkg_resources ==="
python3 -c "import pkg_resources; print('pkg_resources OK')" 2>&1

echo ""
echo "=== Testing CosyVoice2 import ==="
python3 /mnt/d/NovaX/test_cosyvoice.py 2>&1 | grep -E "OK|FAILED|Error" | head -5
