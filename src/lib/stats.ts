// Femora - Statistics calculator

import { db } from "@/lib/db";
import type { Stats } from "@/lib/types";
import { moodMeta } from "@/lib/constants";

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

export async function getStatsForUser(userId: string): Promise<Stats> {
  const [periods, symptoms, moods] = await Promise.all([
    db.period.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    db.symptom.findMany({ where: { userId } }),
    db.mood.findMany({ where: { userId } }),
  ]);

  const sorted = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const cycleLengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    cycleLengths.push(diffDays(new Date(sorted[i].startDate), new Date(sorted[i - 1].startDate)));
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

  // regularity
  let regularity: Stats["regularity"] = "unknown";
  if (cycleLengths.length >= 2) {
    if (variance <= 2) regularity = "regular";
    else if (variance <= 5) regularity = "slightly-irregular";
    else regularity = "irregular";
  }

  // cycle trend (last 6)
  const trend = cycleLengths.slice(-6).map((len, i) => ({
    cycle: i + 1,
    length: len,
    label: `C${i + 1}`,
  }));

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
    .sort((a, b) => b.count - a.count)
    // attach color/label via meta lookup handled in UI
    ;

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
