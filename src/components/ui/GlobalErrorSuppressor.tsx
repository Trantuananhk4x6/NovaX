'use client';
/**
 * GlobalErrorSuppressor
 * ---------------------
 * Suppresses known third-party unhandled Promise rejections that are
 * cosmetic bugs in the vendor library, not in our code.
 *
 * Current filters:
 *  • Clerk onboarding.js "getImageNode" — Clerk tries to process a user
 *    avatar DOM node that no longer exists after a React re-render.
 *    The error is benign (audio still generates, page still works).
 *    Tracked upstream: clerk/javascript#3051
 */
import { useEffect } from 'react';

const SUPPRESSED_MESSAGES = [
  'getImageNode',            // Clerk onboarding async avatar handler
  'onboarding',              // any other Clerk onboarding noise
];

export default function GlobalErrorSuppressor() {
  useEffect(() => {
    function handler(e: PromiseRejectionEvent) {
      const msg = e?.reason?.message ?? String(e?.reason ?? '');
      if (SUPPRESSED_MESSAGES.some(s => msg.includes(s))) {
        e.preventDefault();   // stop it from printing in the console
        if (process.env.NODE_ENV === 'development') {
          // Still log once so we know it happened — not 60×/s
          console.debug('[GlobalErrorSuppressor] suppressed:', msg.slice(0, 80));
        }
      }
    }
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null; // renders nothing
}
