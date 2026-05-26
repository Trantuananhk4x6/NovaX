// ============================================================================
// Payment Type Definitions
// Layer 0 — Interfaces for pricing plans and VietQR payment integration
// ============================================================================

/** Pricing tier */
export type PricingTier = 'free' | 'pro' | 'enterprise';

/** Pricing plan definition */
export interface PricingPlan {
  id: PricingTier;
  name: string;
  /** Price in VND */
  priceVND: number;
  /** Price display label */
  priceLabel: string;
  /** Billing period */
  period: string;
  /** Character quota per month */
  charQuota: number;
  /** Formatted quota label */
  quotaLabel: string;
  /** Feature list */
  features: string[];
  /** Highlighted / recommended */
  isPopular: boolean;
  /** Gradient for card */
  gradient: [string, string];
}

/** VietQR payment payload */
export interface VietQRPayload {
  /** Bank BIN code (from Napas) */
  bankBin: string;
  /** Bank account number */
  accountNumber: string;
  /** Account holder name */
  accountName: string;
  /** Transfer amount */
  amount: number;
  /** Transfer description / memo */
  description: string;
  /** Unique transaction reference */
  transactionRef: string;
}

/** Payment transaction record */
export interface PaymentTransaction {
  id: string;
  planId: PricingTier;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  transactionRef: string;
}

/** Payment state */
export interface PaymentState {
  selectedPlan: PricingPlan | null;
  showQR: boolean;
  qrUrl: string | null;
  paymentStatus: 'idle' | 'pending' | 'success' | 'failed';
  transactionRef: string | null;
}
