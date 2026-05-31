'use client';
/**
 * Safe wrapper around Clerk's UserButton.
 * Clerk's onboarding.js occasionally throws "getImageNode" errors when
 * the profile image hasn't loaded yet. ErrorBoundary catches and
 * re-renders as a plain fallback avatar so the page never crashes.
 */
import { Component, type ReactNode } from 'react';
import { UserButton } from '@clerk/nextjs';

interface State { hasError: boolean }

class ClerkBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: Error) {
    // Suppress the noisy Clerk onboarding error; log only in dev
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ClerkUserButtonSafe] caught:', err.message);
    }
  }

  render() {
    if (this.state.hasError) {
      // Plain fallback avatar so the UI never goes blank
      return (
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-violet)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'white', cursor: 'default',
          }}
          title="Đang tải thông tin tài khoản..."
        >
          N
        </div>
      );
    }
    return this.state.hasError ? null : this.props.children;
  }
}

interface Props {
  afterSignOutUrl?: string;
}

export default function ClerkUserButtonSafe({ afterSignOutUrl = '/sign-in' }: Props) {
  return (
    <ClerkBoundary>
      <UserButton afterSignOutUrl={afterSignOutUrl} />
    </ClerkBoundary>
  );
}
