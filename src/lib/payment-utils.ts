// ============================================================================
// Payment Utilities — VietQR Integration
// Layer 2 — QR code URL generation and currency formatting
// ============================================================================

import { VietQRPayload } from '@/types/payment.types';
import { VIETQR_BANK_CONFIG } from '@/constants/pricing';

/**
 * Generate a VietQR URL for payment QR code image.
 *
 * VietQR format: https://img.vietqr.io/image/{bankBin}-{accountNumber}-{template}.png
 * Query params: amount, addInfo (description), accountName
 *
 * @param payload - Payment payload with amount and description
 * @returns Full VietQR image URL
 */
export function generateVietQRUrl(payload: VietQRPayload): string {
  const { bankBin, accountNumber, accountName, amount, description } = payload;
  const template = 'compact2'; // VietQR template style

  const params = new URLSearchParams({
    amount: amount.toString(),
    addInfo: description,
    accountName: accountName,
  });

  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-${template}.png?${params.toString()}`;
}

/**
 * Create a VietQR payment payload for a subscription plan.
 *
 * @param planName   - Name of the plan being purchased
 * @param amount     - Amount in VND
 * @param userEmail  - User's email for reference
 * @returns Complete VietQR payload
 */
export function createPaymentPayload(
  planName: string,
  amount: number,
  userEmail: string
): VietQRPayload {
  const transactionRef = `VL${Date.now().toString(36).toUpperCase()}`;

  return {
    bankBin: VIETQR_BANK_CONFIG.bankBin,
    accountNumber: VIETQR_BANK_CONFIG.accountNumber,
    accountName: VIETQR_BANK_CONFIG.accountName,
    amount,
    description: `NovaX ${planName} - ${userEmail} - ${transactionRef}`,
    transactionRef,
  };
}

/**
 * Format a number as Vietnamese Dong (VND) currency.
 *
 * @param amount - Amount in VND
 * @returns Formatted string (e.g., "199,000₫")
 */
export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

/**
 * Format large numbers with Vietnamese abbreviations.
 *
 * @param num - Number to format
 * @returns Formatted string (e.g., "2.5M", "500K")
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toString();
}
