'use client';
// ============================================================================
// usePayment — VietQR Payment Flow Hook
// Layer 3 — Manages plan selection, QR code generation, and payment status
// ============================================================================

import { useState, useCallback } from 'react';
import { PaymentState, PricingPlan } from '@/types/payment.types';
import { generateVietQRUrl, createPaymentPayload } from '@/lib/payment-utils';

interface UsePaymentReturn {
  payment: PaymentState;
  selectPlan: (plan: PricingPlan) => void;
  generateQR: (plan: PricingPlan, userEmail: string) => void;
  simulatePaymentSuccess: () => void;
  closePayment: () => void;
}

export function usePayment(): UsePaymentReturn {
  const [payment, setPayment] = useState<PaymentState>({
    selectedPlan: null,
    showQR: false,
    qrUrl: null,
    paymentStatus: 'idle',
    transactionRef: null,
  });

  // ─────────────────────────────────────────────────────────
  // selectPlan — Choose a pricing plan
  // ─────────────────────────────────────────────────────────
  const selectPlan = useCallback((plan: PricingPlan) => {
    setPayment(prev => ({ ...prev, selectedPlan: plan }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // generateQR — Create VietQR payment URL
  //
  // Uses the VietQR image API to generate a scannable QR code
  // with embedded bank account info, amount, and memo.
  // ─────────────────────────────────────────────────────────
  const generateQR = useCallback((plan: PricingPlan, userEmail: string) => {
    const payload = createPaymentPayload(plan.name, plan.priceVND, userEmail);
    const qrUrl = generateVietQRUrl(payload);

    setPayment({
      selectedPlan: plan,
      showQR: true,
      qrUrl,
      paymentStatus: 'pending',
      transactionRef: payload.transactionRef,
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // simulatePaymentSuccess — Demo: mark payment as completed
  // ─────────────────────────────────────────────────────────
  const simulatePaymentSuccess = useCallback(() => {
    setPayment(prev => ({
      ...prev,
      paymentStatus: 'success',
    }));
  }, []);

  // ─────────────────────────────────────────────────────────
  // closePayment — Reset payment modal
  // ─────────────────────────────────────────────────────────
  const closePayment = useCallback(() => {
    setPayment({
      selectedPlan: null,
      showQR: false,
      qrUrl: null,
      paymentStatus: 'idle',
      transactionRef: null,
    });
  }, []);

  return {
    payment,
    selectPlan,
    generateQR,
    simulatePaymentSuccess,
    closePayment,
  };
}
