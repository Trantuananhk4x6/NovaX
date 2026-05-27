'use client';
// ============================================================================
// Voice Cloning Page — Live recording & file upload for AI voice cloning
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useVoiceCloning } from '@/hooks/use-voice-cloning';
import { MIN_RECORDING_DURATION } from '@/types/voice.types';
import { formatDuration } from '@/lib/audio-utils';
import {
  Mic2,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Pause,
  Info,
  ThumbsUp,
  HelpCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function VoiceCloningPage() {
  const { addCustomVoice } = useApp();
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record');

  const {
    recorder,
    canComplete,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const {
    cloning,
    uploadedFile,
    uploadError,
    voiceName,
    voiceDescription,
    voiceCategory,
    handleAudioFileUpload,
    setVoiceName,
    setVoiceDescription,
    setVoiceCategory,
    handleStartVoiceCloning,
    resetCloning,
  } = useVoiceCloning();

  // Audio player state for recorded/uploaded preview
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle playing the preview audio
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAudioFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Clear preview when switching tabs
  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [activeTab]);

  const handleSubmit = () => {
    let source: Blob | File | null = null;
    if (activeTab === 'record' && recorder.audioBlob) {
      source = recorder.audioBlob;
    } else if (activeTab === 'upload' && uploadedFile) {
      source = uploadedFile;
    }

    if (source) {
      handleStartVoiceCloning(source, 'vi-VN', (newVoice) => {
        addCustomVoice(newVoice);
      });
    }
  };

  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setUploadedPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setUploadedPreviewUrl(null);
    }
  }, [uploadedFile]);

  // Success state render
  if (cloning.result?.success) {
    return (
      <MainLayout>
        <div className="page-header">
          <h1>
            <Mic2 size={24} />
            Voice Cloning
          </h1>
        </div>

        <div className="glass-card slide-up" style={{ textAlign: 'center', padding: '64px 24px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} color="var(--accent-green)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
            Nhân bản giọng nói thành công!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Giọng nói "{cloning.result.voice?.name}" đã được thêm vào thư viện của bạn. Bây giờ bạn có thể sử dụng giọng nói này trong Text-to-Speech.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => {
              resetCloning();
              resetRecording();
            }}>
              Tạo giọng khác
            </button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/text-to-speech'}>
              Thử nghiệm ngay <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const previewUrl = activeTab === 'record' ? recorder.audioUrl : uploadedPreviewUrl;

  return (
    <MainLayout>
      <div className="page-header">
        <h1>
          <Mic2 size={24} />
          Voice Cloning
        </h1>
        <div className="page-header-actions">
          <button className="header-btn"><ThumbsUp size={16} /><span>Feedback</span></button>
          <button className="header-btn"><HelpCircle size={16} /><span>Need help?</span></button>
        </div>
      </div>

      <div className="tts-layout">
        {/* Left: Input source (Record or Upload) */}
        <div className="slide-up">
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
                onClick={() => setActiveTab('record')}
                disabled={cloning.isCloning}
              >
                <Mic2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Ghi âm trực tiếp
              </button>
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
                disabled={cloning.isCloning}
              >
                <UploadCloud size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Tải lên file âm thanh
              </button>
            </div>

            {/* TAB: RECORD */}
            {activeTab === 'record' && (
              <div className="recorder-ui">
                {recorder.error && (
                  <div className="error-message" style={{ width: '100%', marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{recorder.error}</span>
                  </div>
                )}

                {/* If we have a recording ready to preview */}
                {recorder.audioUrl ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px 24px', borderRadius: 'var(--radius-full)' }}>
                      <button className="play-pause-btn" onClick={togglePlay} style={{ width: '40px', height: '40px' }}>
                        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 600 }}>
                        {formatDuration(recorder.recordingTime)}
                      </div>
                      <button className="btn-ghost" onClick={resetRecording} title="Xóa và ghi âm lại" style={{ color: 'var(--text-tertiary)' }}>
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className={`record-btn ${recorder.isRecording ? 'recording' : ''}`}
                      onClick={recorder.isRecording ? stopRecording : startRecording}
                    >
                      {recorder.isRecording ? <div style={{ width: 24, height: 24, background: 'currentColor', borderRadius: 4 }} /> : <Mic2 size={32} />}
                    </button>

                    <div className="record-timer">
                      {formatDuration(recorder.recordingTime)}
                    </div>

                    <div className={`record-min-notice ${canComplete ? 'met' : ''}`}>
                      {canComplete ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> Đã đủ thời lượng tối thiểu
                        </span>
                      ) : (
                        `Cần ghi âm ít nhất ${MIN_RECORDING_DURATION} giây (còn ${Math.max(0, MIN_RECORDING_DURATION - recorder.recordingTime)}s)`
                      )}
                    </div>

                    {/* Waveform Visualizer */}
                    {recorder.isRecording && (
                      <div className="waveform-container">
                        {recorder.waveformData.slice(0, 30).map((value, i) => (
                          <div
                            key={i}
                            className="waveform-bar"
                            style={{ height: `${Math.max(4, (value / 255) * 80)}px` }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB: UPLOAD */}
            {activeTab === 'upload' && (
              <div style={{ padding: '16px 0' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".mp3,.wav,.m4a,audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAudioFileUpload(e.target.files[0]);
                    }
                  }}
                  disabled={cloning.isCloning}
                />

                {uploadedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-tertiary)', padding: '16px 24px', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <FileAudio size={20} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadedFile.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                    <button className="play-pause-btn" onClick={togglePlay} style={{ width: '36px', height: '36px' }}>
                      {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                    </button>
                    <button className="btn-ghost" onClick={() => handleAudioFileUpload(null as any)} style={{ color: 'var(--text-tertiary)' }}>
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`dropzone ${isDragging ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="dropzone-icon" />
                    <div className="dropzone-text">Kéo thả file âm thanh vào đây hoặc click để chọn file</div>
                    <div className="dropzone-subtext">Hỗ trợ .MP3, .WAV, .M4A (Tối đa 10MB)</div>
                  </div>
                )}

                {uploadError && (
                  <div className="error-message" style={{ marginTop: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden audio element for preview playback */}
          {previewUrl && (
            <audio
              ref={audioRef}
              src={previewUrl}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          )}

          {/* Cloning Progress Area */}
          {cloning.isCloning && (
            <div className="glass-card cloning-progress slide-up">
              <div className="progress-header">
                <span className="progress-label">{cloning.phaseLabel}</span>
                <span className="progress-percent">{cloning.progress}%</span>
              </div>
              <div className="cloning-bar">
                <div
                  className="cloning-bar-fill"
                  style={{ width: `${cloning.progress}%` }}
                />
              </div>
            </div>
          )}

          {cloning.error && (
            <div className="error-message slide-up" style={{ marginTop: '16px' }}>
              <AlertCircle size={16} />
              <span>{cloning.error}</span>
            </div>
          )}
        </div>

        {/* Right: Voice Metadata Form */}
        <div className="settings-panel slide-up">
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Thông tin giọng nói</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Điền thông tin cho giọng nói nhân bản của bạn</p>
          </div>

          <div className="settings-body">
            <div className="form-group">
              <label className="form-label">Tên giọng nói <span style={{ color: 'var(--accent-red)' }}>*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Giọng của tôi, MC Nam..."
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                disabled={cloning.isCloning}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả (Tùy chọn)</label>
              <textarea
                className="form-input"
                placeholder="Mô tả về phong cách, tông giọng..."
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                style={{ minHeight: '80px', resize: 'vertical' }}
                disabled={cloning.isCloning}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Danh mục</label>
              <select
                className="form-select"
                value={voiceCategory}
                onChange={(e) => setVoiceCategory(e.target.value as any)}
                disabled={cloning.isCloning}
              >
                <option value="general">Chung (General)</option>
                <option value="narration">Kể chuyện (Narration)</option>
                <option value="news">Tin tức (News)</option>
                <option value="commercial">Quảng cáo (Commercial)</option>
                <option value="game">Game/Anime</option>
              </select>
            </div>

            <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px' }}>
                <Info size={16} style={{ color: 'var(--accent-violet-light)', flexShrink: 0, marginTop: 2 }} />
                <strong>Mẹo để có kết quả tốt nhất:</strong>
              </div>
              <ul style={{ paddingLeft: '28px', fontSize: '0.875rem', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Ghi âm ở môi trường yên tĩnh.</li>
                <li>Nói rõ ràng, tự nhiên và đều nhịp.</li>
                <li>Tránh âm thanh nền (quạt, tiếng ồn).</li>
                <li>File upload không nên có nhạc nền.</li>
              </ul>
            </div>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={
                cloning.isCloning ||
                !voiceName.trim() ||
                (activeTab === 'record' && !recorder.audioUrl) ||
                (activeTab === 'upload' && !uploadedFile)
              }
            >
              {cloning.isCloning ? (
                <>
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span>Đang nhân bản AI...</span>
                </>
              ) : (
                <>
                  <Mic2 size={18} />
                  <span>Bắt đầu nhân bản giọng nói</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
