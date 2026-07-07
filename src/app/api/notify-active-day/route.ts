// src/app/api/notify-active-day/route.ts
// Vercel Cron — 8:00 PM daily.
// For anyone with an active period who hasn't logged flow *today* yet,
// a gentle nudge to log how they're feeling. Never fires if today's
// already logged, and never fires if there's no active period.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  const today = startOfDay(new Date());

  let sent = 0;
  let failed = 0;

  for (const userId of subsByUser.keys()) {
    try {
      const settings = await db.settings.findUnique({ where: { userId } });
      if (!(settings?.notifyDailyCheckIn ?? true)) continue;

      const active = await db.period.findFirst({
        where: { userId, endDate: null },
        include: { days: { orderBy: { date: "desc" }, take: 1 } },
      });
      if (!active) continue;

      const loggedToday = await db.periodDay.findFirst({
        where: { periodId: active.id, date: today },
      });
      if (loggedToday) continue; // already logged today, no nudge needed

      const dayOfPeriod = diffDays(today, startOfDay(new Date(active.startDate))) + 1;
      const fallback = `Day ${dayOfPeriod} of your period — how are you feeling today?`;
      const body = await generateNotificationText("active-day-nudge", { dayOfPeriod }, fallback);

      const result = await sendPushToUser(
        userId,
        { title: "Femora — Daily Check-in 🌸", body, tag: "active-day-nudge", url: "/" },
        subsByUser
      );
      sent += result.sent;
      failed += result.failed;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}