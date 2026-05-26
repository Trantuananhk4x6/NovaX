'use client';
// ============================================================================
// Dashboard Page — Welcome screen with quick TTS input & action cards
// ============================================================================

import { useState, useRef } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  BookOpen,
  Megaphone,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const [quickText, setQuickText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = isLoaded ? (clerkUser?.fullName || clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'bạn') : '...';

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="page-header">
        <div />
        <div className="page-header-actions">
          <button className="header-btn">
            <ThumbsUp size={16} />
            <span>Góp ý</span>
          </button>
          <button className="header-btn">
            <HelpCircle size={16} />
            <span>Cần hỗ trợ?</span>
          </button>
          <div className="user-avatar-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section slide-up">
        <p className="welcome-greeting">Rất vui được gặp bạn</p>
        <h1 className="welcome-name">{displayName}</h1>
      </div>

      {/* Quick TTS Input */}
      <div className="glass-card slide-up" style={{ marginBottom: '32px' }}>
        <textarea
          ref={textareaRef}
          className="form-textarea"
          placeholder="Bắt đầu nhập hoặc dán văn bản của bạn vào đây..."
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          style={{ minHeight: '150px', border: '1px solid var(--border-active)' }}
        />

        <div className="char-counter">
          <div className="counter-left">
            <MessageSquare size={16} />
            <span>Bắt đầu nhập để ước tính</span>
          </div>
          <div className="counter-right">
            {quickText.length.toLocaleString()} / 5,000 ký tự
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Link href="/text-to-speech" className="btn btn-primary btn-lg">
            Tạo giọng nói
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }} className="slide-up">
        Hành động nhanh
      </h2>

      <div className="quick-actions slide-up">
        <Link href="/text-to-speech" className="quick-action-card">
          <div
            className="quick-action-gradient"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
            }}
          />
          <div className="quick-action-info">
            <h3>Kể một câu chuyện</h3>
            <p>Làm cho nhân vật sống động với lời dẫn truyền cảm</p>
            <div className="quick-action-link">
              <span>Thử ngay</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link href="/text-to-speech" className="quick-action-card">
          <div
            className="quick-action-gradient"
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
            }}
          />
          <div className="quick-action-info">
            <h3>Ghi âm quảng cáo</h3>
            <p>Tạo quảng cáo chuyên nghiệp với giọng nói AI chân thực</p>
            <div className="quick-action-link">
              <span>Thử ngay</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link href="/voice-cloning" className="quick-action-card">
          <div
            className="quick-action-gradient"
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '12px',
            }}
          />
          <div className="quick-action-info">
            <h3>Nhân bản giọng nói</h3>
            <p>Tạo bản sao giọng nói của riêng bạn với AI</p>
            <div className="quick-action-link">
              <span>Thử ngay</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>

        <Link href="/voices" className="quick-action-card">
          <div
            className="quick-action-gradient"
            style={{
              background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
              borderRadius: '12px',
            }}
          />
          <div className="quick-action-info">
            <h3>Khám phá giọng nói</h3>
            <p>30+ giọng nói AI đa ngôn ngữ sẵn sàng sử dụng</p>
            <div className="quick-action-link">
              <span>Xem thêm</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>
    </MainLayout>
  );
}
