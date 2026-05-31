'use client';
// ============================================================================
// AppContext — Global Application State
// Layer 6 — Provides user profile, voice list, and history across all pages
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserProfile, DEFAULT_USER, HistoryItem } from '@/types/api.types';
import { Voice } from '@/types/voice.types';
import { VOICE_CATALOG } from '@/constants/voices';
import { useHistory } from '@/hooks/use-history';

interface AppContextValue {
  // ── User ───────────────────────────────────────────────
  user: UserProfile;
  setUser: (user: UserProfile) => void;

  // ── Voices ─────────────────────────────────────────────
  voices: Voice[];
  customVoices: Voice[];
  addCustomVoice: (voice: Voice) => void;

  // ── History ────────────────────────────────────────────
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;

  // ── Sidebar ────────────────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ── User state (persisted to localStorage) ─────────────
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

  // ── Voice list: catalog + user's custom cloned voices ──
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  const voices = [...customVoices, ...VOICE_CATALOG];

  // ── History (from useHistory hook) ─────────────────────
  const { history, addHistoryItem, removeHistoryItem, clearHistory } = useHistory();

  // ── Sidebar collapsed state ────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  // ── Add a custom cloned voice to the top of the list ───
  const addCustomVoice = useCallback((voice: Voice) => {
    setCustomVoices(prev => [voice, ...prev]);
  }, []);

  // ── Load user from localStorage on mount ───────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('novax_user');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUser(JSON.parse(stored));

      const storedVoices = localStorage.getItem('novax_custom_voices');
      if (storedVoices) setCustomVoices(JSON.parse(storedVoices));
    } catch { /* ignore */ }
  }, []);

  // ── Persist user changes ───────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('novax_user', JSON.stringify(user));
    } catch { /* ignore */ }
  }, [user]);

  // ── Persist custom voices ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('novax_custom_voices', JSON.stringify(customVoices));
    } catch { /* ignore */ }
  }, [customVoices]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        voices,
        customVoices,
        addCustomVoice,
        history,
        addHistoryItem,
        removeHistoryItem,
        clearHistory,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to consume the AppContext.
 * Throws if used outside of AppProvider.
 */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
