'use client';
// ============================================================================
// YouTube Script Audio Studio
// Professional multi-voice, multi-segment TTS tool for YouTubers
// Features: Smart script splitting, per-segment voice/speed/pause, merge export
// ============================================================================

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { generateId } from '@/lib/audio-utils';
import {
  FileText,
  History,
  Sparkles,
  Loader2,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  Play,
  Pause,
  Download,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Scissors,
  Wand2,
  Mic2,
  Timer,
  PackageOpen,
  CheckCircle2,
  X,
  GripVertical,
  Volume2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScriptSegment {
  id: string;
  label: string;       // "Intro", "Section 1", etc.
  text: string;
  voiceId: string;
  speed: number;
  pauseBefore: number; // seconds of silence before this segment
  audioUrl?: string;
  isGenerating?: boolean;
  error?: string;
  duration?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEGMENT_LABEL_OPTIONS = [
  'Intro', 'Hook', 'Nội dung', 'Chuyển cảnh', 'CTA', 'Outro',
  'Q&A', 'Story', 'Example', 'Summary', 'Custom',
];

const PAUSE_OPTIONS = [
  { value: 0, label: 'Không nghỉ' },
  { value: 0.5, label: '0.5s' },
  { value: 1, label: '1s' },
  { value: 1.5, label: '1.5s' },
  { value: 2, label: '2s' },
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
];

const LABEL_COLORS: Record<string, string> = {
  'Intro': '#8b5cf6',
  'Hook': '#f43f5e',
  'Nội dung': '#3b82f6',
  'Chuyển cảnh': '#f59e0b',
  'CTA': '#10b981',
  'Outro': '#6366f1',
  'Q&A': '#ec4899',
  'Story': '#14b8a6',
  'Example': '#f97316',
  'Summary': '#22c55e',
  'Custom': '#94a3b8',
};

function getLabelColor(label: string) {
  return LABEL_COLORS[label] || '#94a3b8';
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function estimateDuration(text: string, speed: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / 150) * 60 / speed);
}

// ─── Sub-component: Segment Card ─────────────────────────────────────────────

interface SegmentCardProps {
  segment: ScriptSegment;
  index: number;
  voices: ReturnType<typeof useApp>['voices'];
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onUpdate: (id: string, patch: Partial<ScriptSegment>) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  onPlay: (id: string, url: string) => void;
  onPause: () => void;
  canDelete: boolean;
}

function SegmentCard({
  segment, index, voices, isSelected, isPlaying,
  onSelect, onUpdate, onDelete, onGenerate, onPlay, onPause, canDelete,
}: SegmentCardProps) {
  const duration = estimateDuration(segment.text, segment.speed);
  const voiceName = voices.find(v => v.id === segment.voiceId)?.name || 'Chưa chọn';
  const color = getLabelColor(segment.label);

  return (
    <div
      className={`segment-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Pause indicator before segment */}
      {segment.pauseBefore > 0 && (
        <div className="pause-indicator">
          <Timer size={10} />
          <span>Nghỉ {segment.pauseBefore}s</span>
        </div>
      )}

      <div className="segment-header">
        <div className="segment-header-left">
          <GripVertical size={14} style={{ color: 'var(--text-tertiary)', cursor: 'grab' }} />
          <span className="segment-number">{index + 1}</span>
          <select
            className="segment-label-select"
            value={segment.label}
            onClick={e => e.stopPropagation()}
            onChange={e => onUpdate(segment.id, { label: e.target.value })}
            style={{ borderColor: color, color }}
          >
            {SEGMENT_LABEL_OPTIONS.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <span className="segment-voice-chip">
            <Mic2 size={10} />
            {voiceName}
          </span>
        </div>

        <div className="segment-header-right">
          {duration > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              ~{formatDuration(duration)}
            </span>
          )}
          {segment.audioUrl && !segment.isGenerating && (
            <button
              className="segment-action-btn"
              onClick={e => {
                e.stopPropagation();
                if (isPlaying) onPause();
                else onPlay(segment.id, segment.audioUrl!);
              }}
              title={isPlaying ? 'Dừng' : 'Nghe thử đoạn này'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: 1 }} />}
            </button>
          )}
          {segment.audioUrl && (
            <span title="Đã render" style={{ color: 'var(--accent-green)' }}>
              <CheckCircle2 size={12} />
            </span>
          )}
          {canDelete && (
            <button
              className="segment-action-btn danger"
              onClick={e => { e.stopPropagation(); onDelete(segment.id); }}
              title="Xóa đoạn"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="segment-text-preview">
        {segment.text.trim().slice(0, 120) || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Chưa có nội dung...</span>}
        {segment.text.length > 120 && '...'}
      </div>

      {segment.error && (
        <div className="segment-error">
          <AlertCircle size={12} /> {segment.error}
        </div>
      )}

      {segment.isGenerating && (
        <div className="segment-generating">
          <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
          <span>Đang tạo giọng nói...</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BulkTextToSpeechPage() {
  const { voices, history, addHistoryItem, removeHistoryItem } = useApp();

  // ── Segments ──────────────────────────────────────────────────────────────
  const [segments, setSegments] = useState<ScriptSegment[]>([
    {
      id: generateId(),
      label: 'Intro',
      text: '',
      voiceId: '',
      speed: 1.0,
      pauseBefore: 0,
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>(segments[0].id);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [smartImportOpen, setSmartImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [filePrefix, setFilePrefix] = useState('youtube_audio');
  const [globalVoiceId, setGlobalVoiceId] = useState('');
  const [globalLanguage, setGlobalLanguage] = useState('vi-VN');
  const [historyPlayingId, setHistoryPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);

  // ── Selected segment ──────────────────────────────────────────────────────
  const selected = segments.find(s => s.id === selectedId) || segments[0];

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalChars = useMemo(() => segments.reduce((acc, s) => acc + s.text.length, 0), [segments]);
  const totalPauseSeconds = useMemo(() => segments.reduce((acc, s) => acc + s.pauseBefore, 0), [segments]);
  const totalEstimatedDuration = useMemo(() => {
    const speechSeconds = segments.reduce((acc, s) => acc + estimateDuration(s.text, s.speed), 0);
    return speechSeconds + totalPauseSeconds;
  }, [segments, totalPauseSeconds]);
  const renderedCount = useMemo(() => segments.filter(s => s.audioUrl).length, [segments]);
  const filteredVoices = voices.filter(v => !globalLanguage || v.languageCode === globalLanguage);

  // ── Segment CRUD ──────────────────────────────────────────────────────────

  const addSegment = useCallback(() => {
    const newSeg: ScriptSegment = {
      id: generateId(),
      label: 'Nội dung',
      text: '',
      voiceId: globalVoiceId,
      speed: 1.0,
      pauseBefore: 1,
    };
    setSegments(prev => [...prev, newSeg]);
    setSelectedId(newSeg.id);
  }, [globalVoiceId]);

  const updateSegment = useCallback((id: string, patch: Partial<ScriptSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...patch, audioUrl: patch.text !== undefined ? undefined : s.audioUrl } : s));
  }, []);

  const deleteSegment = useCallback((id: string) => {
    setSegments(prev => {
      const next = prev.filter(s => s.id !== id);
      if (selectedId === id && next.length > 0) setSelectedId(next[0].id);
      return next;
    });
  }, [selectedId]);

  // ── Apply global voice to all segments ───────────────────────────────────
  const applyGlobalVoice = useCallback(() => {
    setSegments(prev => prev.map(s => ({ ...s, voiceId: globalVoiceId, audioUrl: undefined })));
  }, [globalVoiceId]);

  // ── Smart Import ──────────────────────────────────────────────────────────
  const handleSmartImport = useCallback(() => {
    if (!importText.trim()) return;

    // Split on --- dividers or double newlines
    const parts = importText.split(/\n---+\n|\n{3,}/).map(p => p.trim()).filter(Boolean);
    const labelCycle = ['Intro', 'Hook', 'Nội dung', 'Nội dung', 'Nội dung', 'CTA', 'Outro'];

    const newSegments: ScriptSegment[] = parts.map((text, i) => ({
      id: generateId(),
      label: labelCycle[Math.min(i, labelCycle.length - 1)],
      text,
      voiceId: globalVoiceId,
      speed: 1.0,
      pauseBefore: i === 0 ? 0 : 1.5,
    }));

    setSegments(newSegments);
    setSelectedId(newSegments[0]?.id || '');
    setSmartImportOpen(false);
    setImportText('');
  }, [importText, globalVoiceId]);

  // ── Generate single segment ───────────────────────────────────────────────
  const generateSegment = useCallback(async (id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg || !seg.text.trim()) return;
    if (!seg.voiceId) {
      updateSegment(id, { error: 'Vui lòng chọn giọng nói cho đoạn này.' });
      return;
    }

    updateSegment(id, { isGenerating: true, error: undefined, audioUrl: undefined });

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: seg.text,
          voiceId: seg.voiceId,
          speed: seg.speed,
          languageCode: globalLanguage,
          filePrefix: `seg_${seg.label.toLowerCase().replace(/\s/g, '_')}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi tạo giọng nói');

      updateSegment(id, {
        isGenerating: false,
        audioUrl: data.audioUrl,
        duration: data.duration,
        error: undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      updateSegment(id, { isGenerating: false, error: msg });
    }
  }, [segments, globalLanguage, updateSegment]);

  // ── Generate ALL segments sequentially ───────────────────────────────────
  const generateAll = useCallback(async () => {
    for (const seg of segments) {
      if (seg.text.trim() && seg.voiceId && !seg.audioUrl) {
        await generateSegment(seg.id);
      }
    }
  }, [segments, generateSegment]);

  // ── Export (merge all segments) ───────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const toMerge = segments.filter(s => s.audioUrl);
    if (toMerge.length === 0) {
      setExportError('Chưa có đoạn nào được render. Hãy tạo giọng cho ít nhất 1 đoạn.');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportUrl(null);

    try {
      const res = await fetch('/api/tts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: toMerge.map(s => ({
            audioUrl: s.audioUrl,
            pauseBefore: s.pauseBefore,
          })),
          filePrefix,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Lỗi ghép audio');

      setExportUrl(data.audioUrl);

      // Save to history
      addHistoryItem({
        id: generateId(),
        textPreview: `${segments.length} đoạn · ${toMerge.length} đã render · ~${formatDuration(totalEstimatedDuration)}`,
        fullText: segments.map(s => s.text).join('\n\n'),
        voiceId: segments[0]?.voiceId || '',
        voiceName: `${segments.length} giọng`,
        languageCode: globalLanguage,
        audioUrl: data.audioUrl,
        duration: data.duration || 0,
        charCount: totalChars,
        createdAt: new Date().toISOString(),
        type: 'bulk-tts',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi';
      setExportError(msg);
    } finally {
      setIsExporting(false);
    }
  }, [segments, filePrefix, totalEstimatedDuration, totalChars, globalLanguage, addHistoryItem]);

  // ── Audio playback ────────────────────────────────────────────────────────
  const handlePlay = useCallback((id: string, url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play().then(() => setPlayingId(id)).catch(() => setPlayingId(null));
  }, []);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, []);

  const handleHistoryPlay = useCallback((itemId: string, audioUrl: string) => {
    if (historyPlayingId === itemId) {
      historyAudioRef.current?.pause();
      setHistoryPlayingId(null);
      return;
    }
    if (historyAudioRef.current) historyAudioRef.current.pause();
    const audio = new Audio(audioUrl);
    historyAudioRef.current = audio;
    audio.onended = () => setHistoryPlayingId(null);
    audio.onerror = () => setHistoryPlayingId(null);
    audio.play().then(() => setHistoryPlayingId(itemId)).catch(() => setHistoryPlayingId(null));
  }, [historyPlayingId]);

  // ── Template insert ───────────────────────────────────────────────────────
  const loadTemplate = useCallback(() => {
    const templates: ScriptSegment[] = [
      { id: generateId(), label: 'Intro', text: 'Xin chào mọi người! Hôm nay mình sẽ chia sẻ về chủ đề [chủ đề].', voiceId: globalVoiceId, speed: 1.1, pauseBefore: 0 },
      { id: generateId(), label: 'Hook', text: 'Bạn có biết rằng [thông tin thú vị]? Đây chính là điều mình sẽ giải thích trong video hôm nay.', voiceId: globalVoiceId, speed: 1.0, pauseBefore: 1.5 },
      { id: generateId(), label: 'Nội dung', text: 'Đầu tiên, chúng ta hãy nói về [điểm 1]. Đây là phần quan trọng nhất mà bạn cần nắm rõ.', voiceId: globalVoiceId, speed: 1.0, pauseBefore: 2 },
      { id: generateId(), label: 'Nội dung', text: 'Tiếp theo, [điểm 2]. Nhiều người thường bỏ qua bước này nhưng nó thực sự rất quan trọng.', voiceId: globalVoiceId, speed: 1.0, pauseBefore: 2 },
      { id: generateId(), label: 'CTA', text: 'Nếu video này hữu ích, hãy nhấn Like và Subscribe để ủng hộ kênh nhé! Bình luận xuống dưới câu hỏi của bạn.', voiceId: globalVoiceId, speed: 1.05, pauseBefore: 2 },
      { id: generateId(), label: 'Outro', text: 'Cảm ơn bạn đã xem đến hết video. Hẹn gặp lại ở video tiếp theo!', voiceId: globalVoiceId, speed: 1.0, pauseBefore: 1.5 },
    ];
    setSegments(templates);
    setSelectedId(templates[0].id);
  }, [globalVoiceId]);

  const historyItems = history.filter(h => h.type === 'bulk-tts');

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="page-header">
        <h1>
          <Mic2 size={24} />
          YouTube Script Audio Studio
        </h1>
        <div className="page-header-actions">
          <a href="mailto:support@novax.ai?subject=Feedback NovaX" className="header-btn" style={{ textDecoration: 'none' }}>
            <ThumbsUp size={16} /><span>Góp ý</span>
          </a>
          <a href="mailto:support@novax.ai?subject=Cần hỗ trợ NovaX" className="header-btn" style={{ textDecoration: 'none' }}>
            <HelpCircle size={16} /><span>Cần hỗ trợ?</span>
          </a>
        </div>
      </div>

      {/* ── Top Toolbar ── */}
      <div className="studio-toolbar slide-up">
        <div className="studio-toolbar-left">
          <button className="btn btn-secondary btn-sm" onClick={() => setSmartImportOpen(true)}>
            <Scissors size={14} /> Smart Import
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadTemplate}>
            <Wand2 size={14} /> Dùng Template
          </button>
          <button className="btn btn-secondary btn-sm" onClick={addSegment}>
            <Plus size={14} /> Thêm đoạn
          </button>
        </div>

        <div className="studio-stats">
          <span><FileText size={12} /> {segments.length} đoạn</span>
          <span><Timer size={12} /> ~{formatDuration(totalEstimatedDuration)}</span>
          <span style={{ color: renderedCount === segments.length && segments.length > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
            <CheckCircle2 size={12} /> {renderedCount}/{segments.length} đã render
          </span>
        </div>

        <div className="studio-toolbar-right">
          <button
            className="btn btn-secondary btn-sm"
            onClick={generateAll}
            disabled={segments.some(s => s.isGenerating)}
          >
            <Sparkles size={14} />
            Tạo tất cả
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={isExporting || renderedCount === 0}
          >
            {isExporting ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={14} />}
            Xuất file audio
          </button>
        </div>
      </div>

      {/* ── Smart Import Modal ── */}
      {smartImportOpen && (
        <div className="modal-overlay" onClick={() => setSmartImportOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3><Scissors size={18} /> Smart Import Script</h3>
              <button className="btn-ghost" onClick={() => setSmartImportOpen(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Dán toàn bộ script của bạn vào đây. Dùng <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: 4 }}>---</code> hoặc 3 dòng trống để phân chia đoạn.
              </p>
              <textarea
                className="form-textarea"
                placeholder={`Đây là phần giới thiệu...\n\n---\n\nĐây là nội dung chính...\n\n---\n\nKết thúc và CTA...`}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                style={{ minHeight: 220 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setSmartImportOpen(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleSmartImport} disabled={!importText.trim()}>
                  <Scissors size={14} /> Phân tách thành đoạn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Studio Layout ── */}
      <div className="studio-layout slide-up">

        {/* ── Left: Segment List ── */}
        <div className="studio-segments">
          <div className="studio-segments-header">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Script
            </span>
            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={addSegment}>
              <Plus size={12} /> Thêm
            </button>
          </div>

          <div className="segment-list-scroll">
            {segments.map((seg, index) => (
              <SegmentCard
                key={seg.id}
                segment={seg}
                index={index}
                voices={voices}
                isSelected={selectedId === seg.id}
                isPlaying={playingId === seg.id}
                onSelect={() => setSelectedId(seg.id)}
                onUpdate={updateSegment}
                onDelete={deleteSegment}
                onGenerate={generateSegment}
                onPlay={handlePlay}
                onPause={handlePause}
                canDelete={segments.length > 1}
              />
            ))}

            <button className="add-segment-btn" onClick={addSegment}>
              <Plus size={16} /> Thêm đoạn mới
            </button>
          </div>
        </div>

        {/* ── Right: Editor + Settings ── */}
        <div className="studio-editor">

          {/* Tab switcher */}
          <div className="settings-tabs" style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
            <button className={`settings-tab ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>
              <Mic2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Chỉnh sửa đoạn
            </button>
            <button className={`settings-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <History size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Lịch sử
            </button>
          </div>

          {activeTab === 'edit' && selected ? (
            <div className="studio-editor-body">

              {/* Global Language Selector */}
              <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Ngôn ngữ chung
                  </span>
                </div>
                <select
                  className="form-select"
                  value={globalLanguage}
                  onChange={e => setGlobalLanguage(e.target.value)}
                  style={{ marginBottom: 8 }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.languageCode}>{c.flag} {c.languageName}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    className="form-select"
                    value={globalVoiceId}
                    onChange={e => setGlobalVoiceId(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Giọng mặc định cho đoạn mới</option>
                    {filteredVoices.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary btn-sm" onClick={applyGlobalVoice} title="Áp dụng giọng này cho tất cả đoạn">
                    Áp dụng tất cả
                  </button>
                </div>
              </div>

              {/* Selected Segment Editor */}
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: getLabelColor(selected.label), flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {selected.label} — Đoạn {segments.findIndex(s => s.id === selectedId) + 1}
                  </span>
                </div>

                {/* Text Editor */}
                <div className="form-group">
                  <label className="form-label">Nội dung đoạn</label>
                  <textarea
                    className="form-textarea"
                    value={selected.text}
                    onChange={e => updateSegment(selected.id, { text: e.target.value })}
                    placeholder="Nhập nội dung cho đoạn này..."
                    style={{ minHeight: 140 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                    {selected.text.length} ký tự · ~{formatDuration(estimateDuration(selected.text, selected.speed))}
                  </div>
                </div>

                {/* Voice Selector for this segment */}
                <div className="form-group">
                  <label className="form-label">Giọng nói cho đoạn này</label>
                  <select
                    className="form-select"
                    value={selected.voiceId}
                    onChange={e => updateSegment(selected.id, { voiceId: e.target.value })}
                  >
                    <option value="">-- Chọn giọng nói --</option>
                    {voices.filter(v => v.isCustom).length > 0 && (
                      <optgroup label="🎤 Giọng của tôi">
                        {voices.filter(v => v.isCustom).map(v => (
                          <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {COUNTRIES.map(country => {
                      const countryVoices = filteredVoices.filter(v => v.countryCode === country.code && !v.isCustom);
                      if (countryVoices.length === 0) return null;
                      return (
                        <optgroup key={country.code} label={`${country.flag} ${country.name}`}>
                          {countryVoices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="slider-container">
                  <div className="slider-header">
                    <span className="slider-label">Tốc độ đọc</span>
                    <span className="slider-value">{selected.speed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range" min="0.7" max="1.5" step="0.05"
                    value={selected.speed}
                    onChange={e => updateSegment(selected.id, { speed: parseFloat(e.target.value) })}
                  />
                  <div className="slider-labels"><span>Chậm</span><span>Nhanh</span></div>
                </div>

                {/* Pause Before */}
                <div className="form-group">
                  <label className="form-label">
                    <Timer size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Nghỉ trước đoạn này
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PAUSE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        className={`filter-pill ${selected.pauseBefore === opt.value ? 'active' : ''}`}
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => updateSegment(selected.id, { pauseBefore: opt.value })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Segment Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => generateSegment(selected.id)}
                    disabled={selected.isGenerating || !selected.text.trim() || !selected.voiceId}
                  >
                    {selected.isGenerating ? (
                      <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang tạo...</>
                    ) : (
                      <><Sparkles size={14} /> Tạo giọng đoạn này</>
                    )}
                  </button>

                  {selected.audioUrl && !selected.isGenerating && (
                    <button
                      className="btn btn-secondary"
                      style={{ gap: 6 }}
                      onClick={() => {
                        if (playingId === selected.id) handlePause();
                        else handlePlay(selected.id, selected.audioUrl!);
                      }}
                    >
                      {playingId === selected.id ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                  )}
                </div>

                {selected.error && (
                  <div className="error-message" style={{ marginTop: 8 }}>
                    <AlertCircle size={14} /> {selected.error}
                  </div>
                )}

                {selected.audioUrl && (
                  <div className="segment-rendered-badge">
                    <CheckCircle2 size={13} />
                    <span>Đoạn đã được render thành công</span>
                    <a href={selected.audioUrl} download style={{ marginLeft: 'auto', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Download size={12} /> Tải về
                    </a>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 24, paddingTop: 20 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Export toàn bộ
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tên file xuất</label>
                    <input
                      type="text"
                      className="form-input"
                      value={filePrefix}
                      onChange={e => setFilePrefix(e.target.value)}
                      placeholder="youtube_audio"
                    />
                  </div>

                  {exportError && (
                    <div className="error-message" style={{ marginBottom: 8 }}>
                      <AlertCircle size={14} /> {exportError}
                    </div>
                  )}

                  {exportUrl && (
                    <div className="segment-rendered-badge" style={{ marginBottom: 8 }}>
                      <CheckCircle2 size={13} />
                      <span>File đã được ghép!</span>
                      <a href={exportUrl} download={`${filePrefix}.wav`} style={{ marginLeft: 'auto', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download size={12} /> Tải về
                      </a>
                    </div>
                  )}

                  {exportUrl && (
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 12 }}>
                      <audio controls src={exportUrl} style={{ width: '100%' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      onClick={generateAll}
                      disabled={segments.some(s => s.isGenerating)}
                    >
                      <Sparkles size={14} /> Tạo tất cả đoạn
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={handleExport}
                      disabled={isExporting || renderedCount === 0}
                    >
                      {isExporting
                        ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang ghép...</>
                        : <><PackageOpen size={14} /> Ghép &amp; Xuất ({renderedCount}/{segments.length})</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            <div className="history-list" style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
              {historyItems.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <History size={40} />
                  <h3>Chưa có lịch sử</h3>
                  <p>Lịch sử export audio sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                historyItems.slice(0, 20).map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-icon"><Mic2 size={16} /></div>
                    <div className="history-content">
                      <div className="history-text">{item.textPreview}</div>
                      <div className="history-meta">
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>·</span>
                        <span>{item.charCount.toLocaleString()} ký tự</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        className="voice-play-btn" style={{ width: 28, height: 28 }}
                        onClick={() => handleHistoryPlay(item.id, item.audioUrl)}
                        title={historyPlayingId === item.id ? 'Dừng' : 'Nghe lại'}
                      >
                        {historyPlayingId === item.id ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: 1 }} />}
                      </button>
                      <a href={item.audioUrl} download className="voice-play-btn"
                        style={{ width: 28, height: 28, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Tải về"
                      >
                        <Download size={12} />
                      </a>
                      <button className="voice-play-btn" style={{ width: 28, height: 28, color: 'var(--accent-red)' }}
                        onClick={() => removeHistoryItem(item.id)} title="Xóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
}
