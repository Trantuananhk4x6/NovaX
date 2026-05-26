'use client';
// ============================================================================
// useHistory — localStorage History Management Hook
// Layer 3 — Persists TTS generation history across browser sessions
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { HistoryItem } from '@/types/api.types';

const HISTORY_STORAGE_KEY = 'novax_history';
const MAX_HISTORY_ITEMS = 50;

interface UseHistoryReturn {
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;
}

/**
 * Load history from localStorage (client-side only).
 */
function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save history to localStorage.
 */
function saveHistory(items: HistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or blocked — silently fail
  }
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // ── Load history on mount (client-side only) ───────────
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // ─────────────────────────────────────────────────────────
  // addHistoryItem — Prepend new item, cap at MAX_HISTORY_ITEMS
  // ─────────────────────────────────────────────────────────
  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(next);
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // removeHistoryItem — Remove a single item by ID
  // ─────────────────────────────────────────────────────────
  const removeHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // clearHistory — Remove all history items
  // ─────────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addHistoryItem, removeHistoryItem, clearHistory };
}
