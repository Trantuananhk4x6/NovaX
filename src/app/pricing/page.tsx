'use client';
// ============================================================================
// Pricing Page — Subscription plans and VietQR payment integration
// ============================================================================

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/context/AppContext';
import { usePayment } from '@/hooks/use-payment';
import { PRICING_PLANS } from '@/constants/pricing';
import { CreditCard, Check, X, ShieldCheck, Zap, Download } from 'lucide-react';
import Image from 'next/image';

export default function PricingPage() {
  const { user } = useApp();
  const {
    payment,
    selectPlan,
    generateQR,
    simulatePaymentSuccess,
    closePayment,
  } = usePayment();

  const handleSubscribe = (planId: string) => {
    const plan = PRICING_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    if (plan.priceVND === 0) {
      // Free plan - just show a success message or redirect
      alert('Bạn đã ở gói Miễn phí.');
      return;
    }

    // Select plan and open modal with QR code
    selectPlan(plan);
    generateQR(plan, user.email);
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '40px 0 60px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Nâng cấp trải nghiệm AI của bạn</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1.125rem' }}>
          Mở khóa toàn bộ sức mạnh của NovaX với giới hạn ký tự cao hơn, giọng nói Premium và tính năng Voice Cloning độc quyền.
        </p>
      </div>

      <div className="slide-up">
        <div className="pricing-grid">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}>
              {/* Plan Header */}
              <div style={{ marginBottom: '32px' }}>
                <h2 className="pricing-name" style={{ color: plan.gradient[0] }}>{plan.name}</h2>
                <div className="pricing-price">{plan.priceLabel}</div>
                <div className="pricing-period">{plan.period}</div>
                <div style={{ 
                  display: 'inline-block', 
                  padding: '4px 12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: 'var(--radius-full)', 
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  marginBottom: '8px'
                }}>
                  <Zap size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--accent-orange)' }} />
                  {plan.quotaLabel}
                </div>
              </div>

              {/* Features List */}
              <ul className="pricing-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <button
                className={`btn btn-lg ${plan.isPopular ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => handleSubscribe(plan.id)}
              >
                {plan.priceVND === 0 ? 'Đang sử dụng' : 'Nâng cấp ngay'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or Trust Section */}
        <div style={{ marginTop: '80px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--accent-green)" />
              <span>Thanh toán an toàn 100% qua VietQR</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={20} color="var(--accent-blue)" />
              <span>Sở hữu bản quyền âm thanh thương mại</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {payment.showQR && payment.selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closePayment}>
              <X size={24} />
            </button>

            {payment.paymentStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Check size={40} color="var(--accent-green)" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Thanh toán thành công!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  Cảm ơn bạn đã nâng cấp lên gói {payment.selectedPlan.name}. Ký tự của bạn đã được cập nhật.
                </p>
                <button className="btn btn-primary btn-lg" onClick={closePayment} style={{ width: '100%' }}>
                  Quay lại làm việc
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Thanh toán gói {payment.selectedPlan.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Mở ứng dụng ngân hàng và quét mã VietQR để thanh toán.
                </p>

                {/* QR Code Container */}
                <div className="qr-container">
                  {payment.qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={payment.qrUrl} 
                      alt="VietQR Code" 
                      className="qr-image"
                    />
                  ) : (
                    <div className="qr-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)' }}>
                      <span className="spinner" style={{ width: 30, height: 30 }}></span>
                    </div>
                  )}

                  <div className="qr-bank-info">
                    <div style={{ marginBottom: 8 }}>
                      Số tiền cần chuyển: <div className="qr-amount">{payment.selectedPlan.priceLabel}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Mã giao dịch: <strong>{payment.transactionRef}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', margin: '24px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Hệ thống sẽ tự động xác nhận thanh toán sau 1-3 phút. Nếu bạn cần hỗ trợ, vui lòng liên hệ CSKH với mã giao dịch ở trên.
                </div>

                {/* Demo Button to simulate successful webhook payment */}
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={simulatePaymentSuccess}
                >
                  <CreditCard size={16} /> (Demo) Giả lập thanh toán thành công
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
