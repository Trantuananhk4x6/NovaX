'use client';
// ============================================================================
// Voices Explorer Page
// - Play button: generate+cache preview audio, serve from cache on repeat
// - Double-click voice card → navigate to /text-to-speech with voice pre-selected
// ============================================================================

import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { Voice, VoiceCategory } from '@/types/voice.types';
import {
  Grid3X3, Search, Filter, Play, Pause, Mic2, User, Star, Loader2, Settings,
} from 'lucide-react';
import Link from 'next/link';

const CATEGORY_FILTERS: { value: VoiceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'narration', label: 'Kể chuyện' },
  { value: 'news', label: 'Tin tức' },
  { value: 'commercial', label: 'Quảng cáo' },
  { value: 'game', label: 'Game/Anime' },
  { value: 'custom', label: 'Giọng của tôi' },
];

export default function VoicesPage() {
  const router = useRouter();
  const { voices, voicesLoading, voicesError, ttsProvider } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VoiceCategory | 'all'>('all');
  const [activeLanguage, setActiveLanguage] = useState<string>('all');

  // Audio preview state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Double-click detection
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const handleVoiceClick = useCallback((voice: Voice) => {
    const now = Date.now();
    const last = lastClickRef.current;
    if (last.id === voice.id && now - last.time < 400) {
      // Double-click → navigate to TTS page with this voice pre-selected
      router.push(`/text-to-speech?voiceId=${encodeURIComponent(voice.id)}&lang=${encodeURIComponent(voice.languageCode)}`);
      return;
    }
    lastClickRef.current = { id: voice.id, time: now };
  }, [router]);

  const handlePlayPreview = useCallback(async (
    e: React.MouseEvent,
    voice: Voice,
  ) => {
    e.stopPropagation(); // don't trigger voice card click

    if (playingVoiceId === voice.id) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }
    // Prevent spam: one request at a time
    if (loadingVoiceId) return;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setPlayingVoiceId(null);
    }

    const playAudio = (url: string) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      audio.play()
        .then(() => setPlayingVoiceId(voice.id))
        .catch(() => setPlayingVoiceId(null));
    };

    // ElevenLabs voices have a hosted preview_url — play directly (no API cost)
    if (voice.previewUrl && voice.provider === 'elevenlabs') {
      playAudio(voice.previewUrl);
      return;
    }

    // Generate or fetch cached preview
    setLoadingVoiceId(voice.id);
    try {
      const res = await fetch('/api/voices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: voice.id,
          provider: voice.provider || ttsProvider,
          languageCode: voice.languageCode || 'vi-VN',
        }),
      });
      const data = await res.json();
      if (data.success && data.audioUrl) playAudio(data.audioUrl);
    } catch {
      // Silent fail
    } finally {
      setLoadingVoiceId(null);
    }
  }, [playingVoiceId, loadingVoiceId, ttsProvider]);

  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        voice.name.toLowerCase().includes(q) ||
        voice.label.toLowerCase().includes(q) ||
        voice.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'all' || voice.category === activeCategory;
      const matchesLanguage = activeLanguage === 'all' || voice.languageCode === activeLanguage;
      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }, [voices, searchQuery, activeCategory, activeLanguage]);

  const availableLanguages = useMemo(() => {
    const codes = new Set(voices.map(v => v.languageCode));
    return COUNTRIES.filter(c => codes.has(c.languageCode));
  }, [voices]);

  const providerLabel = ttsProvider === 'elevenlabs' ? 'ElevenLabs' : 'Google Gemini TTS';
  const providerColor = ttsProvider === 'elevenlabs' ? '#f97316' : '#4285F4';

  return (
    <MainLayout>
      <div className="page-header">
        <h1><Grid3X3 size={24} /> Khám phá giọng nói</h1>
        <div className="page-header-actions">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: `${providerColor}15`, border: `1px solid ${providerColor}30`,
            fontSize: '0.8rem', fontWeight: 600, color: providerColor,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: providerColor }} />
            {providerLabel}
          </div>
          <Link href="/settings" className="header-btn" style={{ textDecoration: 'none' }}>
            <Settings size={16} /> <span>Đổi provider</span>
          </Link>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Tổng: <strong style={{ color: 'var(--text-primary)' }}>{filteredVoices.length}</strong> giọng
          </div>
        </div>
      </div>

      <div className="slide-up">
        {voicesLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Đang tải giọng nói từ {providerLabel}...
          </div>
        )}

        {voicesError && !voicesLoading && (
          <div className="error-message" style={{ marginBottom: 16 }}>
            Không thể tải danh sách giọng nói: {voicesError}
            <Link href="/settings" style={{ marginLeft: 12, color: 'var(--accent-violet-light)' }}>Kiểm tra cài đặt API</Link>
          </div>
        )}

        {!voicesLoading && (
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search />
              <input
                type="text" className="form-input"
                placeholder="Tìm kiếm tên giọng nói..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ borderRadius: 'var(--radius-full)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
              <Filter size={16} style={{ color: 'var(--text-tertiary)', marginLeft: '12px' }} />
              <div className="filter-pills" style={{ gap: '4px' }}>
                {CATEGORY_FILTERS.map(cat => (
                  <button key={cat.value}
                    className={`filter-pill ${activeCategory === cat.value ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.value)}
                    style={{ border: 'none', background: activeCategory === cat.value ? 'rgba(139,92,246,0.15)' : 'transparent' }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <select className="form-select" value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} style={{ width: 'auto', borderRadius: 'var(--radius-full)' }}>
              <option value="all">🌐 Tất cả ngôn ngữ</option>
              {availableLanguages.map(c => (
                <option key={c.code} value={c.languageCode}>{c.flag} {c.languageName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Hint for double-click */}
        {!voicesLoading && filteredVoices.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            💡 Bấm đúp vào thẻ giọng nói để mở ngay trong Text-to-Speech
          </p>
        )}

        {!voicesLoading && filteredVoices.length === 0 && !voicesError ? (
          <div className="empty-state glass-card">
            <Mic2 size={48} />
            <h3>Không tìm thấy giọng nói</h3>
            <p>Thử thay đổi từ khoá hoặc <Link href="/settings" style={{ color: 'var(--accent-violet-light)' }}>đổi provider</Link>.</p>
            <button className="btn btn-secondary mt-4"
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); setActiveLanguage('all'); }}
              style={{ marginTop: '16px' }}>
              Xóa bộ lọc
            </button>
          </div>
        ) : !voicesLoading && (
          <div className="voice-grid">
            {filteredVoices.map(voice => (
              <div
                key={voice.id}
                className="voice-card"
                onClick={() => handleVoiceClick(voice)}
                style={{ cursor: 'pointer' }}
                title="Bấm đúp để dùng trong Text-to-Speech"
              >
                <div className="voice-avatar" style={voice.avatarColors ? {
                  background: `linear-gradient(135deg, ${voice.avatarColors[0]}, ${voice.avatarColors[1]})`,
                  color: 'white',
                } : { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {voice.isCustom ? <User size={24} /> : (voice.gender === 'female' ? '👩' : '👨')}
                </div>

                <div className="voice-info">
                  <div className="voice-name">
                    {voice.name}
                    {voice.isPremium && <Star size={12} fill="var(--accent-orange)" color="var(--accent-orange)" style={{ marginLeft: 4, display: 'inline-block' }} />}
                    <span className="voice-category-badge">
                      {CATEGORY_FILTERS.find(c => c.value === voice.category)?.label || voice.category}
                    </span>
                  </div>
                  <div className="voice-desc" title={voice.description}>{voice.description}</div>
                  <div className="voice-country">
                    {COUNTRIES.find(c => c.code === voice.countryCode)?.flag}{' '}
                    {COUNTRIES.find(c => c.code === voice.countryCode)?.languageName || voice.languageCode}
                    {voice.isCustom && <span style={{ marginLeft: 8, color: 'var(--accent-violet-light)', fontSize: 10, padding: '2px 6px', background: 'rgba(139,92,246,0.1)', borderRadius: 4 }}>Custom</span>}
                  </div>
                </div>

                <div className="voice-actions">
                  <button
                    className="voice-play-btn"
                    onClick={e => handlePlayPreview(e, voice)}
                    aria-label={loadingVoiceId === voice.id ? 'Đang tạo...' : playingVoiceId === voice.id ? 'Dừng' : 'Nghe thử'}
                    disabled={loadingVoiceId !== null && loadingVoiceId !== voice.id}
                    title="Nghe thử"
                  >
                    {loadingVoiceId === voice.id
                      ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                      : playingVoiceId === voice.id
                        ? <Pause size={16} />
                        : <Play size={16} style={{ marginLeft: 2 }} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
