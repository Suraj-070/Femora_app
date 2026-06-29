// Femora - Shared TypeScript types

export type Flow = "spotting" | "light" | "medium" | "heavy";

export const MOODS = [
  "happy",
  "sad",
  "angry",
  "emotional",
  "stressed",
  "anxious",
  "tired",
  "energetic",
  "calm",
] as const;
export type Mood = (typeof MOODS)[number];

export const SYMPTOMS = [
  "Cramps",
  "Headache",
  "Acne",
  "Fatigue",
  "Bloating",
  "Back Pain",
  "Breast Tenderness",
  "Nausea",
  "Digestive Issues",
] as const;
export type SymptomName = (typeof SYMPTOMS)[number] | (string & {});

export interface Period {
  id: string;
  userId: string;
  startDate: string;
  endDate: string | null;
  flow: Flow;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Symptom {
  id: string;
  userId: string;
  date: string;
  symptomName: string;
  severity: number;
  note: string | null;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  mood: Mood;
  note: string | null;
  createdAt: string;
}

export interface Settings {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  pinEnabled: boolean;
  // Health profile
  onboardingDone: boolean;
  ageRange: string | null;
  bodyType: string | null;
  weightRange: string | null;
  stressLevel: string | null;
  exerciseFrequency: string | null;
  conditions: string | null;
  dietType: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PredictionResult {
  expectedDate: string;
  earliestDate: string;
  latestDate: string;
  confidence: number;
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleVariance: number;
  cycleCount: number;
  irregular: boolean;
  lastPeriodStart: string | null;
  ovulationDate: string | null;
  fertileStart: string | null;
  fertileEnd: string | null;
  currentCycleDay: number | null;
  daysUntilNextPeriod: number | null;
}

export interface Stats {
  averageCycleLength: number;
  averagePeriodLength: number;
  longestCycle: number | null;
  shortestCycle: number | null;
  cycleCount: number;
  cycleVariance: number;
  cycleTrend: { cycle: number; length: number; label: string }[];
  symptomFrequency: { name: string; count: number; avgSeverity: number }[];
  moodFrequency: { mood: string; count: number }[];
  periodCount: number;
  totalLoggedDays: number;
  regularity: "regular" | "slightly-irregular" | "irregular" | "unknown";
}

export interface CalendarDayInfo {
  date: string;
  isPeriod: boolean;
  isPredictedPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  flow?: Flow;
  symptoms: { name: string; severity: number }[];
  moods: Mood[];
}