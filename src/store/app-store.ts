"use client";

import { create } from "zustand";

export type ViewKey = "dashboard" | "calendar" | "log" | "stats" | "insights" | "settings";

interface AppState {
  view: ViewKey;
  setView: (v: ViewKey) => void;
  // for log view: preselected date
  logDate: string | null;
  setLogDate: (d: string | null) => void;
  // PIN lock state
  unlocked: boolean;
  setUnlocked: (v: boolean) => void;
  // calendar selected date
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
  logDate: null,
  setLogDate: (logDate) => set({ logDate }),
  unlocked: false,
  setUnlocked: (unlocked) => set({ unlocked }),
  selectedDate: null,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
