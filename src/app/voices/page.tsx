'use client';
// ============================================================================
// Voices Explorer Page — Browse, filter, and preview AI voices
// ============================================================================

import { useState, useMemo, useRef, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { COUNTRIES } from '@/constants/voices';
import { VoiceCategory } from '@/types/voice.types';
import {
  Grid3X3,
  Search,
  Filter,
  Play,
  Pause,
  Globe2,
  Mic2,
  User,
  Star,
  Loader2,
} from 'lucide-react';

const CATEGORY_FILTERS: { value: VoiceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'narration', label: 'Kể chuyện' },
  { value: 'news', label: 'Tin tức' },
  { value: 'commercial', label: 'Quảng cáo' },
  { value: 'game', label: 'Game/Anime' },
  { value: 'custom', label: 'Giọng của tôi' },
];

export default function VoicesPage() {
  const { voices } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VoiceCategory | 'all'>('all');
  const [activeLanguage, setActiveLanguage] = useState<string>('all');
  
  // Audio preview state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPreview = useCallback(async (voiceId: string, previewUrl?: string, voiceName?: string) => {
    // If clicking the same voice that is playing, pause it
    if (playingVoiceId === voiceId) {
      audioRef.current?.pause();
      setPlayingVoiceId(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingVoiceId(null);
    }

    // If there's a previewUrl, play it directly
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => setPlayingVoiceId(null);
      audio.play().then(() => setPlayingVoiceId(voiceId)).catch(() => setPlayingVoiceId(null));
      return;
    }

    // Otherwise, generate a real TTS preview via API
    setLoadingVoiceId(voiceId);
    try {
      const sampleText = 'Xin chào! Đây là giọng nói của tôi. Rất vui được gặp bạn hôm nay.';
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceId,
          speed: 1.0,
          languageCode: 'vi-VN',
          filePrefix: `preview_${voiceId}`,
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
        audio.play().then(() => setPlayingVoiceId(voiceId)).catch(() => setPlayingVoiceId(null));
      }
    } catch {
      // Silent fail — just don't play anything
    } finally {
      setLoadingVoiceId(null);
    }
  }, [playingVoiceId]);

  // Filter voices based on search, category, and language
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            voice.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || voice.category === activeCategory;
      const matchesLanguage = activeLanguage === 'all' || voice.languageCode === activeLanguage;
      
      return matchesSearch && matchesCategory && matchesLanguage;
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
            Tổng cộng: <strong style={{ color: 'var(--text-primary)' }}>{filteredVoices.length}</strong> giọng nói
          </div>
        </div>
      </div>

      <div className="slide-up">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tìm kiếm tên giọng nói..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ borderRadius: 'var(--radius-full)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <Filter size={16} style={{ color: 'var(--text-tertiary)', marginLeft: '12px' }} />
            <div className="filter-pills" style={{ gap: '4px' }}>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat.value}
                  className={`filter-pill ${activeCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.value)}
                  style={{ border: 'none', background: activeCategory === cat.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <select 
            className="form-select" 
            value={activeLanguage}
            onChange={(e) => setActiveLanguage(e.target.value)}
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

        {/* Voices Grid */}
        {filteredVoices.length === 0 ? (
          <div className="empty-state glass-card">
            <Mic2 size={48} />
            <h3>Không tìm thấy giọng nói</h3>
            <p>Không có giọng nói nào khớp với bộ lọc của bạn. Thử thay đổi từ khóa hoặc bộ lọc.</p>
            <button 
              className="btn btn-secondary mt-4" 
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setActiveLanguage('all');
              }}
              style={{ marginTop: '16px' }}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="voice-grid">
            {filteredVoices.map(voice => (
              <div key={voice.id} className="voice-card">
                <div 
                  className="voice-avatar" 
                  style={voice.avatarColors ? {
                    background: `linear-gradient(135deg, ${voice.avatarColors[0]}, ${voice.avatarColors[1]})`,
                    color: 'white'
                  } : {
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {voice.isCustom ? <User size={24} /> : (voice.gender === 'female' ? '👩' : '👨')}
                </div>
                
                <div className="voice-info">
                  <div className="voice-name">
                    {voice.name}
                    {voice.isPremium && <Star size={12} fill="var(--accent-orange)" color="var(--accent-orange)" style={{ marginLeft: 4, display: 'inline-block' }} />}
                    <span className="voice-category-badge">{
                      CATEGORY_FILTERS.find(c => c.value === voice.category)?.label || voice.category
                    }</span>
                  </div>
                  <div className="voice-desc" title={voice.description}>{voice.description}</div>
                  <div className="voice-country">
                    {COUNTRIES.find(c => c.code === voice.countryCode)?.flag} 
                    {COUNTRIES.find(c => c.code === voice.countryCode)?.languageName || voice.languageCode}
                    {voice.isCustom && <span style={{ marginLeft: '8px', color: 'var(--accent-violet-light)', fontSize: '10px', padding: '2px 6px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px' }}>Custom</span>}
                  </div>
                </div>

                <div className="voice-actions">
                  <button 
                    className="voice-play-btn"
                    onClick={() => handlePlayPreview(voice.id, voice.previewUrl, voice.name)}
                    aria-label={loadingVoiceId === voice.id ? 'Đang tạo preview...' : playingVoiceId === voice.id ? 'Dừng lại' : 'Nghe thử'}
                    disabled={loadingVoiceId === voice.id}
                    title={loadingVoiceId === voice.id ? 'Đang tạo preview...' : 'Nghe thử giọng nói này'}
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
