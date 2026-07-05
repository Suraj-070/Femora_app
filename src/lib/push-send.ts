// src/lib/push-send.ts
// Shared web-push sending logic used by all notification cron jobs.

import webpush from "web-push";
import { db } from "@/lib/db";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    "mailto:" + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; tag: string; url?: string },
  subsByUser: Map<string, { id: string; endpoint: string; p256dh: string; auth: string }[]>
): Promise<{ sent: number; failed: number }> {
  ensureConfigured();
  const subs = subsByUser.get(userId) ?? [];
  let sent = 0;
  let failed = 0;
  const json = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json
      );
      sent++;
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        (err as { statusCode: number }).statusCode === 410
      ) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      failed++;
    }
  }
  return { sent, failed };
}

export function groupSubsByUser<T extends { userId: string }>(subs: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const s of subs) {
    const arr = m.get(s.userId) ?? [];
    arr.push(s);
    m.set(s.userId, arr);
  }
  return m;
}

export function verifyCronAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}