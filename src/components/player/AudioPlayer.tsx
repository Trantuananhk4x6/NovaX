'use client';
// ============================================================================
// AudioPlayer — Custom Audio Player Component
// Play/pause, seek slider, time display, and download button
// ============================================================================

import { useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { formatDuration } from '@/lib/audio-utils';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  filename?: string;
}

export default function AudioPlayer({ audioUrl, filename = 'voice_output.mp3' }: AudioPlayerProps) {
  const {
    player,
    audioRef,
    loadAudio,
    togglePlay,
    handleTimeUpdate,
    handleSeek,
    toggleMute,
    handleDownload,
  } = useAudioPlayer();

  // Load audio when URL changes
  useEffect(() => {
    if (audioUrl) {
      loadAudio(audioUrl);
    }
  }, [audioUrl, loadAudio]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const progress = ((e.clientX - rect.left) / rect.width) * 100;
    handleSeek(Math.max(0, Math.min(100, progress)));
  };

  return (
    <div className="audio-player slide-up">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onDurationChange={handleTimeUpdate}
        onLoadedData={handleTimeUpdate}
        onCanPlay={handleTimeUpdate}
        preload="metadata"
      />

      <div className="audio-player-controls">
        {/* Play/Pause Button */}
        <button
          className="play-pause-btn"
          onClick={togglePlay}
          aria-label={player.status === 'playing' ? 'Tạm dừng' : 'Phát'}
        >
          {player.status === 'playing' ? (
            <Pause size={22} />
          ) : (
            <Play size={22} style={{ marginLeft: 2 }} />
          )}
        </button>

        {/* Progress Track */}
        <div className="progress-track">
          <div
            className="progress-bar-container"
            onClick={handleProgressClick}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(player.progress)}
            tabIndex={0}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${player.progress}%` }}
            />
          </div>
          <div className="progress-times">
            <span>{formatDuration(player.currentTime)}</span>
            <span>{formatDuration(player.duration)}</span>
          </div>
        </div>

        {/* Volume Toggle */}
        <button className="btn-ghost" onClick={toggleMute} style={{ padding: '8px' }}>
          {player.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Download Button */}
        <button
          className="btn-secondary btn-sm"
          onClick={() => handleDownload(filename)}
          title="Tải xuống file MP3"
        >
          <Download size={16} />
          <span>Tải xuống</span>
        </button>
      </div>
    </div>
  );
}
