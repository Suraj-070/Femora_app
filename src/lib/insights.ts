// Femora - AI Insights service using Groq API

import Groq from "groq-sdk";
import { db } from "@/lib/db";
import { getPredictionForUser } from "@/lib/prediction";
import { getStatsForUser } from "@/lib/stats";

export interface Insight {
  id: string;
  type: "pattern" | "trend" | "regularity" | "symptom" | "mood" | "tip";
  title: string;
  description: string;
  icon: string;
  tone: "info" | "positive" | "warning";
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

// Accept any object from Prisma — avoids type mismatch with generated client
function buildHealthProfileContext(settings: Record<string, unknown> | null): string {
  if (!settings) return "Health profile: not provided.";

  const parts: string[] = [];

  const ageRange = settings.ageRange as string | null;
  const bodyType = settings.bodyType as string | null;
  const stressLevel = settings.stressLevel as string | null;
  const exerciseFrequency = settings.exerciseFrequency as string | null;
  const conditions = settings.conditions as string | null;
  const dietType = settings.dietType as string | null;

  if (ageRange) {
    const map: Record<string, string> = {
      "under-20": "under 20 (cycles may still be irregular)",
      "20s": "in their 20s",
      "30s": "in their 30s",
      "40s-plus": "40s or older (perimenopause possible)",
    };
    parts.push(`Age: ${map[ageRange] ?? ageRange}`);
  }

  if (bodyType && bodyType !== "prefer-not-to-say") {
    const map: Record<string, string> = {
      slim: "slim/lean (lower body fat may affect estrogen)",
      athletic: "athletic (muscle mass affects hormones)",
      average: "average build",
      curvy: "curvy (higher estrogen storage possible)",
    };
    parts.push(`Body type: ${map[bodyType] ?? bodyType}`);
  }

  if (stressLevel) {
    const map: Record<string, string> = {
      low: "low stress",
      moderate: "moderate stress (some hormonal impact possible)",
      high: "high stress (cortisol may be delaying ovulation)",
    };
    parts.push(`Stress: ${map[stressLevel] ?? stressLevel}`);
  }

  if (exerciseFrequency) {
    const map: Record<string, string> = {
      rarely: "rarely exercises",
      sometimes: "exercises occasionally (1-2x/week)",
      regularly: "exercises regularly (3-5x/week)",
      intensely: "exercises intensely (daily — may affect cycle)",
    };
    parts.push(`Exercise: ${map[exerciseFrequency] ?? exerciseFrequency}`);
  }

  if (conditions) {
    try {
      const conds: string[] = JSON.parse(conditions);
      const map: Record<string, string> = {
        none: "no known conditions",
        pcos: "PCOS",
        endometriosis: "endometriosis",
        thyroid: "thyroid disorder",
        fibroids: "uterine fibroids",
        "prefer-not-to-say": "conditions not disclosed",
      };
      parts.push(`Known conditions: ${conds.map((c) => map[c] ?? c).join(", ")}`);
    } catch {
      // ignore
    }
  }

  if (dietType) {
    const map: Record<string, string> = {
      omnivore: "omnivore diet",
      vegetarian: "vegetarian diet (monitor iron and B12)",
      vegan: "vegan diet (monitor iron, B12, and omega-3)",
      other: "other diet",
    };
    parts.push(`Diet: ${map[dietType] ?? dietType}`);
  }

  return parts.length > 0
    ? `Health profile:\n${parts.map((p) => `- ${p}`).join("\n")}`
    : "Health profile: not provided.";
}

async function buildSummary(userId: string) {
  const [periods, symptoms, moods, prediction, stats, settings] = await Promise.all([
    db.period.findMany({ where: { userId }, orderBy: { startDate: "asc" } }),
    db.symptom.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    db.mood.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    getPredictionForUser(userId),
    getStatsForUser(userId),
    db.settings.findUnique({ where: { userId } }),
  ]);

  const sortedPeriods = [...periods].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const cycleLengths: number[] = [];
  for (let i = 1; i < sortedPeriods.length; i++) {
    cycleLengths.push(diffDays(new Date(sortedPeriods[i].startDate), new Date(sortedPeriods[i - 1].startDate)));
  }

  const symptomTiming: Record<string, number[]> = {};
  for (const s of symptoms) {
    const next = sortedPeriods.find((p) => new Date(p.startDate).getTime() >= startOfDay(new Date(s.date)).getTime());
    const prev = [...sortedPeriods].reverse().find((p) => new Date(p.startDate).getTime() <= startOfDay(new Date(s.date)).getTime());
    if (next) {
      (symptomTiming[s.symptomName] ??= []).push(diffDays(new Date(s.date), new Date(next.startDate)));
    } else if (prev) {
      (symptomTiming[s.symptomName] ??= []).push(diffDays(new Date(s.date), new Date(prev.startDate)));
    }
  }

  const symptomByCycleDay: Record<string, number[]> = {};
  for (const s of symptoms) {
    const prev = [...sortedPeriods].reverse().find((p) => new Date(p.startDate).getTime() <= startOfDay(new Date(s.date)).getTime());
    if (prev) {
      (symptomByCycleDay[s.symptomName] ??= []).push(diffDays(new Date(s.date), new Date(prev.startDate)) + 1);
    }
  }

  const moodCounts: Record<string, number> = {};
  for (const m of moods) moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1;

  const moodPremenstrual: Record<string, number> = {};
  for (const m of moods) {
    const next = sortedPeriods.find((p) => {
      const diff = diffDays(new Date(p.startDate), new Date(m.date));
      return diff >= 0 && diff <= 7;
    });
    if (next) moodPremenstrual[m.mood] = (moodPremenstrual[m.mood] ?? 0) + 1;
  }

  return {
    periodCount: periods.length,
    cycleLengths,
    avgCycleLength: stats.averageCycleLength,
    avgPeriodLength: stats.averagePeriodLength,
    cycleVariance: stats.cycleVariance,
    regularity: stats.regularity,
    confidence: prediction.confidence,
    irregular: prediction.irregular,
    symptomFrequency: stats.symptomFrequency,
    symptomTiming,
    symptomByCycleDay,
    moodCounts,
    moodPremenstrual,
    cycleTrend: stats.cycleTrend,
    lastFewCycles: cycleLengths.slice(-4),
    healthProfile: buildHealthProfileContext(settings as Record<string, unknown> | null),
  };
}

const SYSTEM_PROMPT = `You are Femora's AI health insights engine. You analyze a user's menstrual cycle, symptom, mood data, AND their personal health profile to produce helpful, empathetic, personalized insights.

Rules:
- Return ONLY valid JSON. No markdown, no commentary outside JSON.
- The JSON must be an object: { "insights": [ ... ] }
- Generate between 3 and 6 insights.
- Each insight must be: { "type": "pattern"|"trend"|"regularity"|"symptom"|"mood"|"tip", "title": string, "description": string, "icon": string, "tone": "info"|"positive"|"warning" }
- "icon" must be a single lucide-react icon name like "Sparkles", "TrendingDown", "TrendingUp", "CalendarHeart", "HeartPulse", "Brain", "Smile", "Activity", "Flower2", "Moon", "Sun", "Droplets".
- Titles: max 6 words. Descriptions: max 2 sentences, warm and non-alarmist. Avoid medical diagnosis.
- Use the health profile to personalise insights. For example:
  - High stress → mention cortisol impact on cycle timing
  - PCOS → acknowledge irregular cycles are expected
  - Vegan diet → mention iron/B12 monitoring during period
  - Intense exercise → note possible impact on cycle length
  - 40s+ age → acknowledge perimenopause variability
- Be specific using the data (e.g. "Your average cycle is 29 days", "Cramps appear 2-3 days before your period").
- If data is too sparse (fewer than 2 periods), generate gentle onboarding/tip insights tailored to their health profile.
- Never invent numbers not present in the data. If unsure, speak generally.
- Do not use emoji in the text.`;

export async function generateInsights(userId: string): Promise<Insight[]> {
  const summary = await buildSummary(userId);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the user's cycle data and health profile as JSON:\n\n${JSON.stringify(summary, null, 2)}\n\nGenerate insights now. Return only JSON.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  let parsed: { insights?: Insight[] } | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(raw);
  } catch {
    parsed = null;
  }

