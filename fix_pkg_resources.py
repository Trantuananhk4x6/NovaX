"""
Fix pkg_resources not found in venv.
Run: source ~/ai-narrator/venv/bin/activate && python3 /mnt/d/NovaX/fix_pkg_resources.py
"""
import sys, subprocess

# Method 1: Check if it's a triton namespace collision
try:
    import pkg_resources
    print("pkg_resources already works:", pkg_resources.__file__)
    sys.exit(0)
except ImportError:
    pass

print("pkg_resources not importable. Checking triton...")

# Triton 3.x uses importlib and might shadow pkg_resources namespace
import importlib.util
spec = importlib.util.find_spec("pkg_resources")
print("find_spec result:", spec)

# Try reinstalling differently
print("\nTrying pip install 'setuptools<72'...")
result = subprocess.run(
    [sys.executable, "-m", "pip", "install", "setuptools<72", "--force-reinstall"],
    capture_output=True, text=True
)
print(result.stdout[-200:] if result.stdout else "")
print(result.stderr[-200:] if result.stderr else "")

# Test again
try:
    import importlib
    importlib.invalidate_caches()
    import pkg_resources
    print("\nSUCCESS: pkg_resources now works:", pkg_resources.__file__)
except ImportError as e:
    print("\nSTILL FAILING:", e)
    # Last resort: patch sys.path to find setuptools
    import site
    print("site packages:", site.getsitepackages())
