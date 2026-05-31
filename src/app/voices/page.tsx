'use client';
// ============================================================================
// Voices Explorer Page — Browse, filter, and preview all Gemini TTS voices
// ============================================================================

import { useState, useMemo, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { VoiceCategory, Voice } from '@/types/voice.types';
import {
  Grid3X3,
  Search,
  Filter,
  Play,
  Pause,
  Mic2,
  User,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const CATEGORY_FILTERS: { value: VoiceCategory | 'all'; label: string }[] = [
  { value: 'all',           label: 'Tất cả' },
  { value: 'conversational',label: 'Hội thoại' },
  { value: 'narration',     label: 'Kể chuyện' },
  { value: 'news',          label: 'Tin tức' },
  { value: 'commercial',    label: 'Quảng cáo' },
  { value: 'game',          label: 'Game/Anime' },
  { value: 'general',       label: 'Chung' },
  { value: 'custom',        label: 'Giọng của tôi' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Build a short preview sentence in the voice's own language.
// Uses voice.previewText when available; falls back to a generic phrase.
// ─────────────────────────────────────────────────────────────────────────────
function buildPreviewText(voice: Voice): string {
  if (voice.previewText) return voice.previewText;
  const lang = voice.languageCode ?? 'en-US';
  if (lang.startsWith('vi')) return `Xin chào! Tôi là ${voice.name}. ${voice.description}`;
  if (lang.startsWith('es')) return `¡Hola! Soy ${voice.name}. ${voice.description}`;
  if (lang.startsWith('ru')) return `Привет! Я ${voice.name}. ${voice.description}`;
  if (lang.startsWith('ja')) return `こんにちは！私は${voice.name}です。${voice.description}`;
  if (lang.startsWith('ko')) return `안녕하세요! 저는 ${voice.name}입니다. ${voice.description}`;
  if (lang.startsWith('fr')) return `Bonjour ! Je suis ${voice.name}. ${voice.description}`;
  return `Hi! I'm ${voice.name}. ${voice.description}`;
}

export default function VoicesPage() {
  const { voices } = useApp();

  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState<VoiceCategory | 'all'>('all');
  const [activeLanguage, setActiveLanguage] = useState<string>('all');

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const [errorMsg,       setErrorMsg]       = useState<string | null>(null);

  // Cache: voiceId → public audio URL
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── play a resolved URL ──────────────────────────────────────────────────
  function playUrl(voiceId: string, url: string) {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => setPlayingVoiceId(null);
    audio.play()
      .then(() => setPlayingVoiceId(voiceId))
      .catch(() => setPlayingVoiceId(null));
  }

  // ── main preview handler ─────────────────────────────────────────────────
  async function handlePlayPreview(voice: Voice) {
    setErrorMsg(null);

    // Stop / toggle if same voice
    if (playingVoiceId === voice.id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    audioRef.current?.pause();

    // Use static previewUrl if provided
    if (voice.previewUrl) {
      setPreviewCache(p => ({ ...p, [voice.id]: voice.previewUrl! }));
      playUrl(voice.id, voice.previewUrl);
      return;
    }

    // Use cached generated preview
    if (previewCache[voice.id]) {
      playUrl(voice.id, previewCache[voice.id]);
      return;
    }

    // Custom Fish Audio voices — preview not supported without credits
    if (voice.isCustom && voice.id.length > 20) {
      setErrorMsg(
        `Giọng nhân bản "${voice.name}" cần Fish Audio credits để preview. ` +
        'Nạp credits tại fish.audio hoặc dùng chức năng "VB → Giọng nói" với giọng này.'
      );
      return;
    }

    // Generate preview via local Fish Speech
    try {
      setLoadingVoiceId(voice.id);
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:               buildPreviewText(voice),
          voiceId:            voice.id,
          speed:              1.0,
          temperature:        0.7,
          topP:               0.7,
          repetitionPenalty:  1.2,
          languageCode:       voice.languageCode,
          filePrefix:         'preview',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success || !data?.audioUrl) {
        const msg = data?.error ?? `HTTP ${res.status}`;
        setErrorMsg(`Không thể tạo preview cho ${voice.name}: ${msg}`);
        return;
      }

      setPreviewCache(p => ({ ...p, [voice.id]: data.audioUrl as string }));
      playUrl(voice.id, data.audioUrl as string);
    } catch (e) {
      setErrorMsg(`Lỗi kết nối khi tạo preview: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingVoiceId(null);
    }
  }

  // ── filtering ─────────────────────────────────────────────────────────────
  const filteredVoices = useMemo(() => {
    return voices.filter(v => {
      const q = searchQuery.toLowerCase();
      const matchSearch   = v.name.toLowerCase().includes(q) || v.label.toLowerCase().includes(q);
      const matchCategory = activeCategory === 'all' || v.category === activeCategory;
      const matchLang     = activeLanguage === 'all' || v.languageCode === activeLanguage || v.engine === 'kokoro';
      return matchSearch && matchCategory && matchLang;
    });
  }, [voices, searchQuery, activeCategory, activeLanguage]);

  return (
    <MainLayout>
      <div className="page-header">
        <h1>
          <Grid3X3 size={24} />
          Khám phá giọng nói
        </h1>
        <div className="page-header-actions">
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Tổng cộng:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{filteredVoices.length}</strong>{' '}
            giọng nói
          </div>
        </div>
      </div>

      <div className="slide-up">

        {/* Error toast */}
        {errorMsg && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#fca5a5', fontSize: '0.875rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm kiếm tên giọng nói..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ borderRadius: 'var(--radius-full)' }}
            />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', padding: 4,
            borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)',
          }}>
            <Filter size={16} style={{ color: 'var(--text-tertiary)', marginLeft: 12 }} />
            <div className="filter-pills" style={{ gap: 4 }}>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.value}
                  className={`filter-pill ${activeCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.value)}
                  style={{
                    border: 'none',
                    background: activeCategory === cat.value ? 'rgba(139,92,246,0.15)' : 'transparent',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <select
            className="form-select"
            value={activeLanguage}
            onChange={e => setActiveLanguage(e.target.value)}
            style={{ width: 'auto', borderRadius: 'var(--radius-full)' }}
          >
            <option value="all">🌐 Tất cả ngôn ngữ</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.languageCode}>
                {c.flag} {c.languageName}
              </option>
            ))}
          </select>
        </div>

        {/* Voices grid */}
        {filteredVoices.length === 0 ? (
          <div className="empty-state glass-card">
            <Mic2 size={48} />
            <h3>Không tìm thấy giọng nói</h3>
            <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
            <button
              className="btn btn-secondary mt-4"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveLanguage('all'); }}
              style={{ marginTop: 16 }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="voice-grid">
            {filteredVoices.map(voice => {
              const isPlaying  = playingVoiceId === voice.id;
              const isLoading  = loadingVoiceId === voice.id;

              return (
                <div key={voice.id} className="voice-card">
                  <div
                    className="voice-avatar"
                    style={voice.avatarColors ? {
                      background: `linear-gradient(135deg, ${voice.avatarColors[0]}, ${voice.avatarColors[1]})`,
                      color: 'white',
                    } : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    {voice.isCustom ? <User size={24} /> : (voice.gender === 'female' ? '👩' : '👨')}
                  </div>

                  <div className="voice-info">
                    <div className="voice-name">
                      {voice.name}
                      {voice.isPremium && (
                        <Star size={12} fill="var(--accent-orange)" color="var(--accent-orange)"
                          style={{ marginLeft: 4, display: 'inline-block' }} />
                      )}
                      <span className="voice-category-badge">
                        {CATEGORY_FILTERS.find(c => c.value === voice.category)?.label ?? voice.category}
                      </span>
                    </div>
                    <div className="voice-desc" title={voice.description}>{voice.description}</div>
                    <div className="voice-country">
                      {COUNTRIES.find(c => c.code === voice.countryCode)?.flag}{' '}
                      {COUNTRIES.find(c => c.code === voice.countryCode)?.languageName ?? voice.languageCode}
                      {voice.isCustom && (
                        <span style={{
                          marginLeft: 8, color: 'var(--accent-violet-light)', fontSize: 10,
                          padding: '2px 6px', background: 'rgba(139,92,246,0.1)', borderRadius: 4,
                        }}>Custom</span>
                      )}
                    </div>
                  </div>

                  <div className="voice-actions">
                    <button
                      className="voice-play-btn"
                      onClick={() => handlePlayPreview(voice)}
                      disabled={isLoading}
                      title={isLoading ? 'Đang tạo preview...' : isPlaying ? 'Dừng' : 'Nghe thử'}
                      aria-label={isLoading ? 'Đang tạo preview' : 'Nghe thử'}
                    >
                      {isLoading ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : isPlaying ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} style={{ marginLeft: 2 }} />
                      )}
                    </button>
                    {isLoading && (
                      <div style={{
                        position: 'absolute', bottom: -18, left: '50%', transform: 'translateX(-50%)',
                        fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap',
                      }}>
                        Đang tạo...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .voice-actions { position: relative; }
      `}</style>
    </MainLayout>
  );
}
