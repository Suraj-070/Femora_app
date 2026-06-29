// Femora - App constants: flow levels, symptoms, moods with metadata

import {
  Droplets,
  Frown,
  Angry,
  CloudRain,
  Zap,
  Brain,
  BatteryLow,
  BatteryFull,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import type { Flow, Mood } from "./types";

export interface FlowMeta {
  value: Flow;
  label: string;
  dots: number;
  color: string;
}

export const FLOW_LEVELS: FlowMeta[] = [
  { value: "spotting", label: "Spotting", dots: 1, color: "rose" },
  { value: "light", label: "Light", dots: 2, color: "rose" },
  { value: "medium", label: "Medium", dots: 3, color: "rose" },
  { value: "heavy", label: "Heavy", dots: 4, color: "rose" },
];

export function flowLabel(f: Flow): string {
  return FLOW_LEVELS.find((x) => x.value === f)?.label ?? f;
}

// Moods metadata
export interface MoodMeta {
  value: Mood;
  label: string;
  emoji: string;
  icon: LucideIcon;
  color: string; // tailwind gradient stops
}

export const MOOD_META: MoodMeta[] = [
  { value: "happy", label: "Happy", emoji: "😊", icon: BatteryFull, color: "from-amber-400 to-orange-400" },
  { value: "sad", label: "Sad", emoji: "😢", icon: Frown, color: "from-sky-400 to-cyan-400" },
  { value: "angry", label: "Angry", emoji: "😠", icon: Angry, color: "from-red-400 to-rose-500" },
  { value: "emotional", label: "Emotional", emoji: "🥺", icon: CloudRain, color: "from-violet-400 to-purple-400" },
  { value: "stressed", label: "Stressed", emoji: "😣", icon: Zap, color: "from-orange-400 to-red-400" },
  { value: "anxious", label: "Anxious", emoji: "😰", icon: Brain, color: "from-indigo-400 to-violet-400" },
  { value: "tired", label: "Tired", emoji: "😴", icon: BatteryLow, color: "from-stone-400 to-slate-500" },
  { value: "energetic", label: "Energetic", emoji: "⚡", icon: BatteryFull, color: "from-emerald-400 to-teal-400" },
  { value: "calm", label: "Calm", emoji: "😌", icon: Leaf, color: "from-teal-400 to-emerald-400" },
];

export function moodMeta(m: Mood): MoodMeta {
  return MOOD_META.find((x) => x.value === m) ?? MOOD_META[0];
}

// Symptoms metadata
export interface SymptomMeta {
  label: string;
  emoji: string;
  color: string;
}

export const SYMPTOM_META: Record<string, SymptomMeta> = {
  Cramps: { label: "Cramps", emoji: "💢", color: "from-rose-400 to-pink-500" },
  Headache: { label: "Headache", emoji: "🤕", color: "from-amber-400 to-orange-500" },
  Acne: { label: "Acne", emoji: "🔴", color: "from-red-400 to-rose-500" },
  Fatigue: { label: "Fatigue", emoji: "😮‍💨", color: "from-stone-400 to-slate-500" },
  Bloating: { label: "Bloating", emoji: "🫃", color: "from-yellow-400 to-amber-500" },
  "Back Pain": { label: "Back Pain", emoji: "🔙", color: "from-purple-400 to-violet-500" },
  "Breast Tenderness": { label: "Breast Tenderness", emoji: "💗", color: "from-pink-400 to-rose-500" },
  Nausea: { label: "Nausea", emoji: "🤢", color: "from-lime-400 to-green-500" },
  "Digestive Issues": { label: "Digestive Issues", emoji: "🚽", color: "from-teal-400 to-cyan-500" },
};

export function symptomMeta(name: string): SymptomMeta {
  return SYMPTOM_META[name] ?? { label: name, emoji: "•", color: "from-slate-400 to-slate-500" };
}

export const DEFAULT_SYMPTOMS = [
  "Cramps",
  "Headache",
  "Acne",
  "Fatigue",
  "Bloating",
  "Back Pain",
  "Breast Tenderness",
  "Nausea",
  "Digestive Issues",
];

export const SEVERITY_LABELS = ["", "Mild", "Mild", "Moderate", "Strong", "Severe"];

export const FERTILE_WINDOW_DAYS = 5; // days before ovulation considered fertile
