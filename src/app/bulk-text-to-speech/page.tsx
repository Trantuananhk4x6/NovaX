'use client';
// ============================================================================
// Bulk Text-to-Speech Page — Long text TTS with split modes
// Supports up to 100,000 characters with line/sentence/paragraph splitting
// ============================================================================

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AudioPlayer from '@/components/player/AudioPlayer';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { SplitMode, BULK_TTS_CHAR_LIMIT } from '@/types/tts.types';
import { countCharacters } from '@/lib/tts-engine';
import { generateId } from '@/lib/audio-utils';
import {
  FileText,
  Settings,
  History,
  Sparkles,
  Loader2,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  Clock,
} from 'lucide-react';

const SPLIT_OPTIONS: { value: SplitMode; label: string }[] = [
  { value: 'line', label: 'Theo xuống dòng' },
  { value: 'sentence', label: 'Theo câu' },
  { value: 'paragraph', label: 'Theo đoạn văn' },
];

export default function BulkTextToSpeechPage() {
  const { voices, history, addHistoryItem } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  // Form state
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [languageCode, setLanguageCode] = useState('vi-VN');
  const [splitMode, setSplitMode] = useState<SplitMode>('line');
  const [speed, setSpeed] = useState(1.0);
  const [filePrefix, setFilePrefix] = useState('voice_output');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = useMemo(() => countCharacters(text), [text]);

  // Fish Speech is cross-lingual — all voices work for all 9 languages.
  const filteredVoices = voices;

  // Estimated duration
  const estimatedDuration = useMemo(() => {
    const stripped = text.replace(/<[^>]*>/g, '').trim();
    if (!stripped) return { formatted: '00:00', wordCount: 0 };
    const wordCount = stripped.split(/\s+/).filter(Boolean).length;
    const totalSeconds = Math.round(((wordCount / 150) * 60) / speed);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return {
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      wordCount,
    };
  }, [text, speed]);

  // Clear shake
  useEffect(() => {
    if (shouldShake) {
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShake]);

  const handleSubmit = useCallback(async () => {
    // Validate
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản để chuyển đổi.');
      setShouldShake(true);
      return;
    }
    if (!voiceId) {
      setError('Vui lòng chọn giọng nói trước khi tạo.');
      setShouldShake(true);
      return;
    }
    if (charCount > BULK_TTS_CHAR_LIMIT) {
      setError(`Văn bản vượt quá giới hạn ${BULK_TTS_CHAR_LIMIT.toLocaleString('vi-VN')} ký tự.`);
      setShouldShake(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId,
          speed,
          temperature: 0.7,
          topP: 0.7,
          repetitionPenalty: 1.2,
          languageCode,
          filePrefix,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        const voice = voices.find(v => v.id === voiceId);
        addHistoryItem({
          id: generateId(),
          textPreview: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
          fullText: text,
          voiceId,
          voiceName: voice?.label || 'Unknown',
          languageCode,
          audioUrl: data.audioUrl,
          duration: data.duration || 0,
          charCount,
          createdAt: new Date().toISOString(),
          type: 'bulk-tts',
        });
      } else {
        throw new Error(data.error || 'Lỗi không xác định');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi.';
      setError(`Lỗi: ${msg}`);
      setShouldShake(true);
    } finally {
      setIsGenerating(false);
    }
  }, [text, voiceId, speed, languageCode, filePrefix, splitMode, charCount, voices, addHistoryItem]);

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <h1>
          <FileText size={24} />
          Văn bản dài
        </h1>
        <div className="page-header-actions">
          <button className="header-btn"><ThumbsUp size={16} /><span>Góp ý</span></button>
          <button className="header-btn"><HelpCircle size={16} /><span>Cần hỗ trợ?</span></button>
        </div>
      </div>

      {/* TTS Layout: Textarea + Settings */}
      <div className="tts-layout">
        {/* Left: Text Input Area */}
        <div className="slide-up">
          <div className={`glass-card ${shouldShake ? 'shake' : ''}`}>
            {/* Section header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>Văn bản dài</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  Nhập đoạn văn bản lớn đến {BULK_TTS_CHAR_LIMIT.toLocaleString('vi-VN')} ký tự
                </p>
              </div>
              <div className={`counter-right ${charCount > 90000 ? 'warning' : ''} ${charCount > 98000 ? 'danger' : ''}`}
                style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                {charCount.toLocaleString('vi-VN')} / {BULK_TTS_CHAR_LIMIT.toLocaleString('vi-VN')} ký tự
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className={`form-textarea ${error ? 'error' : ''}`}
              placeholder="Nhập hoặc dán nội dung của bạn vào đây..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
                setShouldShake(false);
              }}
              style={{ minHeight: '350px' }}
              maxLength={BULK_TTS_CHAR_LIMIT + 1000}
            />

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
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message" style={{ marginTop: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="glass-card loading-spinner" style={{ marginTop: '16px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>
                Đang xử lý văn bản dài với AI...
              </p>
            </div>
          )}

          {/* Audio Player Result */}
          {audioUrl && !isGenerating && (
            <div style={{ marginTop: '16px' }}>
              <AudioPlayer
                audioUrl={audioUrl}
                filename={`${filePrefix}.mp3`}
              />
            </div>
          )}
        </div>

        {/* Right: Settings Panel */}
        <div className="settings-panel slide-up">
          {/* Tabs */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Hành động nhanh
            </button>
            <button
              className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Lịch sử
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'settings' ? (
              <>
                {/* File Prefix */}
                <div className="form-group">
                  <label className="form-label">Tên file cơ sở (tiền tố)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={filePrefix}
                    onChange={(e) => setFilePrefix(e.target.value)}
                    placeholder="voice_output"
                  />
                </div>

                {/* Language Selector */}
                <div className="form-group">
                  <label className="form-label">Ngôn ngữ</label>
                  <select
                    className="form-select"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.languageCode}>
                        {c.flag} {c.languageName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voice Selector */}
                <div className="form-group">
                  <label className="form-label">Tên giọng nói</label>
                  <select
                    className="form-select"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                  >
                    <option value="">Tên giọng nói</option>
                    {voices.filter(v => v.isCustom).length > 0 && (
                      <optgroup label="🎤 Giọng của tôi">
                        {voices.filter(v => v.isCustom).map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {COUNTRIES.flatMap(country => {
                      const cvVoices = filteredVoices.filter(v =>
                        v.engine === 'cosyvoice2' && v.countryCode === country.code && !v.isCustom
                      );
                      const koVoices = filteredVoices.filter(v =>
                        v.engine === 'kokoro' && v.countryCode === country.code && !v.isCustom
                      );
                      const groups = [];
                      if (cvVoices.length > 0) groups.push(
                        <optgroup key={`cv2-${country.code}`} label={`🎯 [CosyVoice2] ${country.flag} ${country.languageName}`}>
                          {cvVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      );
                      if (koVoices.length > 0) groups.push(
                        <optgroup key={`ko-${country.code}`} label={`🔊 [Kokoro] ${country.flag} ${country.languageName}`}>
                          {koVoices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      );
                      return groups;
                    })}
                  </select>
                </div>

                {/* Split Mode */}
                <div className="form-group">
                  <label className="form-label">Kiểu chia nhỏ</label>
                  <select
                    className="form-select"
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                  >
                    {SPLIT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Tốc độ</span>
                    <span className="slider-value">{speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  />
                  <div className="slider-labels">
                    <span>Chậm</span>
                    <span>Nhanh</span>
                  </div>
                </div>
              </>
            ) : (
              /* History Tab */
              <div className="history-list">
                {history.filter(h => h.type === 'bulk-tts').length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <History size={40} />
                    <h3>Chưa có lịch sử</h3>
                    <p>Lịch sử xử lý văn bản dài sẽ xuất hiện ở đây</p>
                  </div>
                ) : (
                  history.filter(h => h.type === 'bulk-tts').slice(0, 20).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-icon">
                        <FileText size={16} />
                      </div>
                      <div className="history-content">
                        <div className="history-text">{item.textPreview}</div>
                        <div className="history-meta">
                          <span>{item.voiceName}</span>
                          <span>·</span>
                          <span>{item.charCount.toLocaleString('vi-VN')} ký tự</span>
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
                onClick={handleSubmit}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Bắt đầu xử lý</span>
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
