// src/app/api/notify/route.ts
// Called daily by Vercel Cron at 9am.
// Finds all users with a period due in <=5 days and sends a push notification.

import { NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/db";
import { getPredictionForUser } from "@/lib/prediction";

webpush.setVapidDetails(
  "mailto:" + process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  // Verify cron secret so no one can trigger this manually
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users who have push subscriptions
  const subscriptions = await db.pushSubscription.findMany({
    include: { user: true },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Deduplicate by userId (one prediction check per user, multiple devices)
  const userIds = [...new Set(subscriptions.map((s) => s.userId))];

  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const prediction = await getPredictionForUser(userId);
      const days = prediction.daysUntilNextPeriod;
       console.log("userId:", userId, "days:", days);

      // Only notify if period is in 1–5 days
      if (days === null || days < 1 || days > 5) continue;

      const userSubs = subscriptions.filter((s) => s.userId === userId);

      const payload = JSON.stringify({
        title: "Femora — Period Reminder 🌸",
        body:
          days === 1
            ? "Your period is expected tomorrow. Stay prepared!"
            : `Your period is expected in ${days} days. Time to prepare.`,
        tag: "period-reminder",
        url: "/",
      });

      for (const sub of userSubs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
          console.log("sent to:", sub.endpoint);

        } catch (err: unknown) {
          // 410 Gone = subscription expired, clean it up
          console.log("send error:", err);
          if (
            err &&
            typeof err === "object" &&
            "statusCode" in err &&
            (err as { statusCode: number }).statusCode === 410
          ) {
            await db.pushSubscription.delete({ where: { id: sub.id } });
          }
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}