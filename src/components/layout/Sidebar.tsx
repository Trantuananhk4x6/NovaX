'use client';
// ============================================================================
// Sidebar — Main Navigation Sidebar
// Glassmorphic sidebar with nav items, quota card, and user info
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Home,
  Grid3X3,
  AudioWaveform,
  FileText,
  Mic2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  CreditCard,
  Film,
  MonitorPlay,
  TvMinimalPlay,
} from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

const NAV_ITEMS = [
  { href: '/', label: 'Bảng điều khiển', icon: Home },
  { href: '/voices', label: 'Khám phá giọng nói', icon: Grid3X3 },
  { href: '/text-to-speech', label: 'VB -> Giọng nói', icon: AudioWaveform },
  { href: '/bulk-text-to-speech', label: 'Văn bản dài', icon: FileText },
  { href: '/voice-cloning', label: 'Sao chép giọng (Clone)', icon: Mic2 },
];

const VIDEO_ITEMS = [
  { href: '/audio-to-video', label: 'Âm thanh → Video', icon: Film },
  { href: '/video-to-audio', label: 'Video → Giọng nói', icon: MonitorPlay },
];

const YOUTUBE_ITEMS = [
  { href: '/youtube-tools', label: 'Công cụ YouTube', icon: TvMinimalPlay },
];

const EXTRA_ITEMS = [
  { href: '/pricing', label: 'Nạp thêm', icon: CreditCard },
  { href: '#', label: 'Trợ giúp & Hỗ trợ', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, sidebarCollapsed, toggleSidebar } = useApp();
  const { user: clerkUser, isLoaded } = useUser();

  const displayName = isLoaded ? (clerkUser?.fullName || clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User') : '...';
  const displayEmail = isLoaded ? (clerkUser?.emailAddresses[0]?.emailAddress || '') : '...';

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">N</div>
        {!sidebarCollapsed && (
          <div className="logo-text">
            <h1>NovaX</h1>
            <span>AI Voice Platform</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="btn-ghost"
          style={{
            marginLeft: 'auto',
            padding: '4px',
            borderRadius: '6px',
          }}
          aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {!sidebarCollapsed && (
          <div className="sidebar-section-label">Video Studio</div>
        )}

        {VIDEO_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {!sidebarCollapsed && (
          <div className="sidebar-section-label">YouTube MMO</div>
        )}

        {YOUTUBE_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {!sidebarCollapsed && (
          <div className="sidebar-section-label">Khác</div>
        )}

        {EXTRA_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer: Quota + User */}
      <div className="sidebar-footer">
        {!sidebarCollapsed && (
          <>
            {/* Quota Card */}
            <div className="quota-card">
              <div className="quota-icon">
                <Zap size={16} />
                <span>Ký tự còn lại</span>
              </div>
              <div className="quota-number">
                {user.charsRemaining.toLocaleString()}
              </div>
              <div className="quota-expiry" style={{ marginBottom: '16px' }}>
                Hết hạn vào: {new Date(user.quotaExpiry).toLocaleDateString('vi-VN')}
              </div>

              <Link href="/pricing" className="topup-btn">
                Nạp thêm
              </Link>
            </div>
          </>
        )}

        {/* User Info */}
        <div className="user-info" style={{ marginTop: sidebarCollapsed ? 0 : '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserButton afterSignOutUrl="/sign-in" />
          {!sidebarCollapsed && (
            <div className="user-details">
              <div className="user-name">{displayName}</div>
              <div className="user-email">{displayEmail}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
