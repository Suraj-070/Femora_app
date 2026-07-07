// Femora - Statistics calculator (pure core)
// No database import here on purpose — this is the testable math. The DB
// wrapper that fetches data and calls this lives in stats.ts.

import type { Stats } from "@/lib/types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}
function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

// Given sorted period start/end dates, compute the cycle-length-derived
// numbers. Split out so this can be unit tested without touching the database.
export function computeCycleStats(periods: { startDate: Date | string; endDate: Date | string | null }[]) {
  const sorted = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Gaps under ~10 days aren't real cycles — duplicate/glitched Period
  // records (e.g. deleted then re-logged same day), not genuine short
  // cycles. Exclude them so they don't drag the average toward 0.
  const MIN_PLAUSIBLE_GAP_DAYS = 10;
  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = diffDays(new Date(sorted[i].startDate), new Date(sorted[i - 1].startDate));
    if (gap >= MIN_PLAUSIBLE_GAP_DAYS) cycleLengths.push(gap);
  }

  const periodLengths = sorted
    .filter((p) => p.endDate)
    .map((p) => diffDays(new Date(p.endDate!), new Date(p.startDate)))
    .filter((l) => l > 0);

  const avgCycle = cycleLengths.length ? mean(cycleLengths) : 0;
  const avgPeriod = periodLengths.length ? mean(periodLengths) : 0;
  const longest = cycleLengths.length ? Math.max(...cycleLengths) : null;
  const shortest = cycleLengths.length ? Math.min(...cycleLengths) : null;
  const variance = cycleLengths.length
    ? Math.sqrt(mean(cycleLengths.map((c) => (c - avgCycle) ** 2)))
    : 0;

  let regularity: Stats["regularity"] = "unknown";
  if (cycleLengths.length >= 2) {
    if (variance <= 2) regularity = "regular";
    else if (variance <= 5) regularity = "slightly-irregular";
    else regularity = "irregular";
  }

  const trend = cycleLengths.slice(-6).map((len, i) => ({
    cycle: i + 1,
    length: len,
    label: `C${i + 1}`,
  }));

  return { cycleLengths, periodLengths, avgCycle, avgPeriod, longest, shortest, variance, regularity, trend };
}