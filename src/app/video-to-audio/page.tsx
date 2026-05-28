'use client';
// ============================================================================
// Video to Audio — 3-step: Upload Video → Analyze → Generate Voice & Export
// ============================================================================

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ContextAnalysisCard from '@/components/editor/ContextAnalysisCard';
import { useVideoToAudio } from '@/hooks/use-video-to-audio';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import {
  Mic2,
  UploadCloud,
  Brain,
  Download,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  FileVideo,
  X,
  ThumbsUp,
  HelpCircle,
  AlertCircle,
  MonitorPlay,
  Film,
} from 'lucide-react';

export default function VideoToAudioPage() {
  const { voices } = useApp();
  const {
    state,
    setVideoFile,
    clearVideo,
    startAnalysis,
    updateScript,
    updateVoiceSettings,
    startGeneration,
    goToStep,
    reset,
  } = useVideoToAudio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setVideoFile(e.dataTransfer.files[0]);
  };

  const steps = [
    { id: 1, label: 'Tải Video', icon: UploadCloud },
    { id: 2, label: 'Phân tích & Voice', icon: Brain },
    { id: 3, label: 'Xuất kết quả', icon: Download },
  ];

  // Filter voices by language
  const filteredVoices = state.voiceSettings.languageCode
    ? voices.filter(v => v.languageCode === state.voiceSettings.languageCode)
    : voices;

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <h1><MonitorPlay size={24} /> Video → Giọng nói</h1>
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
              onClick={() => { if (state.currentStep > step.id) goToStep(step.id as any); }}
            >
              <div className="step-icon">
                {state.currentStep > step.id ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
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

      {/* ══ STEP 1: Upload Video ══ */}
      {state.currentStep === 1 && (
        <div className="slide-up">
          {state.videoFile ? (
            <div className="glass-card">
              <div className="uploaded-file-display">
                <div className="uploaded-file-icon" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
                  <FileVideo size={24} />
                </div>
                <div className="uploaded-file-info">
                  <div className="uploaded-file-name">{state.videoFile.name}</div>
                  <div className="uploaded-file-meta">
                    {state.videoMeta?.size} · {state.videoMeta?.width}x{state.videoMeta?.height} · {Math.floor(state.videoDuration / 60)}:{String(Math.floor(state.videoDuration % 60)).padStart(2, '0')}
                  </div>
                </div>
                <button className="btn-ghost" onClick={clearVideo}><X size={20} /></button>
              </div>

              {/* Video Preview */}
              {state.videoUrl && (
                <div className="video-native-preview">
                  <video
                    src={state.videoUrl}
                    controls
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', marginTop: 16, maxHeight: 400 }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-primary btn-lg" onClick={startAnalysis}>
                  <Brain size={18} />
                  <span>Phân tích ngữ cảnh Video</span>
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
                accept=".mp4,.webm,.mov,.avi,.mkv,video/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) setVideoFile(e.target.files[0]); }}
              />
              <Film className="dropzone-icon" />
              <div className="dropzone-text">Kéo thả file video vào đây hoặc click để chọn</div>
              <div className="dropzone-subtext">Hỗ trợ MP4, WebM, MOV (Tối đa 500MB)</div>
            </div>
          )}
        </div>
      )}

      {/* ══ STEP 2: Analyze & Configure Voice ══ */}
      {state.currentStep === 2 && (
        <div className="slide-up">
          {state.isAnalyzing ? (
            <div className="glass-card loading-spinner">
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>Đang phân tích ngữ cảnh video bằng AI...</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>AI đang nhận diện nội dung, cảnh vật và bối cảnh</p>
            </div>
          ) : state.analysis ? (
            <div className="tts-layout">
              {/* Left: Analysis + Script */}
              <div>
                <ContextAnalysisCard analysis={state.analysis} type="video" />

                {/* Editable Script */}
                <div className="glass-card" style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mic2 size={18} /> Script giọng nói
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    AI đã tạo script dựa trên ngữ cảnh video. Bạn có thể chỉnh sửa:
                  </p>
                  <textarea
                    className="form-textarea"
                    value={state.editedScript}
                    onChange={(e) => updateScript(e.target.value)}
                    style={{ minHeight: 150 }}
                    placeholder="Nhập hoặc chỉnh sửa script..."
                  />
                  <div className="char-counter">
                    <div className="counter-left">
                      <Sparkles size={16} />
                      <span>Script AI — chỉnh sửa tùy ý</span>
                    </div>
                    <div className="counter-right">
                      {state.editedScript.length} ký tự
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Voice Settings */}
              <div className="settings-panel">
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Cấu hình giọng nói</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Chọn giọng và tùy chỉnh cho video</p>
                </div>

                <div className="settings-body">
                  {/* Voice */}
                  <div className="form-group">
                    <label className="form-label">Giọng nói</label>
                    <select
                      className="form-select"
                      value={state.voiceSettings.voiceId}
                      onChange={(e) => updateVoiceSettings('voiceId', e.target.value)}
                    >
                      <option value="">-- Chọn giọng nói --</option>
                      {voices.filter(v => v.isCustom).length > 0 && (
                        <optgroup label="🎤 Giọng nói của tôi">
                          {voices.filter(v => v.isCustom).map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </optgroup>
                      )}
                      {COUNTRIES.map(country => {
                        const cv = filteredVoices.filter(v => v.countryCode === country.code && !v.isCustom);
                        if (cv.length === 0) return null;
                        return (
                          <optgroup key={country.code} label={`${country.flag} ${country.name}`}>
                            {cv.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  {/* Language */}
                  <div className="form-group">
                    <label className="form-label">Ngôn ngữ</label>
                    <select
                      className="form-select"
                      value={state.voiceSettings.languageCode}
                      onChange={(e) => updateVoiceSettings('languageCode', e.target.value)}
                    >
                      <option value="">Tất cả</option>
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.languageCode}>{c.flag} {c.languageName}</option>
                      ))}
                    </select>
                  </div>

                  {/* Speed */}
                  <div className="slider-container">
                    <div className="slider-header">
                      <span className="slider-label">Tốc độ</span>
                      <span className="slider-value">{state.voiceSettings.speed.toFixed(1)}x</span>
                    </div>
                    <input type="range" min="0.5" max="2.0" step="0.1"
                      value={state.voiceSettings.speed}
                      onChange={(e) => updateVoiceSettings('speed', parseFloat(e.target.value))}
                    />
                    <div className="slider-labels"><span>Chậm</span><span>Nhanh</span></div>
                  </div>

                  {/* Stability */}
                  <div className="slider-container">
                    <div className="slider-header">
                      <span className="slider-label">Sự sáng tạo</span>
                      <span className="slider-value">{Math.round(state.voiceSettings.stability * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05"
                      value={state.voiceSettings.stability}
                      onChange={(e) => updateVoiceSettings('stability', parseFloat(e.target.value))}
                    />
                    <div className="slider-labels"><span>Ổn định</span><span>Diễn cảm</span></div>
                  </div>

                  {/* Clarity */}
                  <div className="slider-container">
                    <div className="slider-header">
                      <span className="slider-label">Độ đa dạng</span>
                      <span className="slider-value">{Math.round(state.voiceSettings.clarity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05"
                      value={state.voiceSettings.clarity}
                      onChange={(e) => updateVoiceSettings('clarity', parseFloat(e.target.value))}
                    />
                    <div className="slider-labels"><span>Vùng chải</span><span>Năng động</span></div>
                  </div>

                  {/* Pitch */}
                  <div className="slider-container">
                    <div className="slider-header">
                      <span className="slider-label">Cao độ</span>
                      <span className="slider-value">{state.voiceSettings.pitch > 0 ? '+' : ''}{state.voiceSettings.pitch}</span>
                    </div>
                    <input type="range" min="-20" max="20" step="1"
                      value={state.voiceSettings.pitch}
                      onChange={(e) => updateVoiceSettings('pitch', parseInt(e.target.value))}
                    />
                    <div className="slider-labels"><span>Trầm</span><span>Cao</span></div>
                  </div>
                </div>

                {/* Generate Button */}
                <div style={{ padding: '0 20px 20px' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%' }}
                    onClick={startGeneration}
                    disabled={!state.editedScript.trim()}
                  >
                    <Sparkles size={18} />
                    <span>Tạo giọng nói cho Video</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ══ STEP 3: Export ══ */}
      {state.currentStep === 3 && (
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
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 12, textAlign: 'center' }}>
                Đang tạo giọng nói thực tế bằng AI...
              </p>
            </div>
          ) : state.outputAudioUrl ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle2 size={40} color="var(--accent-green)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Giọng nói đã được tạo thành công!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
                Script của bạn đã được chuyển đổi sang giọng nói AI. Bạn có thể nghe thử và tải về bên dưới.
              </p>

              {/* Audio Player */}
              <div style={{ marginBottom: 32, textAlign: 'left', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <audio 
                  controls 
                  src={state.outputAudioUrl} 
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={reset}>
                  Tạo giọng mới
                </button>
                <a 
                  href={state.outputAudioUrl} 
                  download="video_voice.wav"
                  className="btn btn-primary btn-lg"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Download size={18} /> Tải về Audio
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </MainLayout>
  );
}
