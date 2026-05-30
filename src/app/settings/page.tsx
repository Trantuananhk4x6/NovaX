'use client';
// ============================================================================
// Settings Page — Provider selection & user preferences
// ============================================================================

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { TTSProvider } from '@/types/api.types';
import { Settings, Zap, CheckCircle2, AlertCircle, Loader2, Radio } from 'lucide-react';

interface ProviderOption {
  id: TTSProvider;
  name: string;
  tagline: string;
  features: string[];
  badge?: string;
  color: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'gemini',
    name: 'Google Gemini TTS',
    tagline: 'Đa ngôn ngữ, miễn phí với API key',
    features: [
      '30+ giọng nói đa ngôn ngữ',
      'Hỗ trợ 10 ngôn ngữ (VI, EN, ES, RU, JA, KO, FR, DE, ZH, TH)',
      'Tích hợp Gemini Flash TTS',
      'Không giới hạn characters trên free tier',
    ],
    color: '#4285F4',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    tagline: 'Giọng nói AI chất lượng cao nhất',
    features: [
      '1000+ giọng nói đa dạng',
      'Chất lượng audio cực kỳ tự nhiên',
      'Hỗ trợ đa ngôn ngữ nâng cao',
      'Voice cloning premium',
    ],
    badge: 'Premium Quality',
    color: '#f97316',
  },
];

export default function SettingsPage() {
  const { ttsProvider, setTTSProvider, voicesLoading } = useApp();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TTSProvider>(ttsProvider);

  const isDirty = selected !== ttsProvider;

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // small UX delay
      setTTSProvider(selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-header">
        <h1>
          <Settings size={24} />
          Cài đặt
        </h1>
      </div>

      <div className="slide-up" style={{ maxWidth: 720 }}>

        {/* Provider Section */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Nhà cung cấp TTS
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Chọn engine tạo giọng nói AI. Toàn bộ danh sách giọng nói và tính năng sẽ thay đổi theo provider.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PROVIDERS.map(prov => {
              const isSelected = selected === prov.id;
              return (
                <div
                  key={prov.id}
                  onClick={() => setSelected(prov.id)}
                  style={{
                    border: `2px solid ${isSelected ? prov.color : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: isSelected ? `${prov.color}10` : 'var(--bg-card)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Radio indicator */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${isSelected ? prov.color : 'var(--border-default)'}`,
                    background: isSelected ? prov.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                    transition: 'all 0.2s ease',
                  }}>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {prov.name}
                      </span>
                      {prov.badge && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                          background: `${prov.color}20`, color: prov.color,
                          borderRadius: 'var(--radius-full)', border: `1px solid ${prov.color}40`,
                        }}>
                          {prov.badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      {prov.tagline}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {prov.features.map(f => (
                        <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={12} style={{ color: prov.color, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!isDirty || saving || voicesLoading}
              style={{ minWidth: 140 }}
            >
              {saving ? (
                <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Đang lưu...</>
              ) : (
                <><Zap size={14} /> Áp dụng</>
              )}
            </button>

            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-green)', fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} />
                <span>Đã lưu! Danh sách giọng nói đang cập nhật...</span>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-red)', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Trạng thái hiện tại
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} style={{ color: 'var(--accent-violet-light)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Provider đang dùng: <strong>{ttsProvider === 'elevenlabs' ? 'ElevenLabs' : 'Google Gemini TTS'}</strong>
            </span>
            {voicesLoading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--text-tertiary)', marginLeft: 8 }} />}
          </div>
          {voicesLoading && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
              Đang tải danh sách giọng nói...
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
