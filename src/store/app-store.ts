"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ViewKey = "dashboard" | "calendar" | "log" | "stats" | "insights" | "settings";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // for log view: preselected date
  logDate: string | null;
  setLogDate: (d: string | null) => void;
  // PIN lock state — never persisted, always start locked if pin enabled
  unlocked: boolean;
  setUnlocked: (v: boolean) => void;
  // calendar selected date
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
}

const PIN_SESSION_KEY = "femora-pin-unlocked";

function readSessionUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionUnlocked(unlocked: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (unlocked) sessionStorage.setItem(PIN_SESSION_KEY, "1");
    else sessionStorage.removeItem(PIN_SESSION_KEY);
  } catch {
    /* ignore (private browsing storage restrictions, etc.) */
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: "dashboard",
      setView: (view) => set({ view }),
      logDate: null,
      setLogDate: (logDate) => set({ logDate }),
      // Seeded from sessionStorage: stays unlocked across refreshes within
      // the same tab/app session, only resets once that session actually
      // ends (tab closed, PWA fully quit) — not on every reload.
      unlocked: readSessionUnlocked(),
      setUnlocked: (unlocked) => {
        writeSessionUnlocked(unlocked);
        set({ unlocked });
      },
      selectedDate: null,
      setSelectedDate: (selectedDate) => set({ selectedDate }),
    }),
    {
      name: "femora-app-state",
      storage: createJSONStorage(() => localStorage),
      // Only persist the current tab/view — not transient UI state like unlocked/selectedDate
      partialize: (state) => ({ view: state.view }),
    }
  )
);