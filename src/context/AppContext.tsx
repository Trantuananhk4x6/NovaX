'use client';
// ============================================================================
// AppContext — Global Application State
// Provides user profile, TTS provider, voices, and history across all pages
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserProfile, DEFAULT_USER, HistoryItem, TTSProvider } from '@/types/api.types';
import { Voice } from '@/types/voice.types';
import { useHistory } from '@/hooks/use-history';
import { useUser } from '@clerk/nextjs';

interface AppContextValue {
  // ── User ───────────────────────────────────────────────
  user: UserProfile;
  setUser: (user: UserProfile) => void;

  // ── TTS Provider ───────────────────────────────────────
  ttsProvider: TTSProvider;
  setTTSProvider: (provider: TTSProvider) => void;

  // ── Voices ─────────────────────────────────────────────
  voices: Voice[];
  voicesLoading: boolean;
  voicesError: string | null;
  customVoices: Voice[];
  addCustomVoice: (voice: Voice) => void;
  refreshVoices: () => void;

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

function ttsVoiceToVoice(tv: {
  id: string; name: string; description: string; gender: string;
  languageCode: string; languageName: string; countryCode: string;
  category: string; previewUrl?: string; avatarColors: [string, string];
  provider: string;
}): Voice {
  return {
    id: tv.id,
    name: tv.name,
    label: `${tv.name} - ${tv.description.split(/[,.(]/)[0].trim()}`,
    countryCode: tv.countryCode,
    languageCode: tv.languageCode,
    category: tv.category as Voice['category'],
    gender: tv.gender as Voice['gender'],
    description: tv.description,
    previewUrl: tv.previewUrl,
    avatarColors: tv.avatarColors,
    isCustom: false,
    createdAt: new Date().toISOString(),
    provider: (tv.provider as 'gemini' | 'elevenlabs') || 'gemini',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();

  // ── User state ─────────────────────────────────────────
  const [user, setUserState] = useState<UserProfile>(DEFAULT_USER);

  // ── TTS Provider ───────────────────────────────────────
  const [ttsProvider, setTTSProviderState] = useState<TTSProvider>('gemini');

  // ── Voices ─────────────────────────────────────────────
  const [catalogVoices, setCatalogVoices] = useState<Voice[]>([]);
  const [customVoices, setCustomVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [voiceFetchKey, setVoiceFetchKey] = useState(0);

  const voices = [...customVoices, ...catalogVoices];

  // ── History ────────────────────────────────────────────
  const { history, addHistoryItem, removeHistoryItem, clearHistory } = useHistory();

  // ── Sidebar ────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);

  // ── Set user with localStorage persistence ─────────────
  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
    try { localStorage.setItem('novax_user', JSON.stringify(u)); } catch { /* ignore */ }
  }, []);

  // ── Set provider + persist to DB + localStorage ────────
  const setTTSProvider = useCallback((provider: TTSProvider) => {
    setTTSProviderState(provider);
    const updated = { ...user, ttsProvider: provider };
    setUserState(updated);
    try { localStorage.setItem('novax_user', JSON.stringify(updated)); } catch { /* ignore */ }
    // Persist to DB (fire-and-forget)
    fetch('/api/user/provider', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    }).catch(() => { /* silent */ });
    // Trigger voice re-fetch
    setVoiceFetchKey(k => k + 1);
  }, [user]);

  const addCustomVoice = useCallback((voice: Voice) => {
    setCustomVoices(prev => [voice, ...prev]);
  }, []);

  const refreshVoices = useCallback(() => setVoiceFetchKey(k => k + 1), []);

  // ── Load persisted state from localStorage ─────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('novax_user');
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        setUserState(parsed);
        if (parsed.ttsProvider) setTTSProviderState(parsed.ttsProvider);
      }
      const storedVoices = localStorage.getItem('novax_custom_voices');
      if (storedVoices) setCustomVoices(JSON.parse(storedVoices));
    } catch { /* ignore */ }
  }, []);

  // ── Sync user name/email from Clerk when loaded ────────
  useEffect(() => {
    if (!isLoaded || !clerkUser) return;
    const name = clerkUser.fullName || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    setUserState(prev => {
      if (prev.name === name && prev.email === email) return prev;
      const updated = { ...prev, name, email };
      try { localStorage.setItem('novax_user', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, [isLoaded, clerkUser]);

  // ── Load provider preference from DB ──────────────────
  useEffect(() => {
    if (!isLoaded || !clerkUser) return;
    fetch('/api/user/provider')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.provider) {
          setTTSProviderState(data.provider);
          setUserState(prev => {
            const updated = { ...prev, ttsProvider: data.provider };
            try { localStorage.setItem('novax_user', JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
          });
        }
      })
      .catch(() => { /* use localStorage fallback */ });
  }, [isLoaded, clerkUser]);

  // ── Fetch voices whenever provider changes ─────────────
  useEffect(() => {
    setVoicesLoading(true);
    setVoicesError(null);
    setCatalogVoices([]); // Clear old voices immediately when provider changes

    fetch(`/api/voices?provider=${ttsProvider}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.voices)) {
          setCatalogVoices(data.voices.map(ttsVoiceToVoice));
        } else {
          setCatalogVoices([]); // Ensure voices are cleared on API error
          setVoicesError(data.error || 'Không thể tải danh sách giọng nói');
        }
      })
      .catch(err => {
        setCatalogVoices([]);
        setVoicesError(err.message || 'Network error');
      })
      .finally(() => setVoicesLoading(false));
  }, [ttsProvider, voiceFetchKey]);

  // ── Persist custom voices ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('novax_custom_voices', JSON.stringify(customVoices)); } catch { /* ignore */ }
  }, [customVoices]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        ttsProvider,
        setTTSProvider,
        voices,
        voicesLoading,
        voicesError,
        customVoices,
        addCustomVoice,
        refreshVoices,
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

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
