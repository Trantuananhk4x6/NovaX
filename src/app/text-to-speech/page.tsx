'use client';
// ============================================================================
// Text-to-Speech Page — Fish Speech local inference
// Settings map directly to Fish Speech v1.5 parameters.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AudioPlayer from '@/components/player/AudioPlayer';
import { useApp } from '@/context/AppContext';
import { useTTSForm } from '@/hooks/use-tts-form';
import { SCRIPT_TEMPLATES } from '@/constants/templates';
import { COUNTRIES } from '@/constants/voices';
import { truncateForPreview } from '@/lib/tts-engine';
import { generateId } from '@/lib/audio-utils';
import { HistoryItem } from '@/types/api.types';
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
  Play,
  Download,
  Trash2,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Smile, Newspaper, Film, Megaphone, Mic, Globe, Clapperboard, Gamepad2, Heart, Ghost,
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility: compute relative time string from ISO timestamp
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return `${Math.floor(diff / 86_400_000)} ngày trước`;
}

// ─────────────────────────────────────────────────────────────────────────────
// History item mini-player
// ─────────────────────────────────────────────────────────────────────────────
function HistoryPlayer({ item, onDelete }: { item: HistoryItem; onDelete: (id: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(() => {
    if (!item.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(item.audioUrl);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [playing, item.audioUrl]);

  // cleanup on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return (
    <div className="history-item" style={{ flexDirection: 'column', gap: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Play button */}
        <button
          onClick={toggle}
          disabled={!item.audioUrl}
          style={{
            flexShrink: 0,
            width: 34, height: 34,
            borderRadius: '50%',
            border: 'none',
            background: item.audioUrl ? 'var(--accent-violet)' : 'var(--bg-tertiary)',
            color: 'white',
            cursor: item.audioUrl ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={playing ? 'Dừng' : 'Phát'}
        >
          {playing
            ? <PauseIcon size={14} />
            : <Play size={14} style={{ marginLeft: 2 }} />}
        </button>

        {/* Text + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="history-text" style={{ fontWeight: 500 }}>{item.textPreview}</div>
          <div className="history-meta" style={{ marginTop: 4, gap: 6 }}>
            <span style={{ color: 'var(--accent-violet-light)' }}>{item.voiceName}</span>
            <span>·</span>
            <span>{item.charCount} ký tự</span>
            {item.duration > 0 && (
              <>
                <span>·</span>
                <span>~{item.duration}s</span>
              </>
            )}
            <span>·</span>
            <span>{timeAgo(item.createdAt)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {item.audioUrl && (
            <a
              href={item.audioUrl}
              download
              title="Tải xuống"
              style={{
                width: 28, height: 28,
                borderRadius: 6,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <Download size={12} />
            </a>
          )}
          <button
            onClick={() => onDelete(item.id)}
            title="Xoá"
            style={{
              width: 28, height: 28,
              borderRadius: 6,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function TextToSpeechPage() {
  const { voices, history, addHistoryItem, removeHistoryItem } = useApp();
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

  useEffect(() => {
    if (generation.shouldShake) {
      const t = setTimeout(clearShake, 500);
      return () => clearTimeout(t);
    }
  }, [generation.shouldShake, clearShake]);

  // Add to history on success
  useEffect(() => {
    if (generation.result?.success && generation.result.audioUrl) {
      const voice = voices.find(v => v.id === ttsForm.voiceId);
      addHistoryItem({
        id: generateId(),
        textPreview: truncateForPreview(ttsForm.text),
        fullText: ttsForm.text,
        voiceId: ttsForm.voiceId,
        voiceName: voice?.label || ttsForm.voiceId,
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

  // Fish Speech is cross-lingual: same voice speaks all 9 languages.
  // Show all voices regardless of language selection.
  const filteredVoices = voices;

  const ttsHistory = history.filter(h => h.type === 'tts').slice(0, 30);

  return (
    <MainLayout>
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

      <div className="tts-layout">
        {/* ── Left: text input ─────────────────────────────────────────── */}
        <div className="slide-up">
          <div className={`glass-card ${generation.shouldShake ? 'shake' : ''}`}>
            <textarea
              ref={textareaRef}
              className={`form-textarea ${generation.error ? 'error' : ''}`}
              placeholder="Bắt đầu nhập hoặc dán văn bản của bạn vào đây..."
              value={ttsForm.text}
              onChange={e => handleTextChange(e.target.value)}
              style={{ minHeight: '250px' }}
              maxLength={100_000}
            />

            {/* Templates */}
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 8 }}>Bắt đầu với</p>
              <div className="template-tags">
                {SCRIPT_TEMPLATES.slice(0, 8).map(t => {
                  const Icon = ICON_MAP[t.icon] || BookOpen;
                  return (
                    <button key={t.id} className="template-tag" onClick={() => injectTemplate(t.content)} title={t.description}>
                      <Icon size={14} />
                      <span>{t.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SSML toolbar */}
            <div className="ssml-toolbar">
              {[0.5, 1.0, 2.0].map(s => (
                <button key={s} className="ssml-btn" onClick={() => injectSSMLBreak(s)}>
                  <PauseIcon size={12} />
                  <span>Nghỉ {s}s</span>
                </button>
              ))}
            </div>

            {/* Char counter */}
            <div className="char-counter">
              <div className="counter-left">
                <Clock size={16} />
                {charCount > 0
                  ? <span className="duration-badge">⏱ {estimatedDuration.formatted} · {estimatedDuration.wordCount} từ</span>
                  : <span>Bắt đầu nhập để ước tính</span>}
              </div>
              <div className={`counter-right ${charCount > 4500 ? 'warning' : ''} ${charCount > 4900 ? 'danger' : ''}`}>
                {charCount.toLocaleString('vi-VN')} / 5,000 ký tự
              </div>
            </div>

            {generation.error && (
              <div className="error-message" style={{ marginTop: 8 }}>
                <AlertCircle size={16} />
                <span>{generation.error}</span>
              </div>
            )}
          </div>

          {generation.isGenerating && (
            <div className="glass-card loading-spinner" style={{ marginTop: 16 }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>Đang tạo giọng nói AI…</p>
            </div>
          )}

          {generation.result?.success && generation.result.audioUrl && !generation.isGenerating && (
            <div style={{ marginTop: 16 }}>
              <AudioPlayer audioUrl={generation.result.audioUrl} filename={`${ttsForm.filePrefix}.wav`} />
            </div>
          )}
        </div>

        {/* ── Right: settings panel ─────────────────────────────────────── */}
        <div className="settings-panel slide-up">
          {/* Tabs */}
          <div className="settings-tabs">
            <button className={`settings-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Settings
            </button>
            <button className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <History size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              History {ttsHistory.length > 0 && <span style={{ marginLeft: 4, background: 'var(--accent-violet)', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{ttsHistory.length}</span>}
            </button>
          </div>

          <div className="settings-body">
            {activeTab === 'settings' ? (
              <>
                {/* Voice — grouped by engine then country */}
                <div className="form-group">
                  <label className="form-label">Giọng nói</label>
                  <select className="form-select" value={ttsForm.voiceId} onChange={e => handleFieldChange('voiceId', e.target.value)}>
                    <option value="">-- Chọn giọng nói --</option>

                    {/* Custom cloned voices */}
                    {voices.filter(v => v.isCustom).length > 0 && (
                      <optgroup label="🎤 Giọng của tôi">
                        {voices.filter(v => v.isCustom).map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </optgroup>
                    )}

                    {/* CosyVoice2 voices — native Vietnamese + other languages */}
                    {(() => {
                      const cvVoices = filteredVoices.filter(v => v.engine === 'cosyvoice2' && !v.isCustom);
                      if (!cvVoices.length) return null;
                      // Group by country
                      const byCountry = COUNTRIES.map(c => ({
                        country: c,
                        voices: cvVoices.filter(v => v.countryCode === c.code),
                      })).filter(g => g.voices.length > 0);
                      return byCountry.map(({ country, voices: gv }) => (
                        <optgroup key={`cv2-${country.code}`}
                          label={`🎯 [CosyVoice2] ${country.flag} ${country.languageName}`}>
                          {gv.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      ));
                    })()}

                    {/* Kokoro voices */}
                    {COUNTRIES.map(country => {
                      const kv = filteredVoices.filter(v =>
                        v.engine === 'kokoro' && v.countryCode === country.code && !v.isCustom
                      );
                      if (!kv.length) return null;
                      return (
                        <optgroup key={`ko-${country.code}`}
                          label={`🔊 [Kokoro] ${country.flag} ${country.languageName}`}>
                          {kv.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Language */}
                <div className="form-group">
                  <label className="form-label">Ngôn ngữ</label>
                  <select className="form-select" value={ttsForm.languageCode} onChange={e => handleFieldChange('languageCode', e.target.value)}>
                    <option value="">Tất cả ngôn ngữ</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.languageCode}>{c.flag} {c.languageName}</option>)}
                  </select>
                </div>

                {/* Speed */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Tốc độ</span>
                    <span className="slider-value">{ttsForm.speed.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={ttsForm.speed}
                    onChange={e => handleFieldChange('speed', parseFloat(e.target.value))} />
                  <div className="slider-labels"><span>Chậm</span><span>Nhanh</span></div>
                </div>

                {/* File prefix */}
                <div className="form-group">
                  <label className="form-label">Tên file đầu ra</label>
                  <input type="text" className="form-input" value={ttsForm.filePrefix}
                    onChange={e => handleFieldChange('filePrefix', e.target.value)} placeholder="voice_output" />
                </div>
              </>
            ) : (
              /* ── History tab ─────────────────────────────────────────── */
              <div className="history-list" style={{ padding: '0 4px' }}>
                {ttsHistory.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <History size={40} />
                    <h3>Chưa có lịch sử</h3>
                    <p>Lịch sử tạo giọng nói sẽ xuất hiện ở đây</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px 4px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span>{ttsHistory.length} bản ghi</span>
                    </div>
                    {ttsHistory.map(item => (
                      <HistoryPlayer key={item.id} item={item} onDelete={removeHistoryItem} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Generate button */}
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
                    <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Đang xử lý…</span>
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
