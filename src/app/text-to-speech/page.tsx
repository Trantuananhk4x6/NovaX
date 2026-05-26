'use client';
// ============================================================================
// Text-to-Speech Page — Full TTS interface with settings panel
// ============================================================================

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AudioPlayer from '@/components/player/AudioPlayer';
import { useApp } from '@/context/AppContext';
import { useTTSForm } from '@/hooks/use-tts-form';
import { SCRIPT_TEMPLATES } from '@/constants/templates';
import { COUNTRIES } from '@/constants/voices';
import { formatDuration as formatDurationFn } from '@/lib/audio-utils';
import { truncateForPreview } from '@/lib/tts-engine';
import { generateId } from '@/lib/audio-utils';
import {
  AudioWaveform,
  Settings,
  History,
  Clock,
  Sparkles,
  Pause as PauseIcon,
  AlertCircle,
  Loader2,
  ThumbsUp,
  HelpCircle,
  BookOpen,
  Smile,
  Newspaper,
  Film,
  Megaphone,
  Mic,
  Globe,
  Clapperboard,
  Gamepad2,
  Heart,
  Ghost,
  LucideIcon
} from 'lucide-react';

// Icon mapping for templates
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Smile, Newspaper, Film, Megaphone, Mic, Globe, Clapperboard, Gamepad2, Heart, Ghost,
};

