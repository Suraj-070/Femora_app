// src/app/api/notify/route.ts
// Vercel Cron — 9:00 AM daily.
// 1) Period prediction: period due in 1-5 days.
// 2) Suggest-end: active period past its usual length AND stale (no log
//    2+ days) — nudge "did this end?" as a push, not just the in-app banner.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPredictionForUser } from "@/lib/prediction";
import { getStatsForUser } from "@/lib/stats";
import { generateNotificationText } from "@/lib/notification-text";
import { sendPushToUser, groupSubsByUser, verifyCronAuth } from "@/lib/push-send";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000);
}

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await db.pushSubscription.findMany();
  if (subscriptions.length === 0) return NextResponse.json({ sent: 0, failed: 0 });

  const subsByUser = groupSubsByUser(subscriptions);
  const userIds = [...subsByUser.keys()];

  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      // --- 1) Period prediction ---
      const prediction = await getPredictionForUser(userId);
      const days = prediction.daysUntilNextPeriod;

      if (days !== null && days >= 1 && days <= 5) {
        const fallback =
          days === 1
            ? "Your period is expected tomorrow. Stay prepared!"
            : `Your period is expected in ${days} days. Time to prepare.`;
        const body = await generateNotificationText(
          "period-prediction",
          { daysUntilNextPeriod: days },
          fallback
        );
        const result = await sendPushToUser(
          userId,
          { title: "Femora — Period Reminder 🌸", body, tag: "period-reminder", url: "/" },
          subsByUser
        );
        sent += result.sent;
        failed += result.failed;
      }

      // --- 2) Suggest-end nudge ---
      const active = await db.period.findFirst({
        where: { userId, endDate: null },
        include: { days: { orderBy: { date: "desc" }, take: 1 } },
      });

      if (active) {
        const stats = await getStatsForUser(userId);
        const avgLen = Math.round(stats.averagePeriodLength || 5);
        const lastDay = active.days[0]?.date ?? active.startDate;
        const today = startOfDay(new Date());
        const dayOfPeriod = diffDays(today, startOfDay(new Date(active.startDate))) + 1;
        const daysSinceLastLog = diffDays(today, lastDay);

        if (dayOfPeriod > avgLen && daysSinceLastLog >= 2) {
          const fallback = `Day ${dayOfPeriod} and no log since ${lastDay.toDateString()} — did your period end?`;
          const body = await generateNotificationText(
            "suggest-end",
            { dayOfPeriod, avgLen, daysSinceLastLog },
            fallback
          );
          const result = await sendPushToUser(
            userId,
            { title: "Femora — Still tracking?", body, tag: "suggest-end", url: "/" },
            subsByUser
          );
          sent += result.sent;
          failed += result.failed;
        }
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}