'use client';
// ============================================================================
// ContextAnalysisCard — AI Analysis Results Display
// Shows detected keywords, mood, confidence, and suggested themes
// ============================================================================

import { VideoAnalysis } from '@/types/video.types';
import { VIDEO_THEMES } from '@/constants/video-constants';
import {
  Brain,
  Tag,
  Smile,
  BarChart3,
  Globe,
  FileText,
  Clock,
} from 'lucide-react';

interface ContextAnalysisCardProps {
  analysis: VideoAnalysis;
  type: 'audio' | 'video';
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  energetic: '⚡',
  calm: '🧘',
  dramatic: '🎭',
  mysterious: '🔮',
  inspiring: '✨',
  funny: '😂',
  serious: '📰',
  romantic: '💕',
};

const MOOD_LABELS: Record<string, string> = {
  happy: 'Vui vẻ',
  sad: 'Buồn',
  energetic: 'Sôi động',
  calm: 'Bình tĩnh',
  dramatic: 'Kịch tính',
  mysterious: 'Bí ẩn',
  inspiring: 'Truyền cảm hứng',
  funny: 'Hài hước',
  serious: 'Nghiêm túc',
  romantic: 'Lãng mạn',
};

export default function ContextAnalysisCard({
  analysis,
  type,
}: ContextAnalysisCardProps) {
  const theme = VIDEO_THEMES.find(t => t.id === analysis.suggestedTheme);
  const confidencePercent = Math.round(analysis.moodConfidence * 100);

  return (
    <div className="analysis-card glass-card">
      <div className="analysis-header">
        <div className="analysis-header-icon">
          <Brain size={20} />
        </div>
        <div>
          <h3 className="analysis-title">
            Kết quả phân tích AI
          </h3>
          <p className="analysis-subtitle">
            {type === 'audio' ? 'Ngữ cảnh âm thanh' : 'Ngữ cảnh video'} đã được phân tích
          </p>
        </div>
      </div>

      <div className="analysis-body">
        {/* Summary */}
        <div className="analysis-section">
          <div className="analysis-section-icon">
            <FileText size={14} />
          </div>
          <div>
            <div className="analysis-section-label">Tóm tắt</div>
            <div className="analysis-section-value">{analysis.summary}</div>
          </div>
        </div>

        {/* Mood Detection */}
        <div className="analysis-section">
          <div className="analysis-section-icon">
            <Smile size={14} />
          </div>
          <div>
            <div className="analysis-section-label">Tâm trạng / Cảm xúc</div>
            <div className="analysis-mood">
              <span className="analysis-mood-emoji">
                {MOOD_EMOJIS[analysis.mood] || '🎭'}
              </span>
              <span className="analysis-mood-name">
                {MOOD_LABELS[analysis.mood] || analysis.mood}
              </span>
              <div className="analysis-confidence">
                <div className="analysis-confidence-bar">
                  <div
                    className="analysis-confidence-fill"
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
                <span className="analysis-confidence-text">{confidencePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <div className="analysis-section">
          <div className="analysis-section-icon">
            <Tag size={14} />
          </div>
          <div>
            <div className="analysis-section-label">Từ khóa phát hiện</div>
            <div className="analysis-keywords">
              {analysis.keywords.map((kw, i) => (
                <span key={i} className="analysis-keyword-tag">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested Theme */}
        {theme && (
          <div className="analysis-section">
            <div className="analysis-section-icon">
              <BarChart3 size={14} />
            </div>
            <div>
              <div className="analysis-section-label">Theme gợi ý</div>
              <div className="analysis-theme-suggest">
                <div
                  className="analysis-theme-preview"
                  style={{ background: theme.gradient }}
                />
                <div>
                  <span className="analysis-theme-name">
                    {theme.icon} {theme.name}
                  </span>
                  <span className="analysis-theme-desc">{theme.description}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Language */}
        {analysis.detectedLanguage && (
          <div className="analysis-section">
            <div className="analysis-section-icon">
              <Globe size={14} />
            </div>
            <div>
              <div className="analysis-section-label">Ngôn ngữ</div>
              <div className="analysis-section-value">
                {analysis.detectedLanguage === 'vi-VN' ? '🇻🇳 Tiếng Việt' : analysis.detectedLanguage}
              </div>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="analysis-section">
          <div className="analysis-section-icon">
            <Clock size={14} />
          </div>
          <div>
            <div className="analysis-section-label">Thời lượng nguồn</div>
            <div className="analysis-section-value">
              {Math.floor(analysis.sourceDuration / 60)}:{String(Math.floor(analysis.sourceDuration % 60)).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Transcript or Script */}
        {(analysis.transcript || analysis.generatedScript) && (
          <div className="analysis-section">
            <div className="analysis-section-icon">
              <FileText size={14} />
            </div>
            <div>
              <div className="analysis-section-label">
                {analysis.transcript ? 'Phiên dịch' : 'Script AI tạo'}
              </div>
              <div className="analysis-transcript">
                {analysis.transcript || analysis.generatedScript}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
