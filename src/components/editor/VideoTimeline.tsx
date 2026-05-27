'use client';
// ============================================================================
// VideoTimeline — CapCut-style Multi-track Timeline Editor
// Shows video, audio, and text tracks with clips, playhead, and controls
// ============================================================================

import { useRef } from 'react';
import { TimelineTrack } from '@/types/video.types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  Film,
  Music,
  Type,
  Sparkles,
} from 'lucide-react';

const TRACK_ICONS = {
  video: Film,
  audio: Music,
  text: Type,
  effects: Sparkles,
};

interface VideoTimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  zoomLevel: number;
  selectedClipId: string | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectClip: (clipId: string | null) => void;
  onToggleMute: (trackId: string) => void;
  onToggleLock: (trackId: string) => void;
  formatTime: (seconds: number) => string;
}

export default function VideoTimeline({
  tracks,
  currentTime,
  totalDuration,
  isPlaying,
  zoomLevel,
  selectedClipId,
  onTogglePlay,
  onSeek,
  onSkipForward,
  onSkipBackward,
  onZoomIn,
  onZoomOut,
  onSelectClip,
  onToggleMute,
  onToggleLock,
  formatTime,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline width based on zoom
  const pixelsPerSecond = 40 * zoomLevel;
  const timelineWidth = Math.max(totalDuration * pixelsPerSecond, 600);
  const playheadPosition = (currentTime / Math.max(totalDuration, 0.1)) * timelineWidth;

  // Generate time markers
  const markerInterval = zoomLevel >= 2 ? 1 : zoomLevel >= 1 ? 2 : 5;
  const markers: number[] = [];
  for (let t = 0; t <= totalDuration; t += markerInterval) {
    markers.push(t);
  }

  // Handle timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
    const time = (x / timelineWidth) * totalDuration;
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  };

  return (
    <div className="timeline-container">
      {/* Timeline Toolbar */}
      <div className="timeline-toolbar">
        <div className="timeline-toolbar-left">
          <button className="timeline-btn" onClick={onSkipBackward} title="Lùi 5s">
            <SkipBack size={14} />
          </button>
          <button
            className={`timeline-btn timeline-btn-play ${isPlaying ? 'active' : ''}`}
            onClick={onTogglePlay}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 1 }} />}
          </button>
          <button className="timeline-btn" onClick={onSkipForward} title="Tiến 5s">
            <SkipForward size={14} />
          </button>
          <span className="timeline-time-display">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div className="timeline-toolbar-right">
          <button className="timeline-btn" onClick={onZoomOut} title="Thu nhỏ">
            <ZoomOut size={14} />
          </button>
          <span className="timeline-zoom-label">{Math.round(zoomLevel * 100)}%</span>
          <button className="timeline-btn" onClick={onZoomIn} title="Phóng to">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="timeline-body">
        {/* Track Labels (Left side) */}
        <div className="timeline-labels">
          {tracks.map(track => {
            const TrackIcon = TRACK_ICONS[track.type] || Film;
            return (
              <div key={track.id} className="timeline-label-row">
                <TrackIcon size={14} style={{ color: track.color }} />
                <span className="timeline-label-text">{track.label}</span>
                <div className="timeline-label-actions">
                  <button
                    className={`timeline-label-btn ${track.isMuted ? 'muted' : ''}`}
                    onClick={() => onToggleMute(track.id)}
                    title={track.isMuted ? 'Bật âm' : 'Tắt âm'}
                  >
                    {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                  <button
                    className={`timeline-label-btn ${track.isLocked ? 'locked' : ''}`}
                    onClick={() => onToggleLock(track.id)}
                    title={track.isLocked ? 'Mở khóa' : 'Khóa'}
                  >
                    {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Timeline Area */}
        <div className="timeline-scroll" ref={timelineRef}>
          {/* Time Ruler */}
          <div className="timeline-ruler" style={{ width: timelineWidth }}>
            {markers.map(t => (
              <div
                key={t}
                className="timeline-marker"
                style={{ left: (t / Math.max(totalDuration, 0.1)) * timelineWidth }}
              >
                <span className="timeline-marker-label">{formatTime(t)}</span>
                <div className="timeline-marker-line" />
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div
            className="timeline-tracks-area"
            style={{ width: timelineWidth }}
            onClick={handleTimelineClick}
          >
            {tracks.map(track => (
              <div key={track.id} className="timeline-track-row">
                {track.clips.map(clip => {
                  const clipLeft = (clip.startTime / Math.max(totalDuration, 0.1)) * timelineWidth;
                  const clipWidth = ((clip.endTime - clip.startTime) / Math.max(totalDuration, 0.1)) * timelineWidth;

                  return (
                    <div
                      key={clip.id}
                      className={`timeline-clip ${selectedClipId === clip.id ? 'selected' : ''}`}
                      style={{
                        left: clipLeft,
                        width: Math.max(clipWidth, 20),
                        backgroundColor: `${clip.color}33`,
                        borderColor: clip.color,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClip(clip.id);
                      }}
                    >
                      <span className="timeline-clip-label">{clip.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="timeline-playhead"
              style={{ left: playheadPosition }}
            >
              <div className="timeline-playhead-head" />
              <div className="timeline-playhead-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
