// src/app/api/notify-fact/route.ts
// Vercel Cron — 6:00 AM daily. Sends everyone today's FemoraFact.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTodaysFact } from "@/lib/facts";
import { generateNotificationText } from "@/lib/notification-text";
import { sendPushToUser, groupSubsByUser, verifyCronAuth } from "@/lib/push-send";

export async function GET(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await db.pushSubscription.findMany();
  if (subscriptions.length === 0) return NextResponse.json({ sent: 0, failed: 0 });

  const subsByUser = groupSubsByUser(subscriptions);
  const fact = getTodaysFact();

  // One shared AI pass (not per-user) — the fact is the same for everyone,
  // so there's no need to burn a Groq call per user.
  const body = await generateNotificationText("daily-fact", { fact }, fact);

  let sent = 0;
  let failed = 0;

  for (const userId of subsByUser.keys()) {
    const settings = await db.settings.findUnique({ where: { userId } });
    if (!(settings?.notifyDailyFact ?? true)) continue;

    const result = await sendPushToUser(
      userId,
      { title: "Femora — Today's Fact 🌸", body, tag: "daily-fact", url: "/" },
      subsByUser
    );
    sent += result.sent;
    failed += result.failed;
  }

  return NextResponse.json({ sent, failed });
}