'use client';
// ============================================================================
// Audio to Video — 4-step wizard: Upload → Analyze → Customize → Export
// ============================================================================

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoPlayer from '@/components/player/VideoPlayer';
import VideoTimeline from '@/components/editor/VideoTimeline';
import SceneCard from '@/components/editor/SceneCard';
import ContextAnalysisCard from '@/components/editor/ContextAnalysisCard';
import { useAudioToVideo } from '@/hooks/use-audio-to-video';
import { useVideoEditor } from '@/hooks/use-video-editor';
import { VIDEO_THEMES, ASPECT_RATIO_OPTIONS, RESOLUTION_OPTIONS, FPS_OPTIONS, VIDEO_STYLE_OPTIONS } from '@/constants/video-constants';
import {
  Film,
  UploadCloud,
  Mic2,
  Brain,
  Palette,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Loader2,
  Sparkles,
  FileAudio,
  X,
  Play,
  Pause,
  ThumbsUp,
  HelpCircle,
  Settings,
  AlertCircle,
} from 'lucide-react';

export default function AudioToVideoPage() {
  const {
    state,
    totalSceneDuration,
    tracks,
    setAudioFile,
    clearAudio,
    startAnalysis,
    goToCustomize,
    updateSettings,
    updateTheme,
    updateScene,
    removeScene,
    addScene,
    startGeneration,
    goToStep,
    reset,
  } = useAudioToVideo();

  const editor = useVideoEditor(tracks, totalSceneDuration);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'settings'>('scenes');

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setAudioFile(e.dataTransfer.files[0]);
  };

  // Step indicator
  const steps = [
    { id: 1, label: 'Tải lên', icon: UploadCloud },
    { id: 2, label: 'Phân tích', icon: Brain },
    { id: 3, label: 'Tùy chỉnh', icon: Palette },
    { id: 4, label: 'Xuất video', icon: Download },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <h1><Film size={24} /> Âm thanh → Video</h1>
        <div className="page-header-actions">
          <a href="mailto:support@novax.ai?subject=Feedback NovaX" className="header-btn" style={{ textDecoration: 'none' }}><ThumbsUp size={16} /><span>Feedback</span></a>
          <a href="mailto:support@novax.ai?subject=Cần hỗ trợ NovaX" className="header-btn" style={{ textDecoration: 'none' }}><HelpCircle size={16} /><span>Trợ giúp</span></a>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator slide-up">
        {steps.map((step, i) => (
          <div key={step.id} className="step-item-wrapper">
            <div
              className={`step-item ${state.currentStep === step.id ? 'active' : ''} ${state.currentStep > step.id ? 'completed' : ''}`}
              onClick={() => {
                if (state.currentStep > step.id) goToStep(step.id as any);
              }}
            >
              <div className="step-icon">
                {state.currentStep > step.id ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <step.icon size={18} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`step-connector ${state.currentStep > step.id ? 'completed' : ''}`} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {state.error && (
        <div className="error-message slide-up" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      )}

      {/* ══ STEP 1: Upload Audio ══ */}
      {state.currentStep === 1 && (
        <div className="slide-up">
          {state.audioFile ? (
            <div className="glass-card">
              <div className="uploaded-file-display">
                <div className="uploaded-file-icon">
                  <FileAudio size={24} />
                </div>
                <div className="uploaded-file-info">
                  <div className="uploaded-file-name">{state.audioFile.name}</div>
                  <div className="uploaded-file-meta">
                    {(state.audioFile.size / (1024 * 1024)).toFixed(2)} MB · {Math.floor(state.audioDuration / 60)}:{String(Math.floor(state.audioDuration % 60)).padStart(2, '0')}
                  </div>
                </div>
                <button className="btn-ghost" onClick={clearAudio}><X size={20} /></button>
              </div>

              {state.audioUrl && (
                <audio controls src={state.audioUrl} style={{ width: '100%', marginTop: 16 }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-primary btn-lg" onClick={startAnalysis}>
                  <Brain size={18} />
                  <span>Phân tích ngữ cảnh AI</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`dropzone dropzone-large ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.webm,audio/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) setAudioFile(e.target.files[0]); }}
              />
              <UploadCloud className="dropzone-icon" />
              <div className="dropzone-text">Kéo thả file âm thanh vào đây hoặc click để chọn</div>
              <div className="dropzone-subtext">Hỗ trợ MP3, WAV, M4A, OGG (Tối đa 50MB)</div>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2: Analysis ══ */}
      {state.currentStep === 2 && (
        <div className="slide-up">
          {state.isAnalyzing ? (
            <div className="glass-card loading-spinner">
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>Đang phân tích ngữ cảnh âm thanh bằng AI...</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Quá trình này có thể mất vài giây</p>
            </div>
          ) : state.analysis ? (
            <>
              <ContextAnalysisCard analysis={state.analysis} type="audio" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => goToStep(1)}>
                  <ArrowLeft size={16} /> Quay lại
                </button>
                <button className="btn btn-primary btn-lg" onClick={goToCustomize}>
                  <Palette size={18} />
                  <span>Tùy chỉnh Video</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ══ STEP 3: Customize ══ */}
      {state.currentStep === 3 && (
        <div className="slide-up">
          {/* Video Preview */}
          <VideoPlayer
            scenes={state.scenes}
            currentTime={editor.state.currentTime}
            totalDuration={totalSceneDuration}
            isPlaying={editor.state.isPlaying}
            onTogglePlay={editor.togglePlay}
            onSeek={editor.seekTo}
            onSkipForward={() => editor.skipForward(5)}
            onSkipBackward={() => editor.skipBackward(5)}
            audioUrl={state.audioUrl}
          />

          {/* Tabs: Scenes | Settings */}
          <div className="settings-panel" style={{ marginTop: 20 }}>
            <div className="settings-tabs">
              <button
                className={`settings-tab ${activeTab === 'scenes' ? 'active' : ''}`}
                onClick={() => setActiveTab('scenes')}
              >
                <Film size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Scenes ({state.scenes.length})
              </button>
              <button
                className={`settings-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Cấu hình
              </button>
            </div>

            <div className="settings-body">
              {activeTab === 'scenes' ? (
                <>
                  {/* Scene List */}
                  <div className="scene-list">
                    {state.scenes.map(scene => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        onUpdate={updateScene}
                        onRemove={removeScene}
                        canRemove={state.scenes.length > 1}
                      />
                    ))}
                  </div>

                  <button className="btn btn-secondary" onClick={addScene} style={{ width: '100%' }}>
                    <Plus size={16} /> Thêm Scene
                  </button>

                  <div className="scene-summary">
                    Tổng: {state.scenes.length} scenes · {Math.round(totalSceneDuration)}s
                  </div>
                </>
              ) : (
                <>
                  {/* Theme Selector */}
                  <div className="form-group">
                    <label className="form-label">Theme</label>
                    <div className="theme-grid">
                      {VIDEO_THEMES.map(theme => (
                        <button
                          key={theme.id}
                          className={`theme-option ${state.settings.themeId === theme.id ? 'active' : ''}`}
                          onClick={() => updateTheme(theme.id)}
                        >
                          <div className="theme-preview" style={{ background: theme.gradient }} />
                          <span className="theme-name">{theme.icon} {theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div className="form-group">
                    <label className="form-label">Phong cách</label>
                    <select
                      className="form-select"
                      value={state.settings.styleId}
                      onChange={(e) => updateSettings('styleId', e.target.value as any)}
                    >
                      {VIDEO_STYLE_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Resolution */}
                  <div className="form-group">
                    <label className="form-label">Độ phân giải</label>
                    <div className="option-pills">
                      {RESOLUTION_OPTIONS.map(r => (
                        <button
                          key={r.id}
                          className={`filter-pill ${state.settings.resolution === r.id ? 'active' : ''}`}
                          onClick={() => updateSettings('resolution', r.id)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="form-group">
                    <label className="form-label">Tỷ lệ khung hình</label>
                    <div className="option-pills">
                      {ASPECT_RATIO_OPTIONS.map(a => (
                        <button
                          key={a.id}
                          className={`filter-pill ${state.settings.aspectRatio === a.id ? 'active' : ''}`}
                          onClick={() => updateSettings('aspectRatio', a.id)}
                        >
                          {a.icon} {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FPS */}
                  <div className="form-group">
                    <label className="form-label">FPS</label>
                    <div className="option-pills">
                      {FPS_OPTIONS.map(f => (
                        <button
                          key={f.value}
                          className={`filter-pill ${state.settings.fps === f.value ? 'active' : ''}`}
                          onClick={() => updateSettings('fps', f.value as any)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitles */}
                  <div className="toggle-row">
                    <span>Phụ đề tự động</span>
                    <button
                      className={`toggle-switch ${state.settings.subtitles ? 'active' : ''}`}
                      onClick={() => updateSettings('subtitles', !state.settings.subtitles)}
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>

                  {/* File name */}
                  <div className="form-group">
                    <label className="form-label">Tên file đầu ra</label>
                    <input
                      type="text"
                      className="form-input"
                      value={state.settings.filePrefix}
                      onChange={(e) => updateSettings('filePrefix', e.target.value)}
                      placeholder="novax_video"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginTop: 20 }}>
            <VideoTimeline
              tracks={editor.state.tracks}
              currentTime={editor.state.currentTime}
              totalDuration={totalSceneDuration}
              isPlaying={editor.state.isPlaying}
              zoomLevel={editor.state.zoomLevel}
              selectedClipId={editor.state.selectedClipId}
              onTogglePlay={editor.togglePlay}
              onSeek={editor.seekTo}
              onSkipForward={() => editor.skipForward(5)}
              onSkipBackward={() => editor.skipBackward(5)}
              onZoomIn={editor.zoomIn}
              onZoomOut={editor.zoomOut}
              onSelectClip={editor.selectClip}
              onToggleMute={editor.toggleTrackMute}
              onToggleLock={editor.toggleTrackLock}
              formatTime={editor.formatTime}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={() => goToStep(2)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button className="btn btn-primary btn-lg" onClick={startGeneration}>
              <Sparkles size={18} />
              <span>Tạo Video</span>
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 4: Export ══ */}
      {state.currentStep === 4 && (
        <div className="slide-up">
          {state.isGenerating ? (
            <div className="glass-card cloning-progress">
              <div className="progress-header">
                <span className="progress-label">{state.progressLabel}</span>
                <span className="progress-percent">{state.progress}%</span>
              </div>
              <div className="cloning-bar">
                <div className="cloning-bar-fill" style={{ width: `${state.progress}%` }} />
              </div>
            </div>
          ) : state.outputUrl ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={40} color="var(--accent-green)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Video đã được tạo thành công!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                Video của bạn đã sẵn sàng với {state.scenes.length} scenes và âm thanh gốc.
              </p>

              {/* Preview the result */}
              <div style={{ marginBottom: 24 }}>
                <VideoPlayer
                  scenes={state.scenes}
                  currentTime={editor.state.currentTime}
                  totalDuration={totalSceneDuration}
                  isPlaying={editor.state.isPlaying}
                  onTogglePlay={editor.togglePlay}
                  onSeek={editor.seekTo}
                  audioUrl={state.audioUrl}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={reset}>
                  Tạo video mới
                </button>
                <button className="btn btn-primary btn-lg">
                  <Download size={18} /> Tải về MP4
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </MainLayout>
  );
}
