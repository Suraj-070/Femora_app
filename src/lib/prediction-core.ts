// Femora - Smart Prediction Engine
// Learns from historical period data. Does NOT use a fixed 28-day cycle.
// Recalculates after every new period entry. Supports irregular cycles.

import type { PredictionResult } from "@/lib/types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, n) => s + (n - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Compute the prediction from an array of period start dates (oldest first)
 * plus optional period lengths.
 */
export function computePrediction(
  periodStarts: Date[],
  periodLengths: number[],
  now: Date = new Date()
): PredictionResult {
  const empty: PredictionResult = {
    expectedDate: "",
    earliestDate: "",
    latestDate: "",
    confidence: 0,
    averageCycleLength: 0,
    averagePeriodLength: 0,
    cycleVariance: 0,
    cycleCount: 0,
    irregular: false,
    lastPeriodStart: null,
    ovulationDate: null,
    fertileStart: null,
    fertileEnd: null,
    currentCycleDay: null,
    daysUntilNextPeriod: null,
  };

  if (periodStarts.length === 0) return empty;

  // Sort ascending by start date
  const sorted = [...periodStarts].sort((a, b) => a.getTime() - b.getTime());
  const lastStart = sorted[sorted.length - 1];

  // Cycle lengths = gaps between consecutive starts.
  // A gap under ~10 days isn't a real cycle — no one has back-to-back
  // periods days apart. That's a duplicate/glitched Period record (e.g. a
  // period deleted and re-logged on the same day), not genuine data, so it
  // gets excluded rather than dragging the average toward 0.
  const MIN_PLAUSIBLE_GAP_DAYS = 10;
  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = diffDays(sorted[i], sorted[i - 1]);
    if (gap >= MIN_PLAUSIBLE_GAP_DAYS) cycleLengths.push(gap);
  }

  // Average cycle length: if only one period, use period length + estimate; default 28 fallback only if no data
  let avgCycle: number;
  if (cycleLengths.length > 0) {
    avgCycle = mean(cycleLengths);
  } else {
    // single period: estimate cycle as 28 but mark low confidence via cycleCount
    avgCycle = 28;
  }

  const variance = stdDev(cycleLengths);
  const avgPeriod = periodLengths.length > 0 ? mean(periodLengths) : 5;

  // --- Irregularity detection ---
  const SHORT = 21;
  const LONG = 35;
  let irregular = false;
  let irregularityPenalty = 0;

  if (cycleLengths.length > 0) {
    const outOfRange = cycleLengths.filter((c) => c < SHORT || c > LONG).length;
    const outRatio = outOfRange / cycleLengths.length;
    if (outRatio > 0.4 || (cycleLengths.length >= 2 && outOfRange === cycleLengths.length)) {
      irregular = true;
    }
    // high variance relative to mean
    const cv = avgCycle > 0 ? variance / avgCycle : 0; // coefficient of variation
    if (cv > 0.12) {
      irregular = true;
    }
    // single very short or very long cycle
    if (cycleLengths.some((c) => c < 18 || c > 40)) {
      irregularityPenalty += 10;
    }
  }

  // --- Confidence calculation ---
  // Base confidence grows with number of cycles observed (more data = more confidence)
  let confidence = 0;
  if (cycleLengths.length === 0) {
    confidence = 35; // single period entry - very low confidence
  } else if (cycleLengths.length === 1) {
    confidence = 55;
  } else if (cycleLengths.length === 2) {
    confidence = 70;
  } else if (cycleLengths.length === 3) {
    confidence = 80;
  } else if (cycleLengths.length <= 5) {
    confidence = 88;
  } else {
    confidence = 93;
  }

  // Penalize variance: each day of std dev reduces confidence
  const variancePenalty = Math.min(25, variance * 3);
  confidence -= variancePenalty;

  // Penalize irregularity
  if (irregular) confidence -= 12;
  confidence -= irregularityPenalty;

  // Recency penalty: if last period was very long ago (> 1.6x avg cycle), lower confidence
  const sinceLast = diffDays(now, lastStart);
  if (avgCycle > 0 && sinceLast > avgCycle * 1.6) {
    confidence -= 10;
  }

  confidence = Math.max(20, Math.min(96, Math.round(confidence)));

  // --- Prediction dates ---
  const expected = addDays(lastStart, Math.round(avgCycle));
  // Range based on variance (min 2 days each side)
  const range = Math.max(2, Math.round(variance * 1.2) + (irregular ? 2 : 0));
  const earliest = addDays(expected, -range);
  const latest = addDays(expected, range);

  // --- Ovulation & fertile window ---
  // Ovulation typically ~14 days before next period
  const ovulation = addDays(expected, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  // --- Current cycle day ---
  const currentCycleDay = diffDays(now, lastStart) + 1;

  // --- Days until next period ---
  const daysUntilNextPeriod = diffDays(expected, now);

  return {
    expectedDate: expected.toISOString(),
    earliestDate: earliest.toISOString(),
    latestDate: latest.toISOString(),
    confidence,
    averageCycleLength: Math.round(avgCycle * 10) / 10,
    averagePeriodLength: Math.round(avgPeriod * 10) / 10,
    cycleVariance: Math.round(variance * 10) / 10,
    cycleCount: cycleLengths.length,
    irregular,
    lastPeriodStart: lastStart.toISOString(),
    ovulationDate: ovulation.toISOString(),
    fertileStart: fertileStart.toISOString(),
    fertileEnd: fertileEnd.toISOString(),
    currentCycleDay,
    daysUntilNextPeriod,
  };
}