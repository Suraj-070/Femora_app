"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Period, Symptom, MoodEntry, Settings, PredictionResult, Stats, Flow } from "@/lib/types";

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
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Periods ----
export function usePeriods() {
  return useQuery<Period[]>({
    queryKey: ["periods"],
    queryFn: () => fetchJson("/api/periods"),
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { startDate: string; endDate?: string | null; flow: Flow; notes?: string | null }) =>
      fetchJson("/api/periods", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
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
      qc.invalidateQueries({ queryKey: ["periods"] });
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
  });
}

export function useCreateSymptom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; symptomName: string; severity: number; note?: string | null }) =>
      fetchJson("/api/symptoms", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
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
  });
}

export function useCreateMood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; mood: string; note?: string | null }) =>
      fetchJson("/api/moods", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
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
      qc.invalidateQueries({ queryKey: ["moods"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

// ---- Prediction ----
export function usePrediction() {
  return useQuery<PredictionResult>({
    queryKey: ["prediction"],
    queryFn: () => fetchJson("/api/prediction"),
  });
}

// ---- Stats ----
export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => fetchJson("/api/stats"),
  });
}

// ---- Insights ----
export function useInsights() {
  return useQuery<{ insights: import("@/lib/insights").Insight[] }>({
    queryKey: ["insights"],
    queryFn: () => fetchJson("/api/insights"),
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Settings ----
export function useSettings() {
  return useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => fetchJson("/api/settings"),
  });
}

export type UpdateSettingsData = {
  theme?: "light" | "dark" | "system";
  pinEnabled?: boolean;
  pin?: string | null;
  // Health profile
  onboardingDone?: boolean;
  ageRange?: string | null;
  bodyType?: string | null;
  stressLevel?: string | null;
  exerciseFrequency?: string | null;
  weightRange?: string | null;
  conditions?: string | null;
  dietType?: string | null;
};

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsData) =>
      fetchJson("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
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
  });
}