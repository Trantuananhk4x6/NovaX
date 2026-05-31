'use client';
// ============================================================================
// VideoPlayer — Canvas-based Video Preview Player
// Renders animated scenes with text overlays, transitions, and controls
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { VideoScene } from '@/types/video.types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VideoPlayerProps {
  scenes: VideoScene[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  audioUrl?: string | null;
}

export default function VideoPlayer({
  scenes,
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSkipForward,
  onSkipBackward,
  audioUrl,
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get current scene based on time
  const getCurrentScene = useCallback((): VideoScene | null => {
    let elapsed = 0;
    for (const scene of scenes) {
      if (currentTime >= elapsed && currentTime < elapsed + scene.duration) {
        return scene;
      }
      elapsed += scene.duration;
    }
    return scenes[scenes.length - 1] || null;
  }, [scenes, currentTime]);

  // Draw scene on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = getCurrentScene();
    if (!scene) {
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Parse gradient from CSS string
    const drawBackground = () => {
      const gradientMatch = scene.background.match(/#[0-9a-fA-F]{6}/g);
      if (gradientMatch && gradientMatch.length >= 2) {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, gradientMatch[0]);
        grad.addColorStop(1, gradientMatch[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = scene.background;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw scene icon
    const drawIcon = () => {
      if (!scene.icon) return;
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.fillText(scene.icon, canvas.width / 2, canvas.height / 2 - 40);
    };

    // Draw text overlay
    const drawText = () => {
      if (!scene.textOverlay) return;

      const fontSize = scene.textSize === 'large' ? 28 : scene.textSize === 'small' ? 16 : 22;
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;

      let y = canvas.height / 2 + 20;
      if (scene.textPosition === 'top') y = 60;
      else if (scene.textPosition === 'bottom') y = canvas.height - 40;

      ctx.fillText(scene.textOverlay, canvas.width / 2, y);
      ctx.shadowBlur = 0;
    };

    // Draw scene title bar
    const drawTitleBar = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText(`Scene: ${scene.title}`, 12, canvas.height - 14);
    };

    // Animated particles
    const drawParticles = () => {
      const time = currentTime * 2;
      for (let i = 0; i < 6; i++) {
        const x = (Math.sin(time + i * 1.5) * 0.3 + 0.5) * canvas.width;
        const y = (Math.cos(time + i * 2) * 0.3 + 0.5) * canvas.height;
        const radius = 2 + Math.sin(time + i) * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }
    };

    drawBackground();
    drawParticles();
    drawIcon();
    drawText();
    drawTitleBar();
  }, [currentTime, scenes, getCurrentScene]);

  // Sync audio playback
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl, currentTime]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * totalDuration);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="video-player-container" ref={containerRef}>
      {/* Canvas */}
      <div className="video-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="video-canvas"
        />

        {/* Play overlay */}
        {!isPlaying && (
          <div className="video-play-overlay" onClick={onTogglePlay}>
            <div className="video-play-overlay-btn">
              <Play size={32} style={{ marginLeft: 4 }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="video-controls">
        <div className="video-controls-left">
          {onSkipBackward && (
            <button className="video-ctrl-btn" onClick={onSkipBackward}>
              <SkipBack size={16} />
            </button>
          )}
          <button className="video-ctrl-btn video-ctrl-play" onClick={onTogglePlay}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>
          {onSkipForward && (
            <button className="video-ctrl-btn" onClick={onSkipForward}>
              <SkipForward size={16} />
            </button>
          )}
          <span className="video-time">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div className="video-progress" ref={progressRef} onClick={handleProgressClick}>
          <div className="video-progress-fill" style={{ width: `${progressPercent}%` }} />
          <div className="video-progress-head" style={{ left: `${progressPercent}%` }} />
        </div>

        <div className="video-controls-right">
          <button className="video-ctrl-btn" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button className="video-ctrl-btn" onClick={toggleFullscreen}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Hidden audio element */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} />
      )}
    </div>
  );
}
