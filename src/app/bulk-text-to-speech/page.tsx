'use client';
// ============================================================================
// Văn Bản Dài — Long-form TTS page
// Design: voicelabs.top style — large textarea + quick action sidebar
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { generateId } from '@/lib/audio-utils';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Mic2,
  FileText,
  Zap,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChunkResult {
  id: string;
  text: string;
  index: number;
  audioUrl?: string;
  isGenerating?: boolean;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHUNK_METHODS = [
  { value: 'newline', label: 'Theo xuống dòng' },
  { value: 'sentence', label: 'Theo câu' },
  { value: 'paragraph', label: 'Theo đoạn văn' },
  { value: 'none', label: 'Toàn bộ văn bản' },
];

function splitText(text: string, method: string): string[] {
  if (!text.trim()) return [];
  switch (method) {
    case 'newline':
      return text.split('\n').map(s => s.trim()).filter(Boolean);
    case 'sentence':
      return text.split(/(?<=[.!?。！？])\s+/).map(s => s.trim()).filter(Boolean);
    case 'paragraph':
      return text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    case 'none':
    default:
      return [text.trim()];
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// Gemini token estimation (matches tokenization used by gemini-2.5-flash-preview-tts)
function estimateGeminiTokens(text: string): number {
  if (!text) return 0;
  let tokens = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp < 128) tokens += 0.25;          // ASCII ~4 chars/token
    else if (cp < 0x0300) tokens += 0.5;  // Latin extended ~2 chars/token
    else tokens += 0.67;                   // Vietnamese/CJK ~1.5 chars/token
  }
  return Math.max(1, Math.ceil(tokens));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BulkTextToSpeechPage() {
  const { voices, history, addHistoryItem, removeHistoryItem, ttsProvider } = useApp();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('vi-VN');
  const [voiceId, setVoiceId] = useState('');
  const [chunkMethod, setChunkMethod] = useState('newline');
  const [speed, setSpeed] = useState(1.0);
  const [filePrefix, setFilePrefix] = useState('voice_output');

  // ── Processing state ───────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState<ChunkResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);

  // ── History tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Filtered voices ─────────────────────────────────────────────────────────
  const filteredVoices = voices.filter(v => !language || v.languageCode === language);

  // Reset voiceId when language changes
  useEffect(() => {
    setVoiceId('');
  }, [language]);

  // ── Char count ──────────────────────────────────────────────────────────────
  const charCount = text.length;
  const MAX_CHARS = 100000;

  // ── Play audio ─────────────────────────────────────────────────────────────
  const handlePlay = useCallback((id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null));
  }, [playingId]);

  // ── Generate single chunk ───────────────────────────────────────────────────
  const generateChunk = useCallback(async (chunk: ChunkResult): Promise<string | null> => {
    const res = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: chunk.text,
        voiceId,
        speed,
        languageCode: language,
        filePrefix: `${filePrefix}_part${chunk.index + 1}`,
        provider: ttsProvider, // gửi provider để API biết dùng model nào
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi tạo giọng nói');
    return data.audioUrl as string;
  }, [voiceId, speed, language, filePrefix, ttsProvider]);

  // ── Start processing ────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!text.trim()) return;
    if (!voiceId) { setError('Vui lòng chọn giọng nói.'); return; }

    setError(null);
    setMergedUrl(null);
    setIsProcessing(true);

    const parts = splitText(text, chunkMethod);
    const initial: ChunkResult[] = parts.map((t, i) => ({
      id: generateId(),
      text: t,
      index: i,
    }));
    setChunks(initial);

    const updated = [...initial];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], isGenerating: true };
      setChunks([...updated]);

      try {
        const url = await generateChunk(updated[i]);
        updated[i] = { ...updated[i], isGenerating: false, audioUrl: url ?? undefined };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
        updated[i] = { ...updated[i], isGenerating: false, error: msg };
      }
      setChunks([...updated]);
    }

    setIsProcessing(false);

    // Try to merge if all succeeded
    const allUrls = updated.filter(c => c.audioUrl).map(c => ({ audioUrl: c.audioUrl, pauseBefore: 0 }));
    if (allUrls.length > 0) {
      try {
        const mergeRes = await fetch('/api/tts/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segments: allUrls, filePrefix }),
        });
        const mergeData = await mergeRes.json();
        if (mergeRes.ok && mergeData.success) {
          setMergedUrl(mergeData.audioUrl);
          addHistoryItem({
            id: generateId(),
            textPreview: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
            fullText: text,
            voiceId,
            voiceName: voices.find(v => v.id === voiceId)?.name || 'Unknown',
            languageCode: language,
            audioUrl: mergeData.audioUrl,
            duration: mergeData.duration || 0,
            charCount,
            createdAt: new Date().toISOString(),
            type: 'bulk-tts',
          });
        }
      } catch { /* merge failure is non-fatal */ }
    }
  }, [text, voiceId, speed, language, chunkMethod, filePrefix, generateChunk, addHistoryItem, voices, charCount]);

  const bulkHistory = history.filter(h => h.type === 'bulk-tts');
  const doneCount = chunks.filter(c => c.audioUrl).length;
  const errorCount = chunks.filter(c => c.error).length;

  return (
    <MainLayout>
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>
          <FileText size={22} />
          Văn bản dài
        </h1>
        <div className="page-header-actions">
          <button
            className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 'var(--radius-md)' }}
            onClick={() => setActiveTab(activeTab === 'history' ? 'settings' : 'history')}
          >
            <History size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: Text Area ── */}
        <div className="glass-card slide-up" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Văn bản dài</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {charCount > 0 && (
                  <span style={{ fontSize: '0.73rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: 3, opacity: 0.85 }}>
                    <Zap size={11} />
                    ~{estimateGeminiTokens(text).toLocaleString()} token
                  </span>
                )}
                <span style={{
                  fontSize: '0.78rem',
                  color: charCount > MAX_CHARS * 0.9 ? 'var(--accent-red)' : 'var(--text-tertiary)',
                }}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} ký tự
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              Nhập đoạn văn bản tối đa 100.000 ký tự
            </p>
          </div>

          {/* Textarea */}
          <textarea
            className="form-textarea"
            style={{
              minHeight: 340,
              border: 'none',
              borderRadius: 0,
              resize: 'vertical',
              background: 'transparent',
              padding: '20px',
              fontSize: '0.95rem',
              lineHeight: 1.7,
            }}
            placeholder="Nhập hoặc dán nội dung của bạn vào đây..."
            value={text}
            onChange={e => {
              if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
            }}
            maxLength={MAX_CHARS}
          />

          {/* Chunk progress */}
          {chunks.length > 0 ? (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Tiến trình: {doneCount}/{chunks.length} đoạn
                  {errorCount > 0 ? <span style={{ color: 'var(--accent-red)', marginLeft: 8 }}>· {errorCount} lỗi</span> : null}
                </span>
                {mergedUrl ? (
                  <a
                    href={mergedUrl}
                    download={`${filePrefix}.wav`}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <Download size={13} /> <span>Tải về file gộp</span>
                  </a>
                ) : null}
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${chunks.length > 0 ? ((doneCount + errorCount) / chunks.length) * 100 : 0}%`,
                  background: errorCount > 0 ? 'var(--accent-red)' : 'linear-gradient(90deg, var(--accent-purple), var(--accent-blue))',
                  borderRadius: 99,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Chunk list */}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {chunks.map((chunk) => (
                  <div key={chunk.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: chunk.error ? 'rgba(239,68,68,0.08)' : chunk.audioUrl ? 'rgba(16,185,129,0.07)' : 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${chunk.error ? 'rgba(239,68,68,0.2)' : chunk.audioUrl ? 'rgba(16,185,129,0.2)' : 'var(--border-subtle)'}`,
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', minWidth: 20 }}>#{chunk.index + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chunk.text.slice(0, 80)}{chunk.text.length > 80 ? '...' : ''}
                    </span>

                    {chunk.isGenerating && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent-purple)', flexShrink: 0 }} />}
                    {chunk.error && <span title={chunk.error} style={{ flexShrink: 0, display: 'flex' }}><AlertCircle size={13} style={{ color: 'var(--accent-red)' }} /></span>}
                    {chunk.audioUrl && !chunk.isGenerating && (
                      <>
                        <CheckCircle2 size={13} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                        <button
                          onClick={() => handlePlay(chunk.id, chunk.audioUrl!)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 2, flexShrink: 0 }}
                          title={playingId === chunk.id ? 'Dừng' : 'Nghe thử'}
                        >
                          {playingId === chunk.id ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        <a href={chunk.audioUrl} download style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} title="Tải về">
                          <Download size={12} />
                        </a>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Merged audio player */}
              {mergedUrl ? (
                <div style={{ marginTop: 12, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 10 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>File audio gộp:</p>
                  <audio controls src={mergedUrl} style={{ width: '100%', height: 36 }} />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Error */}
          {error ? (
            <div className="error-message" style={{ margin: '0 20px 16px' }}>
              <AlertCircle size={14} /> {error}
            </div>
          ) : null}
        </div>

        {/* ── RIGHT: Settings Panel ── */}
        {activeTab === 'settings' ? (
          <div className="glass-card slide-up" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hành động nhanh
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* File prefix */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên file cơ sở (tiền tố)</label>
                <input
                  type="text"
                  className="form-input"
                  value={filePrefix}
                  onChange={e => setFilePrefix(e.target.value)}
                  placeholder="voice_output"
                />
              </div>

              {/* Language */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ngôn ngữ</label>
                <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.languageCode}>{c.flag} {c.languageName}</option>
                  ))}
                </select>
              </div>

              {/* Voice */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên giọng nói</label>
                <select className="form-select" value={voiceId} onChange={e => setVoiceId(e.target.value)}>
                  <option value="">Tên giọng nói</option>
                  {voices.filter(v => v.isCustom).length > 0 && (
                    <optgroup label="🎤 Giọng của tôi">
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

              {/* Chunk method */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Kiểu chia nhỏ</label>
                <select className="form-select" value={chunkMethod} onChange={e => setChunkMethod(e.target.value)}>
                  {CHUNK_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Speed */}
              <div className="slider-container" style={{ marginBottom: 0 }}>
                <div className="slider-header">
                  <span className="slider-label">Tốc độ</span>
                  <span className="slider-value">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min="0.7" max="1.5" step="0.05"
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                />
                <div className="slider-labels"><span>Chậm</span><span>Nhanh</span></div>
              </div>

              {/* Chunk preview — use ternary (not &&) to avoid React insertBefore reconciliation bug */}
              {text.trim() ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '8px 12px' }}>
                  <Mic2 size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Sẽ chia thành <strong style={{ color: 'var(--text-secondary)' }}>{splitText(text, chunkMethod).length}</strong> đoạn
                </div>
              ) : null}

              {/* CTA */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8, marginTop: 4 }}
                onClick={handleStart}
                disabled={isProcessing || !text.trim() || !voiceId}
              >
                {isProcessing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Đang xử lý...</span>
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <ChevronRight size={15} />
                    <span>Bắt đầu xử lý</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ── History Panel ── */
          <div className="glass-card slide-up" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lịch sử
            </div>
            <div className="history-list" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {bulkHistory.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <History size={36} />
                  <h3 style={{ fontSize: '0.95rem' }}>Chưa có lịch sử</h3>
                  <p style={{ fontSize: '0.8rem' }}>Lịch sử xuất audio sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                bulkHistory.slice(0, 20).map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-icon"><FileText size={15} /></div>
                    <div className="history-content">
                      <div className="history-text">{item.textPreview}</div>
                      <div className="history-meta">
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>·</span>
                        <span>{item.charCount.toLocaleString()} ký tự</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <a href={item.audioUrl} download
                        className="voice-play-btn"
                        style={{ width: 26, height: 26, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Tải về"
                      >
                        <Download size={11} />
                      </a>
                      <button className="voice-play-btn" style={{ width: 26, height: 26, color: 'var(--accent-red)' }}
                        onClick={() => removeHistoryItem(item.id)} title="Xóa"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
