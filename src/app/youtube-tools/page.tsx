'use client';
// ============================================================================
// YouTube Tools — MMO YouTube Tools Dashboard
// Thumbnail AI, SEO Generator, Batch Creator, Content Calendar
// ============================================================================

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  generateThumbnailConcepts,
  generateSEOSuggestions,
  generateVideoId,
} from '@/lib/video-engine';
import { THUMBNAIL_STYLES, CONTENT_CATEGORIES } from '@/constants/video-constants';
import { ThumbnailConcept, SEOSuggestion, BatchVideoItem, ContentCalendarItem } from '@/types/video.types';
import {
  TvMinimalPlay,
  Image,
  Search,
  Layers,
  Calendar,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Star,
  Clock,
  FileVideo,
  Plus,
  Loader2,
  ThumbsUp,
  HelpCircle,
  Wand2,
  Tag,
  BarChart3,
  TrendingUp,
  Zap,
} from 'lucide-react';

type ActiveTool = 'thumbnail' | 'seo' | 'batch' | 'calendar';

export default function YouTubeToolsPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('thumbnail');

  // ── Thumbnail State ────────────────────────────────────
  const [thumbTitle, setThumbTitle] = useState('');
  const [thumbConcepts, setThumbConcepts] = useState<ThumbnailConcept[]>([]);
  const [thumbLoading, setThumbLoading] = useState(false);

  const handleGenerateThumbnails = () => {
    if (!thumbTitle.trim()) return;
    setThumbLoading(true);
    setTimeout(() => {
      setThumbConcepts(generateThumbnailConcepts(thumbTitle));
      setThumbLoading(false);
    }, 1500);
  };

  // ── SEO State ──────────────────────────────────────────
  const [seoTopic, setSeoTopic] = useState('');
  const [seoResults, setSeoResults] = useState<SEOSuggestion[]>([]);
  const [seoLoading, setSeoLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerateSEO = () => {
    if (!seoTopic.trim()) return;
    setSeoLoading(true);
    setTimeout(() => {
      setSeoResults(generateSEOSuggestions(seoTopic));
      setSeoLoading(false);
    }, 2000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Batch State ────────────────────────────────────────
  const [batchItems, setBatchItems] = useState<BatchVideoItem[]>([
    { id: generateVideoId(), audioFileName: 'intro_video_01.mp3', status: 'complete', progress: 100, outputUrl: '#' },
    { id: generateVideoId(), audioFileName: 'tutorial_part2.mp3', status: 'processing', progress: 65 },
    { id: generateVideoId(), audioFileName: 'review_product.wav', status: 'queued', progress: 0 },
  ]);

  // ── Calendar State ────────────────────────────────────
  const [calendarItems] = useState<ContentCalendarItem[]>([
    { id: '1', videoTitle: 'Hướng dẫn kiếm tiền MMO 2026', scheduledDate: '2026-05-28', status: 'scheduled', platform: 'youtube' },
    { id: '2', videoTitle: 'Review sản phẩm hot nhất tháng', scheduledDate: '2026-05-30', status: 'draft', platform: 'both' },
    { id: '3', videoTitle: 'Top 10 mẹo hay cho content creator', scheduledDate: '2026-06-01', status: 'scheduled', platform: 'youtube' },
    { id: '4', videoTitle: 'Vlog cuộc sống hàng ngày #15', scheduledDate: '2026-06-03', status: 'draft', platform: 'tiktok' },
    { id: '5', videoTitle: 'Tutorial: Chỉnh sửa video chuyên nghiệp', scheduledDate: '2026-05-25', status: 'published', platform: 'youtube' },
  ]);

  const tools = [
    { id: 'thumbnail' as const, label: 'AI Thumbnail', icon: Image, color: '#ef4444' },
    { id: 'seo' as const, label: 'SEO Generator', icon: Search, color: '#3b82f6' },
    { id: 'batch' as const, label: 'Batch Video', icon: Layers, color: '#8b5cf6' },
    { id: 'calendar' as const, label: 'Lịch đăng bài', icon: Calendar, color: '#10b981' },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <h1><TvMinimalPlay size={24} /> Công cụ YouTube MMO</h1>
        <div className="page-header-actions">
          <button className="header-btn"><ThumbsUp size={16} /><span>Feedback</span></button>
          <button className="header-btn"><HelpCircle size={16} /><span>Trợ giúp</span></button>
        </div>
      </div>

      {/* Tool Selector */}
      <div className="yt-tools-grid slide-up">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`yt-tool-card ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
          >
            <div className="yt-tool-icon" style={{ background: `${tool.color}22`, color: tool.color }}>
              <tool.icon size={22} />
            </div>
            <span className="yt-tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* ══ THUMBNAIL GENERATOR ══ */}
      {activeTool === 'thumbnail' && (
        <div className="slide-up" style={{ marginTop: 24 }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={20} /> AI Thumbnail Generator
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 20 }}>
              Nhập tiêu đề video để AI tạo ý tưởng thumbnail
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                className="form-input"
                value={thumbTitle}
                onChange={(e) => setThumbTitle(e.target.value)}
                placeholder="VD: Top 10 cách kiếm tiền online 2026"
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateThumbnails(); }}
              />
              <button
                className="btn btn-primary"
                onClick={handleGenerateThumbnails}
                disabled={thumbLoading || !thumbTitle.trim()}
              >
                {thumbLoading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Sparkles size={16} />}
                <span>Tạo</span>
              </button>
            </div>

            {/* Thumbnail Style Tags */}
            <div style={{ marginTop: 16 }}>
              <div className="template-tags">
                {THUMBNAIL_STYLES.map(style => (
                  <button key={style.id} className="template-tag" onClick={() => setThumbTitle(prev => prev || style.description)}>
                    <span>{style.icon}</span>
                    <span>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {thumbConcepts.length > 0 && (
            <div className="thumb-grid" style={{ marginTop: 20 }}>
              {thumbConcepts.map(concept => (
                <div key={concept.id} className="thumb-card glass-card">
                  <div className="thumb-preview" style={{ background: concept.gradient }}>
                    <span className="thumb-text" style={{ fontSize: concept.fontSize === 'large' ? '1.25rem' : '1rem' }}>
                      {concept.textOverlay}
                    </span>
                  </div>
                  <div className="thumb-info">
                    <span className="thumb-title">{concept.title}</span>
                    <span className="thumb-style">{concept.style}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ SEO GENERATOR ══ */}
      {activeTool === 'seo' && (
        <div className="slide-up" style={{ marginTop: 24 }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} /> SEO Title & Description Generator
            </h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 20 }}>
              Nhập chủ đề để AI tạo title, description và tags tối ưu SEO
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                className="form-input"
                value={seoTopic}
                onChange={(e) => setSeoTopic(e.target.value)}
                placeholder="VD: kiếm tiền online, review điện thoại..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateSEO(); }}
              />
              <button
                className="btn btn-primary"
                onClick={handleGenerateSEO}
                disabled={seoLoading || !seoTopic.trim()}
              >
                {seoLoading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
                <span>Phân tích</span>
              </button>
            </div>

            {/* Category Tags */}
            <div style={{ marginTop: 16 }}>
              <div className="template-tags">
                {CONTENT_CATEGORIES.map(cat => (
                  <button key={cat.id} className="template-tag" onClick={() => setSeoTopic(cat.name)}>
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SEO Results */}
          {seoResults.length > 0 && (
            <div className="seo-results" style={{ marginTop: 20 }}>
              {seoResults.map(result => (
                <div key={result.id} className="glass-card seo-card">
                  <div className="seo-card-header">
                    <div className="seo-score">
                      <BarChart3 size={14} />
                      <span>SEO Score: {result.score}/100</span>
                    </div>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCopy(`${result.title}\n\n${result.description}\n\nTags: ${result.tags.join(', ')}`, result.id)}
                    >
                      {copiedId === result.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === result.id ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  <h4 className="seo-title">{result.title}</h4>

                  <p className="seo-description">{result.description}</p>

                  <div className="seo-tags">
                    {result.tags.map((tag, i) => (
                      <span key={i} className="seo-tag">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ BATCH VIDEO ══ */}
      {activeTool === 'batch' && (
        <div className="slide-up" style={{ marginTop: 24 }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={20} /> Batch Video Creator
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  Tạo nhiều video từ danh sách audio cùng lúc
                </p>
              </div>
              <button className="btn btn-primary">
                <Plus size={16} /> Thêm Audio
              </button>
            </div>

            {/* Batch Queue */}
            <div className="batch-list">
              {batchItems.map(item => (
                <div key={item.id} className="batch-item">
                  <div className="batch-item-icon">
                    <FileVideo size={18} />
                  </div>
                  <div className="batch-item-info">
                    <div className="batch-item-name">{item.audioFileName}</div>
                    <div className="batch-item-status">
                      {item.status === 'complete' && <span className="batch-status complete"><Check size={12} /> Hoàn tất</span>}
                      {item.status === 'processing' && <span className="batch-status processing"><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang xử lý</span>}
                      {item.status === 'queued' && <span className="batch-status queued"><Clock size={12} /> Đang chờ</span>}
                    </div>
                  </div>
                  {item.status === 'processing' && (
                    <div className="batch-progress">
                      <div className="batch-progress-bar">
                        <div className="batch-progress-fill" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="batch-progress-text">{item.progress}%</span>
                    </div>
                  )}
                  {item.status === 'complete' && (
                    <button className="btn btn-sm btn-secondary">
                      <ArrowRight size={14} /> Xem
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CONTENT CALENDAR ══ */}
      {activeTool === 'calendar' && (
        <div className="slide-up" style={{ marginTop: 24 }}>
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={20} /> Lịch đăng bài
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  Quản lý lịch trình đăng video
                </p>
              </div>
              <button className="btn btn-primary">
                <Plus size={16} /> Thêm lịch
              </button>
            </div>

            {/* Calendar List */}
            <div className="calendar-list">
              {calendarItems.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)).map(item => (
                <div key={item.id} className="calendar-item">
                  <div className={`calendar-status-dot ${item.status}`} />
                  <div className="calendar-item-info">
                    <div className="calendar-item-title">{item.videoTitle}</div>
                    <div className="calendar-item-meta">
                      <Clock size={12} />
                      <span>{new Date(item.scheduledDate).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <span>·</span>
                      <span>{item.platform === 'youtube' ? '📺 YouTube' : item.platform === 'tiktok' ? '📱 TikTok' : '📺📱 Cả hai'}</span>
                    </div>
                  </div>
                  <div className={`calendar-badge ${item.status}`}>
                    {item.status === 'published' ? '✅ Đã đăng' : item.status === 'scheduled' ? '📅 Đã lên lịch' : '📝 Nháp'}
                  </div>
                </div>
              ))}
            </div>

            {/* Best Time to Post */}
            <div className="glass-card" style={{ marginTop: 16, background: 'rgba(139,92,246,0.05)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={14} color="var(--accent-violet-light)" /> Thời gian đăng tốt nhất
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>📺 YouTube: <strong>18:00 - 21:00</strong> (T2 - T6)</span>
                <span>📱 TikTok: <strong>19:00 - 22:00</strong> (T5 - CN)</span>
                <span>📊 Khung giờ vàng: <strong>20:00</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
