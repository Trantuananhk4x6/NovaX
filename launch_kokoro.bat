@echo off
REM NovaX Kokoro TTS — Windows Launcher
REM Double-click this file to start the Kokoro TTS service in WSL2.
REM Keep the WSL2 window open while using NovaX.

echo Starting NovaX Kokoro TTS Service...
echo A WSL2 terminal will open. Keep it open.
echo.

REM Try Windows Terminal first (best experience)
where wt.exe >nul 2>&1
if %ERRORLEVEL% == 0 (
    start wt.exe --title "NovaX Kokoro TTS" wsl.exe bash /mnt/d/NovaX/start_kokoro.sh
    goto :done
)

REM Fallback: plain WSL2 window
start wsl.exe bash /mnt/d/NovaX/start_kokoro.sh

:done
echo Service starting... check the WSL2 terminal for status.
timeout /t 3 /nobreak >nul