export default function TextToSpeechPage() {
  const { voices, history, addHistoryItem } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  const {
    ttsForm,
    generation,
    charCount,
    estimatedDuration,
    textareaRef,
    handleTextChange,
    handleFieldChange,
    injectTemplate,
    injectSSMLBreak,
    handleSubmitTTS,
    clearShake,
  } = useTTSForm(5000);

  // Auto-clear shake animation after it plays
  useEffect(() => {
    if (generation.shouldShake) {
      const timer = setTimeout(clearShake, 500);
      return () => clearTimeout(timer);
    }
  }, [generation.shouldShake, clearShake]);

  // When generation succeeds, add to history
  useEffect(() => {
    if (generation.result?.success && generation.result.audioUrl) {
      const voice = voices.find(v => v.id === ttsForm.voiceId);
      addHistoryItem({
        id: generateId(),
        textPreview: truncateForPreview(ttsForm.text),
        fullText: ttsForm.text,
        voiceId: ttsForm.voiceId,
        voiceName: voice?.label || 'Unknown',
        languageCode: ttsForm.languageCode,
        audioUrl: generation.result.audioUrl,
        duration: generation.result.duration || 0,
        charCount,
        createdAt: new Date().toISOString(),
        type: 'tts',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation.result]);

  // Filter voices by selected language
  const filteredVoices = ttsForm.languageCode
    ? voices.filter(v => v.languageCode === ttsForm.languageCode)
    : voices;

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <h1>
          <AudioWaveform size={24} />
          Text to Speech
        </h1>
        <div className="page-header-actions">
          <button className="header-btn"><ThumbsUp size={16} /><span>Feedback</span></button>
          <button className="header-btn"><HelpCircle size={16} /><span>Need help?</span></button>
        </div>
      </div>

      {/* TTS Layout: Textarea + Settings */}
      <div className="tts-layout">
        {/* Left: Text Input Area */}
        <div className="slide-up">
          {/* Textarea */}
          <div className={`glass-card ${generation.shouldShake ? 'shake' : ''}`}>
            <textarea
              ref={textareaRef}
              className={`form-textarea ${generation.error ? 'error' : ''}`}
              placeholder="Bắt đầu nhập hoặc dán văn bản của bạn vào đây..."
              value={ttsForm.text}
              onChange={(e) => handleTextChange(e.target.value)}
              style={{ minHeight: '250px' }}
              maxLength={100000}
            />

            {/* Template Tags */}
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Bắt đầu với
              </p>
              <div className="template-tags">
                {SCRIPT_TEMPLATES.slice(0, 8).map((template) => {
                  const IconComp = ICON_MAP[template.icon] || BookOpen;
                  return (
                    <button
                      key={template.id}
                      className="template-tag"
                      onClick={() => injectTemplate(template.content)}
                      title={template.description}
                    >
                      <IconComp size={14} />
                      <span>{template.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SSML Toolbar */}
            <div className="ssml-toolbar">
              <button className="ssml-btn" onClick={() => injectSSMLBreak(0.5)}>
                <PauseIcon size={12} />
                <span>Nghỉ 0.5s</span>
              </button>
              <button className="ssml-btn" onClick={() => injectSSMLBreak(1.0)}>
                <PauseIcon size={12} />
                <span>Nghỉ 1.0s</span>
              </button>
              <button className="ssml-btn" onClick={() => injectSSMLBreak(2.0)}>
                <PauseIcon size={12} />
                <span>Nghỉ 2.0s</span>
              </button>
            </div>

            {/* Char Counter + Duration */}
            <div className="char-counter">
              <div className="counter-left">
                <Clock size={16} />
                {charCount > 0 ? (
                  <span className="duration-badge">
                    ⏱ {estimatedDuration.formatted} · {estimatedDuration.wordCount} từ
                  </span>
                ) : (
                  <span>Bắt đầu nhập để ước tính</span>
                )}
              </div>
              <div className={`counter-right ${charCount > 4500 ? 'warning' : ''} ${charCount > 4900 ? 'danger' : ''}`}>
                {charCount.toLocaleString()} / 5,000 ký tự
              </div>
            </div>

            {/* Error Message */}
            {generation.error && (
              <div className="error-message" style={{ marginTop: '8px' }}>
                <AlertCircle size={16} />
                <span>{generation.error}</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {generation.isGenerating && (
            <div className="glass-card loading-spinner" style={{ marginTop: '16px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>
                Đang tạo giọng nói AI...
              </p>
            </div>
          )}

          {/* Audio Player Result */}
          {generation.result?.success && generation.result.audioUrl && !generation.isGenerating && (
            <div style={{ marginTop: '16px' }}>
              <AudioPlayer
                audioUrl={generation.result.audioUrl}
                filename={`${ttsForm.filePrefix}.mp3`}
              />
            </div>
          )}
        </div>

        {/* Right: Settings Panel */}
        <div className="settings-panel slide-up">
          {/* Tabs: Settings | History */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Settings
            </button>
            <button
              className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              History
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'settings' ? (
              <>
                {/* Voice Style Selector */}
                <div className="form-group">
                  <label className="form-label">Voice style</label>
                  <select
                    className="form-select"
                    value={ttsForm.voiceId}
                    onChange={(e) => handleFieldChange('voiceId', e.target.value)}
                  >
                    <option value="">-- Chọn giọng nói --</option>
                    {/* Custom voices first */}
                    {voices.filter(v => v.isCustom).length > 0 && (
                      <optgroup label="🎤 Giọng nói của tôi">
                        {voices.filter(v => v.isCustom).map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {/* Group by country */}
                    {COUNTRIES.map(country => {
                      const countryVoices = filteredVoices.filter(v =>
                        v.countryCode === country.code && !v.isCustom
                      );
                      if (countryVoices.length === 0) return null;
                      return (
                        <optgroup key={country.code} label={`${country.flag} ${country.name}`}>
                          {countryVoices.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Language Selector */}
                <div className="form-group">
                  <label className="form-label">Ngôn ngữ</label>
                  <select
                    className="form-select"
                    value={ttsForm.languageCode}
                    onChange={(e) => handleFieldChange('languageCode', e.target.value)}
                  >
                    <option value="">Tất cả ngôn ngữ</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.languageCode}>
                        {c.flag} {c.languageName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Tốc độ</span>
                    <span className="slider-value">{ttsForm.speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsForm.speed}
                    onChange={(e) => handleFieldChange('speed', parseFloat(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>Chậm</span>
                    <span>Nhanh</span>
                  </div>
                </div>

                {/* Stability Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Sự sáng tạo</span>
                    <span className="slider-value">{Math.round(ttsForm.stability * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ttsForm.stability}
                    onChange={(e) => handleFieldChange('stability', parseFloat(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>Ổn định</span>
                    <span>Diễn cảm</span>
                  </div>
                </div>

                {/* Clarity Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Độ đa dạng giọng nói</span>
                    <span className="slider-value">{Math.round(ttsForm.clarity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ttsForm.clarity}
                    onChange={(e) => handleFieldChange('clarity', parseFloat(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>Vùng chải</span>
                    <span>Năng động</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Phạm vi biểu cảm</span>
                    <span className="slider-value">{ttsForm.pitch > 0 ? '+' : ''}{ttsForm.pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="1"
                    value={ttsForm.pitch}
                    onChange={(e) => handleFieldChange('pitch', parseInt(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>Tinh tế</span>
                    <span>Kịch tính</span>
                  </div>
                </div>

                {/* File Prefix */}
                <div className="form-group">
                  <label className="form-label">Tên file đầu ra</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ttsForm.filePrefix}
                    onChange={(e) => handleFieldChange('filePrefix', e.target.value)}
                    placeholder="voice_output"
                  />
                </div>
              </>
            ) : (
              /* History Tab */
              <div className="history-list">
                {history.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <History size={40} />
                    <h3>Chưa có lịch sử</h3>
                    <p>Lịch sử tạo giọng nói sẽ xuất hiện ở đây</p>
                  </div>
                ) : (
                  history.filter(h => h.type === 'tts').slice(0, 20).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-icon">
                        <AudioWaveform size={16} />
                      </div>
                      <div className="history-content">
                        <div className="history-text">{item.textPreview}</div>
                        <div className="history-meta">
                          <span>{item.voiceName}</span>
                          <span>·</span>
                          <span>{item.charCount} ký tự</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          {activeTab === 'settings' && (
            <div style={{ padding: '0 20px 20px' }}>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleSubmitTTS}
                disabled={generation.isGenerating}
              >
                {generation.isGenerating ? (
                  <>
                    <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Tạo giọng nói</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