  if (!parsed?.insights || !Array.isArray(parsed.insights)) {
    return fallbackInsights(summary);
  }

  return parsed.insights
    .filter((i) => i && i.title && i.description)
    .slice(0, 6)
    .map((i, idx) => ({
      id: `ai-${idx}-${Date.now()}`,
      type: (i.type as Insight["type"]) ?? "tip",
      title: String(i.title).slice(0, 80),
      description: String(i.description).slice(0, 280),
      icon: String(i.icon ?? "Sparkles"),
      tone: (i.tone as Insight["tone"]) ?? "info",
    }));
}

function fallbackInsights(summary: {
  periodCount: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  regularity: string;
  confidence: number;
  cycleLengths: number[];
}): Insight[] {
  const out: Insight[] = [];
  if (summary.periodCount === 0) {
    out.push({
      id: "fb-welcome",
      type: "tip",
      title: "Welcome to Femora",
      description: "Log your first period to start receiving personalized cycle insights and predictions.",
      icon: "Sparkles",
      tone: "info",
    });
    return out;
  }
  if (summary.avgCycleLength) {
    out.push({
      id: "fb-cycle",
      type: "regularity",
      title: "Your cycle at a glance",
      description: `Your average cycle is ${summary.avgCycleLength} days with periods lasting about ${summary.avgPeriodLength} days on average.`,
      icon: "CalendarHeart",
      tone: "info",
    });
  }
  if (summary.cycleLengths.length >= 2) {
    const trend = summary.cycleLengths.slice(-2);
    if (trend[1] < trend[0] - 1) {
      out.push({ id: "fb-shorter", type: "trend", title: "Cycle shortened recently", description: "Your most recent cycle was shorter than the previous one. Small variations are normal.", icon: "TrendingDown", tone: "info" });
    } else if (trend[1] > trend[0] + 1) {
      out.push({ id: "fb-longer", type: "trend", title: "Cycle lengthened recently", description: "Your most recent cycle was longer than the previous one. This can happen due to stress or lifestyle changes.", icon: "TrendingUp", tone: "info" });
    } else {
      out.push({ id: "fb-stable", type: "regularity", title: "Consistent cycles", description: "Your cycle length has stayed stable recently, which is a good sign of regularity.", icon: "Activity", tone: "positive" });
    }
  }
  return out;
}