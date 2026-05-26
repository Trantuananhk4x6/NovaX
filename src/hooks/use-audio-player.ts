'use client';
// ============================================================================
// useAudioPlayer — Custom Audio Player Hook
// Layer 3 — Controls a hidden <audio> element with play/pause, seek,
//           time tracking, and download functionality
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioPlayerState, DEFAULT_AUDIO_PLAYER } from '@/types/audio.types';

interface UseAudioPlayerReturn {
  // ── State ──────────────────────────────────────────────
  player: AudioPlayerState;
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // ── Actions ────────────────────────────────────────────
  loadAudio: (url: string) => void;
  togglePlay: () => void;
  handleTimeUpdate: () => void;
  handleSeek: (progress: number) => void;
  handleVolumeChange: (volume: number) => void;
  toggleMute: () => void;
  handleDownload: (filename?: string) => void;
  resetPlayer: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [player, setPlayer] = useState<AudioPlayerState>(DEFAULT_AUDIO_PLAYER);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─────────────────────────────────────────────────────────
  // loadAudio — Set a new audio source URL and prepare playback
  // ─────────────────────────────────────────────────────────
  const loadAudio = useCallback((url: string) => {
    setPlayer(prev => ({
      ...prev,
      audioUrl: url,
      status: 'loading',
      currentTime: 0,
      duration: 0,
      progress: 0,
    }));

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // togglePlay — Switch between Play and Pause states
  //
  // Updates the visual icon state and controls the <audio> element.
  // ─────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (player.status === 'playing') {
      audio.pause();
      setPlayer(prev => ({ ...prev, status: 'paused' }));
    } else {
      audio.play().then(() => {
        setPlayer(prev => ({ ...prev, status: 'playing' }));
      }).catch(() => {
        setPlayer(prev => ({ ...prev, status: 'error', error: 'Không thể phát audio.' }));
      });
    }
  }, [player.status]);

  // ─────────────────────────────────────────────────────────
  // handleTimeUpdate — Called on audio's 'timeupdate' event
  //
  // Reads currentTime and duration from the <audio> element
  // and updates the slider progress bar in realtime.
  // ─────────────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    setPlayer(prev => ({
      ...prev,
      currentTime,
      duration,
      progress,
    }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // handleSeek — Jump to a specific position (0–100%)
  //
  // Called when user drags the progress slider.
  // ─────────────────────────────────────────────────────────
  const handleSeek = useCallback((progress: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const newTime = (progress / 100) * audio.duration;
    audio.currentTime = newTime;

    setPlayer(prev => ({
      ...prev,
      currentTime: newTime,
      progress,
    }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // handleVolumeChange — Set volume level (0–1)
  // ─────────────────────────────────────────────────────────
  const handleVolumeChange = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
    setPlayer(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // toggleMute — Toggle mute/unmute
  // ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (player.isMuted) {
      audio.muted = false;
      setPlayer(prev => ({ ...prev, isMuted: false }));
    } else {
      audio.muted = true;
      setPlayer(prev => ({ ...prev, isMuted: true }));
    }
  }, [player.isMuted]);

  // ─────────────────────────────────────────────────────────
  // handleDownload — Create a hidden <a> tag to trigger download
  //
  // Creates a temporary anchor element with the download attribute
  // to let the user save the .mp3 file to their machine.
  // ─────────────────────────────────────────────────────────
  const handleDownload = useCallback((filename: string = 'voice_output.mp3') => {
    if (!player.audioUrl) return;

    const link = document.createElement('a');
    link.href = player.audioUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    requestAnimationFrame(() => {
      document.body.removeChild(link);
    });
  }, [player.audioUrl]);

  // ─────────────────────────────────────────────────────────
  // resetPlayer — Clear player state
  // ─────────────────────────────────────────────────────────
  const resetPlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    setPlayer(DEFAULT_AUDIO_PLAYER);
  }, []);

  // ── Handle audio ended event ───────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setPlayer(prev => ({
        ...prev,
        status: 'paused',
        progress: 100,
      }));
    };

    const handleCanPlay = () => {
      setPlayer(prev => ({
        ...prev,
        status: prev.status === 'loading' ? 'paused' : prev.status,
        duration: audio.duration || 0,
      }));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  return {
    player,
    audioRef,
    loadAudio,
    togglePlay,
    handleTimeUpdate,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    handleDownload,
    resetPlayer,
  };
}
