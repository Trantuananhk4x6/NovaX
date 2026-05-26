// ============================================================================
// Pricing Plans
// Layer 1 — VietQR payment plan definitions
// ============================================================================

import { PricingPlan } from '@/types/payment.types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Miễn phí',
    priceVND: 0,
    priceLabel: '0₫',
    period: '/tháng',
    charQuota: 2_500_000,
    quotaLabel: '2,500,000 ký tự',
    features: [
      '2.5 triệu ký tự mỗi tháng',
      '30+ giọng nói AI miễn phí',
      'Hỗ trợ 10 ngôn ngữ',
      'Tải xuống file MP3',
      'Lịch sử lưu trữ 7 ngày',
      'Hỗ trợ SSML cơ bản',
    ],
    isPopular: false,
    gradient: ['#64748b', '#475569'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceVND: 199_000,
    priceLabel: '199,000₫',
    period: '/tháng',
    charQuota: 10_000_000,
    quotaLabel: '10,000,000 ký tự',
    features: [
      '10 triệu ký tự mỗi tháng',
      '50+ giọng nói AI Premium',
      'Voice Cloning (5 giọng)',
      'Hỗ trợ tất cả ngôn ngữ',
      'Xử lý văn bản dài 100k ký tự',
      'SSML nâng cao',
      'API truy cập (coming soon)',
      'Lịch sử lưu trữ 30 ngày',
      'Ưu tiên hỗ trợ 24/7',
    ],
    isPopular: true,
    gradient: ['#8b5cf6', '#6d28d9'],
  },
  {
    id: 'enterprise',
    name: 'Doanh nghiệp',
    priceVND: 599_000,
    priceLabel: '599,000₫',
    period: '/tháng',
    charQuota: 50_000_000,
    quotaLabel: '50,000,000 ký tự',
    features: [
      '50 triệu ký tự mỗi tháng',
      'Không giới hạn giọng nói',
      'Voice Cloning (không giới hạn)',
      'Tất cả ngôn ngữ + phương ngữ',
      'API truy cập không giới hạn',
      'Xử lý batch file lớn',
      'SLA 99.9% uptime',
      'Quản lý team & workspace',
      'Hỗ trợ chuyên biệt 1-1',
      'Xuất file WAV chất lượng cao',
    ],
    isPopular: false,
    gradient: ['#f59e0b', '#d97706'],
  },
];

/** VietQR bank info (demo data — replace with real bank info) */
export const VIETQR_BANK_CONFIG = {
  bankBin: '970422',           // MB Bank BIN
  accountNumber: '0123456789', // Demo account number
  accountName: 'NOVAX JSC',
  bankName: 'MB Bank',
  bankLogo: '/mb-bank.png',
};
