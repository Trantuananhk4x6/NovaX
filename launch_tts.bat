@echo off
REM NovaX Multi-Engine TTS — Windows Launcher
REM Double-click to start Kokoro + CosyVoice2 in WSL2.
REM Keep the WSL2 window open while using NovaX.

echo Starting NovaX TTS Service (Kokoro + CosyVoice2)...

where wt.exe >nul 2>&1
if %ERRORLEVEL% == 0 (
    start wt.exe --title "NovaX TTS (Kokoro+CosyVoice2)" wsl.exe bash /mnt/d/NovaX/start_tts.sh
    goto :done
)
start wsl.exe bash /mnt/d/NovaX/start_tts.sh

:done
echo Service starting in WSL2 window. Keep it open.
timeout /t 3 /nobreak >nul
