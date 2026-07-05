"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Period, PeriodDay, Symptom, MoodEntry, Settings, PredictionResult, Stats, Flow } from "@/lib/types";

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const j = await res.json();
      msg = j.error ?? msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Bootstrap — single request for all initial data ----
export interface BootstrapData {
  periods: Period[];
  todaySymptoms: Symptom[];
  todayMoods: MoodEntry[];
  prediction: PredictionResult;
  stats: Stats;
  settings: Settings;
}

export function useBootstrap() {
  return useQuery<BootstrapData>({
    queryKey: ["bootstrap"],
    queryFn: () => fetchJson("/api/bootstrap"),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ---- Periods ----
export function usePeriods() {
  const qc = useQueryClient();
  return useQuery<Period[]>({
    queryKey: ["periods"],
    queryFn: () => {
      const bootstrap = qc.getQueryData<BootstrapData>(["bootstrap"]);
      if (bootstrap?.periods) return Promise.resolve(bootstrap.periods);
      return fetchJson("/api/periods");
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { startDate: string; endDate?: string | null; flow: Flow; notes?: string | null }) =>
      fetchJson("/api/periods", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUpdatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; startDate?: string; endDate?: string | null; flow?: Flow; notes?: string | null }) =>
      fetchJson("/api/periods", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/periods?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

// ---- Active period (new day-by-day model) ----
export function useActivePeriod() {
  return useQuery<Period | null>({
    queryKey: ["activePeriod"],
    queryFn: () => fetchJson("/api/periods/active"),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useStartPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { date?: string; flow?: Flow }) =>
      fetchJson("/api/periods/start", { method: "POST", body: JSON.stringify(data ?? {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["activePeriod"] });
      qc.invalidateQueries({ queryKey: ["periodDays"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useEndPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { date?: string }) =>
      fetchJson("/api/periods/end", { method: "POST", body: JSON.stringify(data ?? {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["activePeriod"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ---- Period Days (per-day flow — replaces one-flow-per-period) ----
export function usePeriodDays(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return useQuery<PeriodDay[]>({
    queryKey: ["periodDays", from ?? "all", to ?? "all"],
    queryFn: () => fetchJson(`/api/period-days${q ? `?${q}` : ""}`),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useLogPeriodDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; flow: Flow; notes?: string | null }) =>
      fetchJson("/api/period-days", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periodDays"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["activePeriod"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUpdatePeriodDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; flow?: Flow; notes?: string | null }) =>
      fetchJson("/api/period-days", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periodDays"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useDeletePeriodDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/period-days?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["periodDays"] });
      qc.invalidateQueries({ queryKey: ["periods"] });
      qc.invalidateQueries({ queryKey: ["activePeriod"] });
      qc.invalidateQueries({ queryKey: ["prediction"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

// ---- Symptoms ----
export function useSymptoms(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return useQuery<Symptom[]>({
    queryKey: ["symptoms", from ?? "all", to ?? "all"],
    queryFn: () => fetchJson(`/api/symptoms${q ? `?${q}` : ""}`),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; symptomName: string; severity: number; note?: string | null }) =>
      fetchJson("/api/symptoms", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUpdateSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; date?: string; symptomName?: string; severity?: number; note?: string | null }) =>
      fetchJson("/api/symptoms", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useDeleteSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/symptoms?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

// ---- Moods ----
export function useMoods(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return useQuery<MoodEntry[]>({
    queryKey: ["moods", from ?? "all", to ?? "all"],
    queryFn: () => fetchJson(`/api/moods${q ? `?${q}` : ""}`),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; mood: string; note?: string | null }) =>
      fetchJson("/api/moods", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useUpdateMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; date?: string; mood?: string; note?: string | null }) =>
      fetchJson("/api/moods", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useDeleteMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/moods?id=${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
      qc.invalidateQueries({ queryKey: ["moods"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

// ---- Prediction ----
export function usePrediction() {
  const qc = useQueryClient();
  return useQuery<PredictionResult>({
    queryKey: ["prediction"],
    queryFn: () => {
      const bootstrap = qc.getQueryData<BootstrapData>(["bootstrap"]);
      if (bootstrap?.prediction) return Promise.resolve(bootstrap.prediction);
      return fetchJson("/api/prediction");
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ---- Stats ----
export function useStats() {
  const qc = useQueryClient();
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => {
      const bootstrap = qc.getQueryData<BootstrapData>(["bootstrap"]);
      if (bootstrap?.stats) return Promise.resolve(bootstrap.stats);
      return fetchJson("/api/stats");
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ---- Insights ----
export function useInsights() {
  return useQuery<import("@/lib/insights").InsightsResult>({
    queryKey: ["insights"],
    queryFn: () => fetchJson("/api/insights"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// ---- Settings ----
export function useSettings() {
  const qc = useQueryClient();
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => {
      const bootstrap = qc.getQueryData<BootstrapData>(["bootstrap"]);
      if (bootstrap?.settings) return Promise.resolve(bootstrap.settings);
      return fetchJson("/api/settings");
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export type UpdateSettingsData = {
  theme?: "light" | "dark" | "system";
  pinEnabled?: boolean;
  pin?: string | null;
  onboardingDone?: boolean;
  ageRange?: string | null;
  bodyType?: string | null;
  weightRange?: string | null;
  stressLevel?: string | null;
  exerciseFrequency?: string | null;
  conditions?: string | null;
  dietType?: string | null;
};

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsData) =>
      fetchJson("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["bootstrap"] });
    },
  });
}

// ---- Auth ----
export function useSession() {
  return useQuery<{ user: { id: string; email: string; name: string | null } } | null>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user ? { user: data.user } : null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}