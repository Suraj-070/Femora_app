// src/app/api/bootstrap/route.ts
// Returns all data needed for initial app load in a single request.
// Replaces 6 separate API calls with 1 — massively reduces cold start impact.

import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { computePrediction } from "@/lib/prediction";
import { getStatsForUser } from "@/lib/stats";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Fire all DB queries in parallel — single round trip
  const [periods, todaySymptoms, todayMoods, settings, stats] = await Promise.all([
    db.period.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
    }),
    db.symptom.findMany({
      where: { userId, date: { gte: today, lte: todayEnd } },
      orderBy: { date: "desc" },
    }),
    db.mood.findMany({
      where: { userId, date: { gte: today, lte: todayEnd } },
      orderBy: { date: "desc" },
    }),
    db.settings.findUnique({ where: { userId } }),
    getStatsForUser(userId),
  ]);

  // Compute prediction from periods (no extra DB call needed)
  const sortedStarts = [...periods]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((p) => new Date(p.startDate));

  const periodLengths = periods
    .filter((p) => p.endDate)
    .map((p) => {
      const diff = Math.round(
        (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / 86400000
      );
      return diff > 0 ? diff : 0;
    })
    .filter((l) => l > 0);

  const prediction = computePrediction(sortedStarts, periodLengths);

  // Create settings with defaults if not found
  const settingsData = settings ?? {
    id: "",
    userId,
    theme: "system",
    pinEnabled: false,
    notifyPeriodReminder: true,
    notifySuggestEnd: true,
    notifyDailyCheckIn: true,
    notifyDailyFact: true,
    pin: null,
    onboardingDone: false,
    ageRange: null,
    bodyType: null,
    weightRange: null,
    stressLevel: null,
    exerciseFrequency: null,
    conditions: null,
    dietType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const { pin: _pin, ...settingsForClient } = settingsData;

  return NextResponse.json({
    periods,
    todaySymptoms,
    todayMoods,
    prediction,
    stats,
    settings: { ...settingsForClient, pinSet: !!settingsData.pin },
  });
}