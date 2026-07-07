// Femora - Statistics calculator (DB wrapper)
// The core math lives in stats-core.ts (pure, no DB import). This file just
// fetches the data and shapes it into the Stats type the app uses.

import { db } from "@/lib/db";
import type { Stats } from "@/lib/types";
import { moodMeta } from "@/lib/constants";
import { computeCycleStats } from "@/lib/stats-core";

export { computeCycleStats } from "@/lib/stats-core";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getStatsForUser(userId: string): Promise<Stats> {
  const [periods, symptoms, moods] = await Promise.all([
    db.period.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    db.symptom.findMany({ where: { userId } }),
    db.mood.findMany({ where: { userId } }),
  ]);

  const { cycleLengths, avgCycle, avgPeriod, longest, shortest, variance, regularity, trend } =
    computeCycleStats(periods);

  // symptom frequency
  const symMap = new Map<string, { count: number; sevSum: number }>();
  for (const s of symptoms) {
    const cur = symMap.get(s.symptomName) ?? { count: 0, sevSum: 0 };
    cur.count++;
    cur.sevSum += s.severity;
    symMap.set(s.symptomName, cur);
  }
  const symptomFrequency = Array.from(symMap.entries())
    .map(([name, v]) => ({ name, count: v.count, avgSeverity: v.count ? v.sevSum / v.count : 0 }))
    .sort((a, b) => b.count - a.count);

  // mood frequency
  const moodMap = new Map<string, number>();
  for (const m of moods) {
    moodMap.set(m.mood, (moodMap.get(m.mood) ?? 0) + 1);
  }
  const moodFrequency = Array.from(moodMap.entries())
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  // total logged days (unique dates with any entry)
  const daySet = new Set<string>();
  for (const p of periods) daySet.add(startOfDay(new Date(p.startDate)).toISOString().slice(0, 10));
  for (const s of symptoms) daySet.add(startOfDay(new Date(s.date)).toISOString().slice(0, 10));
  for (const m of moods) daySet.add(startOfDay(new Date(m.date)).toISOString().slice(0, 10));

  void moodMeta; // keep import used (UI references meta)

  return {
    averageCycleLength: Math.round(avgCycle * 10) / 10,
    averagePeriodLength: Math.round(avgPeriod * 10) / 10,
    longestCycle: longest,
    shortestCycle: shortest,
    cycleCount: cycleLengths.length,
    cycleVariance: Math.round(variance * 10) / 10,
    cycleTrend: trend,
    symptomFrequency,
    moodFrequency,
    periodCount: periods.length,
    totalLoggedDays: daySet.size,
    regularity,
  };
}